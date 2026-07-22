# API CMS Aminah Jaya

Backend API untuk **CMS admin** dan **storefront** Aminah Jaya, dibangun dengan **Rust**, **Axum**, dan **SQLx**.

Menyediakan autentikasi, katalog produk, keranjang, checkout, kupon, media upload (Cloudflare R2), dan manajemen order.

> **Catatan integrasi:** semua panggilan ke pihak ketiga (Biteship, Duitku, WhatsApp) sekarang berada di [`api-integrasi-aminah-jaya`](../api-integrasi-aminah-jaya). Service ini hanya memanggilnya server-to-server lewat `INTEGRASI_API_URL` (modul `src/integrasi.rs`) dan menerima webhook status pembayaran.

---

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Docker](https://docs.docker.com/get-docker/)
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli) (opsional, untuk migrasi manual)

---

## Setup

### 1. Siapkan PostgreSQL

Service ini tidak menyertakan container database — `docker-compose.yml` hanya mendefinisikan container aplikasi untuk deployment. Gunakan PostgreSQL lokal, atau DB di VPS lewat SSH tunnel (lihat `USE_SSH_TUNNEL` di bawah).

### 2. Configuration

Salin salah satu file contoh:

```bash
cp .env.example.local .env
# atau
cp .env.example.production .env
```

Isi semua environment variable yang dibutuhkan.

#### Environment variables

| Variable | Wajib | Deskripsi |
| -------- | ----- | --------- |
| `DATABASE_URL` | Ya | Connection string PostgreSQL |
| `JWT_SECRET` | Ya | Secret untuk token JWT |
| `PORT` | Tidak | Port HTTP (default `8080`) |
| `RUST_LOG` | Tidak | Level log (mis. `info`, `debug`) |
| `USE_SSH_TUNNEL` | Tidak | `true` jika DB hanya bisa diakses via SSH |
| `SSH_HOST`, `SSH_USER`, `SSH_KEY_PATH` | Jika tunnel | Konfigurasi SSH tunnel |
| `DB_REMOTE_HOST`, `DB_REMOTE_PORT`, `DB_LOCAL_PORT` | Jika tunnel | Target DB remote & port lokal |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` | Ya | Cloudflare R2 |
| `R2_BUCKET`, `R2_PUBLIC_URL` | Ya | Bucket & URL publik CDN |
| `INTEGRASI_API_URL` | Untuk ongkir | Base URL api-integrasi, mis. `http://127.0.0.1:8002` atau `http://api-integrasi-aminah-jaya:8002`. Tanpa ini, order tetap tersimpan tetapi shipment Biteship & tracking tidak jalan |
| `WEBHOOK_SECRET` | Disarankan | Bearer token yang wajib dikirim api-integrasi saat memanggil `POST /api/webhook/duitku`. Harus sama dengan nilai di api-integrasi. Jika kosong, validasi webhook dilewati |

Variabel `BITESHIP_*` **tidak lagi dibaca** oleh service ini — pindah ke api-integrasi.

Jika database berada di private network/VPS:

```env
USE_SSH_TUNNEL=true
```

Aplikasi akan otomatis membuat SSH tunnel saat startup.

### 3. Run Application

```bash
cargo run
```

Saat startup, aplikasi secara otomatis akan:

- Membuka SSH tunnel (jika diaktifkan)
- Menghubungkan ke PostgreSQL
- Menjalankan pending SQLx migrations
- Menjalankan Axum HTTP server

---

## Database Migrations

Migrations dikelola menggunakan SQLx di folder `migrations/`.

### Automatic migrations (recommended)

Migrations berjalan otomatis saat `cargo run`. Tidak perlu tindakan manual.

### Manual migrations (CLI)

**Install SQLx CLI:**

```bash
cargo install sqlx-cli --no-default-features --features postgres
```

**Buat migration baru:**

```bash
sqlx migrate add nama_migration
```

**Jalankan migrations:**

```bash
sqlx migrate run
```

**Cek status:**

```bash
sqlx migrate info
```

