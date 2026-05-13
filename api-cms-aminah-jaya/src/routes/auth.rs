use axum::{Json, response::IntoResponse, http::{StatusCode, HeaderMap}, extract::State};
use crate::models::{LoginResponse, UserProfile, ApiResponse};
use crate::auth::{create_jwt, verify_jwt};
use crate::state::AppState;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginPayload>
) -> impl IntoResponse {
    let pool = &state.pool;

    // Verify user against database
    let user_data: Option<(String, String, String, String)> = sqlx::query_as(
        "SELECT id::TEXT, email, name, password_hash FROM users WHERE email = $1 LIMIT 1"
    )
    .bind(&payload.email)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    if let Some((id, email, name, _hash)) = user_data {
        // In a real app, use bcrypt/argon2 to verify password_hash
        // For now, we'll allow 'password123' or the hash itself if it's the default seed
        if payload.password == "password123" || payload.password == _hash {
            match create_jwt(&id) {
                Ok(token) => {
                    let response = LoginResponse {
                        token,
                        user: UserProfile { 
                            id: id.clone(), 
                            email: email.clone(), 
                            name: name.clone() 
                        },
                    };
                    return (StatusCode::OK, Json(ApiResponse::success(response))).into_response();
                }
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to create token", None))).into_response(),
            }
        }
    }

    (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid credentials", None))).into_response()
}

pub async fn get_me(
    State(state): State<AppState>,
    headers: HeaderMap
) -> impl IntoResponse {
    tracing::info!("🔍 GET /api/auth/me called");
    
    // 1. Extract token from Authorization header
    let auth_header = match headers.get("Authorization").and_then(|h| h.to_str().ok()) {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Missing or invalid token", None))).into_response(),
    };

    // 2. Verify JWT
    let claims = match verify_jwt(auth_header) {
        Ok(c) => c,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid token", None))).into_response(),
    };

    // 3. Query user from database using claims.sub (ID)
    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid user ID in token", None))).into_response(),
    };

    let pool = &state.pool;
    let user_result: Result<(String, String, String), sqlx::Error> = sqlx::query_as(
        "SELECT id::TEXT, email, name FROM users WHERE id = $1 LIMIT 1"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await;

    match user_result {
        Ok((id, email, name)) => Json(ApiResponse::success(UserProfile { id, email, name })).into_response(),
        Err(_) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("User not found", None))).into_response(),
    }
}
