use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use chrono::{Duration, Utc};

use crate::{
    auth::verify_jwt,
    biteship::{
        build_rate_items, build_rates_request_body_with_couriers, build_shipping_cache_key,
        build_synthetic_items_for_weight, cache_ttl_hours, cart_total_weight_gram,
        default_couriers_list, normalize_pricing_options, weight_kg_bucket, BiteshipClient,
        ShippingRateCacheKey,
    },
    models::{ApiResponse, CartItem},
    state::AppState,
};

#[derive(Debug, Deserialize)]
pub struct MapsAreasQuery {
    pub input: String,
}

#[derive(Debug, Deserialize)]
pub struct ShippingRatesPayload {
    pub destination_lat: Option<f64>,
    pub destination_lng: Option<f64>,
    pub destination_postal_code: Option<String>,
    pub destination_area_id: Option<String>,
    pub destination_city: Option<String>,
    pub destination_province: Option<String>,
    pub couriers: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DraftOrderPayload {
    pub destination_contact_name: String,
    pub destination_contact_phone: String,
    pub destination_address: String,
    pub destination_note: Option<String>,
    pub destination_lat: Option<f64>,
    pub destination_lng: Option<f64>,
    pub destination_postal_code: Option<String>,
    pub destination_area_id: Option<String>,
    pub courier_company: Option<String>,
    pub courier_type: Option<String>,
}

fn extract_customer_id(headers: &HeaderMap) -> Result<Uuid, StatusCode> {
    let token = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = verify_jwt(token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::BAD_REQUEST)
}

async fn get_customer_cart(pool: &sqlx::PgPool, customer_id: Uuid) -> Vec<CartItem> {
    sqlx::query_as(
        r#"SELECT
            ci.id, ci.customer_id, ci.product_id, ci.quantity, ci.created_at,
            p.name AS product_name, p.price::FLOAT8 AS product_price, p.slug AS product_slug,
            p.weight_gram AS product_weight_gram,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS product_thumbnail
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
           WHERE ci.customer_id = $1
           ORDER BY ci.created_at DESC"#,
    )
    .bind(customer_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default()
}

fn biteship_client() -> Result<BiteshipClient, (StatusCode, Json<ApiResponse<()>>)> {
    BiteshipClient::from_env().map_err(|e| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ApiResponse::error(&e.message, None)),
        )
    })
}

fn resolve_couriers(payload: &ShippingRatesPayload) -> String {
    payload
        .couriers
        .clone()
        .filter(|c| !c.trim().is_empty())
        .unwrap_or_else(default_couriers_list)
}

fn build_rates_body(
    client: &BiteshipClient,
    weight_kg: i32,
    total_value_idr: i64,
    payload: &ShippingRatesPayload,
    couriers: &str,
) -> Result<Value, (StatusCode, Json<ApiResponse<()>>)> {
    let items = build_synthetic_items_for_weight(weight_kg, total_value_idr);

    build_rates_request_body_with_couriers(
        client.config(),
        items,
        payload.destination_lat,
        payload.destination_lng,
        payload.destination_postal_code.as_deref(),
        payload.destination_area_id.as_deref(),
        couriers,
    )
    .map_err(|msg| (StatusCode::BAD_REQUEST, Json(ApiResponse::error(&msg, None))))
}

async fn get_cached_rates(
    pool: &sqlx::PgPool,
    cache_key: &str,
) -> Option<Vec<Value>> {
    let row: Option<(Value,)> = sqlx::query_as(
        "SELECT rates_json FROM shipping_rate_cache WHERE cache_key = $1 AND expires_at > NOW()",
    )
    .bind(cache_key)
    .fetch_optional(pool)
    .await
    .ok()?;

    row.map(|(rates_json,)| {
        rates_json
            .as_array()
            .cloned()
            .unwrap_or_default()
    })
}

