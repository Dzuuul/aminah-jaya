# 🏪 Aminah Jaya Project Ecosystem

[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-2c4f7c?style=for-the-badge&logo=solid&logoColor=c8c9cb)](https://www.solidjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

Ekosistem toko online **Aminah Jaya**: dua backend Rust (API inti + API integrasi pihak ketiga) dan tiga frontend SolidStart (CMS admin, storefront customer, landing page).

---

## 🏗️ Struktur Project

Monorepo tanpa tooling workspace — setiap direktori berdiri sendiri dengan `Cargo.toml` / `package.json` masing-masing. Jalankan semua perintah dari dalam direktori project terkait.

| Modul | Tipe | Stack | Port dev | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| [`api-cms-aminah-jaya`](./api-cms-aminah-jaya) | Backend | Rust (Axum + SQLx + PostgreSQL) | 8001 | API inti: auth admin & customer, produk, order, cart, kupon, blog, banner, upload R2 |
| [`api-integrasi-aminah-jaya`](./api-integrasi-aminah-jaya) | Backend | Rust (Axum, tanpa database) | 8002 | Gateway pihak ketiga: Duitku, Biteship, WhatsApp Cloud API, Resend |
| [`cms-aminah-jaya`](./cms-aminah-jaya) | Frontend | SolidStart (SPA, `ssr: false`) | 3001 | Dashboard admin |
| [`storefront-aminah-jaya`](./storefront-aminah-jaya) | Frontend | SolidStart (SSR) + SCSS | 3002 | Toko online untuk customer |
| [`landing-page-aminah-jaya`](./landing-page-aminah-jaya) | Frontend | SolidStart (SSR) | 3003 | Landing page multi-brand (WaitEu, MilkMee) |

`package.json` di root hanya menampung dependency peta (`leaflet`, `maplibre-gl`) — bukan root workspace.

---

## 🔀 Alur Antar Service

```
            ┌────────────────────┐
            │  storefront (3002) │
            └─────┬────────┬─────┘
   VITE_API_BASE  │        │  VITE_INTEGRASI_API_BASE
                  ▼        ▼
       ┌──────────────┐  ┌──────────────────┐        ┌──────────┐
       │ api-cms 8001 │◄─┤ api-integrasi    │◄──────►│ Duitku   │
       │ + PostgreSQL │  │ 8002 (stateless) │        │ Biteship │
       └──────▲───────┘  └──────────────────┘        │ WhatsApp │
              │  INTEGRASI_API_URL ▲                 │ Resend   │
       ┌──────┴───────┐            │                 └──────────┘
       │  cms (3001)  │            └── callback Duitku → webhook api-cms
       └──────────────┘
```

- **Storefront** memakai dua base URL: `VITE_API_BASE` (api-cms) untuk katalog/cart/order/auth, dan `VITE_INTEGRASI_API_BASE` (api-integrasi) untuk ongkir & pembayaran.
- **Pembayaran:** storefront → `POST /payments/duitku` (api-integrasi) → Duitku. Callback Duitku masuk ke api-integrasi, diverifikasi signature HMAC-SHA256, lalu diteruskan ke `POST /api/webhook/duitku` di api-cms dengan header `Authorization: Bearer ${WEBHOOK_SECRET}` untuk mengubah status order.
- **Pengiriman:** api-cms memanggil api-integrasi (`INTEGRASI_API_URL`) untuk membuat shipment Biteship saat checkout dan untuk melacak paket.
- API key Biteship/Duitku hanya berada di api-integrasi, tidak pernah diekspos ke browser.

---

## ✨ Fitur Utama

- **Katalog & CMS**: produk (multi gambar, varian, berat), kategori, koleksi, flash sale, blog, banner, halaman legal, pengaturan toko.
- **Customer storefront**: registrasi/login (email & Google), multi-alamat + pin peta, keranjang, favorit, kupon, checkout dengan ongkir Biteship dan pembayaran Duitku (VA/QRIS/e-wallet).
- **Auth JWT**: token terpisah untuk admin CMS dan customer storefront.
- **Media**: upload multipart ke Cloudflare R2 (S3-compatible).
- **Dockerized**: setiap modul punya `Dockerfile`, `docker-compose.yml`, dan `deploy.sh`.

---

## 🛠️ Tech Stack

### Backend
- **Bahasa**: Rust (edition 2021)
- **Framework**: Axum 0.7 + Tokio + Tower HTTP
- **Database**: PostgreSQL via SQLx 0.8 (query runtime-checked, migrasi otomatis saat startup)
- **Lainnya**: Serde, Reqwest, JSONWebToken, Bcrypt, UUID, `hmac`+`sha2` (signature Duitku), AWS SDK S3 (Cloudflare R2)

### Frontend
- **Framework**: SolidJS 1.9 + SolidStart / Vinxi + Vite 6
- **Package manager**: Bun
- **Styling**: CSS murni dengan custom properties (CMS) dan SCSS modular (storefront) — **tidak memakai Tailwind**
- **Lainnya**: `@solidjs/router`, `lucide-solid`, GSAP, MapLibre GL, `solid-markdown`

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- [Rust](https://www.rust-lang.org/tools/install) stable
- [Bun](https://bun.sh/) (Node.js ≥ 20, landing page ≥ 22)
- PostgreSQL (lokal atau remote via SSH tunnel)
- Docker & Docker Compose (untuk deploy)

### 1. Backend inti

```bash
cd api-cms-aminah-jaya
cp .env.example.local .env     # isi DATABASE_URL, JWT_SECRET, R2_*, dll.
cargo run                      # migrasi SQLx jalan otomatis saat startup → :8001
```

### 2. Backend integrasi

```bash
cd api-integrasi-aminah-jaya
# siapkan .env: DUITKU_*, BITESHIP_*, WHATSAPP_*, CMS_API_URL, WEBHOOK_SECRET
cargo run                      # → :8002
```

`WEBHOOK_SECRET` harus bernilai sama di kedua backend.

### 3. Frontend

```bash
cd cms-aminah-jaya        && bun install && bun run dev   # → :3001
cd storefront-aminah-jaya && bun install && bun run dev   # → :3002
cd landing-page-aminah-jaya && bun install && bun run dev # → :3003
```

Contoh `.env` storefront:

```env
VITE_API_BASE=http://localhost:8001/api
VITE_API_URL=http://localhost:8001
VITE_INTEGRASI_API_BASE=http://localhost:8002/api
VITE_GOOGLE_CLIENT_ID=...
```

---

## 📦 Deployment

Setiap modul punya `deploy.sh` dengan pola yang sama: build image Docker secara lokal → `docker save | gzip` → `scp` ke VPS → `docker compose up -d --force-recreate`. Kredensial VPS dibaca dari `.env` modul (`VPS_IP`/`SSH_HOST`, `VPS_USER`/`SSH_USER`, `SSH_KEY_PATH`).

```bash
cd api-cms-aminah-jaya
./deploy.sh --tag latest --port 8001
```

Semua container bergabung ke Docker network eksternal `aminah-network` dan saling memanggil lewat nama container (mis. `http://api-integrasi-aminah-jaya:8002`).

---

## 📚 Dokumentasi Lain

| Dokumen | Isi |
| :--- | :--- |
| [`CLAUDE.md`](./CLAUDE.md) | Panduan arsitektur & konvensi untuk Claude Code |
| [`api-cms-aminah-jaya/README.md`](./api-cms-aminah-jaya/README.md) | Referensi endpoint API inti |
| [`api-integrasi-aminah-jaya/README.md`](./api-integrasi-aminah-jaya/README.md) | Referensi endpoint Duitku, Biteship, WhatsApp |
| [`cms-aminah-jaya/SUMMARY.md`](./cms-aminah-jaya/SUMMARY.md) | Struktur & design system dashboard admin |
| [`storefront-aminah-jaya/MAPS_IMPLEMENTATION.md`](./storefront-aminah-jaya/MAPS_IMPLEMENTATION.md) | Map picker MapLibre untuk alamat pengiriman |
| [`api-cms-aminah-jaya/BACKEND_COORDINATES_IMPLEMENTATION.md`](./api-cms-aminah-jaya/BACKEND_COORDINATES_IMPLEMENTATION.md) | Penyimpanan koordinat alamat & order |
| `prompt.md` | Spesifikasi awal integrasi Duitku (historis — implementasi final memakai HMAC-SHA256, bukan MD5) |

---

## 📄 License

MIT.

---

<p align="center">Made with ❤️ for Aminah Jaya</p>
