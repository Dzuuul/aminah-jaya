# API Integrasi Aminah Jaya

Backend layanan **integrasi pihak ketiga** untuk ekosistem Aminah Jaya, dibangun dengan **Rust** dan **Axum**.

Menangani proxy **Biteship** (ongkir & fulfillment), **Duitku** (payment gateway v2), dan **Meta WhatsApp Cloud API** (webhook & chatbot). Tidak memiliki database sendiri — state bisnis (cart, order) tetap di `api-cms-aminah-jaya`.

---

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- Akun & API key: [Biteship](https://biteship.com/id/docs), [Duitku](https://docs.duitku.com/), [Meta for Developers](https://developers.facebook.com/) (WhatsApp)

---

## Setup

### 1. Configuration

Buat file `.env` di root project (salin dari contoh di bawah atau dari `.env` tim):

```bash
cp .env .env.backup   # opsional
# edit .env
```

#### Environment variables

| Variable | Wajib | Deskripsi |
| -------- | ----- | --------- |
| `PORT` | Tidak | Port HTTP (default `3000`, produksi umumnya `8002`) |
| `RUST_LOG` | Tidak | Level log (mis. `info`, `debug`) |
| `ALLOWED_ORIGINS` | Disarankan | Daftar origin CORS yang diizinkan, dipisah koma (mis. `https://aminahjaya.com,https://www.aminahjaya.com`). Default: `https://aminahjaya.com,https://www.aminahjaya.com` |
| **WhatsApp** | | |
| `VERIFY_TOKEN` | Ya | Token verifikasi webhook Meta (harus sama dengan yang didaftarkan di Meta App) |
| `WHATSAPP_TOKEN` | Ya | Access token WhatsApp Cloud API |
| `PHONE_NUMBER_ID` | Ya | ID nomor WhatsApp Business |
| **Duitku** | | |
| `DUITKU_MERCHANT_CODE` | Ya | Kode merchant Duitku |
| `DUITKU_API_KEY` | Ya | API key / merchant key Duitku (digunakan sebagai kunci HMAC-SHA256) |
| `DUITKU_BASE_URL` | Tidak | Base URL API (default sandbox `https://sandbox.duitku.com/webapi`) |
| `DUITKU_CALLBACK_URL` | Ya | URL publik callback, mis. `https://integrasi.example.com/payments/duitku/callback` |
| **Biteship** | | |
| `BITESHIP_API_KEY` | Ya | API key Biteship |
| `BITESHIP_ORIGIN_LAT`, `BITESHIP_ORIGIN_LNG` | Ya | Koordinat gudang/asal kirim |
| `BITESHIP_ORIGIN_ADDRESS` | Ya | Alamat lengkap asal |
| `BITESHIP_ORIGIN_POSTAL_CODE` | Disarankan | Kode pos asal |
| `BITESHIP_ORIGIN_CONTACT_NAME`, `BITESHIP_ORIGIN_CONTACT_PHONE` | Disarankan | Kontak pengirim |
| `BITESHIP_ORIGIN_AREA_ID` | Opsional | Area ID Biteship untuk asal (mode Rates by Area Id) |
| `BITESHIP_DEFAULT_COURIERS` | Disarankan | Daftar kurir untuk Rates API (koma), mis. `jne,sicepat,grab` |

### 2. Run Application

```bash
cargo run
```

Server listen di `0.0.0.0:{PORT}`.

**Build release:**

```bash
cargo build --release
./target/release/api-integrasi-aminah-jaya
```

---

## Response Format

### Endpoint Biteship & WhatsApp (di bawah `/api/...` dan `/webhook`)

JSON dengan bentuk umum (sama dengan api-cms):

```json
{
  "success": true,
  "message": "OK",
  "data": { },
  "meta": null,
  "errors": null
}
```

Jika gagal, `success: false` dan `message` berisi penjelasan error.

### Endpoint Duitku

| Endpoint | Format respons |
| -------- | -------------- |
| `POST /payments/duitku` | JSON langsung objek Duitku (`statusCode`, `vaNumber`, `qrString`, dll.) — **bukan** wrapper `success/data` |
| `POST /payments/duitku/callback` | Plain text `OK` + HTTP `200` (wajib untuk Duitku agar tidak retry) |

---

## API Endpoints

Base URL contoh lokal: `http://localhost:8002`

| Prefix | Modul |
| ------ | ----- |
| `/api/shipping/*` | Biteship (storefront & internal) |
| `/payments/duitku*` | Duitku |
| `/webhook` | Meta WhatsApp |

CORS diaktifkan untuk origin yang dikonfigurasi di `ALLOWED_ORIGINS`.

---

### Shipping / Biteship

Proxy ke [Biteship API](https://biteship.com/id/docs). API key hanya di server integrasi; **storefront** memanggil service ini via `VITE_INTEGRASI_API_BASE`, bukan langsung ke Biteship.

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/shipping/couriers` | Tidak | Daftar kurir Biteship |
| GET | `/api/shipping/maps/areas?input=` | Tidak | Pencarian area (min. 3 karakter) |
| POST | `/api/shipping/rates` | Tidak | Hitung ongkir dari `cart_items` |
| POST | `/api/shipping/draft-orders` | Tidak | Buat draft order Biteship |
| GET | `/api/shipping/draft-orders/:id/rates` | Tidak | Tarif untuk draft order |
| POST | `/api/shipping/draft-orders/:id/confirm` | Tidak | Konfirmasi draft → order aktif |
| POST | `/api/shipping/orders` | Internal | Buat order Biteship (dipanggil api-cms) |
| GET | `/api/shipping/orders/:id` | Internal | Detail order Biteship |
| GET | `/api/shipping/tracking/:id` | Internal | Lacak by tracking ID |

#### `POST /api/shipping/rates`

**Request** — lokasi tujuan + item keranjang:

```json
{
  "destination_lat": -7.7702,
  "destination_lng": 112.0262,
  "destination_postal_code": "64182",
  "destination_city": "Kediri",
  "destination_province": "Jawa Timur",
  "destination_area_id": null,
  "couriers": "jne,sicepat,grab",
  "cart_items": [
    {
      "quantity": 2,
      "product_weight_gram": 500,
      "product_price": 75000,
      "product_name": "Hijab Premium"
    }
  ]
}
```

| Field | Wajib | Keterangan |
| ----- | ----- | ---------- |
| `destination_lat` / `destination_lng` | Salah satu kombinasi | Mode koordinat |
| `destination_postal_code` | | Mode kode pos / mix |
| `destination_area_id` | | Mode area ID (jika `BITESHIP_ORIGIN_AREA_ID` juga diset) |
| `destination_city`, `destination_province` | Disarankan | Untuk kunci cache di client |
| `couriers` | Tidak | Override daftar kurir; default `BITESHIP_DEFAULT_COURIERS` |
| `cart_items` | **Ya** | Array item; berat dihitung di server. Tidak boleh kosong |

**Perhitungan berat:**

1. Total gram = Σ (`product_weight_gram` × `quantity`); jika berat kosong → **500 g**/unit  
2. Dibulatkan ke **bucket kg** (ceil, min. 1 kg)  
3. Request ke Biteship memakai **satu item sintetis** dengan berat bucket tersebut  

**Response:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "rates": [
      {
        "id": "jne_reg",
        "courier_company": "jne",
        "courier_type": "reg",
        "name": "JNE Reguler",
        "price": 18000,
        "duration": "2 - 3 days",
        "shipment_duration_range": "2 - 3",
        "shipment_duration_unit": "days",
        "speed_group": "reguler",
        "courier_logo": "https://assets.biteship.com/icons/courier-jne.png"
      }
    ],
    "cached": false,
    "cache_key": "coord:-7.770,112.026|coord:-6.914,107.610|2kg|jne,sicepat,...",
    "weight_kg": 2
  },
  "meta": null,
  "errors": null
}
```

| Field respons | Keterangan |
| ------------- | ---------- |
| `rates` | Layanan kurir + harga (dinormalisasi dari `pricing` Biteship) |
| `cached` | Saat ini selalu `false` di integrasi; storefront bisa cache di `sessionStorage` |
| `weight_kg` | Bucket berat yang dipakai |
| `speed_group` | `next_day` atau `reguler` — untuk UI checkout |

#### Mode Rates API (otomatis di `src/biteship.rs`)

Backend memilih **satu** mode per request berdasarkan prioritas:

1. **Area ID** — `origin_area_id` + `destination_area_id`  
2. **Koordinat** — lat/lng asal & tujuan  
3. **Kode pos** — `origin_postal_code` + `destination_postal_code`  
4. **Mix** — koordinat asal + `destination_postal_code`  

#### `POST /api/shipping/draft-orders`

Sama seperti rates, wajib menyertakan `cart_items` plus data penerima (`destination_contact_name`, `destination_contact_phone`, `destination_address`). Data asal (`origin_*`) diisi otomatis dari env `BITESHIP_ORIGIN_*`.

#### `GET /api/shipping/draft-orders/:id/rates`

Respons berisi dua field: `rates` (normalized, sama seperti endpoint rates) dan `raw` (data asli Biteship untuk debugging).

#### `POST /api/shipping/draft-orders/:id/confirm`

Body bisa kosong (`{}`). Mengubah status draft order menjadi order aktif di Biteship.

#### `POST /api/shipping/orders` (server-to-server)

Dipanggil oleh **api-cms** saat checkout (`INTEGRASI_API_URL`). Body berisi data tujuan + `items`; server integrasi melengkapi field asal (`origin_*`) dari environment secara otomatis jika tidak ada di body.

---

### Payment / Duitku

Integrasi [Duitku API v2](https://docs.duitku.com/). Inquiry path: `{DUITKU_BASE_URL}/api/merchant/v2/inquiry`.

> **Penting:** Signature menggunakan **HMAC-SHA256** (bukan MD5). Pastikan client menggunakan implementasi yang sesuai.

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/payments/duitku` | Buat tagihan (VA / QRIS / dll) |
| POST | `/payments/duitku/callback` | Webhook status pembayaran dari Duitku |

#### `POST /payments/duitku`

**Request:**

```json
{
  "merchantOrderId": "ORD-20260525-001",
  "paymentAmount": 150000,
  "paymentMethod": "SP",
  "productDetails": "Pesanan Aminah Jaya",
  "email": "customer@example.com",
  "phoneNumber": "081234567890",
  "customerVaName": "Budi Santoso",
  "additionalParam": null,
  "returnUrl": "https://aminahjaya.com/pesanan/sukses",
  "expiryPeriod": 60
}
```

| Field | Wajib | Keterangan |
| ----- | ----- | ---------- |
| `merchantOrderId` | Ya | ID order unik (harus unik per transaksi) |
| `paymentAmount` | Ya | Nominal dalam rupiah (integer) |
| `paymentMethod` | Ya | Kode metode pembayaran |
| `productDetails` | Ya | Deskripsi produk |
| `email` | Ya | Email pelanggan |
| `phoneNumber` | Ya | Nomor HP pelanggan |
| `customerVaName` | Ya | Nama pemegang VA |
| `additionalParam` | Tidak | Parameter tambahan opsional |
| `returnUrl` | Tidak | URL redirect setelah pembayaran |
| `expiryPeriod` | Tidak | Durasi kedaluwarsa dalam menit |

| `paymentMethod` (contoh) | Keterangan |
| ------------------------ | ---------- |
| `SP` | ShopeePay / QRIS |
| `BC` | BCA Virtual Account |
| `M2` | Mandiri Virtual Account |
| `VA` | Maybank Virtual Account |

**Signature inquiry (dihitung server):** `HMAC-SHA256(merchantCode + merchantOrderId + paymentAmount, apiKey)`

**Response sukses:** `statusCode: "00"`, plus `vaNumber`, `qrString`, `paymentUrl`, `reference`, dll. (format Duitku langsung, bukan wrapper `ApiResponse`).

#### `POST /payments/duitku/callback`

- **Content-Type:** `application/x-www-form-urlencoded`  
- **Signature verifikasi:** `HMAC-SHA256(merchantCode + amount + merchantOrderId, apiKey)` — 64 karakter hex lowercase  
- Jika signature tidak cocok → HTTP `401 Unauthorized`  
- Jika signature valid dan `resultCode == "00"` → log pembayaran sukses & placeholder notifikasi WhatsApp  
- **Respons wajib:** HTTP `200` + body plain text **`OK`** (wajib agar Duitku tidak retry)

---

### WhatsApp / Meta Cloud API

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/webhook` | Verifikasi webhook Meta (`hub.mode`, `hub.verify_token`, `hub.challenge`) |
| POST | `/webhook` | Terima pesan masuk; balas otomatis via chatbot sederhana |

**Verifikasi (GET):**

```
/webhook?hub.mode=subscribe&hub.verify_token={VERIFY_TOKEN}&hub.challenge={challenge}
```

Jika token cocok, server mengembalikan nilai `hub.challenge` sebagai plain text (HTTP 200). Jika tidak cocok → HTTP 403.

**Handle webhook (POST):**

Server mem-parse payload Meta, mengekstrak pesan teks, memanggil `chatbot_service::generate_reply`, lalu mengirim balasan secara asinkron via `whatsapp_service::send_message`. Selalu merespons HTTP 200 (wajib, agar Meta tidak retry). Status delivery update (tanpa field `messages`) hanya dicatat sebagai log.

---

## Integrasi dengan api-cms

| Alur | Pemanggil | Endpoint integrasi |
| ---- | --------- | ------------------ |
| Hitung ongkir checkout | Storefront | `POST /api/shipping/rates` |
| Pencarian area peta | Storefront | `GET /api/shipping/maps/areas` |
| Buat shipment setelah order | api-cms | `POST /api/shipping/orders` atau `POST /api/shipping/draft-orders/:id/confirm` |
| Lacak paket | api-cms | `GET /api/shipping/tracking/:id` |
| Pembayaran online | Storefront / chatbot | `POST /payments/duitku` |

**api-cms** membutuhkan:

```env
INTEGRASI_API_URL=http://127.0.0.1:8002
```

Tanpa URL ini, order tetap tersimpan di PostgreSQL tetapi shipment Biteship tidak dibuat.

---

## Project Structure

```
src/
├── main.rs              # Router, CORS, nest /api
├── biteship.rs          # Client Biteship + normalisasi rates
├── config/env.rs        # Config WhatsApp, Duitku, CORS
├── duitku/
│   ├── mod.rs
│   ├── models.rs        # Struct + signature HMAC-SHA256
│   ├── client.rs        # HTTP ke Duitku
│   └── handlers.rs      # Checkout & callback
├── routes/
│   ├── shipping.rs      # Handler Biteship
│   └── webhook.rs       # Handler WhatsApp
├── models/
│   ├── response.rs      # ApiResponse<T>
│   └── webhook.rs       # Payload Meta
└── services/
    ├── chatbot_service.rs
    └── whatsapp_service.rs
```

---

## Features

### Biteship

- Rates (`POST /v1/rates/couriers`), couriers, maps/areas, draft order, confirm, create order, tracking  
- Origin dari env (`BITESHIP_ORIGIN_*`); kurir default `BITESHIP_DEFAULT_COURIERS`  
- Normalisasi `pricing` → `rates` dengan `speed_group`, `courier_logo`, durasi  
- Berat dari `cart_items` di body (tidak baca database)  

### Duitku

- Inquiry v2 (VA, QRIS, dan metode lain)  
- Signature HMAC-SHA256 untuk inquiry dan verifikasi callback  
- Respons callback `OK` sesuai spesifikasi Duitku  

### WhatsApp

- Verifikasi & webhook Meta Cloud API  
- Auto-reply dasar (extensible di `chatbot_service`)  
- Async reply — server segera merespons 200 sebelum mengirim balasan  

---

## Technology Stack

| Teknologi | Penggunaan |
| --------- | ---------- |
| Rust | Runtime & bahasa utama |
| Axum | HTTP router & handlers |
| Tokio | Async runtime |
| Reqwest | HTTP client (Biteship, Duitku) |
| Serde / JSON | Serialisasi API |
| HMAC-SHA256 (hmac + sha2) | Signature Duitku v2 |
| Tower HTTP | CORS, tracing |
| dotenvy | Environment variables |
| tracing | Structured logging |

---

## Architecture Notes

- **Stateless** — tidak ada PostgreSQL/SQLx di service ini  
- **Pemisahan concern** — `api-cms` = domain bisnis; `api-integrasi` = gateway pihak ketiga  
- API key Biteship & Duitku **tidak** diekspos ke browser  
- CORS dikonfigurasi via `ALLOWED_ORIGINS` (bukan wildcard) untuk keamanan  
- Storefront: `VITE_INTEGRASI_API_BASE` (mis. `http://localhost:8002/api`) untuk shipping  
- Storefront: `VITE_API_BASE` (mis. `http://localhost:8001/api`) untuk cart, auth, order  
- Port default development: integrasi **8002**, cms **8001**  
- Callback Duitku & webhook WhatsApp harus dapat diakses dari internet (HTTPS di production)  

---

## Testing

**Unit test signature Duitku (HMAC-SHA256):**

```bash
cargo test duitku::models
```

**Unit test klasifikasi kecepatan kurir:**

```bash
cargo test biteship::tests
```

**Semua unit test:**

```bash
cargo test
```

**Postman:** Import koleksi `Aminah_Jaya_Integration.postman_collection.json`. Set Collection Variable `base_url` ke `http://localhost:8002` (default) dan sesuaikan `verify_token`, `duitku_merchant_code` dengan nilai `.env` aktif.

> **Catatan simulasi callback Duitku:** Signature pada Postman collection perlu digenerate manual dengan `HMAC-SHA256(merchantCode + amount + merchantOrderId, apiKey)` menggunakan API key dari `.env`.

---

## Related Projects

| Project | Peran |
| ------- | ----- |
| `api-cms-aminah-jaya` | API utama: produk, cart, order, auth, DB |
| `storefront-aminah-jaya` | Toko online — ongkir via integrasi |
| `cms-aminah-jaya` | Admin dashboard |

**Storefront environment:**

```env
VITE_API_BASE=http://localhost:8001/api
VITE_INTEGRASI_API_BASE=http://localhost:8002/api
```

**Production contoh:**

```env
VITE_API_BASE=https://aminahjaya.com/api
VITE_INTEGRASI_API_BASE=https://integrasi.aminahjaya.com/api
```

Pastikan `DUITKU_CALLBACK_URL` dan URL webhook WhatsApp di Meta App mengarah ke host integrasi yang sama.