async fn store_cached_rates(
    pool: &sqlx::PgPool,
    key: &ShippingRateCacheKey,
    rates: &[Value],
) -> Result<(), sqlx::Error> {
    let expires_at = Utc::now() + Duration::hours(cache_ttl_hours());
    let rates_json = Value::Array(rates.to_vec());

    sqlx::query(
        r#"
        INSERT INTO shipping_rate_cache (
            cache_key, origin_key, destination_key, weight_kg, couriers, rates_json, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cache_key) DO UPDATE SET
            rates_json = EXCLUDED.rates_json,
            expires_at = EXCLUDED.expires_at,
            created_at = NOW()
        "#,
    )
    .bind(&key.cache_key)
    .bind(&key.origin_key)
    .bind(&key.destination_key)
    .bind(key.weight_kg)
    .bind(&key.couriers)
    .bind(rates_json)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn list_couriers() -> impl IntoResponse {
    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    match client.get_couriers().await {
        Ok(data) => {
            let couriers = data.get("couriers").cloned().unwrap_or_else(|| json!([]));
            (StatusCode::OK, Json(ApiResponse::success(couriers))).into_response()
        }
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}

pub async fn search_maps_areas(Query(query): Query<MapsAreasQuery>) -> impl IntoResponse {
    if query.input.trim().len() < 3 {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(
                "Masukkan minimal 3 karakter pencarian",
                None,
            )),
        )
            .into_response();
    }

    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    match client.search_areas(&query.input).await {
        Ok(data) => {
            let areas = data.get("areas").cloned().unwrap_or_else(|| json!([]));
            (StatusCode::OK, Json(ApiResponse::success(areas))).into_response()
        }
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}

pub async fn get_shipping_rates(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ShippingRatesPayload>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response();
        }
    };

    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    let cart_items = get_customer_cart(&state.pool, customer_id).await;
    let total_grams = cart_total_weight_gram(&cart_items);
    let weight_kg = weight_kg_bucket(total_grams);
    let couriers = resolve_couriers(&payload);
    let total_value_idr = cart_items
        .iter()
        .map(|item| {
            (item.product_price.unwrap_or(0.0) * item.quantity as f64).round() as i64
        })
        .sum();

    let cache_key = build_shipping_cache_key(
        client.config(),
        payload.destination_lat,
        payload.destination_lng,
        payload.destination_postal_code.as_deref(),
        payload.destination_area_id.as_deref(),
        payload.destination_city.as_deref(),
        payload.destination_province.as_deref(),
        weight_kg,
        Some(&couriers),
    );

    if let Some(cached_rates) = get_cached_rates(&state.pool, &cache_key.cache_key).await {
        if !cached_rates.is_empty() {
            tracing::info!(
                "Shipping rates cache HIT: {} ({} kg)",
                cache_key.cache_key,
                weight_kg
            );
            return (
                StatusCode::OK,
                Json(ApiResponse::success(json!({
                    "rates": cached_rates,
                    "cached": true,
                    "cache_key": cache_key.cache_key,
                    "weight_kg": weight_kg,
                }))),
            )
                .into_response();
        }
    }

    let body = match build_rates_body(&client, weight_kg, total_value_idr, &payload, &couriers) {
        Ok(b) => b,
        Err(e) => return e.into_response(),
    };

    match client.get_rates(body).await {
        Ok(data) => {
            let options = normalize_pricing_options(&data);

            if !options.is_empty() {
                if let Err(e) = store_cached_rates(&state.pool, &cache_key, &options).await {
                    tracing::warn!("Gagal menyimpan cache ongkir: {e}");
                } else {
                    tracing::info!(
                        "Shipping rates cache MISS → saved: {} ({} kg)",
                        cache_key.cache_key,
                        weight_kg
                    );
                }
            }

            (
                StatusCode::OK,
                Json(ApiResponse::success(json!({
                    "rates": options,
                    "cached": false,
                    "cache_key": cache_key.cache_key,
                    "weight_kg": weight_kg,
                }))),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}

pub async fn create_draft_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<DraftOrderPayload>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response();
        }
    };

    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    let cart_items = get_customer_cart(&state.pool, customer_id).await;
    if cart_items.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error("Keranjang kosong", None)),
        )
            .into_response();
    }

    let cfg = client.config();
    let items = build_rate_items(&cart_items);

    let mut body = json!({
        "shipper_contact_name": cfg.origin_contact_name,
        "shipper_contact_phone": cfg.origin_contact_phone,
        "origin_contact_name": cfg.origin_contact_name,
        "origin_contact_phone": cfg.origin_contact_phone,
        "origin_address": cfg.origin_address,
        "destination_contact_name": payload.destination_contact_name,
        "destination_contact_phone": payload.destination_contact_phone,
        "destination_address": payload.destination_address,
        "destination_note": payload.destination_note,
        "items": items,
    });

    if let (Some(lat), Some(lng)) = (payload.destination_lat, payload.destination_lng) {
        body["destination_coordinate"] = json!({
            "latitude": lat,
            "longitude": lng
        });
        body["origin_coordinate"] = json!({
            "latitude": cfg.origin_lat,
            "longitude": cfg.origin_lng
        });
    }

    if let Some(area_id) = &payload.destination_area_id {
        body["destination_area_id"] = json!(area_id);
    }
    if let Some(postal) = &payload.destination_postal_code {
        if let Ok(code) = postal.parse::<i64>() {
            body["destination_postal_code"] = json!(code);
        }
    }
    if let Some(area_id) = &cfg.origin_area_id {
        body["origin_area_id"] = json!(area_id);
    }
    if let Some(postal) = cfg.origin_postal_code {
        body["origin_postal_code"] = json!(postal);
    }

    if let (Some(company), Some(service)) = (&payload.courier_company, &payload.courier_type) {
        body["courier_company"] = json!(company);
        body["courier_type"] = json!(service);
    }

    match client.create_draft_order(body).await {
        Ok(data) => (StatusCode::CREATED, Json(ApiResponse::success(data))).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}

