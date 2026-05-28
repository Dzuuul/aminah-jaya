use serde::{Deserialize, Serialize};

pub const DUITKU_SUCCESS_STATUS: &str = "00";

/// Path resmi Duitku v2 inquiry (digabung dengan `DUITKU_BASE_URL`).
pub const INQUIRY_PATH: &str = "/api/merchant/v2/inquiry";

/// Request internal dari storefront / chatbot sebelum diteruskan ke Duitku.
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

/// Signature inquiry: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
pub fn generate_inquiry_signature(
    merchant_code: &str,
    merchant_order_id: &str,
    payment_amount: i64,
    api_key: &str,
) -> String {
    let raw = format!(
        "{}{}{}{}",
        merchant_code, merchant_order_id, payment_amount, api_key
    );
    md5_hex(&raw)
}

/// Signature callback: MD5(merchantCode + amount + merchantOrderId + apiKey)
pub fn generate_callback_signature(
    merchant_code: &str,
    amount: &str,
    merchant_order_id: &str,
    api_key: &str,
) -> String {
    let raw = format!("{}{}{}{}", merchant_code, amount, merchant_order_id, api_key);
    md5_hex(&raw)
}

fn md5_hex(input: &str) -> String {
    format!("{:x}", md5::compute(input.as_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inquiry_signature_matches_concatenation_order() {
        let sig = generate_inquiry_signature("D0001", "ORDER-1", 150000, "test-key");
        let expected = format!("{:x}", md5::compute(b"D0001ORDER-1150000test-key"));
        assert_eq!(sig, expected);
    }

    #[test]
    fn callback_signature_matches_concatenation_order() {
        let sig = generate_callback_signature("D0001", "150000", "ORDER-1", "test-key");
        let expected = format!("{:x}", md5::compute(b"D0001150000ORDER-1test-key"));
        assert_eq!(sig, expected);
    }
}
