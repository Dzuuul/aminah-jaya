use axum::{Json, response::IntoResponse, http::{StatusCode, HeaderMap}, extract::{State, Path, Query}};
use crate::models::{ApiResponse, CustomerFavorite, AddFavoritePayload};
use crate::auth::verify_jwt;
use crate::state::AppState;
use uuid::Uuid;
use serde::Deserialize;

async fn get_customer_id(headers: &HeaderMap) -> Result<Uuid, (StatusCode, Json<ApiResponse<()>>)> {
    let auth_header = match headers.get("Authorization").and_then(|h| h.to_str().ok()) {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return Err((StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Missing or invalid token", None)))),
    };

    let claims = match verify_jwt(auth_header) {
        Ok(c) => c,
        Err(_) => return Err((StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid token", None)))),
    };

    match Uuid::parse_str(&claims.sub) {
        Ok(id) => Ok(id),
        Err(_) => Err((StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid user ID in token", None)))),
    }
}

pub async fn get_favorites(
    State(state): State<AppState>,
    headers: HeaderMap
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let items: Vec<CustomerFavorite> = sqlx::query_as(
        r#"SELECT 
            cf.id, cf.customer_id, cf.product_id, cf.folder_name, cf.created_at,
            p.name AS product_name, p.price::FLOAT8 AS product_price, p.slug AS product_slug,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS product_thumbnail
           FROM customer_favorites cf
           JOIN products p ON p.id = cf.product_id
           WHERE cf.customer_id = $1
           ORDER BY cf.created_at DESC"#
    )
    .bind(customer_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(items)).into_response()
}

pub async fn add_favorite(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AddFavoritePayload>
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let folder_name = payload.folder_name.clone().unwrap_or_else(|| "Favorit Saya".to_string());
    let clean_folder = if folder_name.trim().is_empty() {
        "Favorit Saya".to_string()
    } else {
        folder_name.trim().to_string()
    };

    // Check if item already exists in this folder
    let existing: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM customer_favorites WHERE customer_id = $1 AND product_id = $2 AND folder_name = $3"
    )
    .bind(customer_id)
    .bind(payload.product_id)
    .bind(&clean_folder)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    if let Some(id) = existing {
        return (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({ "id": id, "message": "Item already in favorites" })))).into_response();
    }

    // Insert new item
    let result = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO customer_favorites (customer_id, product_id, folder_name) VALUES ($1, $2, $3) RETURNING id"
    )
    .bind(customer_id)
    .bind(payload.product_id)
    .bind(&clean_folder)
    .fetch_one(pool)
    .await;

    match result {
        Ok(id) => (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({ "id": id, "folder_name": clean_folder })))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

pub async fn remove_favorite(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let result = sqlx::query("DELETE FROM customer_favorites WHERE id = $1 AND customer_id = $2")
        .bind(id)
        .bind(customer_id)
        .execute(pool)
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Favorite item not found", None))).into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct RemoveFavoriteQuery {
    pub folder_name: Option<String>,
}

pub async fn remove_favorite_by_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(product_id): Path<Uuid>,
    Query(query): Query<RemoveFavoriteQuery>
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let result = if let Some(ref folder_name) = query.folder_name {
        sqlx::query("DELETE FROM customer_favorites WHERE customer_id = $1 AND product_id = $2 AND folder_name = $3")
            .bind(customer_id)
            .bind(product_id)
            .bind(folder_name)
            .execute(pool)
            .await
    } else {
        sqlx::query("DELETE FROM customer_favorites WHERE customer_id = $1 AND product_id = $2")
            .bind(customer_id)
            .bind(product_id)
            .execute(pool)
            .await
    };

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({ "rows_affected": r.rows_affected() })))).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Favorite item not found", None))).into_response(),
    }
}

pub async fn get_favorite_folders(
    State(state): State<AppState>,
    headers: HeaderMap
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let folders: Vec<String> = sqlx::query_scalar(
        "SELECT DISTINCT folder_name FROM customer_favorites WHERE customer_id = $1 ORDER BY folder_name ASC"
    )
    .bind(customer_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(folders)).into_response()
}
