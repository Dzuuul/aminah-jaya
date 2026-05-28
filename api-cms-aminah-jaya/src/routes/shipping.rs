use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    auth::verify_jwt,
    integrasi::IntegrasiClient,
    models::ApiResponse,
    state::AppState,
};

fn extract_customer_id(headers: &HeaderMap) -> Result<Uuid, StatusCode> {
    let token = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = verify_jwt(token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::BAD_REQUEST)
}

pub async fn get_customer_order_tracking(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<Uuid>,
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

    let row: Option<(Option<String>, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT biteship_tracking_id, biteship_order_id, tracking_number FROM orders WHERE id = $1 AND customer_id = $2",
    )
    .bind(order_id)
    .bind(customer_id)
    .fetch_optional(&state.pool)
    .await
    .unwrap_or(None);

    let (tracking_id, biteship_order_id, waybill) = match row {
        Some(r) => r,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<()>::error("Pesanan tidak ditemukan", None)),
            )
                .into_response();
        }
    };

    let integrasi = match IntegrasiClient::from_env() {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(ApiResponse::<()>::error(&e.message, None)),
            )
                .into_response();
        }
    };

    if let Some(tracking_id) = tracking_id.filter(|t| !t.is_empty()) {
        match integrasi.get_biteship_tracking(&tracking_id).await {
            Ok(data) => {
                return (StatusCode::OK, Json(ApiResponse::success(data))).into_response();
            }
            Err(e) => {
                tracing::warn!("Biteship tracking via integrasi failed: {}", e.message);
            }
        }
    }

    if let Some(biteship_order_id) = biteship_order_id.filter(|t| !t.is_empty()) {
        match integrasi.get_biteship_order(&biteship_order_id).await {
            Ok(data) => {
                return (StatusCode::OK, Json(ApiResponse::success(data))).into_response();
            }
            Err(e) => {
                tracing::warn!("Biteship order via integrasi failed: {}", e.message);
            }
        }
    }

    (
        StatusCode::OK,
        Json(ApiResponse::success(json!({
            "status": "pending",
            "waybill_id": waybill,
            "message": "Pelacakan belum tersedia untuk pesanan ini"
        }))),
    )
        .into_response()
}
