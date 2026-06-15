use reqwest::StatusCode;
use tracing::error;

use crate::config::env::DuitkuConfig;

use super::models::{
    DuitkuInquiryRequest, DuitkuInquiryResponse, INQUIRY_PATH,
    generate_inquiry_signature,
};

#[derive(Debug)]
pub enum DuitkuClientError {
    Network(reqwest::Error),
    Http(StatusCode, String),
    Parse(serde_json::Error),
}

impl From<reqwest::Error> for DuitkuClientError {
    fn from(err: reqwest::Error) -> Self {
        DuitkuClientError::Network(err)
    }
}

pub struct DuitkuClient {
    http: reqwest::Client,
    config: DuitkuConfig,
}

impl DuitkuClient {
    pub fn new(config: DuitkuConfig) -> Self {
        Self {
            http: reqwest::Client::new(),
            config,
        }
    }

    pub fn build_inquiry_request(
        &self,
        merchant_order_id: String,
        payment_amount: i64,
        payment_method: String,
        product_details: String,
        email: String,
        phone_number: String,
        customer_va_name: String,
        additional_param: Option<String>,
        return_url: Option<String>,
        expiry_period: Option<i32>,
    ) -> DuitkuInquiryRequest {
        let signature = generate_inquiry_signature(
            &self.config.merchant_code,
            &merchant_order_id,
            payment_amount,
            &self.config.api_key,
        );

        DuitkuInquiryRequest {
            merchant_code: self.config.merchant_code.clone(),
            payment_amount,
            payment_method,
            merchant_order_id,
            product_details,
            additional_param,
            customer_va_name,
            email,
            phone_number,
            callback_url: self.config.callback_url.clone(),
            return_url,
            signature,
            expiry_period,
        }
    }

    pub async fn create_inquiry(
        &self,
        request: &DuitkuInquiryRequest,
    ) -> Result<DuitkuInquiryResponse, DuitkuClientError> {
        let url = format!(
            "{}{}",
            self.config.base_url.trim_end_matches('/'),
            INQUIRY_PATH
        );

        tracing::info!("Mengirim request ke Duitku URL: {}", url);
        let payload_json = serde_json::to_string(request).unwrap_or_default();
        tracing::info!("Duitku Request Payload: {}", payload_json);

        let response = self.http.post(&url).json(request).send().await?;

        let status = response.status();
        let body = response.text().await?;
        tracing::info!("Duitku Response HTTP {}: {}", status, body);

        // Duitku selalu mengembalikan JSON bahkan saat HTTP error.
        // Coba parse dulu — jika berhasil, kembalikan struct response
        // sehingga handler di atasnya bisa membaca statusCode & statusMessage
        // dan menampilkan pesan error yang bermakna ke storefront.
        if let Ok(parsed) = serde_json::from_str::<DuitkuInquiryResponse>(&body) {
            if !status.is_success() {
                error!(
                    "Duitku inquiry HTTP {} dengan body JSON: {:?}",
                    status, parsed
                );
            }
            return Ok(parsed);
        }

        // Body bukan JSON valid — kembalikan error mentah
        if !status.is_success() {
            error!("Duitku inquiry HTTP {} (non-JSON body): {}", status, body);
            return Err(DuitkuClientError::Http(status, body));
        }

        // HTTP 200 tapi body tidak bisa di-parse
        let parsed: DuitkuInquiryResponse = serde_json::from_str(&body).map_err(|e| {
            error!("Duitku inquiry parse error: {} — body: {}", e, body);
            DuitkuClientError::Parse(e)
        })?;

        Ok(parsed)
    }
}
