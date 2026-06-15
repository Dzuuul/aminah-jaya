use serde::{Deserialize, Serialize};
use hmac::{Hmac, Mac};
use sha2::Sha256;

pub const DUITKU_SUCCESS_STATUS: &str = "00";

/// Path resmi Duitku v2 inquiry (digabung dengan base_url config).
pub const INQUIRY_PATH: &str = "/api/merchant/v2/inquiry";

/// Request internal dari storefront sebelum diteruskan ke Duitku.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePaymentRequest {
    pub merchant_order_id: String,
    pub payment_amount: i64,
    pub payment_method: String,
    pub product_details: String,
    pub email: String,
    pub phone_number: String,
    pub customer_va_name: String,
    #[serde(default)]
    pub additional_param: Option<String>,
    #[serde(default)]
    pub return_url: Option<String>,
    #[serde(default)]
    pub expiry_period: Option<i32>,
}

/// Payload inquiry ke API Duitku v2.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DuitkuInquiryRequest {
    pub merchant_code: String,
    pub payment_amount: i64,
    pub payment_method: String,
    pub merchant_order_id: String,
    pub product_details: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub additional_param: Option<String>,
    pub customer_va_name: String,
    pub email: String,
    pub phone_number: String,
    pub callback_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub return_url: Option<String>,
    pub signature: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expiry_period: Option<i32>,
}

/// Respons inquiry dari Duitku.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DuitkuInquiryResponse {
    pub merchant_code: Option<String>,
    pub reference: Option<String>,
    pub payment_url: Option<String>,
    pub va_number: Option<String>,
    pub qr_string: Option<String>,
    pub amount: Option<String>,
    pub status_code: Option<String>,
    pub status_message: Option<String>,
}

impl DuitkuInquiryResponse {
    pub fn is_success(&self) -> bool {
        self.status_code.as_deref() == Some(DUITKU_SUCCESS_STATUS)
    }
}

/// Payload callback Duitku (`application/x-www-form-urlencoded`).
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DuitkuCallbackPayload {
    pub merchant_code: String,
    pub amount: String,
    pub merchant_order_id: String,
    #[serde(default)]
    pub product_detail: Option<String>,
    #[serde(default)]
    pub additional_param: Option<String>,
    #[serde(rename = "paymentCode", default)]
    pub payment_code: Option<String>,
    pub result_code: String,
    #[serde(default)]
    pub merchant_user_id: Option<String>,
    #[serde(default)]
    pub reference: Option<String>,
    pub signature: String,
}

impl DuitkuCallbackPayload {
    pub fn is_payment_success(&self) -> bool {
        self.result_code == DUITKU_SUCCESS_STATUS
    }
}

/// Signature inquiry: HMAC_SHA256(merchantCode + merchantOrderId + paymentAmount, apiKey)
/// Sesuai dokumentasi Duitku v2 terbaru — metode MD5 sudah obsolete.
pub fn generate_inquiry_signature(
    merchant_code: &str,
    merchant_order_id: &str,
    payment_amount: i64,
    api_key: &str,
) -> String {
    let raw = format!("{}{}{}", merchant_code, merchant_order_id, payment_amount);
    hmac_sha256_hex(&raw, api_key)
}

/// Signature callback: HMAC_SHA256(merchantcode + amount + merchantOrderId, apiKey)
/// Sesuai dokumentasi Duitku v2 terbaru — metode MD5 sudah obsolete.
pub fn generate_callback_signature(
    merchant_code: &str,
    amount: &str,
    merchant_order_id: &str,
    api_key: &str,
) -> String {
    let raw = format!("{}{}{}", merchant_code, amount, merchant_order_id);
    hmac_sha256_hex(&raw, api_key)
}

/// HMAC-SHA256 dengan output hex lowercase (64 karakter).
fn hmac_sha256_hex(message: &str, key: &str) -> String {
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(key.as_bytes())
        .expect("HMAC menerima kunci dengan panjang berapa pun");
    mac.update(message.as_bytes());
    let result = mac.finalize();
    let bytes = result.into_bytes();
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inquiry_signature_is_64_hex_chars() {
        let sig = generate_inquiry_signature("D0001", "ORDER-1", 150000, "test-key");
        assert_eq!(sig.len(), 64);
        assert!(sig.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn callback_signature_is_64_hex_chars() {
        let sig = generate_callback_signature("D0001", "150000", "ORDER-1", "test-key");
        assert_eq!(sig.len(), 64);
        assert!(sig.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn inquiry_and_callback_differ() {
        // Memastikan urutan parameter berbeda menghasilkan signature berbeda
        let inquiry = generate_inquiry_signature("D0001", "ORDER-1", 150000, "key");
        let callback = generate_callback_signature("D0001", "150000", "ORDER-1", "key");
        assert_ne!(inquiry, callback);
    }
}
