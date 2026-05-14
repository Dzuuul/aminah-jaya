use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::state::AppState;
use crate::models::Notification;

#[derive(Deserialize)]
pub struct NotificationQuery {
    pub user_id: Option<Uuid>,
    pub contact_id: Option<Uuid>,
}

#[derive(Serialize)]
pub struct NotificationListResponse {
    pub success: bool,
    pub data: Vec<Notification>,
}

#[derive(Serialize)]
pub struct UnreadCountResponse {
    pub success: bool,
    pub count: i64,
}

pub async fn list_notifications(
    State(state): State<AppState>,
    Query(query): Query<NotificationQuery>,
) -> Result<Json<NotificationListResponse>, StatusCode> {
    let notifications = sqlx::query_as::<_, Notification>(
        "SELECT * FROM notifications 
         WHERE ($1::uuid IS NULL OR user_id = $1)
         AND ($2::uuid IS NULL OR contact_id = $2)
         ORDER BY created_at DESC LIMIT 50"
    )
    .bind(query.user_id)
    .bind(query.contact_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch notifications: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(NotificationListResponse {
        success: true,
        data: notifications,
    }))
}

pub async fn get_unread_count(
    State(state): State<AppState>,
    Query(query): Query<NotificationQuery>,
) -> Result<Json<UnreadCountResponse>, StatusCode> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM notifications 
         WHERE is_read = false
         AND ($1::uuid IS NULL OR user_id = $1)
         AND ($2::uuid IS NULL OR contact_id = $2)"
    )
    .bind(query.user_id)
    .bind(query.contact_id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to count unread notifications: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(UnreadCountResponse {
        success: true,
        count: row.0,
    }))
}

pub async fn mark_as_read(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    sqlx::query("UPDATE notifications SET is_read = true WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to mark notification as read: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(serde_json::json!({ "success": true })))
}
