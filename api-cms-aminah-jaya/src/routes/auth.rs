use axum::{Json, response::IntoResponse, http::StatusCode};
use crate::models::{LoginResponse, UserProfile, ApiResponse};
use crate::auth::create_jwt;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}

pub async fn login(Json(payload): Json<LoginPayload>) -> impl IntoResponse {
    // In a real app, verify against database here
    if payload.email == "admin@aminahjaya.com" && payload.password == "password123" {
        let user_id = "user-123";
        match create_jwt(user_id) {
            Ok(token) => {
                let response = LoginResponse {
                    token,
                    user: UserProfile {
                        id: user_id.to_string(),
                        email: payload.email,
                        name: "Admin Aminah".to_string(),
                    },
                };
                (StatusCode::OK, Json(ApiResponse::success(response))).into_response()
            }
            Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to create token", None))).into_response(),
        }
    } else {
        (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid credentials", None))).into_response()
    }
}
