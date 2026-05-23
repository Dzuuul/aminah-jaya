use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    auth::verify_jwt,
    models::{ApiResponse, Coupon, CustomerAvailableCoupon},
    state::AppState,
};

#[derive(Debug, Deserialize)]
pub struct AvailableCouponsQuery {
    pub subtotal: Option<f64>,
    pub shipping_cost: Option<f64>,
}

fn extract_customer_id(headers: &HeaderMap) -> Result<Uuid, StatusCode> {
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok());

    let token = match auth_header {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    let claims = verify_jwt(token).map_err(|_| StatusCode::UNAUTHORIZED)?;

    Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::BAD_REQUEST)
}

fn compute_discount(coupon: &Coupon, subtotal: f64, shipping_cost: f64) -> f64 {
    let base = subtotal + shipping_cost;
    let mut amount = match coupon.discount_type.to_lowercase().as_str() {
        "percentage" => {
            let mut amt = base * (coupon.discount_value / 100.0);
            if let Some(max_discount) = coupon.max_discount {
                if amt > max_discount {
                    amt = max_discount;
                }
            }
            amt
        }
        "fixed" => coupon.discount_value,
        _ => 0.0,
    };

    if amount > base {
        amount = base;
    }

    amount.round()
}

fn map_coupon_for_customer(
    coupon: Coupon,
    subtotal: Option<f64>,
    shipping_cost: Option<f64>,
) -> CustomerAvailableCoupon {
    let subtotal = subtotal.unwrap_or(0.0);
    let shipping_cost = shipping_cost.unwrap_or(0.0);

    let mut can_use = true;
    let mut disabled_reason: Option<String> = None;

    if let Some(limit) = coupon.usage_limit {
        if coupon.used_count >= limit {
            can_use = false;
            disabled_reason = Some("Kuota voucher sudah habis".to_string());
        }
    }

    if subtotal > 0.0 && subtotal < coupon.min_purchase {
        can_use = false;
        disabled_reason = Some(format!(
            "Min. belanja Rp {}",
            coupon.min_purchase.round() as i64
        ));
    }

    let estimated_discount = if can_use && subtotal > 0.0 {
        Some(compute_discount(&coupon, subtotal, shipping_cost))
    } else {
        None
    };

    CustomerAvailableCoupon {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase: coupon.min_purchase,
        max_discount: coupon.max_discount,
        start_at: coupon.start_at,
        end_at: coupon.end_at,
        can_use,
        disabled_reason,
        estimated_discount,
    }
}

pub async fn list_available_coupons(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AvailableCouponsQuery>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response();
        }
    };

    let coupons = match sqlx::query_as::<_, Coupon>(
        r#"
        SELECT c.*
        FROM coupons c
        WHERE c.is_active = true
          AND c.start_at <= NOW()
          AND c.end_at >= NOW()
          AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
          AND NOT EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.customer_id = $1
              AND o.coupon_id = c.id
          )
        ORDER BY c.end_at ASC
        "#,
    )
    .bind(customer_id)
    .fetch_all(&state.pool)
    .await
    {
        Ok(rows) => rows,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(&e.to_string(), None)),
            )
                .into_response();
        }
    };

    let mapped: Vec<CustomerAvailableCoupon> = coupons
        .into_iter()
        .map(|coupon| {
            map_coupon_for_customer(coupon, query.subtotal, query.shipping_cost)
        })
        .collect();

    (
        StatusCode::OK,
        Json(ApiResponse::success(mapped)),
    )
        .into_response()
}

pub async fn validate_customer_coupon(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(code): Path<String>,
    Query(query): Query<AvailableCouponsQuery>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response();
        }
    };

    let subtotal = query.subtotal.unwrap_or(0.0);
    let shipping_cost = query.shipping_cost.unwrap_or(0.0);

    let coupon = match sqlx::query_as::<_, Coupon>(
        r#"
        SELECT c.*
        FROM coupons c
        WHERE UPPER(c.code) = UPPER($1)
          AND c.is_active = true
          AND c.start_at <= NOW()
          AND c.end_at >= NOW()
        "#,
    )
    .bind(code.trim())
    .fetch_optional(&state.pool)
    .await
    {
        Ok(Some(c)) => c,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<()>::error(
                    "Voucher tidak valid atau sudah tidak aktif",
                    None,
                )),
            )
                .into_response();
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(&e.to_string(), None)),
            )
                .into_response();
        }
    };

    if let Some(limit) = coupon.usage_limit {
        if coupon.used_count >= limit {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::error(
                    "Voucher sudah tidak bisa digunakan",
                    None,
                )),
            )
                .into_response();
        }
    }

    let already_used: bool = match sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM orders WHERE customer_id = $1 AND coupon_id = $2)",
    )
    .bind(customer_id)
    .bind(coupon.id)
    .fetch_one(&state.pool)
    .await
    {
        Ok(exists) => exists,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(&e.to_string(), None)),
            )
                .into_response();
        }
    };

    if already_used {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(
                "Anda sudah pernah menggunakan voucher ini",
                None,
            )),
        )
            .into_response();
    }

    if subtotal < coupon.min_purchase {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(
                "Total pembelanjaan belum memenuhi syarat voucher",
                None,
            )),
        )
            .into_response();
    }

    let mapped = map_coupon_for_customer(coupon, Some(subtotal), Some(shipping_cost));

    (
        StatusCode::OK,
        Json(ApiResponse::success(mapped)),
    )
        .into_response()
}
