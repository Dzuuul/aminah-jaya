use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    pub data: T,
    pub meta: Value,
    pub errors: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

impl PaginationQuery {
    pub fn offset(&self) -> i64 {
        let page = self.page.unwrap_or(1).max(1);
        let limit = self.limit.unwrap_or(10).max(1);
        (page - 1) * limit
    }

    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(10).max(1)
    }
}

#[derive(Debug, Serialize)]
pub struct PaginationMeta {
    pub current_page: i64,
    pub total_pages: i64,
    pub total_items: i64,
    pub items_per_page: i64,
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

    pub fn paginated(data: T, meta: PaginationMeta) -> Self {
        Self {
            success: true,
            message: "OK".to_string(),
            data,
            meta: serde_json::to_value(meta).unwrap_or(serde_json::json!({})),
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

// ── Auth ───────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserProfile,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: String,
    pub email: String,
    pub name: String,
}

// ── Dashboard ──────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_revenue: f64,
    pub total_orders: i64,
    pub new_customers: i64,
    pub stock_items: i64,
    pub revenue_change: f64,
    pub orders_change: f64,
    pub customers_change: f64,
    pub stock_change: f64,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct RecentOrder {
    pub id: Uuid,
    pub order_number: String,
    pub customer_name: String,
    pub product_name: String,
    pub grand_total: f64,
    pub status: String,
    pub ordered_at: DateTime<Utc>,
}

// ── Products ───────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProductImage {
    pub id: Uuid,
    pub product_id: Uuid,
    pub url: String,
    pub alt_text: Option<String>,
    pub sort_order: i32,
    pub is_primary: bool,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub category_id: Option<Uuid>,
    pub category_name: String,   // joined from categories
    pub price: f64,
    pub stock: i32,
    pub status: String,          // computed: In Stock / Low Stock / Out of Stock
    pub sku: Option<String>,
    pub thumbnail_url: Option<String>, // First image from product_images
    #[sqlx(skip)]
    pub images: Vec<ProductImage>,     // Full gallery
}

#[derive(Debug, Deserialize)]
pub struct CreateProductPayload {
    pub name: String,
    pub category_id: Option<Uuid>,
    pub price: f64,
    pub stock: i32,
    pub sku: Option<String>,
    pub image_urls: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductPayload {
    pub name: Option<String>,
    pub category_id: Option<Uuid>,
    pub price: Option<f64>,
    pub stock: Option<i32>,
    pub image_urls: Option<Vec<String>>,
}

// ── Orders ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: Uuid,
    pub order_number: String,
    pub customer_name: String,
    pub product_name: String,   // first product name from order_items
    pub grand_total: f64,
    pub status: String,
    pub payment_status: String,
    pub ordered_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderStatusPayload {
    pub status: String,
}

// ── Customers (mapped from contacts table) ─────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Customer {
    pub id: Uuid,
    pub name: String,        // display_name or wa_name
    pub phone: String,       // wa_phone
    pub city: Option<String>,
    pub total_orders: i64,
    pub total_spent: f64,
    pub is_blocked: bool,
    pub first_seen_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerStats {
    pub total_customers: i64,
    pub active_customers: i64,
    pub total_revenue: f64,
}

// ── Categories ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub image_url: Option<String>,
    pub description: Option<String>,
    pub sort_order: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryPayload {
    pub name: String,
    pub image_url: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategoryPayload {
    pub name: Option<String>,
    pub image_url: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
}

// ── Flash Sale ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FlashSale {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub start_at: DateTime<Utc>,
    pub end_at: DateTime<Utc>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FlashSaleItem {
    pub id: Uuid,
    pub flash_sale_id: Uuid,
    pub product_id: Uuid,
    pub sale_price: f64,
    pub stock_limit: i32,
    pub sold_count: i32,
    pub sort_order: i32,
    // Joined fields
    pub product_name: String,
    pub product_thumbnail: Option<String>,
    pub original_price: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateFlashSalePayload {
    pub name: String,
    pub description: Option<String>,
    pub start_at: DateTime<Utc>,
    pub end_at: DateTime<Utc>,
    pub items: Vec<CreateFlashSaleItemPayload>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFlashSaleItemPayload {
    pub product_id: Uuid,
    pub sale_price: f64,
    pub stock_limit: i32,
}

// ── Blogs ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Blog {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub excerpt: Option<String>,
    pub content: String,
    pub image_url: Option<String>,
    pub cta_product_id: Option<Uuid>,
    pub author_id: Option<Uuid>,
    pub is_published: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // Joined fields
    #[sqlx(default)]
    pub cta_product_name: Option<String>,
    #[sqlx(default)]
    pub cta_product_price: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBlogPayload {
    pub title: String,
    pub excerpt: Option<String>,
    pub content: String,
    pub image_url: Option<String>,
    pub cta_product_id: Option<Uuid>,
    pub is_published: bool,
}

// ── Banners ────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Banner {
    pub id: Uuid,
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub image_url: String,
    pub link_url: Option<String>,
    pub cta_text: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBannerPayload {
    pub image_url: String,
    pub link_url: Option<String>,
    pub sort_order: Option<i32>,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBannerPayload {
    pub image_url: Option<String>,
    pub link_url: Option<String>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
}
