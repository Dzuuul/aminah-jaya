use axum::{
    extract::{State, Multipart},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;
use crate::models::ApiResponse;
use crate::state::AppState;

pub async fn upload_file(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut file_url = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        let file_name = field.file_name().unwrap_or("").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
        
        tracing::debug!("📁 Received multipart field: name={}, file_name={}, content_type={}", name, file_name, content_type);
        
        if name == "file" {
            let data: axum::body::Bytes = match field.bytes().await {
                Ok(b) => b,
                Err(e) => {
                    tracing::error!("❌ Failed to read bytes from field 'file': {:?}", e);
                    return (StatusCode::BAD_REQUEST, Json(ApiResponse::error(&format!("Failed to read bytes: {}", e), None))).into_response();
                }
            };

            let extension = file_name.split('.').last().unwrap_or("bin");
            let key = format!("products/{}.{}", Uuid::new_v4(), extension);

            let result = state.s3_client
                .put_object()
                .bucket(&state.r2_bucket)
                .key(&key)
                .body(data.into())
                .content_type(content_type)
                .send()
                .await;

            match result {
                Ok(_) => {
                    let public_url = state.r2_public_url.trim_end_matches('/');
                    let url = format!("{}/{}", public_url, key);
                    tracing::info!("✅ File uploaded successfully. Public URL: {}", url);
                    file_url = Some(url);
                }
                Err(e) => {
                    tracing::error!("❌ Failed to upload to R2: {:?}", e);
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&format!("Failed to upload to R2: {}", e), None))).into_response();
                }
            }
        }
    }

    match file_url {
        Some(url) => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({ "url": url })))).into_response(),
        None => (StatusCode::BAD_REQUEST, Json(ApiResponse::error("No file uploaded", None))).into_response(),
    }
}
