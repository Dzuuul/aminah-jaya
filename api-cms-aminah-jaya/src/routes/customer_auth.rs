use axum::{Json, response::IntoResponse, http::{StatusCode, HeaderMap}, extract::State};
use crate::models::{ApiResponse, StorefrontCustomer, RegisterCustomerPayload, LoginCustomerPayload, LoginResponse, UserProfile, GoogleAuthPayload, CartItem, Coupon};
use crate::biteship::{build_rate_items, BiteshipClient};
use serde_json::json;
use crate::auth::{create_jwt, verify_jwt};
use crate::state::AppState;
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterCustomerPayload>
) -> impl IntoResponse {
    let pool = &state.pool;

    let email = if payload.email.trim().is_empty() {
        if let Some(ref phone) = payload.phone {
            let clean_phone = phone.trim();
            if !clean_phone.is_empty() {
                // Check if phone number is already registered
                let phone_exists: bool = sqlx::query_scalar(
                    "SELECT EXISTS(SELECT 1 FROM storefront_customers WHERE phone = $1)"
                )
                .bind(clean_phone)
                .fetch_one(pool)
                .await
                .unwrap_or(false);

                if phone_exists {
                    return (StatusCode::CONFLICT, Json(ApiResponse::error("Nomor HP sudah terdaftar", None))).into_response();
                }

                format!("phone-{}@aminahjaya.com", clean_phone)
            } else {
                return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Email atau Nomor HP wajib diisi", None))).into_response();
            }
        } else {
            return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Email atau Nomor HP wajib diisi", None))).into_response();
        }
    } else {
        payload.email.trim().to_string()
    };

    let password_hash = match hash(payload.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Gagal memproses kata sandi", None))).into_response(),
    };

    let result = sqlx::query_as::<_, StorefrontCustomer>(
        r#"INSERT INTO storefront_customers (email, password_hash, name, phone)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, name, phone, created_at"#
    )
    .bind(&email)
    .bind(password_hash)
    .bind(&payload.name)
    .bind(&payload.phone)
    .fetch_one(pool)
    .await;

    match result {
        Ok(customer) => (StatusCode::CREATED, Json(ApiResponse::success(customer))).into_response(),
        Err(e) => {
            let err_msg = e.to_string();
            if err_msg.contains("unique constraint") {
                let friendly_msg = if err_msg.contains("email") {
                    "Email sudah terdaftar"
                } else if err_msg.contains("phone") {
                    "Nomor HP sudah terdaftar"
                } else {
                    "Email atau Nomor HP sudah terdaftar"
                };
                (StatusCode::CONFLICT, Json(ApiResponse::error(friendly_msg, None))).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&err_msg, None))).into_response()
            }
        }
    }
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginCustomerPayload>
) -> impl IntoResponse {
    let pool = &state.pool;

    let customer_data: Option<(Uuid, String, String, String)> = sqlx::query_as(
        "SELECT id, email, name, password_hash FROM storefront_customers WHERE email = $1 OR phone = $1 LIMIT 1"
    )
    .bind(&payload.identity)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    if let Some((id, email, name, hash)) = customer_data {
        if verify(payload.password, &hash).unwrap_or(false) {
            match create_jwt(&id.to_string()) {
                Ok(token) => {
                    let response = LoginResponse {
                        token,
                        user: UserProfile { 
                            id: id.to_string(), 
                            email, 
                            name 
                        },
                    };
                    return (StatusCode::OK, Json(ApiResponse::success(response))).into_response();
                }
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to create token", None))).into_response(),
            }
        }
    }

    (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid credentials", None))).into_response()
}

pub async fn get_me(
    State(state): State<AppState>,
    headers: HeaderMap
) -> impl IntoResponse {
    let auth_header = match headers.get("Authorization").and_then(|h| h.to_str().ok()) {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Missing or invalid token", None))).into_response(),
    };

    let claims = match verify_jwt(auth_header) {
        Ok(c) => c,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid token", None))).into_response(),
    };

    let customer_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid customer ID in token", None))).into_response(),
    };

    let pool = &state.pool;
    let customer: Option<StorefrontCustomer> = sqlx::query_as(
        "SELECT id, email, name, phone, created_at FROM storefront_customers WHERE id = $1 LIMIT 1"
    )
    .bind(customer_id)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    match customer {
        Some(c) => Json(ApiResponse::success(c)).into_response(),
        None => (StatusCode::NOT_FOUND, Json(ApiResponse::error("Customer not found", None))).into_response(),
    }
}

