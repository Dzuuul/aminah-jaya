use reqwest::Method;
use serde_json::{json, Value};

const BITESHIP_BASE_URL: &str = "https://api.biteship.com/v1";

#[derive(Clone)]
pub struct BiteshipConfig {
    pub api_key: String,
    pub origin_lat: f64,
    pub origin_lng: f64,
    pub origin_address: String,
    pub origin_postal_code: Option<i64>,
    pub origin_contact_name: String,
    pub origin_contact_phone: String,
    pub origin_area_id: Option<String>,
}

#[derive(Debug)]
pub struct BiteshipError {
    pub message: String,
    pub status: Option<u16>,
}

impl std::fmt::Display for BiteshipError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for BiteshipError {}

#[derive(Clone)]
pub struct BiteshipClient {
    config: BiteshipConfig,
    http: reqwest::Client,
}

impl BiteshipClient {
    pub fn from_env() -> Result<Self, BiteshipError> {
        let api_key = std::env::var("BITESHIP_API_KEY").map_err(|_| BiteshipError {
            message: "BITESHIP_API_KEY belum dikonfigurasi".into(),
            status: None,
        })?;

        if api_key.trim().is_empty() {
            return Err(BiteshipError {
                message: "BITESHIP_API_KEY kosong".into(),
                status: None,
            });
        }

        let origin_lat = std::env::var("BITESHIP_ORIGIN_LAT")
            .unwrap_or_else(|_| "-6.2088".into())
            .parse()
            .map_err(|_| BiteshipError {
                message: "BITESHIP_ORIGIN_LAT tidak valid".into(),
                status: None,
            })?;

        let origin_lng = std::env::var("BITESHIP_ORIGIN_LNG")
            .unwrap_or_else(|_| "106.8456".into())
            .parse()
            .map_err(|_| BiteshipError {
                message: "BITESHIP_ORIGIN_LNG tidak valid".into(),
                status: None,
            })?;

        let origin_postal_code = std::env::var("BITESHIP_ORIGIN_POSTAL_CODE")
            .ok()
            .and_then(|v| v.parse::<i64>().ok());

        Ok(Self {
            config: BiteshipConfig {
                api_key: api_key.trim().to_string(),
                origin_lat,
                origin_lng,
                origin_address: std::env::var("BITESHIP_ORIGIN_ADDRESS").unwrap_or_else(|_| {
                    "Gudang Aminah Jaya, Indonesia".into()
                }),
                origin_postal_code,
                origin_contact_name: std::env::var("BITESHIP_ORIGIN_CONTACT_NAME")
                    .unwrap_or_else(|_| "Aminah Jaya".into()),
                origin_contact_phone: std::env::var("BITESHIP_ORIGIN_CONTACT_PHONE")
                    .unwrap_or_else(|_| "081234567890".into()),
                origin_area_id: std::env::var("BITESHIP_ORIGIN_AREA_ID").ok(),
            },
            http: reqwest::Client::new(),
        })
    }

    pub fn config(&self) -> &BiteshipConfig {
        &self.config
    }

    pub async fn get_couriers(&self) -> Result<Value, BiteshipError> {
        self.request(Method::GET, "/couriers", None).await
    }

    pub async fn search_areas(&self, input: &str) -> Result<Value, BiteshipError> {
        let path = format!(
            "/maps/areas?countries=ID&input={}&type=all",
            urlencoding::encode(input)
        );
        self.request(Method::GET, &path, None).await
    }

    pub async fn get_rates(&self, body: Value) -> Result<Value, BiteshipError> {
        self.request(Method::POST, "/rates/couriers", Some(body)).await
    }

    pub async fn create_draft_order(&self, body: Value) -> Result<Value, BiteshipError> {
        self.request(Method::POST, "/draft_orders", Some(body)).await
    }

    pub async fn get_draft_order(&self, draft_id: &str) -> Result<Value, BiteshipError> {
        self.request(Method::GET, &format!("/draft_orders/{draft_id}"), None)
            .await
    }

    pub async fn get_draft_rates(&self, draft_id: &str) -> Result<Value, BiteshipError> {
        self.request(
            Method::GET,
            &format!("/draft_orders/{draft_id}/rates"),
            None,
        )
        .await
    }

