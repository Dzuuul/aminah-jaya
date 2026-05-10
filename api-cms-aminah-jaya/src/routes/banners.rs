use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;
use crate::models::{Banner, CreateBannerPayload, UpdateBannerPayload, ApiResponse};
use crate::state::AppState;

/// GET /api/banners
pub async fn list_banners(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let banners: Vec<Banner> = sqlx::query_as(
        "SELECT * FROM banners WHERE is_active = true ORDER BY sort_order ASC, created_at DESC"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(banners))
}

/// GET /api/banners/all (for CMS)
pub async fn list_all_banners(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let banners: Vec<Banner> = sqlx::query_as(
        "SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(banners))
}

/// POST /api/banners
pub async fn create_banner(
    State(state): State<AppState>,
    Json(payload): Json<CreateBannerPayload>,
) -> impl IntoResponse {
    let pool = &state.pool;
    
    let result: Result<Uuid, sqlx::Error> = sqlx::query_scalar(
        r#"INSERT INTO banners (image_url, link_url, sort_order, starts_at, ends_at)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id"#
    )
    .bind(&payload.image_url)
    .bind(&payload.link_url)
    .bind(payload.sort_order.unwrap_or(0))
    .bind(payload.starts_at)
    .bind(payload.ends_at)
    .fetch_one(pool).await;

    match result {
        Ok(id) => (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({ "id": id })))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

/// PATCH /api/banners/:id
pub async fn update_banner(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateBannerPayload>,
) -> impl IntoResponse {
    let pool = &state.pool;
    
    let result = sqlx::query(
        r#"UPDATE banners SET
               image_url  = COALESCE($1, image_url),
               link_url   = COALESCE($2, link_url),
               sort_order = COALESCE($3, sort_order),
               is_active  = COALESCE($4, is_active),
               starts_at  = COALESCE($5, starts_at),
               ends_at    = COALESCE($6, ends_at)
           WHERE id = $7"#
    )
    .bind(&payload.image_url)
    .bind(&payload.link_url)
    .bind(payload.sort_order)
    .bind(payload.is_active)
    .bind(payload.starts_at)
    .bind(payload.ends_at)
    .bind(id)
    .execute(pool).await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Banner not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

/// DELETE /api/banners/:id
pub async fn delete_banner(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let pool = &state.pool;
    let result = sqlx::query("DELETE FROM banners WHERE id = $1").bind(id).execute(pool).await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({})))).into_response(),
        Ok(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Banner not found", None))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}
