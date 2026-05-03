use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub verify_token: String,
    pub whatsapp_token: String,
    pub phone_number_id: String,
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

        Config {
            port,
            verify_token,
            whatsapp_token,
            phone_number_id,
        }
    }
}