### SSH tunnel untuk remote database

```bash
ssh -L 5433:127.0.0.1:5432 <ssh_user>@<ssh_host> -i <key_path> -N
DATABASE_URL="postgres://user:pass@localhost:5433/db" sqlx migrate run
```

---

## Response format

Semua endpoint mengembalikan JSON dengan bentuk umum (`ApiResponse<T>` di `src/models/mod.rs`):

```json
{
  "success": true,
  "message": "OK",
  "data": { },
  "meta": {},
  "errors": null
}
```

Saat gagal: `success: false`, `message` berisi penjelasan, `data` bernilai `null`, dan `errors` opsional.

Endpoint berpaginasi mengisi `meta`:

```json
"meta": { "current_page": 1, "total_pages": 12, "total_items": 118, "items_per_page": 10 }
```

Query pagination: `?page=1&limit=10` (default `page=1`, `limit=10`).

Endpoint yang membutuhkan autentikasi customer/admin: header `Authorization: Bearer <token>`. Tidak ada middleware auth global — setiap handler memvalidasi token sendiri (`src/auth.rs`, JWT HS256, masa berlaku 24 jam).

---

## API Endpoints

### Auth — Admin

| Method | Endpoint          | Description                       |
| ------ | ----------------- | --------------------------------- |
| POST   | `/api/auth/login` | Login admin, terima JWT           |
| GET    | `/api/auth/me`    | Profil admin yang sedang login    |

### Auth — Customer

| Method | Endpoint                         | Description                    |
| ------ | -------------------------------- | ------------------------------ |
| POST   | `/api/customer/register`         | Register akun customer         |
| POST   | `/api/customer/login`            | Login customer                 |
| POST   | `/api/customer/auth/google`      | Login/register via Google      |
| GET    | `/api/customer/me`               | Profil customer                |
| PATCH  | `/api/customer/profile`          | Update profil                  |
| GET    | `/api/customer/orders`           | Riwayat order customer         |
| POST   | `/api/customer/orders`           | Buat order dari cart (+ shipment Biteship) |
| GET    | `/api/customer/orders/number/:order_number` | Detail order by nomor order |
| GET    | `/api/customer/orders/:id/tracking` | Lacak pengiriman (proxy ke api-integrasi) |

**Contoh `POST /api/customer/orders`:**

```json
{
  "shipping_address": "Fikri | 08123456789 | Jl. Sudirman No. 1",
  "shipping_city": "Bandung",
  "shipping_province": "Jawa Barat",
  "shipping_cost": 18000,
  "payment_method": "transfer",
  "notes": "Tolong hubungi sebelum kirim",
  "coupon_code": "PROMO10",
  "courier_company": "jne",
  "courier_type": "reg",
  "destination_lat": -6.914744,
  "destination_lng": 107.609810,
  "destination_postal_code": "40132",
  "destination_area_id": null,
  "destination_contact_name": "Fikri",
  "destination_contact_phone": "08123456789",
  "biteship_draft_order_id": null
}
```

`payment_method`: `cod`, `transfer`, `qris`, `other`.

Jika `INTEGRASI_API_URL` diset, `courier_company` dan `courier_type` **wajib** (nilainya dari `POST /api/shipping/rates` di api-integrasi). Order lokal dibuat dalam satu transaksi database; setelahnya shipment Biteship dibuat lewat api-integrasi — jika `biteship_draft_order_id` dikirim, draft tersebut dikonfirmasi, kalau tidak dibuat order baru. Hasilnya disimpan di kolom `biteship_order_id`, `biteship_tracking_id`, dan `tracking_number`.

### Customer addresses

Alamat disimpan di tabel `customer_addresses` (multi-alamat per customer).

| Method | Endpoint                              | Description           |
| ------ | ------------------------------------- | --------------------- |
| GET    | `/api/customer/addresses`             | List alamat           |
| POST   | `/api/customer/addresses`             | Tambah alamat         |
| PATCH  | `/api/customer/addresses/:id`         | Update alamat         |
| DELETE | `/api/customer/addresses/:id`         | Hapus alamat          |
| PATCH  | `/api/customer/addresses/:id/default` | Set alamat default    |

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