pub async fn google_login(
    State(state): State<AppState>,
    Json(payload): Json<GoogleAuthPayload>
) -> impl IntoResponse {
    let pool = &state.pool;

    // 1. Verify token with Google
    let client = reqwest::Client::new();
    let res = client
        .get(format!("https://oauth2.googleapis.com/tokeninfo?id_token={}", payload.id_token))
        .send()
        .await;

    let google_user = match res {
        Ok(r) if r.status().is_success() => {
            match r.json::<serde_json::Value>().await {
                Ok(json) => json,
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to parse Google response", None))).into_response(),
            }
        },
        _ => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid Google token", None))).into_response(),
    };

    let email = google_user["email"].as_str().unwrap_or("");
    let name = google_user["name"].as_str().unwrap_or("Google User");
    
    if email.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Google token missing email", None))).into_response();
    }

    // 2. Find or Create customer
    let mut customer = sqlx::query_as::<_, StorefrontCustomer>(
        "SELECT id, email, name, phone, created_at FROM storefront_customers WHERE email = $1 LIMIT 1"
    )
    .bind(email)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    if customer.is_none() {
        // Auto-register using UPSERT to avoid race conditions
        let result = sqlx::query_as::<_, StorefrontCustomer>(
            r#"INSERT INTO storefront_customers (email, password_hash, name, phone)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (email) DO UPDATE
                 SET name = COALESCE(storefront_customers.name, EXCLUDED.name)
               RETURNING id, email, name, phone, created_at"#
        )
        .bind(email)
        .bind("") // No password for OAuth users
        .bind(name)
        .bind("")
        .fetch_one(pool)
        .await;

        match result {
            Ok(c) => customer = Some(c),
            Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
        }
    }

    let customer = customer.unwrap();

    // 3. Create JWT
    match create_jwt(&customer.id.to_string()) {
        Ok(token) => {
            let response = LoginResponse {
                token,
                user: UserProfile { 
                    id: customer.id.to_string(), 
                    email: customer.email, 
                    name: customer.name 
                },
            };
            (StatusCode::OK, Json(ApiResponse::success(response))).into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to create token", None))).into_response(),
    }
}