    pub async fn confirm_draft_order(&self, draft_id: &str) -> Result<Value, BiteshipError> {
        self.request(
            Method::POST,
            &format!("/draft_orders/{draft_id}/confirm"),
            Some(json!({})),
        )
        .await
    }

    pub async fn create_order(&self, body: Value) -> Result<Value, BiteshipError> {
        self.request(Method::POST, "/orders", Some(body)).await
    }

    pub async fn get_order(&self, order_id: &str) -> Result<Value, BiteshipError> {
        self.request(Method::GET, &format!("/orders/{order_id}"), None)
            .await
    }

    pub async fn get_tracking(&self, tracking_id: &str) -> Result<Value, BiteshipError> {
        self.request(Method::GET, &format!("/trackings/{tracking_id}"), None)
            .await
    }

    async fn request(
        &self,
        method: Method,
        path: &str,
        body: Option<Value>,
    ) -> Result<Value, BiteshipError> {
        let url = format!("{BITESHIP_BASE_URL}{path}");
        let mut req = self
            .http
            .request(method, &url)
            .header("Authorization", &self.config.api_key)
            .header("Content-Type", "application/json");

        if let Some(payload) = body {
            req = req.json(&payload);
        }

        let response = req.send().await.map_err(|e| BiteshipError {
            message: format!("Gagal menghubungi Biteship: {e}"),
            status: None,
        })?;

        let status = response.status();
        let text = response.text().await.map_err(|e| BiteshipError {
            message: e.to_string(),
            status: Some(status.as_u16()),
        })?;

        let parsed: Value = serde_json::from_str(&text).unwrap_or_else(|_| {
            json!({ "raw": text })
        });

        if !status.is_success() {
            let message = parsed
                .get("error")
                .or_else(|| parsed.get("message"))
                .and_then(|v| v.as_str())
                .unwrap_or("Permintaan ke Biteship gagal")
                .to_string();

            return Err(BiteshipError {
                message,
                status: Some(status.as_u16()),
            });
        }

        Ok(parsed)
    }
}

