use reqwest::Method;
use serde_json::Value;

#[derive(Debug)]
pub struct IntegrasiError {
    pub message: String,
}

impl std::fmt::Display for IntegrasiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for IntegrasiError {}

#[derive(Clone)]
pub struct IntegrasiClient {
    base_url: String,
    http: reqwest::Client,
}

impl IntegrasiClient {
    pub fn from_env() -> Result<Self, IntegrasiError> {
        let base_url = std::env::var("INTEGRASI_API_URL").map_err(|_| IntegrasiError {
            message: "INTEGRASI_API_URL belum dikonfigurasi".into(),
        })?;

        let base_url = base_url.trim().trim_end_matches('/').to_string();
        if base_url.is_empty() {
            return Err(IntegrasiError {
                message: "INTEGRASI_API_URL kosong".into(),
            });
        }

        Ok(Self {
            base_url,
            http: reqwest::Client::new(),
        })
    }

    pub fn is_configured() -> bool {
        std::env::var("INTEGRASI_API_URL")
            .ok()
            .map(|v| !v.trim().is_empty())
            .unwrap_or(false)
    }

    pub async fn confirm_draft_order(&self, draft_id: &str) -> Result<Value, IntegrasiError> {
        self.request(
            Method::POST,
            &format!("/api/shipping/draft-orders/{draft_id}/confirm"),
            Some(serde_json::json!({})),
        )
        .await
    }

    pub async fn create_biteship_order(&self, body: Value) -> Result<Value, IntegrasiError> {
        self.request(Method::POST, "/api/shipping/orders", Some(body))
            .await
    }

    pub async fn get_biteship_order(&self, order_id: &str) -> Result<Value, IntegrasiError> {
        self.request(
            Method::GET,
            &format!("/api/shipping/orders/{order_id}"),
            None,
        )
        .await
    }

    pub async fn get_biteship_tracking(&self, tracking_id: &str) -> Result<Value, IntegrasiError> {
        self.request(
            Method::GET,
            &format!("/api/shipping/tracking/{tracking_id}"),
            None,
        )
        .await
    }

    async fn request(
        &self,
        method: Method,
        path: &str,
        body: Option<Value>,
    ) -> Result<Value, IntegrasiError> {
        let url = format!("{}{}", self.base_url, path);
        let mut req = self.http.request(method, &url);

        if let Some(payload) = body {
            req = req.json(&payload);
        }

        let response = req.send().await.map_err(|e| IntegrasiError {
            message: format!("Gagal menghubungi layanan integrasi: {e}"),
        })?;

        let status = response.status();
        let text = response.text().await.map_err(|e| IntegrasiError {
            message: e.to_string(),
        })?;

        let parsed: Value = serde_json::from_str(&text).unwrap_or_else(|_| {
            serde_json::json!({ "raw": text })
        });

        if !status.is_success() {
            let message = parsed
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("Permintaan ke layanan integrasi gagal")
                .to_string();
            return Err(IntegrasiError { message });
        }

        if parsed.get("success").and_then(|v| v.as_bool()) == Some(false) {
            let message = parsed
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("Permintaan ke layanan integrasi gagal")
                .to_string();
            return Err(IntegrasiError { message });
        }

        Ok(parsed.get("data").cloned().unwrap_or(parsed))
    }
}
