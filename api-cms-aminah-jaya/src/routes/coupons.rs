use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use crate::models::{ApiResponse, Coupon, CreateCouponPayload, UpdateCouponPayload, PaginationQuery, PaginationMeta};
use crate::state::AppState;
use uuid::Uuid;

pub async fn list_coupons(
    State(state): State<AppState>,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<ApiResponse<Vec<Coupon>>>, (StatusCode, String)> {
    let limit = pagination.limit();
    let offset = pagination.offset();

    let coupons = sqlx::query_as::<_, Coupon>(
        "SELECT * FROM coupons ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM coupons")
        .fetch_one(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::paginated(coupons, PaginationMeta {
        current_page: pagination.page.unwrap_or(1),
        total_pages: (total.0 as f64 / limit as f64).ceil() as i64,
        total_items: total.0,
        items_per_page: limit,
    })))
}

pub async fn get_coupon(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Coupon>>, (StatusCode, String)> {
    let coupon = sqlx::query_as::<_, Coupon>("SELECT * FROM coupons WHERE id = $1")
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| (StatusCode::NOT_FOUND, "Coupon not found".to_string()))?;

    Ok(Json(ApiResponse::success(coupon)))
}

pub async fn validate_coupon(
    State(state): State<AppState>,
    Path(code): Path<String>,
) -> Result<Json<ApiResponse<Coupon>>, (StatusCode, String)> {
    let coupon = sqlx::query_as::<_, Coupon>(
        "SELECT * FROM coupons WHERE code = $1 AND is_active = true AND start_at <= NOW() AND end_at >= NOW()"
    )
    .bind(code)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| (StatusCode::NOT_FOUND, "Kupon tidak valid atau sudah kadaluarsa".to_string()))?;

    if let Some(limit) = coupon.usage_limit {
        if coupon.used_count >= limit {
            return Err((StatusCode::BAD_REQUEST, "Kupon sudah mencapai batas penggunaan".to_string()));
        }
    }

    Ok(Json(ApiResponse::success(coupon)))
}

pub async fn create_coupon(
    State(state): State<AppState>,
    Json(payload): Json<CreateCouponPayload>,
) -> Result<Json<ApiResponse<Coupon>>, (StatusCode, String)> {
    let coupon = sqlx::query_as::<_, Coupon>(
        r#"
        INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, start_at, end_at, usage_limit, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#
    )
    .bind(&payload.code.to_uppercase())
    .bind(&payload.discount_type)
    .bind(payload.discount_value)
    .bind(payload.min_purchase.unwrap_or(0.0))
    .bind(payload.max_discount)
    .bind(payload.start_at)
    .bind(payload.end_at)
    .bind(payload.usage_limit)
    .bind(payload.is_active.unwrap_or(true))
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(coupon)))
}

pub async fn update_coupon(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateCouponPayload>,
) -> Result<Json<ApiResponse<Coupon>>, (StatusCode, String)> {
    let coupon = sqlx::query_as::<_, Coupon>(
        r#"
        UPDATE coupons SET
            code = COALESCE($1, code),
            discount_type = COALESCE($2, discount_type),
            discount_value = COALESCE($3, discount_value),
            min_purchase = COALESCE($4, min_purchase),
            max_discount = COALESCE($5, max_discount),
            start_at = COALESCE($6, start_at),
            end_at = COALESCE($7, end_at),
            usage_limit = COALESCE($8, usage_limit),
            is_active = COALESCE($9, is_active),
            updated_at = NOW()
        WHERE id = $10
        RETURNING *
        "#
    )
    .bind(payload.code.map(|c| c.to_uppercase()))
    .bind(payload.discount_type)
    .bind(payload.discount_value)
    .bind(payload.min_purchase)
    .bind(payload.max_discount)
    .bind(payload.start_at)
    .bind(payload.end_at)
    .bind(payload.usage_limit)
    .bind(payload.is_active)
    .bind(id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(coupon)))
}

pub async fn delete_coupon(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, String)> {
    sqlx::query("DELETE FROM coupons WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(())))
}