### Customer coupons (storefront)

Voucher yang bisa dipakai customer di checkout (belum pernah dipakai, masih aktif).

| Method | Endpoint                                  | Description                          |
| ------ | ----------------------------------------- | ------------------------------------ |
| GET    | `/api/customer/coupons`                   | List voucher tersedia                |
| GET    | `/api/customer/coupons/validate/:code`    | Validasi voucher + estimasi diskon   |

Query opsional untuk keduanya: `subtotal`, `shipping_cost`.

### Shipping & payment (pindah ke api-integrasi)

Endpoint `/api/shipping/*` (couriers, maps/areas, rates, draft order) dan `/payments/duitku*` **tidak ada di service ini** — semuanya dilayani oleh [`api-integrasi-aminah-jaya`](../api-integrasi-aminah-jaya) dan dipanggil langsung oleh storefront lewat `VITE_INTEGRASI_API_BASE`.

Yang tersisa di api-cms:

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/customer/orders/:id/tracking` | Customer | Ambil `biteship_tracking_id`/`biteship_order_id` order lalu proxy ke api-integrasi (`GET /api/shipping/tracking/:id`, fallback `GET /api/shipping/orders/:id`). Jika belum ada data tracking, mengembalikan status `pending` |
| POST | `/api/webhook/duitku` | Bearer `WEBHOOK_SECRET` | Dipanggil api-integrasi setelah callback Duitku terverifikasi; set `payment_status = 'paid'` dan `status = 'processing'` untuk `order_number` terkait |

**Body `POST /api/webhook/duitku`:**

```json
{ "order_number": "ORD-20260525-001", "amount": "150000" }
```

Header wajib: `Authorization: Bearer ${WEBHOOK_SECRET}` (dilewati jika `WEBHOOK_SECRET` kosong). Balasan `404` jika `order_number` tidak ditemukan.

> Tabel `shipping_rate_cache` (migration `20260524000000`) adalah sisa dari implementasi cache ongkir lama di api-cms dan saat ini **tidak dibaca kode manapun**.

### Cart (customer)

| Method | Endpoint        | Description                |
| ------ | --------------- | -------------------------- |
| GET    | `/api/cart`     | Isi keranjang (+ berat)    |
| POST   | `/api/cart`     | Tambah item                |
| PATCH  | `/api/cart/:id` | Update quantity            |
| DELETE | `/api/cart/:id` | Hapus item                 |
| DELETE | `/api/cart`     | Kosongkan keranjang        |

### Favorites (wishlist)

| Method | Endpoint                                      | Description              |
| ------ | --------------------------------------------- | ------------------------ |
| GET    | `/api/customer/favorites`                     | List favorit             |
| POST   | `/api/customer/favorites`                     | Tambah favorit           |
| DELETE | `/api/customer/favorites/:id`                 | Hapus by ID favorit      |
| DELETE | `/api/customer/favorites/product/:product_id` | Hapus by produk          |
| GET    | `/api/customer/favorites/folders`             | List nama folder         |

### Dashboard (admin)

| Method | Endpoint                       | Description        |
| ------ | ------------------------------ | ------------------ |
| GET    | `/api/dashboard/stats`         | Statistik          |
| GET    | `/api/dashboard/performance`   | Analitik           |
| GET    | `/api/dashboard/recent-orders` | Order terbaru    |

### Products

| Method | Endpoint                   | Description           |
| ------ | -------------------------- | ----------------------- |
| GET    | `/api/products`            | List produk             |
| POST   | `/api/products`            | Buat produk             |
| GET    | `/api/products/:id`        | Detail produk           |
| GET    | `/api/products/slug/:slug` | Detail by slug          |
| PATCH  | `/api/products/:id`        | Update produk           |
| DELETE | `/api/products/:id`        | Soft delete             |

Produk memiliki field `weight_gram` untuk perhitungan ongkir Biteship.

### Categories

| Method | Endpoint              | Description    |
| ------ | --------------------- | -------------- |
| GET    | `/api/categories`     | List kategori  |
| POST   | `/api/categories`     | Buat kategori  |
| PATCH  | `/api/categories/:id` | Update         |
| DELETE | `/api/categories/:id` | Hapus          |
| GET    | `/api/categories/slug/:slug/products` | Produk dalam kategori |

### Collections

| Method | Endpoint               | Description   |
| ------ | ---------------------- | ------------- |
| GET    | `/api/collections`     | List          |
| POST   | `/api/collections`     | Buat          |
| GET    | `/api/collections/:id` | Detail        |
| PATCH  | `/api/collections/:id` | Update        |
| DELETE | `/api/collections/:id` | Hapus         |

### Flash sales

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/flash-sales`        | List (CMS)           |
| POST   | `/api/flash-sales`        | Buat event           |
| GET    | `/api/flash-sales/active` | Event aktif (public) |
| GET    | `/api/flash-sales/:id`    | Detail + items       |
| DELETE | `/api/flash-sales/:id`    | Hapus                |

