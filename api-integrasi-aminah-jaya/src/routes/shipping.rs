use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{
    biteship::{
        build_rate_items, build_rates_request_body_with_couriers, build_shipping_cache_key,
        build_synthetic_items_for_weight, cart_total_weight_gram, default_couriers_list,
        normalize_pricing_options, weight_kg_bucket, BiteshipClient, RateCartItem,
    },
    models::response::ApiResponse,
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
    pub cart_items: Vec<RateCartItem>,
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
    pub cart_items: Vec<RateCartItem>,
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

pub async fn get_shipping_rates(Json(payload): Json<ShippingRatesPayload>) -> impl IntoResponse {
    if payload.cart_items.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error("Keranjang kosong", None)),
        )
            .into_response();
    }

    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    let total_grams = cart_total_weight_gram(&payload.cart_items);
    let weight_kg = weight_kg_bucket(total_grams);
    let couriers = resolve_couriers(&payload);
    let total_value_idr: i64 = payload
        .cart_items
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

    let items = build_synthetic_items_for_weight(weight_kg, total_value_idr);
    let body = match build_rates_request_body_with_couriers(
        client.config(),
        items,
        payload.destination_lat,
        payload.destination_lng,
        payload.destination_postal_code.as_deref(),
        payload.destination_area_id.as_deref(),
        &couriers,
    ) {
        Ok(b) => b,
        Err(msg) => {
            return (StatusCode::BAD_REQUEST, Json(ApiResponse::error(&msg, None))).into_response();
        }
    };

    match client.get_rates(body).await {
        Ok(data) => {
            let options = normalize_pricing_options(&data);
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

pub async fn create_draft_order(Json(payload): Json<DraftOrderPayload>) -> impl IntoResponse {
    if payload.cart_items.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error("Keranjang kosong", None)),
        )
            .into_response();
    }

    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    let cfg = client.config();
    let items = build_rate_items(&payload.cart_items);

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

pub async fn create_biteship_order(Json(mut body): Json<Value>) -> impl IntoResponse {
    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    let cfg = client.config();
    if body.get("shipper_contact_name").is_none() {
        body["shipper_contact_name"] = json!(cfg.origin_contact_name);
    }
    if body.get("shipper_contact_phone").is_none() {
        body["shipper_contact_phone"] = json!(cfg.origin_contact_phone);
    }
    if body.get("origin_contact_name").is_none() {
        body["origin_contact_name"] = json!(cfg.origin_contact_name);
    }
    if body.get("origin_contact_phone").is_none() {
        body["origin_contact_phone"] = json!(cfg.origin_contact_phone);
    }
    if body.get("origin_address").is_none() {
        body["origin_address"] = json!(cfg.origin_address);
    }
    if body.get("origin_coordinate").is_none() {
        body["origin_coordinate"] = json!({
            "latitude": cfg.origin_lat,
            "longitude": cfg.origin_lng
        });
    }
    if body.get("origin_area_id").is_none() {
        if let Some(area_id) = &cfg.origin_area_id {
            body["origin_area_id"] = json!(area_id);
        }
    }
    if body.get("origin_postal_code").is_none() {
        if let Some(postal) = cfg.origin_postal_code {
            body["origin_postal_code"] = json!(postal);
        }
    }

    match client.create_order(body).await {
        Ok(data) => (StatusCode::CREATED, Json(ApiResponse::success(data))).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}

pub async fn get_biteship_order(Path(order_id): Path<String>) -> impl IntoResponse {
    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    match client.get_order(&order_id).await {
        Ok(data) => (StatusCode::OK, Json(ApiResponse::success(data))).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}

pub async fn get_biteship_tracking(Path(tracking_id): Path<String>) -> impl IntoResponse {
    let client = match biteship_client() {
        Ok(c) => c,
        Err(e) => return e.into_response(),
    };

    match client.get_tracking(&tracking_id).await {
        Ok(data) => (StatusCode::OK, Json(ApiResponse::success(data))).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(ApiResponse::<()>::error(&e.message, None)),
        )
            .into_response(),
    }
}
