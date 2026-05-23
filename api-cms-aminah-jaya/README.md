# API CMS Aminah Jaya

Backend API for Aminah Jaya Store CMS, built with **Rust**, **Axum**, and **SQLx**.

---

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Docker](https://docs.docker.com/get-docker/)
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli)

---

## Setup

### 1. Start Database

```bash
docker-compose up -d
```

### 2. Configuration

Salin file berikut:

```bash
.env.example.local
# atau
.env.example.production
```

ke:

```bash
.env
```

Isi semua environment variable yang dibutuhkan.

Jika database berada di private network/VPS, aktifkan SSH tunnel:

```env
USE_SSH_TUNNEL=true
```

Aplikasi akan otomatis membuat SSH tunnel saat startup.

### 3. Run Application

```bash
cargo run
```

Saat startup, aplikasi secara otomatis akan:

- Membuka SSH Tunnel (jika diaktifkan)
- Menghubungkan ke PostgreSQL
- Menjalankan pending SQLx migrations
- Menjalankan Axum HTTP server

---

## Database Migrations

Migrations dikelola menggunakan SQLx.

### Automatic Migrations (Recommended)

Migrations berjalan otomatis saat aplikasi dijalankan:

```bash
cargo run
```

Tidak perlu tindakan manual.

### Manual Migrations (CLI)

**Install SQLx CLI:**

```bash
cargo install sqlx-cli --no-default-features --features postgres
```

**Buat migration baru:**

```bash
sqlx migrate add create_customer_addresses
```

Contoh file yang dihasilkan:

```
migrations/
└── 202605220001_create_customer_addresses.sql
```

**Jalankan migrations:**

```bash
sqlx migrate run
```

**Cek status migrations:**

```bash
sqlx migrate info
```

### SSH Tunnel untuk Remote Database

Jika menggunakan PostgreSQL remote:

```bash
ssh -L 5433:127.0.0.1:5432 <ssh_user>@<ssh_host> -i <key_path> -N
```

Kemudian jalankan migration dengan:

```bash
DATABASE_URL="postgres://user:pass@localhost:5433/db" sqlx migrate run
```

---

## API Endpoints

### Auth — Admin

| Method | Endpoint          | Description                        |
| ------ | ----------------- | ---------------------------------- |
| POST   | `/api/auth/login` | Authenticate admin dan terima JWT  |
| GET    | `/api/auth/me`    | Get current authenticated admin    |

### Auth — Customer

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/api/customer/register`    | Register akun customer             |
| POST   | `/api/customer/login`       | Customer login                     |
| POST   | `/api/customer/auth/google` | Login/Register via Google OAuth    |
| GET    | `/api/customer/me`          | Get profil customer yang login     |
| PATCH  | `/api/customer/profile`     | Update profil customer             |
| GET    | `/api/customer/orders`      | Get riwayat order customer         |
| POST   | `/api/customer/orders`      | Buat order baru dari cart          |

### Customer Addresses

Alamat customer disimpan di tabel terpisah (`customer_addresses`) untuk mendukung multi-alamat pengiriman.

| Method | Endpoint                              | Description                |
| ------ | ------------------------------------- | -------------------------- |
| GET    | `/api/customer/addresses`             | Get semua alamat customer  |
| POST   | `/api/customer/addresses`             | Tambah alamat baru         |
| PATCH  | `/api/customer/addresses/:id`         | Update alamat              |
| DELETE | `/api/customer/addresses/:id`         | Hapus alamat               |
| PATCH  | `/api/customer/addresses/:id/default` | Set alamat default         |

**Contoh request tambah alamat:**

```json
POST /api/customer/addresses

{
  "label": "Rumah",
  "recipient_name": "Fikri",
  "recipient_phone": "08123456789",
  "address": "Jl. Sudirman No. 1",
  "province": "Jawa Barat",
  "city": "Bandung",
  "district": "Coblong",
  "postal_code": "40132",
  "lat": -6.914744,
  "lng": 107.609810,
  "is_default": true
}
```

### Cart (Customer Only)

| Method | Endpoint        | Description                  |
| ------ | --------------- | ---------------------------- |
| GET    | `/api/cart`     | Get shopping cart            |
| POST   | `/api/cart`     | Tambah item ke cart          |
| PATCH  | `/api/cart/:id` | Update jumlah item di cart   |
| DELETE | `/api/cart/:id` | Hapus item dari cart         |
| DELETE | `/api/cart`     | Kosongkan cart               |

### Dashboard

| Method | Endpoint                       | Description           |
| ------ | ------------------------------ | --------------------- |
| GET    | `/api/dashboard/stats`         | Statistik dashboard   |
| GET    | `/api/dashboard/performance`   | Analitik dashboard    |
| GET    | `/api/dashboard/recent-orders` | Order terbaru         |

### Products

| Method | Endpoint                   | Description            |
| ------ | -------------------------- | ---------------------- |
| GET    | `/api/products`            | List produk            |
| POST   | `/api/products`            | Buat produk            |
| GET    | `/api/products/:id`        | Detail produk          |
| GET    | `/api/products/slug/:slug` | Detail produk by slug  |
| PATCH  | `/api/products/:id`        | Update produk          |
| DELETE | `/api/products/:id`        | Soft delete produk     |

### Categories

| Method | Endpoint              | Description      |
| ------ | --------------------- | ---------------- |
| GET    | `/api/categories`     | List kategori    |
| POST   | `/api/categories`     | Buat kategori    |
| PATCH  | `/api/categories/:id` | Update kategori  |
| DELETE | `/api/categories/:id` | Hapus kategori   |

### Collections

| Method | Endpoint               | Description        |
| ------ | ---------------------- | ------------------ |
| GET    | `/api/collections`     | List koleksi       |
| POST   | `/api/collections`     | Buat koleksi       |
| GET    | `/api/collections/:id` | Detail koleksi     |
| PATCH  | `/api/collections/:id` | Update koleksi     |
| DELETE | `/api/collections/:id` | Hapus koleksi      |

### Flash Sales

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/flash-sales`        | List flash sales        |
| POST   | `/api/flash-sales`        | Buat flash sale         |
| GET    | `/api/flash-sales/active` | Get flash sale aktif    |
| GET    | `/api/flash-sales/:id`    | Detail flash sale       |
| DELETE | `/api/flash-sales/:id`    | Hapus flash sale        |

