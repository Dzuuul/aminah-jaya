use reqwest::Client;
use serde_json::json;
use tracing::{error, info};

pub async fn send_message(to: &str, message: &str, token: &str, phone_number_id: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::new();
    let url = format!("https://graph.facebook.com/v18.0/{}/messages", phone_number_id);

    let body = json!({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {
            "body": message
        }
    });

    info!("Sending message to {}: {}", to, message);

    let res = client.post(&url)
        .bearer_auth(token)
        .json(&body)
        .send()
        .await?;

    if res.status().is_success() {
        info!("Message sent successfully");
    } else {
        let error_text = res.text().await?;
        error!("Failed to send message: {}", error_text);
    }

    Ok(())
}
