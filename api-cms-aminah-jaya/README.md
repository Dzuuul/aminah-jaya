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
   Copy `.env.example.local` or `.env.example.production` to `.env` and fill in the required variables.
   
   If the database is in a private network, set `USE_SSH_TUNNEL=true` and provide the SSH credentials. The application will automatically open a tunnel on startup.

3. **Run Application**:
   ```bash
   cargo run
   ```
   *Note: On startup, the app will automatically open an SSH tunnel (if enabled) and run pending database migrations.*

## Database Migrations

Database migrations are managed by `sqlx`.

### Automatic Migrations (Recommended)
Migrations will run automatically every time you start the application with `cargo run`. You don't need to do anything manually.

### Manual Migrations (CLI)
If you need to use the `sqlx-cli`, follow these steps:

1. **Install SQLx CLI**:
   ```bash
   cargo install sqlx-cli --no-default-features --features postgres
   ```

2. **Open SSH Tunnel (if required)**:
   If connecting to a remote DB, open a tunnel in a separate terminal:
   ```bash
   ssh -L 5433:127.0.0.1:5432 <ssh_user>@<ssh_host> -i <key_path> -N
   ```

3. **Run CLI Commands**:
   Override the `DATABASE_URL` to point to your local tunnel port:
   ```bash
   DATABASE_URL="postgres://user:pass@localhost:5433/db" sqlx migrate run
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
