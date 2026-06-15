use reqwest::StatusCode;
use tracing::error;

use crate::config::env::DuitkuConfig;

use super::models::{
    DuitkuInquiryRequest, DuitkuInquiryResponse, DuitkuPaymentMethodRequest,
    DuitkuPaymentMethodResponse, INQUIRY_PATH, GET_PAYMENT_METHOD_PATH,
    generate_inquiry_signature, generate_payment_method_signature,
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

    /// Mendapatkan daftar metode pembayaran yang aktif
    pub async fn get_payment_methods(
        &self,
        amount: i64,
    ) -> Result<DuitkuPaymentMethodResponse, DuitkuClientError> {
        let now = chrono::Local::now();
        let datetime_str = now.format("%Y-%m-%d %H:%M:%S").to_string();

        let signature = crate::duitku::models::generate_payment_method_signature(
            &self.config.merchant_code,
            amount,
            &datetime_str,
            &self.config.api_key,
        );

        let payload = DuitkuPaymentMethodRequest {
            merchantcode: self.config.merchant_code.clone(),
            amount,
            datetime: datetime_str,
            signature,
        };

        let url = format!(
            "{}{}",
            self.config.base_url,
            crate::duitku::models::GET_PAYMENT_METHOD_PATH
        );

        let response = match self.http.post(&url).json(&payload).send().await {
            Ok(res) => res,
            Err(e) => return Err(DuitkuClientError::Network(e)),
        };

        let status = response.status();
        let body_text = match response.text().await {
            Ok(t) => t,
            Err(e) => return Err(DuitkuClientError::Network(e)),
        };

        if !status.is_success() {
            return Err(DuitkuClientError::Http(status, body_text));
        }

        match serde_json::from_str::<DuitkuPaymentMethodResponse>(&body_text) {
            Ok(data) => Ok(data),
            Err(e) => {
                tracing::error!(
                    "Gagal parse respons get payment method dari Duitku: {}\nBody: {}",
                    e,
                    body_text
                );
                Err(DuitkuClientError::Parse(e))
            }
        }
    }
}
