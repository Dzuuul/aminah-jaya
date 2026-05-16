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
            p.slug,
            p.description,
            p.category_id,
            COALESCE(c.name, 'Uncategorized') AS category_name,
            p.price::FLOAT8,
            p.price_compare::FLOAT8,
            p.stock,
            CASE
                WHEN p.stock = 0     THEN 'Out of Stock'
                WHEN p.stock <= 15   THEN 'Low Stock'
                ELSE                      'In Stock'
            END AS status,
            p.sku,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS thumbnail_url,
            p.subtitle,
            p.rating::FLOAT8,
            p.reviews_count,
            p.sold_count,
            p.certifications,
            p.variants_chips,
            p.ingredients,
            p.how_to_use,
            p.story,
            p.macro_detail,
            p.benefits,
            p.dosage,
            p.discount_label,
            p.wa_message_template
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
        SELECT p.id, p.name, p.slug, p.description, p.category_id,
               COALESCE(c.name, 'Uncategorized') AS category_name,
               p.price::FLOAT8, p.price_compare::FLOAT8, p.stock,
               CASE WHEN p.stock = 0 THEN 'Out of Stock'
                    WHEN p.stock <= 15 THEN 'Low Stock'
                    ELSE 'In Stock' END AS status,
               p.sku,
               (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS thumbnail_url,
               p.subtitle, p.rating::FLOAT8, p.reviews_count, p.sold_count,
               p.certifications, p.variants_chips, p.ingredients, p.how_to_use,
               p.story, p.macro_detail, p.benefits, p.dosage, p.discount_label,
               p.wa_message_template
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

/// GET /api/products/slug/:slug
pub async fn get_product_by_slug(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let product: Option<Product> = sqlx::query_as(
        r#"
        SELECT p.id, p.name, p.slug, p.description, p.category_id,
               COALESCE(c.name, 'Uncategorized') AS category_name,
               p.price::FLOAT8, p.price_compare::FLOAT8, p.stock,
               CASE WHEN p.stock = 0 THEN 'Out of Stock'
                    WHEN p.stock <= 15 THEN 'Low Stock'
                    ELSE 'In Stock' END AS status,
               p.sku,
               (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS thumbnail_url,
               p.subtitle, p.rating::FLOAT8, p.reviews_count, p.sold_count,
               p.certifications, p.variants_chips, p.ingredients, p.how_to_use,
               p.story, p.macro_detail, p.benefits, p.dosage, p.discount_label,
               p.wa_message_template
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.slug = $1
        "#
    )
    .bind(slug)
    .fetch_optional(pool).await.unwrap_or(None);

    match product {
        Some(mut p) => {
            let images: Vec<crate::models::ProductImage> = sqlx::query_as(
                "SELECT id, product_id, url, alt_text, sort_order, is_primary FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC"
            )
            .bind(p.id)
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
        r#"INSERT INTO products (
            name, category_id, price, price_compare, stock, sku, slug,
            description, subtitle, rating, reviews_count, sold_count, certifications,
            variants_chips, ingredients, how_to_use, story, macro_detail,
            benefits, dosage, discount_label, wa_message_template
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
           RETURNING id"#
    )
    .bind(&payload.name)
    .bind(payload.category_id)
    .bind(payload.price)
    .bind(payload.price_compare)
    .bind(payload.stock)
    .bind(&payload.sku)
    .bind(&slug)
    .bind(&payload.description)
    .bind(&payload.subtitle)
    .bind(payload.rating)
    .bind(payload.reviews_count)
    .bind(&payload.sold_count)
    .bind(serde_json::to_value(&payload.certifications).unwrap_or(serde_json::json!([])))
    .bind(serde_json::to_value(&payload.variants_chips).unwrap_or(serde_json::json!([])))
    .bind(&payload.ingredients)
    .bind(&payload.how_to_use)
    .bind(&payload.story)
    .bind(&payload.macro_detail)
    .bind(&payload.benefits)
    .bind(&payload.dosage)
    .bind(&payload.discount_label)
    .bind(&payload.wa_message_template)
    .fetch_one(&mut *tx).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("❌ Database error creating product: {:?}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
        }
    };

    // Insert all images in one go if there are any
    if !payload.image_urls.is_empty() {
        let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> = sqlx::QueryBuilder::new(
            "INSERT INTO product_images (product_id, url, sort_order, is_primary) "
        );

        query_builder.push_values(payload.image_urls.iter().enumerate(), |mut b, (i, url)| {
            b.push_bind(product_id)
             .push_bind(url)
             .push_bind(i as i32)
             .push_bind(i == 0);
        });

        let query = query_builder.build();
        if let Err(e) = query.execute(&mut *tx).await {
            tracing::error!("❌ Database error adding product images: {:?}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to save product images", None))).into_response();
        }
    }

    if let Err(e) = tx.commit().await {
        tracing::error!("❌ Database error committing transaction: {:?}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to commit transaction", None))).into_response();
    }

    tracing::info!("✅ Product created successfully: {} (ID: {})", payload.name, product_id);
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
               price_compare = COALESCE($4, price_compare),
               stock       = COALESCE($5, stock),
               sku         = COALESCE($6, sku),
               description = COALESCE($7, description),
               subtitle    = COALESCE($8, subtitle),
               rating      = COALESCE($9, rating),
               reviews_count = COALESCE($10, reviews_count),
               sold_count  = COALESCE($11, sold_count),
               certifications = COALESCE($12, certifications),
               variants_chips = COALESCE($13, variants_chips),
               ingredients = COALESCE($14, ingredients),
               how_to_use  = COALESCE($15, how_to_use),
               story       = COALESCE($16, story),
               macro_detail = COALESCE($17, macro_detail),
               benefits    = COALESCE($18, benefits),
               dosage      = COALESCE($19, dosage),
               discount_label = COALESCE($20, discount_label),
               wa_message_template = COALESCE($21, wa_message_template)
           WHERE id = $22"#
    )
    .bind(&payload.name)
    .bind(payload.category_id)
    .bind(payload.price)
    .bind(payload.price_compare)
    .bind(payload.stock)
    .bind(&payload.sku)
    .bind(&payload.description)
    .bind(&payload.subtitle)
    .bind(payload.rating)
    .bind(payload.reviews_count)
    .bind(&payload.sold_count)
    .bind(payload.certifications.map(|c| serde_json::to_value(c).unwrap_or(serde_json::json!([]))))
    .bind(payload.variants_chips.map(|v| serde_json::to_value(v).unwrap_or(serde_json::json!([]))))
    .bind(&payload.ingredients)
    .bind(&payload.how_to_use)
    .bind(&payload.story)
    .bind(&payload.macro_detail)
    .bind(&payload.benefits)
    .bind(&payload.dosage)
    .bind(&payload.discount_label)
    .bind(&payload.wa_message_template)
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

        if !image_urls.is_empty() {
            let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> = sqlx::QueryBuilder::new(
                "INSERT INTO product_images (product_id, url, sort_order, is_primary) "
            );

            query_builder.push_values(image_urls.iter().enumerate(), |mut b, (i, url)| {
                b.push_bind(id)
                 .push_bind(url)
                 .push_bind(i as i32)
                 .push_bind(i == 0);
            });

            let query = query_builder.build();
            if let Err(e) = query.execute(&mut *tx).await {
                tracing::error!("❌ Database error updating product images: {:?}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to update product images", None))).into_response();
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
