use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{Order, UpdateOrderStatusPayload, ApiResponse};

/// GET /api/orders
pub async fn list_orders(State(pool): State<PgPool>) -> impl IntoResponse {
    let orders: Vec<Order> = sqlx::query_as(
        r#"
        SELECT
            o.id,
            o.order_number,
            COALESCE(c.display_name, c.wa_name, c.wa_phone) AS customer_name,
            COALESCE(
                (SELECT oi.product_name FROM order_items oi WHERE oi.order_id = o.id LIMIT 1),
                'Multiple Items'
            ) AS product_name,
            o.grand_total,
            o.status::TEXT,
            o.payment_status::TEXT,
            o.ordered_at
        FROM orders o
        JOIN contacts c ON c.id = o.contact_id
        ORDER BY o.ordered_at DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(orders))
}

/// GET /api/orders/:id
pub async fn get_order(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let order: Option<Order> = sqlx::query_as(
        r#"
        SELECT
            o.id,
            o.order_number,
            COALESCE(c.display_name, c.wa_name, c.wa_phone) AS customer_name,
            COALESCE(
                (SELECT oi.product_name FROM order_items oi WHERE oi.order_id = o.id LIMIT 1),
                'Multiple Items'
            ) AS product_name,
            o.grand_total,
            o.status::TEXT,
            o.payment_status::TEXT,
            o.ordered_at
        FROM orders o
        JOIN contacts c ON c.id = o.contact_id
        WHERE o.id = $1
        "#
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .unwrap_or(None);

    match order {
        Some(o) => (StatusCode::OK, Json(ApiResponse::success(serde_json::to_value(o).unwrap()))).into_response(),
        None => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Order not found", None))).into_response(),
    }
}

/// PATCH /api/orders/:id/status
pub async fn update_order_status(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateOrderStatusPayload>,
) -> impl IntoResponse {
    let valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
    if !valid_statuses.contains(&payload.status.to_lowercase().as_str()) {
        return (StatusCode::BAD_REQUEST, "Invalid status value").into_response();
    }

    let result = sqlx::query("UPDATE orders SET status = $1::order_status WHERE id = $2")
        .bind(&payload.status.to_lowercase())
        .bind(id)
        .execute(&pool)
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Order not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}