pub async fn get_draft_order_rates(Path(draft_id): Path<String>) -> impl IntoResponse {
    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    match client.get_draft_rates(&draft_id).await {
        Ok(data) => {
            let options = normalize_pricing_options(&data);
            (
                StatusCode::OK,
                Json(ApiResponse::success(json!({
                    "rates": options,
                    "raw": data
                }))),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}

pub async fn confirm_draft_order(Path(draft_id): Path<String>) -> impl IntoResponse {
    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    match client.confirm_draft_order(&draft_id).await {
        Ok(data) => (StatusCode::OK, Json(ApiResponse::success(data))).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}

pub async fn get_customer_order_tracking(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(order_id): Path<Uuid>,
) -> impl IntoResponse {
    let customer_id = match extract_customer_id(&headers) {
        Ok(id) => id,
        Err(status) => {
            return (
                status,
                Json(ApiResponse::<()>::error("Unauthorized", None)),
            )
                .into_response();
        }
    };

    let row: Option<(Option<String>, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT biteship_tracking_id, biteship_order_id, tracking_number FROM orders WHERE id = $1 AND customer_id = $2",
    )
    .bind(order_id)
    .bind(customer_id)
    .fetch_optional(&state.pool)
    .await
    .unwrap_or(None);

    let (tracking_id, biteship_order_id, waybill) = match row {
        Some(r) => r,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<()>::error("Pesanan tidak ditemukan", None)),
            )
                .into_response();
        }
    };

    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    if let Some(tracking_id) = tracking_id.filter(|t| !t.is_empty()) {
        match client.get_tracking(&tracking_id).await {
            Ok(data) => {
                return (StatusCode::OK, Json(ApiResponse::success(data))).into_response();
            }
            Err(e) => {
                tracing::warn!("Biteship tracking failed: {}", e.message);
            }
        }
    }

    if let Some(biteship_order_id) = biteship_order_id.filter(|t| !t.is_empty()) {
        match client.get_order(&biteship_order_id).await {
            Ok(data) => {
                return (StatusCode::OK, Json(ApiResponse::success(data))).into_response();
            }
            Err(e) => {
                tracing::warn!("Biteship order fetch failed: {}", e.message);
            }
        }
    }

    (
        StatusCode::OK,
        Json(ApiResponse::success(json!({
            "status": "pending",
            "waybill_id": waybill,
            "message": "Pelacakan belum tersedia untuk pesanan ini"
        }))),
    )
        .into_response()
}
