use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use std::env;

use crate::{models::ApiResponse, state::AppState};

#[derive(Debug, Deserialize)]
pub struct DuitkuWebhookPayload {
    pub order_number: String,
    pub amount: String,
}

pub async fn handle_duitku_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<DuitkuWebhookPayload>,
) -> impl IntoResponse {
    let expected_secret = env::var("WEBHOOK_SECRET").unwrap_or_default();
    
    // Validasi token jika WEBHOOK_SECRET di set
    if !expected_secret.is_empty() {
        let auth_header = match headers.get("Authorization").and_then(|h| h.to_str().ok()) {
            Some(h) if h.starts_with("Bearer ") => &h[7..],
            _ => {
                tracing::warn!("Webhook request rejected: Missing or invalid Authorization header");
                return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Unauthorized", None))).into_response();
            }
        };

        if auth_header != expected_secret {
            tracing::warn!("Webhook request rejected: Invalid secret");
            return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Unauthorized", None))).into_response();
        }
    }

    let pool = &state.pool;

    // Update status order
    let result = sqlx::query(
        "UPDATE orders SET payment_status = 'paid', status = 'processing'::order_status WHERE order_number = $1"
    )
    .bind(&payload.order_number)
    .execute(pool)
    .await;

    match result {
        Ok(res) => {
            if res.rows_affected() > 0 {
                tracing::info!(order_number = %payload.order_number, "Order status updated via webhook");
                (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({ "message": "OK" })))).into_response()
            } else {
                tracing::warn!(order_number = %payload.order_number, "Order not found during webhook process");
                (StatusCode::NOT_FOUND, Json(ApiResponse::error("Order not found", None))).into_response()
            }
        }
        Err(e) => {
            tracing::error!(error = %e, order_number = %payload.order_number, "Failed to update order status via webhook");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Internal Server Error", None))).into_response()
        }
    }
}
