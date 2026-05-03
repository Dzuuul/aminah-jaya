use axum::{extract::State, Json, response::IntoResponse};
use sqlx::PgPool;
use crate::models::{DashboardStats, RecentOrder, ApiResponse};

/// GET /api/dashboard/stats
pub async fn get_stats(State(pool): State<PgPool>) -> impl IntoResponse {
    let revenue: (Option<f64>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE payment_status = 'paid'"
    )
    .fetch_one(&pool).await.unwrap_or((Some(0.0),));

    let orders: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM orders")
        .fetch_one(&pool).await.unwrap_or((0,));

    let new_customers: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM contacts WHERE DATE_TRUNC('month', first_seen_at) = DATE_TRUNC('month', NOW())"
    )
    .fetch_one(&pool).await.unwrap_or((0,));

    let stock: (Option<i64>,) = sqlx::query_as("SELECT COALESCE(SUM(stock), 0) FROM products")
        .fetch_one(&pool).await.unwrap_or((Some(0),));

    Json(ApiResponse::success(DashboardStats {
        total_revenue: revenue.0.unwrap_or(0.0),
        total_orders: orders.0,
        new_customers: new_customers.0,
        stock_items: stock.0.unwrap_or(0),
        revenue_change: 12.5,
        orders_change: 8.2,
        customers_change: 4.4,
        stock_change: -2.1,
    }))
}

/// GET /api/dashboard/recent-orders
pub async fn get_recent_orders(State(pool): State<PgPool>) -> impl IntoResponse {
    let orders: Vec<RecentOrder> = sqlx::query_as(
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
            o.ordered_at
        FROM orders o
        JOIN contacts c ON c.id = o.contact_id
        ORDER BY o.ordered_at DESC
        LIMIT 10
        "#
    )
    .fetch_all(&pool).await.unwrap_or_default();

    Json(ApiResponse::success(orders))
}
