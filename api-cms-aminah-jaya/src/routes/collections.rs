use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;
use crate::models::{Collection, CreateCollectionPayload, UpdateCollectionPayload, ApiResponse};
use crate::state::AppState;

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct ProductInCollection {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
}

/// GET /api/collections
pub async fn list_collections(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let pool = &state.pool;
    
    let collections: Vec<Collection> = sqlx::query_as(
        "SELECT id, name, slug, image_url, description, sort_order, created_at, updated_at FROM collections ORDER BY sort_order ASC, name ASC"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let mut collections_with_products = Vec::new();
    for col in collections {
        let prods: Vec<ProductInCollection> = sqlx::query_as(
            r#"SELECT p.id, p.name, p.slug
               FROM products p
               JOIN product_collections pc ON pc.product_id = p.id
               WHERE pc.collection_id = $1 AND p.status != 'inactive'
               ORDER BY p.name ASC
               LIMIT 8"#
        )
        .bind(col.id)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        collections_with_products.push(serde_json::json!({
            "id": col.id,
            "name": col.name,
            "slug": col.slug,
            "image_url": col.image_url,
            "description": col.description,
            "sort_order": col.sort_order,
            "created_at": col.created_at,
            "updated_at": col.updated_at,
            "products": prods
        }));
    }

    Json(ApiResponse::success(collections_with_products))
}

/// GET /api/collections/:id
pub async fn get_collection(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let pool = &state.pool;
    
    let collection_opt: Option<Collection> = sqlx::query_as(
        "SELECT id, name, slug, image_url, description, sort_order, created_at, updated_at FROM collections WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    match collection_opt {
        Some(mut collection) => {
            // Fetch associated product IDs
            let product_ids: Vec<Uuid> = sqlx::query_scalar(
                "SELECT product_id FROM product_collections WHERE collection_id = $1"
            )
            .bind(id)
            .fetch_all(pool)
            .await
            .unwrap_or_default();

            collection.product_ids = Some(product_ids);
            (StatusCode::OK, Json(ApiResponse::success(collection))).into_response()
        }
        None => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Collection not found", None))).into_response(),
    }
}

/// POST /api/collections
pub async fn create_collection(
    State(state): State<AppState>,
    Json(payload): Json<CreateCollectionPayload>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let slug = payload.name.to_lowercase().replace(' ', "-");

    let mut tx = match pool.begin().await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    };

    let result = sqlx::query_scalar::<_, Uuid>(
        r#"INSERT INTO collections (name, slug, image_url, description, sort_order)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id"#
    )
    .bind(&payload.name)
    .bind(&slug)
    .bind(&payload.image_url)
    .bind(&payload.description)
    .bind(payload.sort_order.unwrap_or(0))
    .fetch_one(&mut *tx)
    .await;

    let collection_id = match result {
        Ok(id) => id,
        Err(e) => {
            let _ = tx.rollback().await;
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
        }
    };

    // Link products if provided
    if let Some(product_ids) = payload.product_ids {
        if !product_ids.is_empty() {
            for prod_id in product_ids {
                let link_res = sqlx::query(
                    "INSERT INTO product_collections (product_id, collection_id) VALUES ($1, $2)"
                )
                .bind(prod_id)
                .bind(collection_id)
                .execute(&mut *tx)
                .await;

                if let Err(e) = link_res {
                    let _ = tx.rollback().await;
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
                }
            }
        }
    }

    if let Err(e) = tx.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
    }

    (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({ "id": collection_id, "slug": slug })))).into_response()
}

/// PATCH /api/collections/:id
pub async fn update_collection(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateCollectionPayload>,
) -> impl IntoResponse {
    let pool = &state.pool;

    let mut tx = match pool.begin().await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    };

    // Calculate dynamic update values
    let slug = payload.name.as_ref().map(|n| n.to_lowercase().replace(' ', "-"));

    let update_res = sqlx::query(
        r#"UPDATE collections SET
               name = COALESCE($1, name),
               slug = COALESCE($2, slug),
               image_url = COALESCE($3, image_url),
               description = COALESCE($4, description),
               sort_order = COALESCE($5, sort_order),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6"#
    )
    .bind(&payload.name)
    .bind(&slug)
    .bind(&payload.image_url)
    .bind(&payload.description)
    .bind(payload.sort_order)
    .bind(id)
    .execute(&mut *tx)
    .await;

    if let Err(e) = update_res {
        let _ = tx.rollback().await;
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
    }

    // Sync product links if provided
    if let Some(product_ids) = payload.product_ids {
        // Delete all old mappings
        if let Err(e) = sqlx::query("DELETE FROM product_collections WHERE collection_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await
        {
            let _ = tx.rollback().await;
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
        }

        // Insert new mappings
        for prod_id in product_ids {
            let link_res = sqlx::query(
                "INSERT INTO product_collections (product_id, collection_id) VALUES ($1, $2)"
            )
            .bind(prod_id)
            .bind(id)
            .execute(&mut *tx)
            .await;

            if let Err(e) = link_res {
                let _ = tx.rollback().await;
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
            }
        }
    }

    if let Err(e) = tx.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
    }

    (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response()
}

/// DELETE /api/collections/:id
pub async fn delete_collection(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let pool = &state.pool;
    
    let result = sqlx::query("DELETE FROM collections WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Collection not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}
