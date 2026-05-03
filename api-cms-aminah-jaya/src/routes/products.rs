use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{Product, CreateProductPayload, UpdateProductPayload, ApiResponse};

/// GET /api/products
pub async fn list_products(State(pool): State<PgPool>) -> impl IntoResponse {
    let products: Vec<Product> = sqlx::query_as(
        r#"
        SELECT
            p.id,
            p.name,
            COALESCE(c.name, 'Uncategorized') AS category_name,
            p.price::FLOAT8,
            p.stock,
            CASE
                WHEN p.stock = 0     THEN 'Out of Stock'
                WHEN p.stock <= 15   THEN 'Low Stock'
                ELSE                      'In Stock'
            END AS status,
            p.sku
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.status != 'inactive'
        ORDER BY p.name ASC
        "#
    )
    .fetch_all(&pool).await.unwrap_or_default();

    Json(ApiResponse::success(products))
}

/// GET /api/products/:id
pub async fn get_product(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let product: Option<Product> = sqlx::query_as(
        r#"
        SELECT p.id, p.name,
               COALESCE(c.name, 'Uncategorized') AS category_name,
               p.price::FLOAT8, p.stock,
               CASE WHEN p.stock = 0 THEN 'Out of Stock'
                    WHEN p.stock <= 15 THEN 'Low Stock'
                    ELSE 'In Stock' END AS status,
               p.sku
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = $1
        "#
    )
    .bind(id)
    .fetch_optional(&pool).await.unwrap_or(None);

    match product {
        Some(p) => (StatusCode::OK, Json(ApiResponse::success(serde_json::to_value(p).unwrap()))).into_response(),
        None => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Product not found", None))).into_response(),
    }
}

/// POST /api/products
pub async fn create_product(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateProductPayload>,
) -> impl IntoResponse {
    let slug = payload.name.to_lowercase().replace(' ', "-");
    let result = sqlx::query(
        r#"INSERT INTO products (name, category_id, price, stock, sku, slug)
           VALUES ($1, $2, $3, $4, $5, $6)"#
    )
    .bind(&payload.name)
    .bind(payload.category_id)
    .bind(payload.price)
    .bind(payload.stock)
    .bind(&payload.sku)
    .bind(&slug)
    .execute(&pool).await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({ "slug": slug })))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

/// PATCH /api/products/:id
pub async fn update_product(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateProductPayload>,
) -> impl IntoResponse {
    let result = sqlx::query(
        r#"UPDATE products SET
               name        = COALESCE($1, name),
               category_id = COALESCE($2, category_id),
               price       = COALESCE($3, price),
               stock       = COALESCE($4, stock)
           WHERE id = $5"#
    )
    .bind(payload.name)
    .bind(payload.category_id)
    .bind(payload.price)
    .bind(payload.stock)
    .bind(id)
    .execute(&pool).await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Product not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

/// DELETE /api/products/:id
pub async fn delete_product(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    // Soft-delete: set status to inactive
    let result = sqlx::query("UPDATE products SET status = 'inactive' WHERE id = $1")
        .bind(id)
        .execute(&pool).await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Product not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}
