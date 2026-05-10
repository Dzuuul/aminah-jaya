use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;
use crate::models::{Product, CreateProductPayload, UpdateProductPayload, ApiResponse, PaginationQuery, PaginationMeta};
use crate::state::AppState;

/// GET /api/products
pub async fn list_products(
    State(state): State<AppState>,
    Query(pagination): Query<PaginationQuery>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let limit = pagination.limit();
    let offset = pagination.offset();

    let total_items: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM products WHERE status != 'inactive'")
        .fetch_one(pool)
        .await
        .unwrap_or(0);

    let products: Vec<Product> = sqlx::query_as(
        r#"
        SELECT
            p.id,
            p.name,
            p.category_id,
            COALESCE(c.name, 'Uncategorized') AS category_name,
            p.price::FLOAT8,
            p.stock,
            CASE
                WHEN p.stock = 0     THEN 'Out of Stock'
                WHEN p.stock <= 15   THEN 'Low Stock'
                ELSE                      'In Stock'
            END AS status,
            p.sku,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS thumbnail_url
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.status != 'inactive'
        ORDER BY p.name ASC
        LIMIT $1 OFFSET $2
        "#
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool).await.unwrap_or_default();

    let meta = PaginationMeta {
        current_page: pagination.page.unwrap_or(1),
        total_pages: (total_items as f64 / limit as f64).ceil() as i64,
        total_items,
        items_per_page: limit,
    };

    Json(ApiResponse::paginated(products, meta))
}

/// GET /api/products/:id
pub async fn get_product(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let product: Option<Product> = sqlx::query_as(
        r#"
        SELECT p.id, p.name, p.category_id,
               COALESCE(c.name, 'Uncategorized') AS category_name,
               p.price::FLOAT8, p.stock,
               CASE WHEN p.stock = 0 THEN 'Out of Stock'
                    WHEN p.stock <= 15 THEN 'Low Stock'
                    ELSE 'In Stock' END AS status,
               p.sku,
               (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS thumbnail_url
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = $1
        "#
    )
    .bind(id)
    .fetch_optional(pool).await.unwrap_or(None);

    match product {
        Some(mut p) => {
            let images: Vec<crate::models::ProductImage> = sqlx::query_as(
                "SELECT id, product_id, url, alt_text, sort_order, is_primary FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC"
            )
            .bind(id)
            .fetch_all(pool).await.unwrap_or_default();
            
            p.images = images;
            (StatusCode::OK, Json(ApiResponse::success(serde_json::to_value(p).unwrap()))).into_response()
        },
        None => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Product not found", None))).into_response(),
    }
}

/// POST /api/products
pub async fn create_product(
    State(state): State<AppState>,
    Json(payload): Json<CreateProductPayload>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let slug = payload.name.to_lowercase().replace(' ', "-");
    
    let mut tx = match pool.begin().await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    };

    let product_id: Uuid = match sqlx::query_scalar(
        r#"INSERT INTO products (name, category_id, price, stock, sku, slug)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id"#
    )
    .bind(&payload.name)
    .bind(payload.category_id)
    .bind(payload.price)
    .bind(payload.stock)
    .bind(&payload.sku)
    .bind(&slug)
    .fetch_one(&mut *tx).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("❌ Database error creating product: {:?}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
        }
    };

    for (i, url) in payload.image_urls.iter().enumerate() {
        if let Err(e) = sqlx::query(
            "INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES ($1, $2, $3, $4)"
        )
        .bind(product_id)
        .bind(url)
        .bind(i as i32)
        .bind(i == 0)
        .execute(&mut *tx).await {
            tracing::error!("❌ Database error adding product image: {:?}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
        }
    }

    if let Err(e) = tx.commit().await {
        tracing::error!("❌ Database error committing transaction: {:?}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
    }

    (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({ "id": product_id, "slug": slug })))).into_response()
}

/// PATCH /api/products/:id
pub async fn update_product(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateProductPayload>,
) -> impl IntoResponse {
    let pool = &state.pool;
    
    let mut tx = match pool.begin().await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    };

    let result = sqlx::query(
        r#"UPDATE products SET
               name        = COALESCE($1, name),
               category_id = COALESCE($2, category_id),
               price       = COALESCE($3, price),
               stock       = COALESCE($4, stock)
           WHERE id = $5"#
    )
    .bind(&payload.name)
    .bind(payload.category_id)
    .bind(payload.price)
    .bind(payload.stock)
    .bind(id)
    .execute(&mut *tx).await;

    if let Err(e) = result {
        tracing::error!("❌ Database error updating product: {:?}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
    }

    // Update images if provided
    if let Some(image_urls) = payload.image_urls {
        // Simple approach: delete existing and insert new
        if let Err(e) = sqlx::query("DELETE FROM product_images WHERE product_id = $1")
            .bind(id)
            .execute(&mut *tx).await {
            tracing::error!("❌ Database error deleting product images: {:?}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
        }

        for (i, url) in image_urls.iter().enumerate() {
            if let Err(e) = sqlx::query(
                "INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES ($1, $2, $3, $4)"
            )
            .bind(id)
            .bind(url)
            .bind(i as i32)
            .bind(i == 0)
            .execute(&mut *tx).await {
                tracing::error!("❌ Database error updating product image: {:?}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
            }
        }
    }

    if let Err(e) = tx.commit().await {
        tracing::error!("❌ Database error committing transaction: {:?}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
    }

    (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response()
}

/// DELETE /api/products/:id
pub async fn delete_product(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let pool = &state.pool;
    // Soft-delete: set status to inactive
    let result = sqlx::query("UPDATE products SET status = 'inactive' WHERE id = $1")
        .bind(id)
        .execute(pool).await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Product not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

/// GET /api/categories
pub async fn list_categories(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let categories: Vec<crate::models::Category> = sqlx::query_as(
        "SELECT id, name, slug, image_url, description, sort_order FROM categories WHERE is_active = true ORDER BY sort_order ASC, name ASC"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(categories))
}

/// POST /api/categories
pub async fn create_category(
    State(state): State<AppState>,
    Json(payload): Json<crate::models::CreateCategoryPayload>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let slug = payload.name.to_lowercase().replace(' ', "-");
    
    let result = sqlx::query(
        r#"INSERT INTO categories (name, slug, image_url, description, sort_order)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id"#
    )
    .bind(&payload.name)
    .bind(&slug)
    .bind(&payload.image_url)
    .bind(&payload.description)
    .bind(payload.sort_order.unwrap_or(0))
    .execute(pool).await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({ "slug": slug })))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

/// PATCH /api/categories/:id
pub async fn update_category(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<crate::models::UpdateCategoryPayload>,
) -> impl IntoResponse {
    let pool = &state.pool;
    
    let result = sqlx::query(
        r#"UPDATE categories SET
               name       = COALESCE($1, name),
               image_url  = COALESCE($2, image_url),
               description = COALESCE($3, description),
               sort_order = COALESCE($4, sort_order)
           WHERE id = $5"#
    )
    .bind(&payload.name)
    .bind(&payload.image_url)
    .bind(&payload.description)
    .bind(payload.sort_order)
    .bind(id)
    .execute(pool).await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Category not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

/// DELETE /api/categories/:id
pub async fn delete_category(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let pool = &state.pool;
    // Soft-delete: set is_active to false
    let result = sqlx::query("UPDATE categories SET is_active = false WHERE id = $1")
        .bind(id)
        .execute(pool).await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Category not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}
