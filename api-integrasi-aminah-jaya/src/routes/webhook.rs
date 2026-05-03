use std::sync::Arc;
use axum::{
    extract::{Query, State, Json},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use tracing::{info, error};

use crate::{
    config::env::Config,
    models::webhook::WebhookPayload,
    services::{chatbot_service, whatsapp_service},
};

#[derive(Debug, Deserialize)]
pub struct VerifyQuery {
    #[serde(rename = "hub.mode")]
    pub mode: Option<String>,
    #[serde(rename = "hub.verify_token")]
    pub verify_token: Option<String>,
    #[serde(rename = "hub.challenge")]
    pub challenge: Option<String>,
}

pub async fn verify_webhook(
    State(config): State<Arc<Config>>,
    Query(query): Query<VerifyQuery>,
) -> impl IntoResponse {
    info!("Incoming GET /webhook request: {:?}", query);
    
    if let (Some(mode), Some(token), Some(challenge)) = (&query.mode, &query.verify_token, &query.challenge) {
        if mode == "subscribe" && token == &config.verify_token {
            info!("Webhook verified successfully.");
            return (StatusCode::OK, challenge.clone()).into_response();
        } else {
            error!("Verification failed. Expected token: {}, got: {}", config.verify_token, token);
        }
    } else {
        error!("Missing query parameters in verification request. Received: {:?}", query);
    }
    
    (StatusCode::FORBIDDEN, "Forbidden").into_response()
}

pub async fn handle_webhook(
    State(config): State<Arc<Config>>,
    Json(raw_payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    info!("Raw webhook payload: {}", raw_payload);

    let payload: Result<WebhookPayload, _> = serde_json::from_value(raw_payload.clone());
    
    match payload {
        Ok(payload) => {
            if let Some(entries) = payload.entry {
                for entry in entries {
                    if let Some(changes) = entry.changes {
                        for change in changes {
                            if let Some(value) = change.value {
                                if let Some(messages) = value.messages {
                                    for message in messages {
                                        if let (Some(from), Some(text)) = (message.from, message.text) {
                                            if let Some(body) = text.body {
                                                info!("Received message from {}: {}", from, body);
                                                
                                                let reply = chatbot_service::generate_reply(&body);
                                                
                                                let config_clone = config.clone();
                                                let from_clone = from.clone();
                                                
                                                // Spawn task to send message asynchronously
                                                tokio::spawn(async move {
                                                    if let Err(e) = whatsapp_service::send_message(
                                                        &from_clone,
                                                        &reply,
                                                        &config_clone.whatsapp_token,
                                                        &config_clone.phone_number_id,
                                                    ).await {
                                                        error!("Error sending message: {}", e);
                                                    }
                                                });
                                            }
                                        }
                                    }
                                } else {
                                    info!("No messages found in value (might be a status update).");
                                }
                            }
                        }
                    }
                }
            }
        }
        Err(e) => {
            error!("Failed to deserialize WebhookPayload: {}", e);
        }
    }

    StatusCode::OK
}
