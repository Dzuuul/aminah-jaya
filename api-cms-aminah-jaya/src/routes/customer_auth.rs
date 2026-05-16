use axum::{Json, response::IntoResponse, http::{StatusCode, HeaderMap}, extract::State};
use crate::models::{ApiResponse, StorefrontCustomer, RegisterCustomerPayload, LoginCustomerPayload, LoginResponse, UserProfile, GoogleAuthPayload};
use crate::auth::{create_jwt, verify_jwt};
use crate::state::AppState;
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterCustomerPayload>
) -> impl IntoResponse {
    let pool = &state.pool;

    let password_hash = match hash(payload.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to hash password", None))).into_response(),
    };

    let result = sqlx::query_as::<_, StorefrontCustomer>(
        r#"INSERT INTO storefront_customers (email, password_hash, name, phone)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, name, phone, created_at"#
    )
    .bind(&payload.email)
    .bind(password_hash)
    .bind(&payload.name)
    .bind(&payload.phone)
    .fetch_one(pool)
    .await;

    match result {
        Ok(customer) => (StatusCode::CREATED, Json(ApiResponse::success(customer))).into_response(),
        Err(e) => {
            if e.to_string().contains("unique constraint") {
                (StatusCode::CONFLICT, Json(ApiResponse::error("Email already exists", None))).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response()
            }
        }
    }
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginCustomerPayload>
) -> impl IntoResponse {
    let pool = &state.pool;

    let customer_data: Option<(Uuid, String, String, String)> = sqlx::query_as(
        "SELECT id, email, name, password_hash FROM storefront_customers WHERE email = $1 OR phone = $1 LIMIT 1"
    )
    .bind(&payload.identity)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    if let Some((id, email, name, hash)) = customer_data {
        if verify(payload.password, &hash).unwrap_or(false) {
            match create_jwt(&id.to_string()) {
                Ok(token) => {
                    let response = LoginResponse {
                        token,
                        user: UserProfile { 
                            id: id.to_string(), 
                            email, 
                            name 
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
    let auth_header = match headers.get("Authorization").and_then(|h| h.to_str().ok()) {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Missing or invalid token", None))).into_response(),
    };

    let claims = match verify_jwt(auth_header) {
        Ok(c) => c,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid token", None))).into_response(),
    };

    let customer_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid customer ID in token", None))).into_response(),
    };

    let pool = &state.pool;
    let customer: Option<StorefrontCustomer> = sqlx::query_as(
        "SELECT id, email, name, phone, created_at FROM storefront_customers WHERE id = $1 LIMIT 1"
    )
    .bind(customer_id)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    match customer {
        Some(c) => Json(ApiResponse::success(c)).into_response(),
        None => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Customer not found", None))).into_response(),
    }
}

pub async fn google_login(
    State(state): State<AppState>,
    Json(payload): Json<GoogleAuthPayload>
) -> impl IntoResponse {
    let pool = &state.pool;

    // 1. Verify token with Google
    let client = reqwest::Client::new();
    let res = client
        .get(format!("https://oauth2.googleapis.com/tokeninfo?id_token={}", payload.id_token))
        .send()
        .await;

    let google_user = match res {
        Ok(r) if r.status().is_success() => {
            match r.json::<serde_json::Value>().await {
                Ok(json) => json,
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to parse Google response", None))).into_response(),
            }
        },
        _ => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid Google token", None))).into_response(),
    };

    let email = google_user["email"].as_str().unwrap_or("");
    let name = google_user["name"].as_str().unwrap_or("Google User");
    
    if email.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Google token missing email", None))).into_response();
    }

    // 2. Find or Create customer
    let mut customer = sqlx::query_as::<_, StorefrontCustomer>(
        "SELECT id, email, name, phone, created_at FROM storefront_customers WHERE email = $1 LIMIT 1"
    )
    .bind(email)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    if customer.is_none() {
        // Auto-register
        let result = sqlx::query_as::<_, StorefrontCustomer>(
            r#"INSERT INTO storefront_customers (email, password_hash, name, phone)
               VALUES ($1, $2, $3, $4)
               RETURNING id, email, name, phone, created_at"#
        )
        .bind(email)
        .bind("") // No password for OAuth users
        .bind(name)
        .bind("")
        .fetch_one(pool)
        .await;

        match result {
            Ok(c) => customer = Some(c),
            Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
        }
    }

    let customer = customer.unwrap();

    // 3. Create JWT
    match create_jwt(&customer.id.to_string()) {
        Ok(token) => {
            let response = LoginResponse {
                token,
                user: UserProfile { 
                    id: customer.id.to_string(), 
                    email: customer.email, 
                    name: customer.name 
                },
            };
            (StatusCode::OK, Json(ApiResponse::success(response))).into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to create token", None))).into_response(),
    }
}