### Blogs

| Method | Endpoint            | Description  |
| ------ | ------------------- | ------------ |
| GET    | `/api/blogs`        | List         |
| GET    | `/api/blogs/latest` | Terbaru      |
| POST   | `/api/blogs`        | Buat         |
| GET    | `/api/blogs/:id`    | Detail       |
| DELETE | `/api/blogs/:id`    | Hapus        |

### Orders (admin CMS)

| Method | Endpoint                 | Description      |
| ------ | ------------------------ | ---------------- |
| GET    | `/api/orders`            | List semua order |
| GET    | `/api/orders/:id`        | Detail           |
| PATCH  | `/api/orders/:id/status` | Update status    |

Order menyimpan metadata Biteship: `biteship_order_id`, `biteship_tracking_id`, `courier_company`, `courier_service`, `tracking_number`, koordinat tujuan, dll.

### Customers (CMS)

| Method | Endpoint               | Description        |
| ------ | ---------------------- | ------------------ |
| GET    | `/api/customers`       | List               |
| GET    | `/api/customers/stats` | Statistik          |
| GET    | `/api/customers/:id`   | Detail             |

### Coupons (CMS)

| Method | Endpoint                      | Description              |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/api/coupons`                | List (paginated)         |
| POST   | `/api/coupons`                | Buat kupon               |
| GET    | `/api/coupons/validate/:code` | Validasi (admin/public)  |
| GET    | `/api/coupons/:id`            | Detail                   |
| PATCH  | `/api/coupons/:id`            | Update                   |
| DELETE | `/api/coupons/:id`            | Hapus                    |

Kupon dipakai saat checkout lewat `coupon_code` di `POST /api/customer/orders`.

### Banners

| Method | Endpoint           | Description    |
| ------ | ------------------ | -------------- |
| GET    | `/api/banners`     | Banner aktif   |
| GET    | `/api/banners/all` | Semua banner   |
| POST   | `/api/banners`     | Buat           |
| PATCH  | `/api/banners/:id` | Update         |
| DELETE | `/api/banners/:id` | Hapus          |

### Notifications

| Method | Endpoint                          | Description           |
| ------ | --------------------------------- | --------------------- |
| GET    | `/api/notifications`              | List                  |
| GET    | `/api/notifications/unread-count` | Jumlah belum dibaca   |
| PATCH  | `/api/notifications/:id/read`     | Tandai dibaca         |

### Legal & settings

| Method | Endpoint          | Description        |
| ------ | ----------------- | ------------------ |
| GET    | `/api/legal`      | List halaman legal |
| GET    | `/api/legal/:key` | Detail by key      |
| PATCH  | `/api/legal/:key` | Update             |
| GET    | `/api/settings`   | Settings toko      |
| PATCH  | `/api/settings`   | Update settings    |

### Media upload

| Method | Endpoint      | Description              |
| ------ | ------------- | ------------------------ |
| POST   | `/api/upload` | Upload file ke R2 (admin)|

---

## Features

### Multi-address support

- Beberapa alamat per customer, satu alamat default
- Label, provinsi/kota/kecamatan, kode pos
- Koordinat GPS (`lat`, `lng`) untuk peta dan ongkir

### Checkout & orders

- Order dari cart dalam transaksi database
- Kupon diskon (persentase/fixed, min. belanja, batas pemakaian)
- Ongkir & shipment Biteship lewat api-integrasi (rates di storefront → pilih kurir → shipment saat checkout)
- Pelacakan via `GET /api/customer/orders/:id/tracking`
- Status pembayaran diperbarui via `POST /api/webhook/duitku`

### Klien api-integrasi

Modul: `src/integrasi.rs` (`IntegrasiClient`), dipakai oleh `src/routes/customer_auth.rs` dan `src/routes/shipping.rs`.

- `IntegrasiClient::from_env()` membaca `INTEGRASI_API_URL`; `is_configured()` dipakai untuk mengecek apakah alur Biteship aktif
- Memanggil `POST /api/shipping/orders`, `POST /api/shipping/draft-orders/:id/confirm`, `GET /api/shipping/orders/:id`, `GET /api/shipping/tracking/:id`
- Kegagalan panggilan tidak membatalkan order lokal — hanya dicatat sebagai warning
- API key Biteship/Duitku tidak pernah ada di service ini maupun di browser

### Flash sale

Event terbatas waktu dengan item, harga promo, `stock_limit`, dan `sold_count`.

---

## Technology stack

| Teknologi        | Penggunaan                    |
| ---------------- | ----------------------------- |
| Rust             | Runtime & bahasa utama        |
| Axum             | HTTP router & handlers        |
| SQLx             | Async PostgreSQL              |
| PostgreSQL       | Database relasional           |
| Reqwest          | HTTP client ke api-integrasi  |
| Cloudflare R2    | Object storage (S3-compatible)|
| AWS SDK for Rust | Upload ke R2                  |
| Serde / JSON     | Serialisasi API               |
| Chrono           | Tanggal & waktu               |
| Tower HTTP       | CORS, tracing, middleware     |
| Bcrypt           | Hash password                 |
| JWT              | Auth admin & customer         |
| Rust Decimal     | Kolom NUMERIC (harga)         |

---

## Architecture notes

- UUID primary keys (`uuid_generate_v4`)
- SQLx migrations otomatis saat startup
- SSH tunnel opsional untuk DB remote
- Multi-alamat customer (`customer_addresses`)
- Order creation transaction-safe (cart → order → items → clear cart), shipment Biteship dibuat setelah commit lewat api-integrasi
- Kolom order untuk kupon (`coupon_id`, `coupon_code`, `discount_amount`)
- Kolom order untuk Biteship (`biteship_order_id`, `biteship_tracking_id`, `courier_company`, `courier_service`, dll.)
- Tabel `shipping_rate_cache` tersisa dari implementasi lama dan tidak lagi digunakan
- Berat produk (`weight_gram`) dikirim ke api-integrasi untuk perhitungan ongkir (default 500 g/unit)
- Query SQLx runtime-checked (`query_as`, `query_scalar`) — tidak butuh `DATABASE_URL` saat kompilasi dan tidak perlu `cargo sqlx prepare`
- Media upload multipart ke R2 dengan URL publik
- JWT terpisah untuk admin CMS dan customer storefront

---

## Related projects

| Project                    | Peran                          |
| -------------------------- | ------------------------------ |
| `cms-aminah-jaya`          | Admin dashboard (CMS UI)       |
| `storefront-aminah-jaya`   | Toko online customer-facing    |
| `api-integrasi-aminah-jaya`| Gateway Duitku, Biteship, WhatsApp |

Storefront memanggil API ini via `VITE_API_BASE` (mis. `http://localhost:8001/api`) dan `VITE_API_URL` (base tanpa `/api`, dipakai beberapa komponen lama).
