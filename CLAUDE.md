# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Struktur Repo

Monorepo tanpa tooling workspace — setiap direktori adalah project berdiri sendiri (Cargo/npm masing-masing). Selalu jalankan perintah dari dalam direktori project-nya.

| Direktori | Stack | Port | Peran |
|---|---|---|---|
| `api-cms-aminah-jaya` | Rust + Axum 0.7 + SQLx (PostgreSQL) | 8001 | API inti: auth admin & customer, produk, order, cart, kupon, blog, banner, upload R2 |
| `api-integrasi-aminah-jaya` | Rust + Axum 0.7 (tanpa DB) | 8002 | Integrasi pihak ketiga: Duitku (pembayaran), Biteship (ongkir/tracking), WhatsApp Cloud API, Resend (email) |
| `cms-aminah-jaya` | SolidStart (SSR **off**) | 3001 | Dashboard admin |
| `storefront-aminah-jaya` | SolidStart (SSR on) + SCSS | 3002 | Web toko untuk customer |
| `landing-page-aminah-jaya` | SolidStart | 3003 | Landing page (multi-brand: index, `milkmee`, `waiteu`) |

`package.json` di root hanya menampung dependency peta (leaflet/maplibre) — bukan workspace root.

## Perintah

Backend (di dalam `api-cms-aminah-jaya/` atau `api-integrasi-aminah-jaya/`):
```bash
cargo run                  # migrasi (khusus api-cms) jalan otomatis saat startup
cargo build --release
cargo test                 # unit test hanya ada di api-integrasi (duitku/models.rs, biteship.rs)
cargo test signature       # jalankan satu test berdasarkan nama
cargo clippy
```

Frontend (di dalam salah satu direktori frontend) — package manager: **bun**:
```bash
bun install
bun run dev                # port sudah dipatok per project di script "dev"
bun run build && bun run start
```

Deploy: setiap project punya `deploy.sh` + `docker-compose.yml`. Skrip build image Docker secara lokal, `docker save | gzip`, kirim via `scp` ke VPS, lalu `docker compose up -d --force-recreate`. Kredensial VPS dibaca dari `.env` project (`SSH_HOST`/`VPS_IP`, `SSH_USER`, `SSH_KEY_PATH`). Semua container gabung ke docker network eksternal `aminah-network` dan saling memanggil lewat nama container.

## Arsitektur Alur Data

**Frontend → backend.** Storefront memakai dua base URL: `VITE_API_BASE` (api-cms, default `http://localhost:8001/api`) lewat `src/lib/api.ts`, dan `VITE_INTEGRASI_API_BASE` (api-integrasi, default `http://localhost:8002/api`) lewat `src/lib/integrasi-api.ts`. Fitur ongkir/pembayaran memanggil integrasi langsung dari browser, bukan lewat api-cms.

**Alur pembayaran Duitku (lintas service).** Storefront → `POST /payments/duitku` di api-integrasi → Duitku. Callback Duitku masuk ke `POST /payments/duitku/callback` (api-integrasi, body `x-www-form-urlencoded`), signature divalidasi, lalu api-integrasi meneruskan ke `POST {CMS_API_URL}/api/webhook/duitku` dengan header `Authorization: Bearer {WEBHOOK_SECRET}` untuk update `orders.payment_status`. `WEBHOOK_SECRET` harus identik di kedua service. Endpoint callback wajib membalas plain text `"OK"` + `200`.

Signature Duitku memakai **HMAC-SHA256**, bukan MD5 seperti pada `prompt.md` (dokumen spesifikasi awal yang sudah usang): `HMAC-SHA256(merchantCode + merchantOrderId + paymentAmount, apiKey)` untuk inquiry dan `HMAC-SHA256(merchantCode + amount + merchantOrderId, apiKey)` untuk callback. Khusus `GET /payments/duitku/methods`, Duitku meminta SHA-256 biasa dari `merchantCode + amount + datetime + apiKey`.

**Arah balik.** api-cms memanggil api-integrasi lewat `src/integrasi.rs` (`IntegrasiClient::from_env()`, env `INTEGRASI_API_URL`) untuk tracking Biteship — dipakai di `routes/shipping.rs`.

