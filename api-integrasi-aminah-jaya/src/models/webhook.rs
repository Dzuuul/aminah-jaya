use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct WebhookPayload {
    pub object: Option<String>,
    pub entry: Option<Vec<Entry>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Entry {
    pub id: Option<String>,
    pub changes: Option<Vec<Change>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Change {
    pub value: Option<ChangeValue>,
    pub field: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChangeValue {
    pub messaging_product: Option<String>,
    pub metadata: Option<Metadata>,
    pub contacts: Option<Vec<Contact>>,
    pub messages: Option<Vec<Message>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Metadata {
    pub display_phone_number: Option<String>,
    pub phone_number_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Contact {
    pub profile: Option<Profile>,
    pub wa_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Profile {
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Message {
    pub from: Option<String>,
    pub id: Option<String>,
    pub timestamp: Option<String>,
    pub text: Option<Text>,
    #[serde(rename = "type")]
    pub message_type: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Text {
    pub body: Option<String>,
}