### Blogs

| Method | Endpoint            | Description     |
| ------ | ------------------- | --------------- |
| GET    | `/api/blogs`        | List blog       |
| GET    | `/api/blogs/latest` | Blog terbaru    |
| POST   | `/api/blogs`        | Buat blog       |
| GET    | `/api/blogs/:id`    | Detail blog     |
| DELETE | `/api/blogs/:id`    | Hapus blog      |

### Orders

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| GET    | `/api/orders`            | List semua order     |
| GET    | `/api/orders/:id`        | Detail order         |
| PATCH  | `/api/orders/:id/status` | Update status order  |

### Customers (CMS)

| Method | Endpoint               | Description           |
| ------ | ---------------------- | --------------------- |
| GET    | `/api/customers`       | List customers        |
| GET    | `/api/customers/stats` | Statistik customer    |
| GET    | `/api/customers/:id`   | Detail customer       |

### Coupons

| Method | Endpoint                      | Description      |
| ------ | ----------------------------- | ---------------- |
| GET    | `/api/coupons`                | List kupon       |
| POST   | `/api/coupons`                | Buat kupon       |
| GET    | `/api/coupons/validate/:code` | Validasi kupon   |
| GET    | `/api/coupons/:id`            | Detail kupon     |
| PATCH  | `/api/coupons/:id`            | Update kupon     |
| DELETE | `/api/coupons/:id`            | Hapus kupon      |

### Banners

| Method | Endpoint           | Description     |
| ------ | ------------------ | --------------- |
| GET    | `/api/banners`     | Banner aktif    |
| GET    | `/api/banners/all` | Semua banner    |
| POST   | `/api/banners`     | Buat banner     |
| PATCH  | `/api/banners/:id` | Update banner   |
| DELETE | `/api/banners/:id` | Hapus banner    |

### Notifications

| Method | Endpoint                          | Description                   |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/api/notifications`              | List notifikasi               |
| GET    | `/api/notifications/unread-count` | Jumlah notifikasi belum dibaca|
| PATCH  | `/api/notifications/:id/read`     | Tandai notifikasi dibaca      |

### Legal & Settings

| Method | Endpoint          | Description         |
| ------ | ----------------- | ------------------- |
| GET    | `/api/legal`      | List halaman legal  |
| GET    | `/api/legal/:key` | Get halaman legal   |
| PATCH  | `/api/legal/:key` | Update halaman legal|
| GET    | `/api/settings`   | Get settings        |
| PATCH  | `/api/settings`   | Update settings     |

### Media Upload

| Method | Endpoint      | Description                     |
| ------ | ------------- | ------------------------------- |
| POST   | `/api/upload` | Upload media ke Cloudflare R2   |

### Favorites (Wishlist)

| Method | Endpoint                                      | Description              |
| ------ | --------------------------------------------- | ------------------------ |
| GET    | `/api/customer/favorites`                     | Get wishlist             |
| POST   | `/api/customer/favorites`                     | Tambah item wishlist     |
| DELETE | `/api/customer/favorites/:id`                 | Hapus item wishlist      |
| DELETE | `/api/customer/favorites/product/:product_id` | Hapus berdasarkan produk |
| GET    | `/api/customer/favorites/folders`             | List folder favorit      |

---

## Features

### Multi Address Support

Customer dapat menyimpan beberapa alamat pengiriman.

- Multiple alamat per customer
- Dukungan alamat default
- Koordinat GPS
- Label alamat (`Rumah`, `Kantor`, dll.)
- Dukungan Provinsi / Kota / Kecamatan
- Dukungan kode pos

### GPS Coordinates Support

Alamat mendukung latitude dan longitude untuk:

- Tracking pengiriman
- Integrasi peta
- Perhitungan jarak
- Estimasi ongkos kirim
- Integrasi kurir

```json
{
  "lat": -6.914744,
  "lng": 107.609810
}
```

---

## Technology Stack

| Teknologi        | Deskripsi                 |
| ---------------- | ------------------------- |
| Rust             | Bahasa pemrograman utama  |
| Axum             | Web framework             |
| SQLx             | Async SQL toolkit         |
| PostgreSQL       | Database                  |
| Cloudflare R2    | Object storage            |
| AWS SDK for Rust | Integrasi R2              |
| Serde            | JSON serialization        |
| Chrono           | Date & time               |
| Tower HTTP       | Middleware                |
| Bcrypt           | Password hashing          |
| JWT              | Authentication            |

---

## Architecture Notes

- UUID primary key dari PostgreSQL
- SQLx compile-time checked queries
- Automatic migrations saat startup
- SSH Tunnel support
- Arsitektur multi-alamat untuk customer
- Transaction-safe order creation
- Media upload ke Cloudflare R2
- JWT authentication