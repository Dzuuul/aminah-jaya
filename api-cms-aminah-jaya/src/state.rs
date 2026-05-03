#[derive(Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub s3_client: aws_sdk_s3::Client,
    pub r2_bucket: String,
    pub r2_public_url: String,
}
