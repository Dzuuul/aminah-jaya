# API CMS Aminah Jaya

Backend API for Aminah Jaya Store CMS, built with Rust, Axum, and SQLx.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Docker](https://docs.docker.com/get-docker/)
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli)

## Setup

1. **Start Database**:
   ```bash
   docker-compose up -d
   ```

2. **Configuration**:
   Copy `.env.example` to `.env` and fill in the required variables (Database URL, R2/S3 credentials, etc.).

3. **Run Application**:
   ```bash
   cargo run
   ```

## Database Migrations

This project uses `sqlx-cli` for database migrations.

1. **Install SQLx CLI**:
   ```bash
   cargo install sqlx-cli --no-default-features --features postgres
   ```

2. **Run Migrations**:
   ```bash
   sqlx migrate run
   ```

3. **Revert Last Migration**:
   ```bash
   sqlx migrate revert
   ```

4. **Create New Migration**:
   ```bash
   sqlx migrate add <migration_name>
   ```

## API Endpoints

### Auth
- `POST /api/auth/login`: Authenticate and receive JWT.

### Dashboard
- `GET /api/dashboard/stats`: Retrieve summary statistics.
- `GET /api/dashboard/recent-orders`: Get list of most recent orders.

### Products & Categories
- `GET /api/products`: List products (paginated).
- `POST /api/products`: Create a new product.
- `GET /api/products/:id`: Get product details.
- `PATCH /api/products/:id`: Update product info.
- `DELETE /api/products/:id`: Soft-delete product.
- `GET /api/categories`: List all categories.

### Flash Sales
- `GET /api/flash-sales`: List all flash sale events.
- `POST /api/flash-sales`: Create new flash sale with items.
- `GET /api/flash-sales/active`: Get currently ongoing flash sale (public).
- `GET /api/flash-sales/:id`: Get flash sale details.
- `DELETE /api/flash-sales/:id`: Delete flash sale event.

### Blogs
- `GET /api/blogs`: List all articles (paginated).
- `GET /api/blogs/latest`: Get 3 latest published articles for landing page.
- `POST /api/blogs`: Create new article with optional product CTA.
- `GET /api/blogs/:id`: Get article details.
- `DELETE /api/blogs/:id`: Delete an article.

### Orders
- `GET /api/orders`: List all orders.
- `GET /api/orders/:id`: Get order details.
- `PATCH /api/orders/:id/status`: Update order status (Pending, Paid, etc.).

### Customers
- `GET /api/customers`: List customers.
- `GET /api/customers/stats`: Get customer-related statistics.
- `GET /api/customers/:id`: Get customer profile.

### Media
- `POST /api/upload`: Upload image/video to Cloudflare R2 (S3-compatible).

## Technology Stack

- **Axum**: High-performance web framework.
- **SQLx**: Type-safe SQL toolkit for PostgreSQL.
- **PostgreSQL**: Primary database.
- **Cloudflare R2**: Media storage (S3 compatible).
- **Serde**: Serialization/Deserialization.
- **Chrono**: Time and date handling.
