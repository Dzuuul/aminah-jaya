use axum::{
    extract::{Path, State},
    Json,
};
use crate::{
    models::{ApiResponse, LegalPage, UpdateLegalPagePayload},
    state::AppState,
};
use axum::http::StatusCode;

pub async fn list_legal_pages(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<LegalPage>>>, (StatusCode, Json<ApiResponse<()>>)> {
    let pages = sqlx::query_as::<_, LegalPage>(
        "SELECT * FROM legal_pages ORDER BY key ASC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(&format!("Database error: {}", e), None)),
        )
    })?;

    Ok(Json(ApiResponse::success(pages)))
}

pub async fn get_legal_page(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> Result<Json<ApiResponse<LegalPage>>, (StatusCode, Json<ApiResponse<()>>)> {
    let page = sqlx::query_as::<_, LegalPage>(
        "SELECT * FROM legal_pages WHERE key = $1"
    )
    .bind(key)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(&format!("Database error: {}", e), None)),
        )
    })?
    .ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error("Legal page not found", None)),
        )
    })?;

    Ok(Json(ApiResponse::success(page)))
}

pub async fn update_legal_page(
    State(state): State<AppState>,
    Path(key): Path<String>,
    Json(payload): Json<UpdateLegalPagePayload>,
) -> Result<Json<ApiResponse<LegalPage>>, (StatusCode, Json<ApiResponse<()>>)> {
    let page = sqlx::query_as::<_, LegalPage>(
        "UPDATE legal_pages 
         SET title_id = $1, content_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE key = $3
         RETURNING *"
    )
    .bind(payload.title_id)
    .bind(payload.content_id)
    .bind(key)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(&format!("Database error: {}", e), None)),
        )
    })?;

    Ok(Json(ApiResponse::success(page)))
}
