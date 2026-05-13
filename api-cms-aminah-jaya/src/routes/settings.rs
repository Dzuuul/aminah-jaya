use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Settings {
    pub store_name: String,
    pub store_email: String,
    pub phone_number: String,
    pub store_description: Option<String>,
    pub currency: String,
    pub language: String,
    pub email_notifications: bool,
    pub order_notifications: bool,
    pub low_stock_notifications: bool,
    pub appearance_mode: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsPayload {
    pub store_name: Option<String>,
    pub store_email: Option<String>,
    pub phone_number: Option<String>,
    pub store_description: Option<String>,
    pub currency: Option<String>,
    pub language: Option<String>,
    pub email_notifications: Option<bool>,
    pub order_notifications: Option<bool>,
    pub low_stock_notifications: Option<bool>,
    pub appearance_mode: Option<String>,
}

pub async fn get_settings(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Settings>(
        "SELECT store_name, store_email, phone_number, store_description, currency, language, email_notifications, order_notifications, low_stock_notifications, appearance_mode FROM settings WHERE id = 1"
    )
    .fetch_one(&state.pool)
    .await;

    match result {
        Ok(settings) => (StatusCode::OK, Json(serde_json::json!({ "success": true, "data": settings }))).into_response(),
        Err(e) => {
            tracing::error!("Failed to fetch settings: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "success": false, "message": "Failed to fetch settings" }))).into_response()
        }
    }
}

pub async fn update_settings(
    State(state): State<AppState>,
    Json(payload): Json<UpdateSettingsPayload>,
) -> impl IntoResponse {
    let result = sqlx::query(
        r#"
        UPDATE settings 
        SET 
            store_name = COALESCE($1, store_name),
            store_email = COALESCE($2, store_email),
            phone_number = COALESCE($3, phone_number),
            store_description = COALESCE($4, store_description),
            currency = COALESCE($5, currency),
            language = COALESCE($6, language),
            email_notifications = COALESCE($7, email_notifications),
            order_notifications = COALESCE($8, order_notifications),
            low_stock_notifications = COALESCE($9, low_stock_notifications),
            appearance_mode = COALESCE($10, appearance_mode),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        "#
    )
    .bind(payload.store_name)
    .bind(payload.store_email)
    .bind(payload.phone_number)
    .bind(payload.store_description)
    .bind(payload.currency)
    .bind(payload.language)
    .bind(payload.email_notifications)
    .bind(payload.order_notifications)
    .bind(payload.low_stock_notifications)
    .bind(payload.appearance_mode)
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "success": true, "message": "Settings updated successfully" }))).into_response(),
        Err(e) => {
            tracing::error!("Failed to update settings: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "success": false, "message": "Failed to update settings" }))).into_response()
        }
    }
}
