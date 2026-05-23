use axum::{Json, response::IntoResponse, http::{StatusCode, HeaderMap}, extract::{State, Path}};
use crate::models::{ApiResponse, CartItem, AddToCartPayload, UpdateCartItemPayload};
use crate::auth::verify_jwt;
use crate::state::AppState;
use uuid::Uuid;

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

pub async fn get_cart(
    State(state): State<AppState>,
    headers: HeaderMap
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let items: Vec<CartItem> = sqlx::query_as(
        r#"SELECT 
            ci.id, ci.customer_id, ci.product_id, ci.quantity, ci.created_at,
            p.name AS product_name, p.price::FLOAT8 AS product_price, p.slug AS product_slug,
            p.weight_gram AS product_weight_gram,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS product_thumbnail
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
           WHERE ci.customer_id = $1
           ORDER BY ci.created_at DESC"#
    )
    .bind(customer_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(items)).into_response()
}

pub async fn add_to_cart(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AddToCartPayload>
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    
    // Check if item already exists
    let existing: Option<(Uuid, i32)> = sqlx::query_as(
        "SELECT id, quantity FROM cart_items WHERE customer_id = $1 AND product_id = $2"
    )
    .bind(customer_id)
    .bind(payload.product_id)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    if let Some((id, qty)) = existing {
        // Update quantity
        let new_qty = qty + payload.quantity;
        let _ = sqlx::query("UPDATE cart_items SET quantity = $1 WHERE id = $2")
            .bind(new_qty)
            .bind(id)
            .execute(pool)
            .await;
        
        return (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({ "id": id, "quantity": new_qty })))).into_response();
    }

    // Insert new item
    let result = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO cart_items (customer_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING id"
    )
    .bind(customer_id)
    .bind(payload.product_id)
    .bind(payload.quantity)
    .fetch_one(pool)
    .await;

    match result {
        Ok(id) => (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({ "id": id })))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

pub async fn update_cart_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateCartItemPayload>
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let result = sqlx::query("UPDATE cart_items SET quantity = $1 WHERE id = $2 AND customer_id = $3")
        .bind(payload.quantity)
        .bind(id)
        .bind(customer_id)
        .execute(pool)
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Cart item not found", None))).into_response(),
    }
}

pub async fn remove_from_cart(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let result = sqlx::query("DELETE FROM cart_items WHERE id = $1 AND customer_id = $2")
        .bind(id)
        .bind(customer_id)
        .execute(pool)
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Cart item not found", None))).into_response(),
    }
}

pub async fn clear_cart(
    State(state): State<AppState>,
    headers: HeaderMap
) -> impl IntoResponse {
    let customer_id = match get_customer_id(&headers).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };

    let pool = &state.pool;
    let _ = sqlx::query("DELETE FROM cart_items WHERE customer_id = $1")
        .bind(customer_id)
        .execute(pool)
        .await;

    (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response()
}