**Konfigurasi.** api-integrasi memuat semua env sekali di `config/env.rs` (`Config::load()`) dan menyebarkannya sebagai `State<Arc<Config>>`; tambahkan env baru di struct itu, bukan `std::env::var` tersebar. api-cms sebaliknya membaca env langsung di titik pakai, dengan state minimal (`state.rs`: pool, s3_client, r2_bucket, r2_public_url).

## Konvensi api-cms

- Semua route didaftarkan manual di `main.rs` (satu file besar); handler ada di `src/routes/<domain>.rs`, struct di `src/models/mod.rs`.
- Response selalu dibungkus `ApiResponse<T>` (`{ success, message, data, meta, errors }`). Frontend memeriksa `json.success` dan mengembalikan `json.data` — handler baru harus ikut format ini, termasuk jalur error (`ApiResponse::error`).
- Pagination: `Query<PaginationQuery>` (`page`, `limit`) + `PaginationMeta` via `ApiResponse::paginated`.
- SQLx dipakai **runtime-checked** (`sqlx::query_as::<_, T>`, `query_scalar`, `query`) — bukan makro `query!`, jadi tidak perlu `DATABASE_URL` saat compile dan tidak ada `sqlx prepare`. Kolom `NUMERIC` biasanya di-cast `::FLOAT8` di SQL agar cocok dengan `f64` di model.
- Auth: JWT HS256 (`src/auth.rs`, `create_jwt`/`verify_jwt`, exp 24 jam, `JWT_SECRET`). Tidak ada middleware/extractor — tiap handler yang butuh auth mengambil `HeaderMap`, memotong prefix `Bearer `, lalu `verify_jwt`. Admin dan customer berbagi mekanisme yang sama; token customer disimpan di `localStorage` sebagai `customer_token`, token admin sebagai `token`.
- Migrasi: file `migrations/<YYYYMMDDHHMMSS>_nama.sql`, dijalankan otomatis oleh `sqlx::migrate!` saat startup. `deploy.sh` mendeteksi perubahan di `migrations/` dan memicu `cargo clean` sebelum build.
- Development bisa menembus DB via SSH tunnel otomatis: set `USE_SSH_TUNNEL=true` + `SSH_HOST`/`SSH_USER`/`SSH_KEY_PATH`; `main.rs` menulis ulang host di `DATABASE_URL` ke `localhost:$DB_LOCAL_PORT`. Di VPS nilainya dipaksa `false` oleh `deploy.sh`.
- Upload file masuk ke Cloudflare R2 lewat `aws-sdk-s3` (env `R2_*`), body limit 10 MB.

## Konvensi Frontend

- SolidStart file-based routing di `src/routes/`. `cms-aminah-jaya` memakai `ssr: false` (SPA) — hindari kode yang mengandalkan SSR di sana; storefront & landing page SSR aktif, jadi akses `window`/`localStorage` harus dijaga `typeof window !== "undefined"`.
- **Tidak ada Tailwind.** `cms-aminah-jaya` pakai CSS custom properties + kelas tulis tangan di `src/app.css` (~2.5k baris); `storefront-aminah-jaya` pakai SCSS berlapis di `src/styles/` (`base/`, `components/`, `pages/`) yang di-`@use` dari `src/app.scss`. Beberapa komponen CMS (mis. `Layout.tsx`) masih memakai kelas bergaya Tailwind (`fixed inset-0 z-40 lg:hidden`) yang tidak terdefinisi di mana pun dan tidak berefek — jangan menirunya.
- State global memakai signal-module sederhana di `src/lib/*-store.ts` (`cart-store`, `auth-store`, `legal-store`, `sidebarStore`, `searchStore`, `toast`), bukan library store eksternal.
- Bahasa UI: Indonesia; format uang lewat `formatCurrency` (`Intl.NumberFormat("id-ID", IDR)`).

## Referensi Lain

- `prompt.md` (root): spesifikasi awal integrasi Duitku. **Usang** pada bagian signature (menyebut MD5); implementasi final memakai HMAC-SHA256.
- Postman collection tersedia di kedua project API (`*_postman_collection.json`), berguna untuk melihat kontrak endpoint.
- `api-cms-aminah-jaya/BACKEND_COORDINATES_IMPLEMENTATION.md` dan `storefront-aminah-jaya/MAPS_IMPLEMENTATION.md`: skema koordinat alamat/order dan map picker MapLibre.
- `cms-aminah-jaya/SUMMARY.md`: struktur halaman, komponen, dan design system CMS.
