# Context & Role
Anda adalah seorang Software Architect dan Senior Backend Engineer yang ahli dalam ekosistem Rust (terutama `axum`, `tokio`, `reqwest`, dan `serde`). 
Tugas Anda adalah menulis kode dan merancang modul integrasi untuk Payment Gateway **Duitku** ke dalam sistem e-commerce berbasis arsitektur modular (monorepo/microservices).

## Project Architecture & Tech Stack
- **Backend Layout**: 
  - `api-cms`: Mengelola manajemen produk, inventori, dan konten toko.
  - `api-integrasi`: Menangani integrasi pihak ketiga, termasuk Duitku dan Meta WhatsApp Business API. (Fokus pengerjaan di sini).
- **Frontend Layout**: Storefront (User Web) & CMS Admin.
- **Channels**: Transaksi dapat dipicu dari dua tempat:
  1. Storefront Web via REST API.
  2. WhatsApp Chatbot via Webhook Meta Cloud API.
- **Backend Stack**: Rust (`axum` untuk router, `reqwest` untuk HTTP client, `serde` untuk serialisasi JSON, `md5` untuk generator signature).

---

## Objective
Implementasikan modul integrasi Duitku API v2 di dalam layanan `api-integrasi` menggunakan Rust. Modul ini harus menangani dua proses utama:
1. **Inquiry/Checkout**: Membuat tagihan pembayaran ke API Duitku (mendukung QRIS dan Virtual Account).
2. **Callback/Webhook**: Menerima notifikasi status pembayaran dari Duitku, melakukan validasi keamanan signature, dan memperbarui status pesanan.

---

## Technical Specifications & Security Rules

### 1. Duitku Integration Details
- **Base URL (Sandbox)**: `https://sandbox.duitku.com/webapi`
- **Inquiry Endpoint**: `/v2/inquiry`
- **Formula Signature Inquiry**: `MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)`
- **Formula Signature Callback**: `MD5(merchantCode + amount + merchantOrderId + apiKey)`
- **Response Sukses Duitku**: Ditandai dengan properti `statusCode` bernilai `"00"`.
- **Response Webhook**: Setelah memproses callback dengan sukses, endpoint wajib mengembalikan plain text `"OK"` dengan HTTP Status `200 OK`.

### 2. Implementation Guidelines (Rust & Axum)
- **Type Safety & Serde**: Gunakan anotasi `#[derive(Serialize, Deserialize)]` dengan atribut `#[serde(rename_all = "camelCase")]` untuk menyesuaikan format JSON payload dari Duitku.
- **Environment Variables**: Ambil kredensial (`DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`, `DUITKU_BASE_URL`, `DUITKU_CALLBACK_URL`) menggunakan `std::env::var` secara aman atau pasang skema penanganan *error fallback*.
- **Modular Code**: Pisahkan struktur data Duitku (Request/Response), fungsi enkripsi generator *signature*, dan handler Axum ke dalam modul terpisah (misal: `mod duitku;` yang berisi `models.rs`, `client.rs`, dan `handlers.rs`).
- **Error Handling**: Tangani kegagalan jaringan `reqwest` atau kegagalan parsing JSON dengan mengembalikan HTTP Status yang tepat (`StatusCode::BAD_GATEWAY` atau `StatusCode::INTERNAL_SERVER_ERROR`), jangan gunakan `.unwrap()` pada area kritis untuk menghindari *panic*.

---

## Tasks to Execute (Instruksi untuk Cursor)

### Langkah 1: Struktur Data & Logika Signature
Buat berkas model (`models.rs`) yang berisi struct data untuk:
- `DuitkuInquiryRequest` & `DuitkuInquiryResponse`
- `DuitkuCallbackPayload`
- Tambahkan fungsi helper `pub fn generate_signature(...) -> String` berbasis library `md5`.

### Langkah 2: Handler Axum untuk Checkout
Buat fungsi handler `create_payment_handler` yang menerima request internal dari Web/Chatbot, memproses *signature*, menembak API Duitku lewat `reqwest`, dan mengembalikan data instruksi bayar (VA/QRIS string) ke klien.

### Langkah 3: Handler Axum untuk Webhook Callback
Buat fungsi handler `duitku_callback_handler` yang menerima POST request dari Duitku. Handler wajib memvalidasi *signature* kiriman Duitku dengan *signature* hasil kalkulasi lokal. Jika tidak cocok, kembalikan `StatusCode::UNAUTHORIZED`. Jika cocok dan `resultCode == "00"`, berikan placeholder cetak log untuk logika update database dan pengiriman pesan notifikasi WhatsApp.

---

*Tolong mulai dengan membuat file/modul `models.rs` dan implementasi logika pembuatan signature-nya terlebih dahulu.*