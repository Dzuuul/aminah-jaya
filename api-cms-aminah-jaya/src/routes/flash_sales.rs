use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use crate::models::{ApiResponse, FlashSale, FlashSaleItem, CreateFlashSalePayload, PaginationQuery, PaginationMeta};
use crate::state::AppState;
use uuid::Uuid;

pub async fn list_flash_sales(
    State(state): State<AppState>,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<ApiResponse<Vec<FlashSale>>>, (StatusCode, String)> {
    let limit = pagination.limit();
    let offset = pagination.offset();

    let sales = sqlx::query_as::<_, FlashSale>(
        "SELECT * FROM flash_sales ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM flash_sales")
        .fetch_one(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::paginated(sales, PaginationMeta {
        current_page: pagination.page.unwrap_or(1),
        total_pages: (total.0 as f64 / limit as f64).ceil() as i64,
        total_items: total.0,
        items_per_page: limit,
    })))
}

pub async fn create_flash_sale(
    State(state): State<AppState>,
    Json(payload): Json<CreateFlashSalePayload>,
) -> Result<Json<ApiResponse<FlashSale>>, (StatusCode, String)> {
    let mut tx = state.pool.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let sale = sqlx::query_as::<_, FlashSale>(
        "INSERT INTO flash_sales (name, description, start_at, end_at) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *"
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(payload.start_at)
    .bind(payload.end_at)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for item in payload.items {
        sqlx::query(
            "INSERT INTO flash_sale_items (flash_sale_id, product_id, sale_price, stock_limit) 
             VALUES ($1, $2, $3, $4)"
        )
        .bind(sale.id)
        .bind(item.product_id)
        .bind(item.sale_price)
        .bind(item.stock_limit)
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    tx.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(sale)))
}

pub async fn get_flash_sale(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<serde_json::Value>>, (StatusCode, String)> {
    let sale = sqlx::query_as::<_, FlashSale>("SELECT * FROM flash_sales WHERE id = $1")
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| (StatusCode::NOT_FOUND, "Flash sale not found".to_string()))?;

    let items = sqlx::query_as::<_, FlashSaleItem>(
        "SELECT fsi.*, p.name as product_name, p.price as original_price,
         (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as product_thumbnail
         FROM flash_sale_items fsi
         JOIN products p ON p.id = fsi.product_id
         WHERE fsi.flash_sale_id = $1
         ORDER BY fsi.sort_order ASC"
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(serde_json::json!({
        "sale": sale,
        "items": items
    }))))
}

pub async fn delete_flash_sale(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, String)> {
    sqlx::query("DELETE FROM flash_sales WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(())))
}

pub async fn get_active_flash_sale(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Option<serde_json::Value>>>, (StatusCode, String)> {
    let now = chrono::Utc::now();
    
    let sale = sqlx::query_as::<_, FlashSale>(
        "SELECT * FROM flash_sales 
         WHERE is_active = true AND start_at <= $1 AND end_at >= $1 
         ORDER BY start_at ASC LIMIT 1"
    )
    .bind(now)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if let Some(sale) = sale {
        let items = sqlx::query_as::<_, FlashSaleItem>(
            "SELECT fsi.*, p.name as product_name, p.price as original_price,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as product_thumbnail
             FROM flash_sale_items fsi
             JOIN products p ON p.id = fsi.product_id
             WHERE fsi.flash_sale_id = $1
             ORDER BY fsi.sort_order ASC"
        )
        .bind(sale.id)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        Ok(Json(ApiResponse::success(Some(serde_json::json!({
            "sale": sale,
            "items": items
        })))))
    } else {
        Ok(Json(ApiResponse::success(None)))
    }
}
