use std::sync::Arc;

use axum::{
    extract::{Form, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use tracing::{error, info, warn};

use crate::config::env::Config;
use crate::duitku::client::{DuitkuClient, DuitkuClientError};
use crate::duitku::models::{
    CreatePaymentRequest, DuitkuCallbackPayload, generate_callback_signature,
};
use crate::services::email_service;

pub async fn create_payment_handler(
    State(config): State<Arc<Config>>,
    Json(body): Json<CreatePaymentRequest>,
) -> Response {
    let client = DuitkuClient::new(config.duitku.clone());

    let inquiry_request = client.build_inquiry_request(
        body.merchant_order_id,
        body.payment_amount,
        body.payment_method,
        body.product_details,
        body.email,
        body.phone_number,
        body.customer_va_name,
        body.additional_param,
        body.return_url,
        body.expiry_period,
    );

    match client.create_inquiry(&inquiry_request).await {
        Ok(response) => {
            if response.is_success() {
                info!(
                    order_id = %inquiry_request.merchant_order_id,
                    reference = ?response.reference,
                    "Duitku inquiry berhasil"
                );
                
                // Send email instruction asynchronously
                let resend_api_key = config.resend_api_key.clone();
                let to_email = inquiry_request.email.clone();
                let order_id = inquiry_request.merchant_order_id.clone();
                let response_clone = response.clone();
                tokio::spawn(async move {
                    email_service::send_payment_instruction(resend_api_key, to_email, order_id, response_clone).await;
                });

                (StatusCode::OK, Json(response)).into_response()
            } else {
                warn!(
                    order_id = %inquiry_request.merchant_order_id,
                    status_code = ?response.status_code,
                    status_message = ?response.status_message,
                    "Duitku inquiry ditolak oleh Duitku"
                );
                (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({
                        "error": "Pembayaran ditolak oleh gateway",
                        "detail": response.status_message.as_deref().unwrap_or("Payment channel not available / Gateway Error")
                    })),
                ).into_response()
            }
        }
        Err(DuitkuClientError::Network(e)) => {
            error!("Koneksi ke Duitku gagal: {}", e);
            (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({ "error": "Gagal menghubungi payment gateway" })),
            )
                .into_response()
        }
        Err(DuitkuClientError::Http(status, body)) => {
            error!("Duitku mengembalikan HTTP {}: {}", status, body);
            (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({ "error": "Payment gateway error", "detail": body })),
            )
                .into_response()
        }
        Err(DuitkuClientError::Parse(e)) => {
            error!("Gagal parse respons Duitku: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "Invalid response from payment gateway" })),
            )
                .into_response()
        }
    }
}

pub async fn duitku_callback_handler(
    State(config): State<Arc<Config>>,
    Form(payload): Form<DuitkuCallbackPayload>,
) -> Response {
    let expected_signature = generate_callback_signature(
        &payload.merchant_code,
        &payload.amount,
        &payload.merchant_order_id,
        &config.duitku.api_key,
    );

    if payload.signature != expected_signature {
        warn!(
            order_id = %payload.merchant_order_id,
            "Signature callback Duitku tidak valid"
        );
        return StatusCode::UNAUTHORIZED.into_response();
    }

    if payload.is_payment_success() {
        info!(
            order_id = %payload.merchant_order_id,
            amount = %payload.amount,
            reference = ?payload.reference,
            payment_code = ?payload.payment_code,
            "Pembayaran Duitku sukses — memanggil webhook CMS"
        );
        
        let client = reqwest::Client::new();
        let webhook_payload = serde_json::json!({
            "order_number": payload.merchant_order_id,
            "amount": payload.amount,
        });

        let webhook_url = format!("{}/api/webhook/duitku", config.cms_api_url);
        match client.post(&webhook_url)
            .header("Authorization", format!("Bearer {}", config.webhook_secret))
            .json(&webhook_payload)
            .send()
            .await {
                Ok(res) => {
                    if res.status().is_success() {
                        info!(order_id = %payload.merchant_order_id, "Berhasil update status di CMS");
                    } else {
                        warn!(order_id = %payload.merchant_order_id, status = %res.status(), "Gagal update status di CMS");
                    }
                }
                Err(e) => {
                    error!(order_id = %payload.merchant_order_id, error = %e, "Gagal memanggil webhook CMS");
                }
            }
    } else {
        info!(
            order_id = %payload.merchant_order_id,
            result_code = %payload.result_code,
            "Callback Duitku diterima, pembayaran belum sukses"
        );
    }

    (StatusCode::OK, "OK").into_response()
}
