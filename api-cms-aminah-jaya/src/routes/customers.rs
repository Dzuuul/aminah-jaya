use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{Customer, CustomerStats, ApiResponse};

/// GET /api/customers
pub async fn list_customers(State(pool): State<PgPool>) -> impl IntoResponse {
    let customers: Vec<Customer> = sqlx::query_as(
        r#"
        SELECT
            c.id,
            COALESCE(c.display_name, c.wa_name, c.wa_phone) AS name,
            c.wa_phone AS phone,
            c.city,
            COUNT(o.id) AS total_orders,
            COALESCE(SUM(o.grand_total) FILTER (WHERE o.payment_status = 'paid'), 0)::FLOAT8 AS total_spent,
            c.is_blocked,
            c.first_seen_at
        FROM contacts c
        LEFT JOIN orders o ON o.contact_id = c.id
        GROUP BY c.id, c.display_name, c.wa_name, c.wa_phone, c.city, c.is_blocked, c.first_seen_at
        ORDER BY c.first_seen_at DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(customers))
}

/// GET /api/customers/:id
pub async fn get_customer(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let customer: Option<Customer> = sqlx::query_as(
        r#"
        SELECT
            c.id,
            COALESCE(c.display_name, c.wa_name, c.wa_phone) AS name,
            c.wa_phone AS phone,
            c.city,
            COUNT(o.id) AS total_orders,
            COALESCE(SUM(o.grand_total) FILTER (WHERE o.payment_status = 'paid'), 0)::FLOAT8 AS total_spent,
            c.is_blocked,
            c.first_seen_at
        FROM contacts c
        LEFT JOIN orders o ON o.contact_id = c.id
        WHERE c.id = $1
        GROUP BY c.id, c.display_name, c.wa_name, c.wa_phone, c.city, c.is_blocked, c.first_seen_at
        "#
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .unwrap_or(None);

    match customer {
        Some(c) => (StatusCode::OK, Json(ApiResponse::success(serde_json::to_value(c).unwrap()))).into_response(),
        None => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Customer not found", None))).into_response(),
    }
}

/// GET /api/customers/stats
pub async fn get_customer_stats(State(pool): State<PgPool>) -> impl IntoResponse {
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM contacts")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let active: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM contacts WHERE last_seen_at >= NOW() - INTERVAL '30 days' AND is_blocked = FALSE"
    )
    .fetch_one(&pool)
    .await
    .unwrap_or((0,));

    let revenue: (Option<f64>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE payment_status = 'paid'"
    )
    .fetch_one(&pool)
    .await
    .unwrap_or((Some(0.0),));

    Json(ApiResponse::success(CustomerStats {
        total_customers: total.0,
        active_customers: active.0,
        total_revenue: revenue.0.unwrap_or(0.0),
    }))
}