pub fn cache_ttl_hours() -> i64 {
    std::env::var("SHIPPING_RATE_CACHE_TTL_HOURS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(6)
}

pub fn cart_total_weight_gram(cart_items: &[crate::models::CartItem]) -> i64 {
    cart_items
        .iter()
        .map(|item| {
            let unit = item
                .product_weight_gram
                .filter(|w| *w > 0)
                .unwrap_or(500) as i64;
            unit * item.quantity as i64
        })
        .sum()
}

/// Bucket per 1 kg (dibulatkan ke atas), minimum 1 kg.
pub fn weight_kg_bucket(total_grams: i64) -> i32 {
    (((total_grams.max(1) as f64) / 1000.0).ceil() as i32).max(1)
}

#[derive(Clone, Debug)]
pub struct ShippingRateCacheKey {
    pub cache_key: String,
    pub origin_key: String,
    pub destination_key: String,
    pub weight_kg: i32,
    pub couriers: String,
}

fn normalize_location_part(value: Option<&str>) -> String {
    value
        .unwrap_or("")
        .trim()
        .to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn build_shipping_cache_key(
    cfg: &BiteshipConfig,
    destination_lat: Option<f64>,
    destination_lng: Option<f64>,
    destination_postal_code: Option<&str>,
    destination_area_id: Option<&str>,
    destination_city: Option<&str>,
    destination_province: Option<&str>,
    weight_kg: i32,
    couriers_override: Option<&str>,
) -> ShippingRateCacheKey {
    let couriers = couriers_override
        .map(str::to_string)
        .unwrap_or_else(default_couriers_list);

    let origin_key = if let Some(postal) = cfg.origin_postal_code {
        format!("postal:{postal}")
    } else {
        format!("coord:{:.3},{:.3}", cfg.origin_lat, cfg.origin_lng)
    };

    let destination_key = if let Some(area) = destination_area_id.filter(|s| !s.is_empty()) {
        format!("area:{}", area.trim())
    } else if let Some(postal) = destination_postal_code.filter(|s| !s.is_empty()) {
        let city = normalize_location_part(destination_city);
        let province = normalize_location_part(destination_province);
        if city.is_empty() {
            format!("postal:{}", postal.trim())
        } else {
            format!("postal:{}|{}|{}", postal.trim(), city, province)
        }
    } else if let (Some(lat), Some(lng)) = (destination_lat, destination_lng) {
        format!("coord:{lat:.3},{lng:.3}")
    } else {
        "unknown".to_string()
    };

    let cache_key = format!("{origin_key}|{destination_key}|{weight_kg}kg|{couriers}");

    ShippingRateCacheKey {
        cache_key,
        origin_key,
        destination_key,
        weight_kg,
        couriers,
    }
}

pub fn build_synthetic_items_for_weight(weight_kg: i32, total_value_idr: i64) -> Vec<Value> {
    vec![json!({
        "name": "Paket",
        "description": "Produk Aminah Jaya",
        "value": total_value_idr.max(10_000),
        "weight": (weight_kg as i64) * 1000,
        "quantity": 1,
        "length": 10,
        "width": 10,
        "height": 10
    })]
}

/// Daftar kurir default — wajib untuk Rates API (lihat Postman: Rates API By Coordinates).
pub fn default_couriers_list() -> String {
    std::env::var("BITESHIP_DEFAULT_COURIERS").unwrap_or_else(|_| {
        "jne,sicepat,jnt,tiki,anteraja,ninja,paxel,grab,gojek,idexpress".to_string()
    })
}

pub fn build_rate_items(cart_items: &[crate::models::CartItem]) -> Vec<Value> {
    cart_items
        .iter()
        .map(|item| {
            let weight = item
                .product_weight_gram
                .filter(|w| *w > 0)
                .unwrap_or(500) as i64;
            let value = item.product_price.unwrap_or(0.0).round() as i64;
            let name = item
                .product_name
                .clone()
                .unwrap_or_else(|| "Produk".into());
            json!({
                "name": name,
                "description": "Produk Aminah Jaya",
                "value": value.max(1000),
                "weight": weight,
                "quantity": item.quantity,
                "length": 10,
                "width": 10,
                "height": 10
            })
        })
        .collect()
}

/// Susun body POST /v1/rates/couriers sesuai mode Biteship (koordinat, kode pos, mix, atau area id).
pub fn build_rates_request_body(
    cfg: &BiteshipConfig,
    items: Vec<Value>,
    destination_lat: Option<f64>,
    destination_lng: Option<f64>,
    destination_postal_code: Option<&str>,
    destination_area_id: Option<&str>,
    couriers_override: Option<&str>,
) -> Result<Value, String> {
    let default_couriers = default_couriers_list();
    let couriers = couriers_override.unwrap_or(&default_couriers);
    build_rates_request_body_with_couriers(
        cfg,
        items,
        destination_lat,
        destination_lng,
        destination_postal_code,
        destination_area_id,
        couriers,
    )
}

pub fn build_rates_request_body_with_couriers(
    cfg: &BiteshipConfig,
    items: Vec<Value>,
    destination_lat: Option<f64>,
    destination_lng: Option<f64>,
    destination_postal_code: Option<&str>,
    destination_area_id: Option<&str>,
    couriers: &str,
) -> Result<Value, String> {
    if items.is_empty() {
        return Err("Keranjang kosong".into());
    }

    let couriers = couriers.to_string();

    let dest_coords = match (destination_lat, destination_lng) {
        (Some(lat), Some(lng)) => Some((lat, lng)),
        _ => None,
    };

    let dest_postal = destination_postal_code
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .and_then(|s| s.parse::<i64>().ok());

    let dest_area = destination_area_id
        .map(str::trim)
        .filter(|s| !s.is_empty());

    // Mode: area id (Rates API By Area Id)
    if let (Some(origin_area), Some(dest_area)) =
        (cfg.origin_area_id.as_deref(), dest_area)
    {
        return Ok(json!({
            "origin_area_id": origin_area,
            "destination_area_id": dest_area,
            "couriers": couriers,
            "items": items,
        }));
    }

    // Mode: koordinat penuh (Rates API By Coordinates)
    if let Some((dlat, dlng)) = dest_coords {
        return Ok(json!({
            "origin_latitude": cfg.origin_lat,
            "origin_longitude": cfg.origin_lng,
            "destination_latitude": dlat,
            "destination_longitude": dlng,
            "couriers": couriers,
            "items": items,
        }));
    }

    // Mode: kode pos penuh (Rates API By Postal Code)
    if let (Some(op), Some(dp)) = (cfg.origin_postal_code, dest_postal) {
        return Ok(json!({
            "origin_postal_code": op,
            "destination_postal_code": dp,
            "couriers": couriers,
            "items": items,
        }));
    }

    // Mode: mix origin koordinat + destination postal
    if let (Some(dp),) = (dest_postal,) {
        return Ok(json!({
            "origin_latitude": cfg.origin_lat,
            "origin_longitude": cfg.origin_lng,
            "destination_postal_code": dp,
            "couriers": couriers,
            "items": items,
        }));
    }

    Err(
        "Lokasi tujuan belum lengkap. Pilih alamat di peta (koordinat) atau isi kode pos."
            .into(),
    )
}

/// Ambil nilai maksimum dari rentang durasi Biteship, mis. `"0 - 1"` → `1`, `"2"` → `2`.
fn parse_duration_max_value(range: &str) -> f64 {
    let trimmed = range.trim();
    if trimmed.is_empty() {
        return f64::MAX;
    }

    let segment = trimmed
        .split('-')
        .next_back()
        .unwrap_or(trimmed)
        .trim();

    segment
        .chars()
        .filter(|c| c.is_ascii_digit() || *c == '.')
        .collect::<String>()
        .parse::<f64>()
        .unwrap_or(f64::MAX)
}

/// Kelompok kecepatan untuk UI checkout: Next Day (≤1 hari) vs Reguler.
pub fn classify_speed_group(duration_range: &str, duration_unit: &str) -> &'static str {
    let unit = duration_unit.trim().to_lowercase();
    let max_val = parse_duration_max_value(duration_range);

    if unit.is_empty() || unit == "day" || unit == "days" {
        if max_val <= 1.0 {
            "next_day"
        } else {
            "reguler"
        }
    } else if unit == "hour" || unit == "hours" {
        if max_val <= 24.0 {
            "next_day"
        } else {
            "reguler"
        }
    } else {
        "reguler"
    }
}

fn resolve_courier_logo(rate: &Value, company: &str) -> String {
    for key in [
        "courier_logo",
        "courier_logo_url",
        "logo_url",
        "logo",
        "courier_image",
        "image",
    ] {
        if let Some(url) = rate.get(key).and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            return url.to_string();
        }
    }

    format!(
        "https://assets.biteship.com/icons/courier-{}.png",
        company.to_lowercase()
    )
}

