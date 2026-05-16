use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use crate::models::{ApiResponse, Blog, CreateBlogPayload, PaginationQuery, PaginationMeta};
use crate::state::AppState;
use uuid::Uuid;

pub async fn list_blogs(
    State(state): State<AppState>,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<ApiResponse<Vec<Blog>>>, (StatusCode, String)> {
    let limit = pagination.limit();
    let offset = pagination.offset();

    let blogs = sqlx::query_as::<_, Blog>(
        r#"
        SELECT b.id, b.title, b.slug, b.excerpt, b.content, b.image_url, b.cta_product_id, b.author_id, b.is_published, b.published_at, b.created_at, b.updated_at,
               p.name as cta_product_name, p.price::FLOAT8 as cta_product_price
        FROM blogs b
        LEFT JOIN products p ON p.id = b.cta_product_id
        ORDER BY b.created_at DESC LIMIT $1 OFFSET $2
        "#
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM blogs")
        .fetch_one(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::paginated(blogs, PaginationMeta {
        current_page: pagination.page.unwrap_or(1),
        total_pages: (total.0 as f64 / limit as f64).ceil() as i64,
        total_items: total.0,
        items_per_page: limit,
    })))
}

pub async fn get_latest_blogs(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<Blog>>>, (StatusCode, String)> {
    let blogs = sqlx::query_as::<_, Blog>(
        r#"
        SELECT b.id, b.title, b.slug, b.excerpt, b.content, b.image_url, b.cta_product_id, b.author_id, b.is_published, b.published_at, b.created_at, b.updated_at,
               p.name as cta_product_name, p.price::FLOAT8 as cta_product_price
        FROM blogs b
        LEFT JOIN products p ON p.id = b.cta_product_id
        WHERE b.is_published = true
        ORDER BY b.published_at DESC LIMIT 3
        "#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(blogs)))
}

pub async fn create_blog(
    State(state): State<AppState>,
    Json(payload): Json<CreateBlogPayload>,
) -> Result<Json<ApiResponse<Blog>>, (StatusCode, String)> {
    let slug = payload.title.to_lowercase().replace(' ', "-");
    
    let published_at = if payload.is_published {
        Some(payload.published_at.unwrap_or_else(chrono::Utc::now))
    } else {
        payload.published_at
    };

    let blog = sqlx::query_as::<_, Blog>(
        r#"
        INSERT INTO blogs (title, slug, excerpt, content, image_url, cta_product_id, is_published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#
    )
    .bind(&payload.title)
    .bind(&slug)
    .bind(&payload.excerpt)
    .bind(&payload.content)
    .bind(&payload.image_url)
    .bind(payload.cta_product_id)
    .bind(payload.is_published)
    .bind(published_at)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(blog)))
}

pub async fn get_blog(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Blog>>, (StatusCode, String)> {
    let blog = sqlx::query_as::<_, Blog>(
        r#"
        SELECT b.id, b.title, b.slug, b.excerpt, b.content, b.image_url, b.cta_product_id, b.author_id, b.is_published, b.published_at, b.created_at, b.updated_at,
               p.name as cta_product_name, p.price::FLOAT8 as cta_product_price
        FROM blogs b
        LEFT JOIN products p ON p.id = b.cta_product_id
        WHERE b.id = $1
        "#
    )
    .bind(id)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| (StatusCode::NOT_FOUND, "Blog not found".to_string()))?;

    Ok(Json(ApiResponse::success(blog)))
}

pub async fn delete_blog(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, String)> {
    sqlx::query("DELETE FROM blogs WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ApiResponse::success(())))
}
