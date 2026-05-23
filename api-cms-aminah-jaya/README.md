# API CMS Aminah Jaya

Backend API untuk **CMS admin** dan **storefront** Aminah Jaya, dibangun dengan **Rust**, **Axum**, dan **SQLx**.

Menyediakan autentikasi, katalog produk, keranjang, checkout, kupon, pengiriman (Biteship), media upload (Cloudflare R2), dan manajemen order.

---

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Docker](https://docs.docker.com/get-docker/)
- [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli) (opsional, untuk migrasi manual)

---

## Setup

### 1. Start Database

```bash
docker-compose up -d
```

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
| `BITESHIP_API_KEY` | Untuk ongkir | API key Biteship |
| `BITESHIP_ORIGIN_LAT`, `BITESHIP_ORIGIN_LNG` | Untuk ongkir | Koordinat gudang/asal kirim |
| `BITESHIP_ORIGIN_ADDRESS` | Untuk ongkir | Alamat lengkap asal |
| `BITESHIP_ORIGIN_POSTAL_CODE` | Disarankan | Kode pos asal |
| `BITESHIP_ORIGIN_CONTACT_NAME`, `BITESHIP_ORIGIN_CONTACT_PHONE` | Disarankan | Kontak pengirim |
| `BITESHIP_ORIGIN_AREA_ID` | Opsional | Area ID Biteship untuk asal |
| `BITESHIP_DEFAULT_COURIERS` | Disarankan | Daftar kurir untuk Rates API (koma), mis. `jne,sicepat,grab` |
| `SHIPPING_RATE_CACHE_TTL_HOURS` | Tidak | TTL cache ongkir di PostgreSQL (default `6`) |

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

Semua endpoint mengembalikan JSON dengan bentuk umum:

```json
{
  "success": true,
  "data": { },
  "message": null,
  "meta": null
}
```

Endpoint yang membutuhkan autentikasi customer/admin: header `Authorization: Bearer <token>`.

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
| POST   | `/api/customer/orders`           | Buat order dari cart (+ Biteship) |
| GET    | `/api/customer/orders/:id/tracking` | Lacak pengiriman (Biteship) |

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
  "destination_contact_name": "Fikri",
  "destination_contact_phone": "08123456789"
}
```

`payment_method`: `cod`, `transfer`, `qris`, `other`.

Jika `BITESHIP_API_KEY` aktif, `courier_company` dan `courier_type` wajib (dari hasil `/api/shipping/rates`). Order lokal dan shipment Biteship dibuat dalam satu transaksi.

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

### Shipping / Biteship

Proxy ke [Biteship API](https://biteship.com/id/docs). API key hanya di server; storefront memanggil endpoint ini (bukan langsung ke Biteship).

| Method | Endpoint                                   | Auth     | Description                    |
| ------ | ------------------------------------------ | -------- | ------------------------------ |
| GET    | `/api/shipping/couriers`                   | Tidak    | Daftar kurir Biteship          |
| GET    | `/api/shipping/maps/areas?input=`          | Tidak    | Pencarian area (maps)          |
| POST   | `/api/shipping/rates`                      | Customer | Hitung ongkir dari cart (cache)|
| POST   | `/api/shipping/draft-orders`               | Customer | Buat draft order Biteship      |
| GET    | `/api/shipping/draft-orders/:id/rates`     | Customer | Tarif untuk draft order        |
| POST   | `/api/shipping/draft-orders/:id/confirm`   | Customer | Konfirmasi draft → order       |

#### `POST /api/shipping/rates`

**Request** — lokasi tujuan (salah satu mode cukup; backend memilih mode Biteship yang valid):

```json
{
  "destination_lat": -6.914744,
  "destination_lng": 107.609810,
  "destination_postal_code": "40132",
  "destination_city": "Bandung",
  "destination_province": "Jawa Barat",
  "destination_area_id": null,
  "couriers": "jne,sicepat,grab"
}
```

| Field | Wajib | Keterangan |
| ----- | ----- | ---------- |
| `destination_lat` / `destination_lng` | Salah satu kombinasi | Mode koordinat (atau mix dengan kode pos asal) |
| `destination_postal_code` | | Mode kode pos / mix |
| `destination_area_id` | | Mode area ID (jika `BITESHIP_ORIGIN_AREA_ID` juga diset) |
| `destination_city`, `destination_province` | Disarankan | Memperjelas kunci cache untuk rute yang sama |
| `couriers` | Tidak | Override daftar kurir; default dari `BITESHIP_DEFAULT_COURIERS` |

**Berat** tidak dikirim di body. Server membaca **keranjang customer yang login**:

1. Total gram = Σ (`products.weight_gram` × qty); jika berat produk kosong → **500 g**/unit  
2. Dibulatkan ke **bucket kg** (ceil, min. 1 kg), mis. 1.200 g → **2 kg**  
3. Request ke Biteship memakai **satu item sintetis** dengan berat bucket tersebut (agar cache bisa dipakai ulang lintas customer)

**Response:**

```json
{
  "success": true,
  "data": {
    "rates": [
      {
        "id": "jne_reg",
        "courier_company": "jne",
        "courier_type": "reg",
        "name": "JNE Reguler",
        "description": "",
        "price": 18000,
        "duration": "2 - 3 days",
        "shipment_duration_range": "2 - 3",
        "shipment_duration_unit": "days",
        "speed_group": "reguler",
        "courier_logo": "https://assets.biteship.com/icons/courier-jne.png",
        "available_for_cash_on_delivery": false
      }
    ],
    "cached": false,
    "cache_key": "postal:64182|postal:40132|bandung|jawa barat|2kg|jne,sicepat,...",
    "weight_kg": 2
  }
}
```

| Field respons | Keterangan |
| ------------- | ---------- |
| `rates` | Daftar layanan kurir + harga (dinormalisasi dari `pricing` Biteship) |
| `cached` | `true` = dari PostgreSQL, **tanpa** hit Biteship |
| `weight_kg` | Bucket berat yang dipakai untuk perhitungan |
| `cache_key` | Kunci cache (debug/opsional) |
| `speed_group` | `next_day` (estimasi ≤ 1 hari / ≤ 24 jam) atau `reguler` — untuk UI checkout |
| `courier_logo` | URL logo dari Biteship atau fallback CDN |

#### Cache ongkir (PostgreSQL)

Tabel `shipping_rate_cache` (migration `20260524000000_add_shipping_rate_cache.sql`):

- **Kunci:** `{asal}|{tujuan}|{weight_kg}kg|{couriers}`  
- **TTL:** `SHIPPING_RATE_CACHE_TTL_HOURS` (default 6 jam)  
- **Cache hit** → respons sama untuk customer lain dengan rute + berat bucket sama → biaya API Biteship Rp0  

Storefront menambah debounce alamat dan cache `sessionStorage` per kunci serupa; backend cache tetap sumber utama lintas user.

#### Mode Rates API (otomatis di `biteship.rs`)

Backend memilih **satu** mode per request (tidak mencampur field asal/tujuan):

1. **Area ID** — `origin_area_id` + `destination_area_id`  
2. **Koordinat** — lat/lng asal & tujuan  
3. **Kode pos** — `origin_postal_code` + `destination_postal_code`  
4. **Mix** — koordinat asal + `destination_postal_code`  

Field `couriers` **wajib** ada di body ke Biteship (dari env atau payload).

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
- Integrasi Biteship: rates → pilih kurir → buat shipment
- Pelacakan via `GET /api/customer/orders/:id/tracking`

### Biteship integration

Modul: `src/biteship.rs`, routes: `src/routes/shipping.rs`.

- Rates (`POST /v1/rates/couriers`), couriers, maps/areas, draft order, confirm, tracking
- Origin dari env (`BITESHIP_ORIGIN_*`); daftar kurir default `BITESHIP_DEFAULT_COURIERS`
- Normalisasi `pricing` → `rates` dengan `speed_group`, `courier_logo`, durasi pengiriman
- Cache ongkir di PostgreSQL (`shipping_rate_cache`) + bucket berat per kg
- `POST /api/customer/orders` membuat order Biteship setelah order lokal (jika API key aktif)
- API key tidak diekspos ke browser storefront

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
| Reqwest          | HTTP client (Biteship)        |
| Cloudflare R2    | Object storage (S3-compatible)|
| AWS SDK for Rust | Upload ke R2                  |
| Serde / JSON     | Serialisasi API               |
| Chrono           | Tanggal & waktu               |
| Tower HTTP       | CORS, tracing, middleware     |
| Bcrypt           | Hash password                 |
| JWT              | Auth admin & customer         |
| Biteship         | Ongkir & fulfillment        |

---

## Architecture notes

- UUID primary keys (`uuid_generate_v4`)
- SQLx migrations otomatis saat startup
- SSH tunnel opsional untuk DB remote
- Multi-alamat customer (`customer_addresses`)
- Order creation transaction-safe (cart → order → items → clear cart → Biteship)
- Kolom order untuk kupon (`coupon_id`, `coupon_code`, `discount_amount`)
- Kolom order untuk Biteship (`biteship_order_id`, `biteship_tracking_id`, `courier_company`, `courier_service`, dll.)
- Tabel `shipping_rate_cache` untuk cache tarif ongkir Biteship
- Perhitungan ongkir berdasarkan `weight_gram` produk di cart (default 500 g)
- Media upload multipart ke R2 dengan URL publik
- JWT terpisah untuk admin CMS dan customer storefront

---

## Related projects

| Project                    | Peran                          |
| -------------------------- | ------------------------------ |
| `cms-aminah-jaya`          | Admin dashboard (CMS UI)       |
| `storefront-aminah-jaya`   | Toko online customer-facing    |

Storefront memanggil API ini via `VITE_API_BASE` (mis. `http://localhost:8001/api`).