pub fn normalize_pricing_options(response: &Value) -> Vec<Value> {
    let pricing = response
        .get("pricing")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    pricing
        .into_iter()
        .filter_map(|rate| {
            let company = rate
                .get("courier_code")
                .or_else(|| rate.get("company"))
                .and_then(|v| v.as_str())?;
            let service = rate
                .get("courier_service_code")
                .or_else(|| rate.get("type"))
                .and_then(|v| v.as_str())?;
            let price = rate
                .get("price")
                .and_then(|v| v.as_f64().or_else(|| v.as_i64().map(|n| n as f64)))?;
            let name = rate
                .get("courier_service_name")
                .or_else(|| rate.get("courier_name"))
                .and_then(|v| v.as_str())
                .unwrap_or(company);
            let description = rate.get("description").and_then(|v| v.as_str()).unwrap_or("");
            let duration_range = rate
                .get("shipment_duration_range")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let duration_unit = rate
                .get("shipment_duration_unit")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let speed_group = classify_speed_group(duration_range, duration_unit);
            let courier_logo = resolve_courier_logo(&rate, company);

            Some(json!({
                "id": format!("{company}_{service}"),
                "courier_company": company,
                "courier_type": service,
                "name": name,
                "description": description,
                "price": price,
                "duration": format!("{duration_range} {duration_unit}").trim().to_string(),
                "shipment_duration_range": duration_range,
                "shipment_duration_unit": duration_unit,
                "speed_group": speed_group,
                "courier_logo": courier_logo,
                "available_collection_method": rate.get("available_collection_method").cloned().unwrap_or(json!([])),
                "available_for_cash_on_delivery": rate.get("available_for_cash_on_delivery").and_then(|v| v.as_bool()).unwrap_or(false),
            }))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classify_next_day_for_zero_to_one_days() {
        assert_eq!(classify_speed_group("0 - 1", "days"), "next_day");
    }

    #[test]
    fn classify_reguler_for_multi_day() {
        assert_eq!(classify_speed_group("2 - 3", "days"), "reguler");
    }
}
