use std::env;

const DEFAULT_DUITKU_BASE_URL: &str = "https://sandbox.duitku.com/webapi";

#[derive(Debug, Clone)]
pub struct DuitkuConfig {
    pub merchant_code: String,
    pub api_key: String,
    pub base_url: String,
    pub callback_url: String,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub verify_token: String,
    pub whatsapp_token: String,
    pub phone_number_id: String,
    pub duitku: DuitkuConfig,
}

impl Config {
    pub fn load() -> Self {
        dotenvy::dotenv().ok();

        let port = env::var("PORT")
            .unwrap_or_else(|_| "3000".to_string())
            .parse()
            .expect("PORT must be a number");

        let verify_token = env::var("VERIFY_TOKEN").expect("VERIFY_TOKEN must be set");
        let whatsapp_token = env::var("WHATSAPP_TOKEN").expect("WHATSAPP_TOKEN must be set");
        let phone_number_id = env::var("PHONE_NUMBER_ID").expect("PHONE_NUMBER_ID must be set");

        let duitku = DuitkuConfig {
            merchant_code: env::var("DUITKU_MERCHANT_CODE")
                .expect("DUITKU_MERCHANT_CODE must be set"),
            api_key: env::var("DUITKU_API_KEY").expect("DUITKU_API_KEY must be set"),
            base_url: env::var("DUITKU_BASE_URL")
                .unwrap_or_else(|_| DEFAULT_DUITKU_BASE_URL.to_string()),
            callback_url: env::var("DUITKU_CALLBACK_URL")
                .expect("DUITKU_CALLBACK_URL must be set"),
        };

        Config {
            port,
            verify_token,
            whatsapp_token,
            phone_number_id,
            duitku,
        }
    }
}
