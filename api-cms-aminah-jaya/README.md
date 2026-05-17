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

### Auth (Admin)
- `POST /api/auth/login`: Authenticate and receive JWT.
- `GET /api/auth/me`: Get current authenticated user profile.

### Auth (Customer)
- `POST /api/customer/register`: Register a new customer account.
- `POST /api/customer/login`: Customer login to receive JWT.
- `POST /api/customer/auth/google`: Customer login/registration using Google OAuth token.
- `GET /api/customer/me`: Get current authenticated customer profile.
- `PATCH /api/customer/profile`: Update current customer profile (name, email, phone, shipping address, or password).
- `GET /api/customer/orders`: Get order history list for the authenticated customer.
- `POST /api/customer/orders`: Create a new order from current cart items.

### Cart (Customer Only)
- `GET /api/cart`: Get current items in the shopping cart.
- `POST /api/cart`: Add a product to the cart.
- `PATCH /api/cart/:id`: Update item quantity in cart.
- `DELETE /api/cart/:id`: Remove item from cart.
- `DELETE /api/cart`: Clear entire cart.

### Dashboard
- `GET /api/dashboard/stats`: Retrieve summary statistics.
- `GET /api/dashboard/performance`: Get detailed performance analytics.
- `GET /api/dashboard/recent-orders`: Get list of most recent orders.

### Products
- `GET /api/products`: List products (paginated). Includes `slug` and `weight_gram`.
- `POST /api/products`: Create a new product.
- `GET /api/products/:id`: Get product details by UUID.
- `GET /api/products/slug/:slug`: Get product details by URL slug.
- `PATCH /api/products/:id`: Update product info.
- `DELETE /api/products/:id`: Soft-delete product (sets status to inactive).

### Categories
- `GET /api/categories`: List all active categories.
- `POST /api/categories`: Create a new category.
- `PATCH /api/categories/:id`: Update category details.
- `DELETE /api/categories/:id`: Soft-delete category.

### Collections
- `GET /api/collections`: List all active collections.
- `POST /api/collections`: Create a new collection.
- `GET /api/collections/:id`: Get collection details by UUID.
- `PATCH /api/collections/:id`: Update collection details.
- `DELETE /api/collections/:id`: Delete a collection.

### Flash Sales
- `GET /api/flash-sales`: List all flash sale events.
- `POST /api/flash-sales`: Create new flash sale with items.
- `GET /api/flash-sales/active`: Get currently ongoing flash sale (public).
- `GET /api/flash-sales/:id`: Get flash sale details.
- `DELETE /api/flash-sales/:id`: Delete flash sale event.

### Blogs
- `GET /api/blogs`: List all articles (paginated).
- `GET /api/blogs/latest`: Get 3 latest published articles.
- `POST /api/blogs`: Create new article.
- `GET /api/blogs/:id`: Get article details.
- `DELETE /api/blogs/:id`: Delete an article.

### Orders
- `GET /api/orders`: List all orders.
- `GET /api/orders/:id`: Get full order details.
- `PATCH /api/orders/:id/status`: Update order status.

### Customers (CMS View)
- `GET /api/customers`: List contacts (mapped from WA contacts).
- `GET /api/customers/stats`: Get customer-related statistics.
- `GET /api/customers/:id`: Get contact profile and order history.

### Coupons
- `GET /api/coupons`: List all discount coupons.
- `POST /api/coupons`: Create new coupon.
- `GET /api/coupons/validate/:code`: Validate a coupon code.
- `GET /api/coupons/:id`: Get coupon details.
- `PATCH /api/coupons/:id`: Update coupon.
- `DELETE /api/coupons/:id`: Delete coupon.

### Banners
- `GET /api/banners`: List active banners.
- `GET /api/banners/all`: List all banners (including inactive).
- `POST /api/banners`: Create new banner.
- `PATCH /api/banners/:id`: Update banner.
- `DELETE /api/banners/:id`: Delete banner.

### Notifications
- `GET /api/notifications`: List admin notifications.
- `GET /api/notifications/unread-count`: Get count of unread notifications.
- `PATCH /api/notifications/:id/read`: Mark notification as read.

### Legal & Settings
- `GET /api/legal`: List all legal pages.
- `GET /api/legal/:key`: Get specific legal page (Terms, Privacy, etc.).
- `PATCH /api/legal/:key`: Update legal page content.
- `GET /api/settings`: Get global site settings.
- `PATCH /api/settings`: Update site settings.

### Media
- `POST /api/upload`: Upload image/video to Cloudflare R2.

### Favorites (Customer Only)
- `GET /api/customer/favorites`: Get customer's wishlisted products.
- `POST /api/customer/favorites`: Add a product to customer's wishlist.
- `DELETE /api/customer/favorites/:id`: Remove item from wishlist by wishlist ID.
- `DELETE /api/customer/favorites/product/:product_id`: Remove item from wishlist by product UUID.
- `GET /api/customer/favorites/folders`: Get list of favorite folder names.

## Technology Stack

- **Axum**: Web framework.
- **SQLx**: Asynchronous SQL toolkit.
- **PostgreSQL**: Database.
- **Cloudflare R2**: S3-compatible media storage.
- **AWS SDK for Rust**: Interacting with R2.
- **Serde**: JSON serialization.
- **Chrono**: DateTime handling.
- **Tower HTTP**: CORS and tracing layers.
- **Bcrypt**: Password hashing.
- **JSONWebToken**: Authentication.
