use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    pub data: T,
    pub meta: Value,
    pub errors: Option<Value>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            message: "OK".to_string(),
            data,
            meta: serde_json::json!({}),
            errors: None,
        }
    }
}

impl ApiResponse<()> {
    pub fn error(message: &str, errors: Option<Value>) -> Self {
        Self {
            success: false,
            message: message.to_string(),
            data: (),
            meta: serde_json::json!({}),
            errors,
        }
    }
}
