use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};

use uuid::Uuid;

use crate::{
    auth::verify_jwt,
    models::{ApiResponse, CustomerAddress},
    state::AppState,
};

#[derive(Debug, serde::Deserialize)]
pub struct CreateAddressPayload {
    pub label: Option<String>,
    pub recipient_name: String,
    pub recipient_phone: String,
    pub address: String,
    pub province: Option<String>,
    pub city: Option<String>,
    pub district: Option<String>,
    pub postal_code: Option<String>,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    pub is_default: Option<bool>,
}

#[derive(Debug, serde::Deserialize)]
pub struct UpdateAddressPayload {
    pub label: Option<String>,
    pub recipient_name: String,
    pub recipient_phone: String,
    pub address: String,
    pub province: Option<String>,
    pub city: Option<String>,
    pub district: Option<String>,
    pub postal_code: Option<String>,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
}

fn extract_customer_id(headers: &HeaderMap) -> Result<Uuid, StatusCode> {
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok());

    let token = match auth_header {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    let claims = verify_jwt(token).map_err(|_| StatusCode::UNAUTHORIZED)?;

    Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::BAD_REQUEST)
}

pub async fn list_addresses(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response()
        }
    };

    let result: Vec<CustomerAddress> = sqlx::query_as(
        r#"
        SELECT *
        FROM customer_addresses
        WHERE customer_id = $1
        ORDER BY is_default DESC, created_at DESC
        "#,
    )
    .bind(customer_id)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(result)).into_response()
}

pub async fn create_address(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateAddressPayload>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response()
        }
    };

    let is_default = payload.is_default.unwrap_or(false);

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(&e.to_string(), None)),
            )
                .into_response()
        }
    };

    if is_default {
        let _ = sqlx::query(
            r#"
            UPDATE customer_addresses
            SET is_default = false
            WHERE customer_id = $1
            "#,
        )
        .bind(customer_id)
        .execute(&mut *tx)
        .await;
    }

    let result: Result<CustomerAddress, sqlx::Error> = sqlx::query_as(
        r#"
        INSERT INTO customer_addresses (
            customer_id,
            label,
            recipient_name,
            recipient_phone,
            address,
            province,
            city,
            district,
            postal_code,
            lat,
            lng,
            is_default
        )
        VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )
        RETURNING *
        "#,
    )
    .bind(customer_id)
    .bind(&payload.label)
    .bind(&payload.recipient_name)
    .bind(&payload.recipient_phone)
    .bind(&payload.address)
    .bind(&payload.province)
    .bind(&payload.city)
    .bind(&payload.district)
    .bind(&payload.postal_code)
    .bind(payload.lat)
    .bind(payload.lng)
    .bind(is_default)
    .fetch_one(&mut *tx)
    .await;

    match result {
        Ok(address) => {
            let _ = tx.commit().await;

            (
                StatusCode::CREATED,
                Json(ApiResponse::success(address)),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(&e.to_string(), None)),
        )
            .into_response(),
    }
}

pub async fn update_address(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(address_id): Path<Uuid>,
    Json(payload): Json<UpdateAddressPayload>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response()
        }
    };

    let result: Result<CustomerAddress, sqlx::Error> = sqlx::query_as(
        r#"
        UPDATE customer_addresses
        SET
            label = $1,
            recipient_name = $2,
            recipient_phone = $3,
            address = $4,
            province = $5,
            city = $6,
            district = $7,
            postal_code = $8,
            lat = $9,
            lng = $10,
            updated_at = NOW()
        WHERE id = $11
          AND customer_id = $12
        RETURNING *
        "#,
    )
    .bind(&payload.label)
    .bind(&payload.recipient_name)
    .bind(&payload.recipient_phone)
    .bind(&payload.address)
    .bind(&payload.province)
    .bind(&payload.city)
    .bind(&payload.district)
    .bind(&payload.postal_code)
    .bind(payload.lat)
    .bind(payload.lng)
    .bind(address_id)
    .bind(customer_id)
    .fetch_one(&state.pool)
    .await;

    match result {
        Ok(address) => Json(ApiResponse::success(address)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(&e.to_string(), None)),
        )
            .into_response(),
    }
}

pub async fn delete_address(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(address_id): Path<Uuid>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response()
        }
    };

    let result = sqlx::query(
        r#"
        DELETE FROM customer_addresses
        WHERE id = $1
          AND customer_id = $2
        "#,
    )
    .bind(address_id)
    .bind(customer_id)
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => Json(ApiResponse::success("Address deleted")).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(&e.to_string(), None)),
        )
            .into_response(),
    }
}

pub async fn set_default_address(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(address_id): Path<Uuid>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response()
        }
    };

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(&e.to_string(), None)),
            )
                .into_response()
        }
    };

    let _ = sqlx::query(
        r#"
        UPDATE customer_addresses
        SET is_default = false
        WHERE customer_id = $1
        "#,
    )
    .bind(customer_id)
    .execute(&mut *tx)
    .await;

    let result = sqlx::query(
        r#"
        UPDATE customer_addresses
        SET is_default = true
        WHERE id = $1
          AND customer_id = $2
        "#,
    )
    .bind(address_id)
    .bind(customer_id)
    .execute(&mut *tx)
    .await;

    match result {
        Ok(_) => {
            let _ = tx.commit().await;

            Json(ApiResponse::success("Default address updated"))
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(&e.to_string(), None)),
        )
            .into_response(),
    }
}