pub async fn update_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<crate::models::UpdateCustomerProfilePayload>
) -> impl IntoResponse {
    let auth_header = match headers.get("Authorization").and_then(|h| h.to_str().ok()) {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Missing or invalid token", None))).into_response(),
    };

    let claims = match verify_jwt(auth_header) {
        Ok(c) => c,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid token", None))).into_response(),
    };

    let customer_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid customer ID in token", None))).into_response(),
    };

    let pool = &state.pool;

    // Check if email is already taken by another customer
    let email_taken: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM storefront_customers WHERE email = $1 AND id != $2)"
    )
    .bind(&payload.email)
    .bind(customer_id)
    .fetch_one(pool)
    .await
    .unwrap_or(false);

    if email_taken {
        return (StatusCode::CONFLICT, Json(ApiResponse::error("Email sudah terdaftar", None))).into_response();
    }

    // Update password if provided
    if let Some(ref pwd) = payload.password {
        if !pwd.trim().is_empty() {
            match hash(pwd, DEFAULT_COST) {
                Ok(h) => {
                    let _ = sqlx::query(
                        "UPDATE storefront_customers SET password_hash = $1 WHERE id = $2"
                    )
                    .bind(h)
                    .bind(customer_id)
                    .execute(pool)
                    .await;
                }
                Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Gagal memproses kata sandi", None))).into_response(),
            }
        }
    }

    let result = sqlx::query_as::<_, StorefrontCustomer>(
        r#"UPDATE storefront_customers 
           SET name = $1, phone = $2, email = $3
           WHERE id = $4
           RETURNING id, email, name, phone, created_at"#
    )
    .bind(&payload.name)
    .bind(&payload.phone)
    .bind(&payload.email)
    .bind(customer_id)
    .fetch_one(pool)
    .await;

    match result {
        Ok(customer) => (StatusCode::OK, Json(ApiResponse::success(customer))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    }
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct CustomerOrder {
    pub id: Uuid,
    pub order_number: String,
    pub grand_total: f64,
    pub status: String,
    pub payment_status: String,
    pub shipping_address: Option<String>,
    pub ordered_at: chrono::DateTime<chrono::Utc>,
    #[sqlx(skip)]
    pub items: Vec<CustomerOrderItem>,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct CustomerOrderItem {
    pub id: Uuid,
    pub product_id: Uuid,
    pub product_name: String,
    pub variant_label: Option<String>,
    pub quantity: i32,
    pub unit_price: f64,
    pub subtotal: f64,
}

pub async fn get_orders(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let auth_header = match headers.get("Authorization").and_then(|h| h.to_str().ok()) {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Missing or invalid token", None))).into_response(),
    };

    let claims = match verify_jwt(auth_header) {
        Ok(c) => c,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid token", None))).into_response(),
    };

    let customer_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid customer ID in token", None))).into_response(),
    };

    let pool = &state.pool;

    let mut orders: Vec<CustomerOrder> = sqlx::query_as(
        r#"SELECT 
            id, order_number, grand_total::DOUBLE PRECISION AS grand_total, 
            status::TEXT AS status, payment_status::TEXT AS payment_status, 
            shipping_address, ordered_at 
           FROM orders 
           WHERE customer_id = $1 
           ORDER BY ordered_at DESC"#
    )
    .bind(customer_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    for order in &mut orders {
        let items: Vec<CustomerOrderItem> = sqlx::query_as(
            r#"SELECT 
                id, product_id, product_name, variant_label, quantity, 
                unit_price::DOUBLE PRECISION AS unit_price, subtotal::DOUBLE PRECISION AS subtotal 
               FROM order_items 
               WHERE order_id = $1"#
        )
        .bind(order.id)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        order.items = items;
    }

    Json(ApiResponse::success(orders)).into_response()
}

#[derive(Debug, serde::Deserialize)]
pub struct CreateOrderPayload {
    pub shipping_address: String,
    pub shipping_city: String,
    pub shipping_province: String,
    pub shipping_cost: f64,
    pub payment_method: String, // "cod", "transfer", "qris", "other"
    pub notes: Option<String>,
    pub coupon_code: Option<String>,
    pub courier_company: Option<String>,
    pub courier_type: Option<String>,
    pub destination_lat: Option<f64>,
    pub destination_lng: Option<f64>,
    pub destination_postal_code: Option<String>,
    pub destination_area_id: Option<String>,
    pub destination_contact_name: Option<String>,
    pub destination_contact_phone: Option<String>,
    pub biteship_draft_order_id: Option<String>,
}

pub async fn create_order(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateOrderPayload>
) -> impl IntoResponse {
    let auth_header = match headers.get("Authorization").and_then(|h| h.to_str().ok()) {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Missing or invalid token", None))).into_response(),
    };

    let claims = match verify_jwt(auth_header) {
        Ok(c) => c,
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid token", None))).into_response(),
    };

    let customer_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid customer ID in token", None))).into_response(),
    };

    let pool = &state.pool;
    
    // Start transaction
    let mut tx = match pool.begin().await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    };

    // 1. Fetch customer details
    let customer: Option<StorefrontCustomer> = match sqlx::query_as(
        "SELECT id, email, name, phone, created_at FROM storefront_customers WHERE id = $1 LIMIT 1"
    )
    .bind(customer_id)
    .fetch_optional(&mut *tx)
    .await {
        Ok(c) => c,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    };

    let customer = match customer {
        Some(c) => c,
        None => return (StatusCode::NOT_FOUND, Json(ApiResponse::error("Customer not found", None))).into_response(),
    };

    // 2. Fetch cart items
    let cart_items: Vec<CartItem> = match sqlx::query_as(
        r#"SELECT 
            ci.id, ci.customer_id, ci.product_id, ci.quantity, ci.created_at,
            p.name AS product_name, p.price::FLOAT8 AS product_price, p.slug AS product_slug,
            p.weight_gram AS product_weight_gram,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS product_thumbnail
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
           WHERE ci.customer_id = $1"#
    )
    .bind(customer_id)
    .fetch_all(&mut *tx)
    .await {
        Ok(items) => items,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    };

    if cart_items.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Keranjang belanja kosong", None))).into_response();
    }

    // 3. Find or Create Contact in contacts table
    let contact_id: Uuid = if let Some(ref phone_val) = customer.phone {
        let clean_phone = phone_val.trim().replace("+", "");
        if !clean_phone.is_empty() {
            let existing_contact_id: Option<Uuid> = match sqlx::query_scalar(
                "SELECT id FROM contacts WHERE wa_phone = $1"
            )
            .bind(&clean_phone)
            .fetch_optional(&mut *tx)
            .await {
                Ok(c) => c,
                Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
            };

            if let Some(c_id) = existing_contact_id {
                c_id
            } else {
                match sqlx::query_scalar(
                    r#"INSERT INTO contacts (wa_phone, wa_name, display_name, email, city)
                       VALUES ($1, $2, $3, $4, $5)
                       RETURNING id"#
                )
                .bind(&clean_phone)
                .bind(&customer.name)
                .bind(&customer.name)
                .bind(&customer.email)
                .bind(&payload.shipping_city)
                .fetch_one(&mut *tx)
                .await {
                    Ok(id) => id,
                    Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
                }
            }
        } else {
            // Fallback for customer with empty phone string
            let clean_phone = format!("cust-{}", customer.id.to_string()[..12].replace("-", ""));
            let existing_contact_id: Option<Uuid> = match sqlx::query_scalar(
                "SELECT id FROM contacts WHERE wa_phone = $1"
            )
            .bind(&clean_phone)
            .fetch_optional(&mut *tx)
            .await {
                Ok(c) => c,
                Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
            };

            if let Some(c_id) = existing_contact_id {
                c_id
            } else {
                match sqlx::query_scalar(
                    r#"INSERT INTO contacts (wa_phone, wa_name, display_name, email, city)
                       VALUES ($1, $2, $3, $4, $5)
                       RETURNING id"#
                )
                .bind(&clean_phone)
                .bind(&customer.name)
                .bind(&customer.name)
                .bind(&customer.email)
                .bind(&payload.shipping_city)
                .fetch_one(&mut *tx)
                .await {
                    Ok(id) => id,
                    Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
                }
            }
        }
    } else {
        // Fallback for customer without phone - generate a unique placeholder
        let clean_phone = format!("cust-{}", customer.id.to_string()[..12].replace("-", ""));
        let existing_contact_id: Option<Uuid> = match sqlx::query_scalar(
            "SELECT id FROM contacts WHERE wa_phone = $1"
        )
        .bind(&clean_phone)
        .fetch_optional(&mut *tx)
        .await {
            Ok(c) => c,
            Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
        };

        if let Some(c_id) = existing_contact_id {
            c_id
        } else {
            match sqlx::query_scalar(
                r#"INSERT INTO contacts (wa_phone, wa_name, display_name, email, city)
                   VALUES ($1, $2, $3, $4, $5)
                   RETURNING id"#
            )
            .bind(&clean_phone)
            .bind(&customer.name)
            .bind(&customer.name)
            .bind(&customer.email)
            .bind(&payload.shipping_city)
            .fetch_one(&mut *tx)
            .await {
                Ok(id) => id,
                Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
            }
        }
    };

    // Calculate totals
    let mut total_amount = 0.0;
    for item in &cart_items {
        total_amount += item.product_price.unwrap_or(0.0) * item.quantity as f64;
    }

    let mut coupon_id: Option<Uuid> = None;
    let mut coupon_code: Option<String> = None;
    let mut discount_amount = 0.0;

    if let Some(code) = payload.coupon_code.clone().filter(|c| !c.trim().is_empty()) {
        let coupon: Coupon = match sqlx::query_as(
            "SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = true AND start_at <= NOW() AND end_at >= NOW()"
        )
        .bind(code.trim())
        .fetch_one(&mut *tx)
        .await {
            Ok(c) => c,
            Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Voucher tidak valid atau sudah tidak aktif", None))).into_response(),
        };

        if let Some(limit) = coupon.usage_limit {
            if coupon.used_count >= limit {
                return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Voucher sudah tidak bisa digunakan", None))).into_response();
            }
        }

        if total_amount < coupon.min_purchase {
            return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Total pembelanjaan belum memenuhi syarat voucher", None))).into_response();
        }

        let mut computed_discount = match coupon.discount_type.to_lowercase().as_str() {
            "percentage" => {
                let mut amount = (total_amount + payload.shipping_cost) * (coupon.discount_value / 100.0);
                if let Some(max_discount) = coupon.max_discount {
                    if amount > max_discount {
                        amount = max_discount;
                    }
                }
                amount
            }
            "fixed" => coupon.discount_value,
            _ => 0.0,
        };

        if computed_discount > total_amount + payload.shipping_cost {
            computed_discount = total_amount + payload.shipping_cost;
        }

        coupon_id = Some(coupon.id);
        coupon_code = Some(code.trim().to_string());
        discount_amount = computed_discount;
    }

    let grand_total = total_amount + payload.shipping_cost - discount_amount;

    // Validate payment method
    let valid_pm = ["cod", "transfer", "qris", "other"];
    let method = payload.payment_method.to_lowercase();
    let pm = if valid_pm.contains(&method.as_str()) {
        method
    } else {
        "transfer".to_string()
    };

    let courier_company = payload.courier_company.clone().filter(|s| !s.trim().is_empty());
    let courier_type = payload.courier_type.clone().filter(|s| !s.trim().is_empty());
    let biteship_enabled = BiteshipClient::from_env().is_ok();

    if biteship_enabled && (courier_company.is_none() || courier_type.is_none()) {
        return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Pilih metode pengiriman terlebih dahulu", None))).into_response();
    }

    // 4. Create Order
    let order_id: Uuid = match sqlx::query_scalar(
        r#"INSERT INTO orders (
            contact_id, customer_id, total_amount, shipping_cost, discount_amount, coupon_id, coupon_code, grand_total,
            payment_method, payment_status, shipping_address, shipping_city, shipping_province, notes, status,
            shipping_lat, shipping_lng, shipping_postal_code, shipping_area_id,
            courier_company, courier_service, courier
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::payment_method, 'unpaid', $10, $11, $12, $13, 'pending'::order_status,
            $14, $15, $16, $17, $18, $19, $20)
           RETURNING id"#
    )
    .bind(contact_id)
    .bind(customer_id)
    .bind(total_amount)
    .bind(payload.shipping_cost)
    .bind(discount_amount)
    .bind(coupon_id)
    .bind(&coupon_code)
    .bind(grand_total)
    .bind(pm)
    .bind(&payload.shipping_address)
    .bind(&payload.shipping_city)
    .bind(&payload.shipping_province)
    .bind(&payload.notes)
    .bind(payload.destination_lat)
    .bind(payload.destination_lng)
    .bind(&payload.destination_postal_code)
    .bind(&payload.destination_area_id)
    .bind(&courier_company)
    .bind(&courier_type)
    .bind(courier_company.as_deref())
    .fetch_one(&mut *tx)
    .await {
        Ok(id) => id,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response(),
    };

    if let Some(coupon_id) = coupon_id {
        let update_result = sqlx::query("UPDATE coupons SET used_count = used_count + 1 WHERE id = $1")
            .bind(coupon_id)
            .execute(&mut *tx)
            .await;

        if let Err(e) = update_result {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
        }
    }

    // 5. Insert Order Items
    for item in &cart_items {
        let price = item.product_price.unwrap_or(0.0);
        let subtotal = price * item.quantity as f64;
        let p_name = item.product_name.clone().unwrap_or_default();
        
        let insert_item_result = sqlx::query(
            r#"INSERT INTO order_items (
                order_id, product_id, product_name, quantity, unit_price, subtotal
               )
               VALUES ($1, $2, $3, $4, $5, $6)"#
        )
        .bind(order_id)
        .bind(item.product_id)
        .bind(&p_name)
        .bind(item.quantity)
        .bind(price)
        .bind(subtotal)
        .execute(&mut *tx)
        .await;

        if let Err(e) = insert_item_result {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
        }
    }

    // 6. Clear Cart
    let clear_cart_result = sqlx::query("DELETE FROM cart_items WHERE customer_id = $1")
        .bind(customer_id)
        .execute(&mut *tx)
        .await;

    if let Err(e) = clear_cart_result {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
    }

    // 7. Create Biteship shipment
    let mut biteship_draft_order_id = payload.biteship_draft_order_id.clone();

    if let Ok(biteship) = BiteshipClient::from_env() {
        let cfg = biteship.config();
        let items = build_rate_items(&cart_items);
        let company = courier_company.clone().unwrap_or_default();
        let service = courier_type.clone().unwrap_or_default();

        let biteship_result = if let Some(draft_id) = payload.biteship_draft_order_id.clone().filter(|d| !d.is_empty()) {
            biteship_draft_order_id = Some(draft_id.clone());
            biteship.confirm_draft_order(&draft_id).await
        } else {
            let dest_phone = payload
                .destination_contact_phone
                .clone()
                .or_else(|| customer.phone.clone())
                .unwrap_or_else(|| "081234567890".into());
            let dest_name = payload
                .destination_contact_name
                .clone()
                .unwrap_or_else(|| customer.name.clone());
            let mut body = json!({
                "shipper_contact_name": cfg.origin_contact_name,
                "shipper_contact_phone": cfg.origin_contact_phone,
                "origin_contact_name": cfg.origin_contact_name,
                "origin_contact_phone": cfg.origin_contact_phone,
                "origin_address": cfg.origin_address,
                "destination_contact_name": dest_name,
                "destination_contact_phone": dest_phone,
                "destination_address": payload.shipping_address,
                "destination_note": payload.notes,
                "courier_company": company,
                "courier_type": service,
                "delivery_type": "now",
                "reference_id": order_id.to_string(),
                "order_note": payload.notes,
                "items": items,
            });

            if let (Some(lat), Some(lng)) = (payload.destination_lat, payload.destination_lng) {
                body["origin_coordinate"] = json!({ "latitude": cfg.origin_lat, "longitude": cfg.origin_lng });
                body["destination_coordinate"] = json!({ "latitude": lat, "longitude": lng });
            }
            if let Some(area_id) = &payload.destination_area_id {
                body["destination_area_id"] = json!(area_id);
            }
            if let Some(postal) = &payload.destination_postal_code {
                if let Ok(code) = postal.parse::<i64>() {
                    body["destination_postal_code"] = json!(code);
                }
            }
            if let Some(area_id) = &cfg.origin_area_id {
                body["origin_area_id"] = json!(area_id);
            }
            if let Some(postal) = cfg.origin_postal_code {
                body["origin_postal_code"] = json!(postal);
            }

            biteship.create_order(body).await
        };

        match biteship_result {
            Ok(data) => {
                let biteship_order_id =
                    data.get("id").and_then(|v| v.as_str()).map(str::to_string);
                let biteship_tracking_id = data
                    .pointer("/courier/tracking_id")
                    .and_then(|v| v.as_str())
                    .map(str::to_string);
                let tracking_number = data
                    .pointer("/courier/waybill_id")
                    .and_then(|v| v.as_str())
                    .map(str::to_string);

                let _ = sqlx::query(
                    r#"UPDATE orders SET
                        biteship_order_id = $1,
                        biteship_tracking_id = $2,
                        biteship_draft_order_id = $3,
                        tracking_number = COALESCE($4, tracking_number)
                       WHERE id = $5"#,
                )
                .bind(&biteship_order_id)
                .bind(&biteship_tracking_id)
                .bind(&biteship_draft_order_id)
                .bind(&tracking_number)
                .bind(order_id)
                .execute(&mut *tx)
                .await;
            }
            Err(e) => {
                tracing::error!("Biteship order failed: {}", e.message);
                return (StatusCode::BAD_GATEWAY, Json(ApiResponse::error(
                    &format!("Gagal membuat pengiriman Biteship: {}", e.message),
                    None,
                ))).into_response();
            }
        }
    } else {
        tracing::warn!("BITESHIP_API_KEY not configured; order saved without Biteship shipment");
    }

    // Commit Transaction
    if let Err(e) = tx.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(&e.to_string(), None))).into_response();
    }

    // Fetch order number
    let order_number: String = match sqlx::query_scalar("SELECT order_number FROM orders WHERE id = $1")
        .bind(order_id)
        .fetch_one(pool)
        .await {
            Ok(num) => num,
            Err(_) => "AJ-ORDER".to_string(),
        };

    (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({
        "order_id": order_id,
        "order_number": order_number,
        "grand_total": grand_total
    })))).into_response()
}
