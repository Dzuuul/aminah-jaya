# Backend: Koordinat Alamat & Pengiriman

Dokumen ini menjelaskan bagaimana koordinat GPS disimpan dan dipakai di `api-cms-aminah-jaya`.

---

## Riwayat Singkat

Implementasi pertama menyimpan satu alamat + koordinat langsung di tabel `storefront_customers`. Skema itu **sudah tidak berlaku**: sejak migration `20260522000001_adjust_customer_address_to_multiple.sql`, kolom `shipping_address`, `shipping_lat`, `shipping_lng` di `storefront_customers` **dihapus** dan digantikan tabel multi-alamat `customer_addresses`.

| Migration | Perubahan |
| --- | --- |
| `20260520000000_add_shipping_coordinates` | Menambah `shipping_lat`/`shipping_lng` `NUMERIC(10,6)` di `storefront_customers` (historis) |
| `20260521000000_change_shipping_coordinates_to_double_precision` | Mengubah tipe ke `DOUBLE PRECISION` agar cocok dengan `f64` di Rust (historis) |
| `20260522000001_adjust_customer_address_to_multiple` | Menghapus kolom lama, membuat tabel `customer_addresses` |
| `20260523000000_add_biteship_order_fields` | Menambah koordinat & metadata kurir di tabel `orders` |

---

## Skema Aktif

### `customer_addresses`

```sql
CREATE TABLE customer_addresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES storefront_customers(id) ON DELETE CASCADE,
  label           VARCHAR(50),
  recipient_name  VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20)  NOT NULL,
  address         TEXT         NOT NULL,
  province        VARCHAR(100),
  city            VARCHAR(100),
  district        VARCHAR(100),
  postal_code     VARCHAR(20),
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Index: `idx_customer_addresses_customer_id` dan `idx_customer_addresses_coords (lat, lng)`.

Satu customer boleh punya banyak alamat; hanya satu yang `is_default = true` (dikelola handler `set_default_address`).

### `orders`

Kolom yang berkaitan dengan koordinat & pengiriman:

| Kolom | Tipe | Isi |
| --- | --- | --- |
| `shipping_lat`, `shipping_lng` | `DOUBLE PRECISION` | Koordinat tujuan saat order dibuat |
| `shipping_postal_code` | `VARCHAR(20)` | Kode pos tujuan |
| `shipping_area_id` | `VARCHAR(100)` | Area ID Biteship (jika dipakai) |
| `courier_company`, `courier_service` | `VARCHAR(50)` | Kurir & layanan terpilih |
| `biteship_order_id`, `biteship_tracking_id`, `biteship_draft_order_id` | `VARCHAR(100)` | Referensi Biteship, diisi setelah shipment dibuat |

Index: `idx_orders_biteship_order_id`, `idx_orders_biteship_tracking_id`.

---

## Endpoint Terkait

### Alamat customer

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/customer/addresses` | List alamat milik customer |
| POST | `/api/customer/addresses` | Tambah alamat (termasuk `lat`, `lng`) |
| PATCH | `/api/customer/addresses/:id` | Ubah alamat |
| DELETE | `/api/customer/addresses/:id` | Hapus alamat |
| PATCH | `/api/customer/addresses/:id/default` | Jadikan alamat default |

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

> `PATCH /api/customer/profile` **tidak lagi** menerima `shipping_address`/`shipping_lat`/`shipping_lng` — profil hanya menyimpan nama, telepon, email, dan password.

### Order

`POST /api/customer/orders` menerima koordinat tujuan lewat `destination_lat`, `destination_lng`, `destination_postal_code`, dan `destination_area_id`, lalu menyimpannya ke kolom `shipping_*` di tabel `orders` serta meneruskannya ke api-integrasi untuk membuat shipment Biteship.

---

## Format & Validasi Koordinat

- Tipe kolom `DOUBLE PRECISION`, dipetakan ke `Option<f64>` di Rust.
- Rentang wajar untuk Indonesia: latitude `-11.0` … `6.0`, longitude `95.0` … `141.0`.
- Presisi 6 desimal ≈ ±0,11 m — cukup untuk pinpoint alamat.
- Koordinat bersifat opsional: alamat tanpa `lat`/`lng` tetap valid, tetapi perhitungan ongkir akan jatuh ke mode kode pos di api-integrasi.

Contoh koordinat: Jakarta `-6.2088, 106.8456` · Bandung `-6.9175, 107.6191` · Surabaya `-7.2575, 112.7521` · Kediri `-7.8480, 112.0178`.

---

## Frontend Terkait

Pemilihan titik di storefront memakai `MapPicker` (MapLibre GL + OpenStreetMap). Lihat [`../storefront-aminah-jaya/MAPS_IMPLEMENTATION.md`](../storefront-aminah-jaya/MAPS_IMPLEMENTATION.md).

---

## Menjalankan Migrasi

Migrasi berjalan otomatis saat `cargo run` (`sqlx::migrate!("./migrations")`). Untuk produksi, backup dulu lalu deploy seperti biasa:

```bash
pg_dump -h <host> -U <user> <db> > backup.sql
./deploy.sh --tag latest --port 8001
```

Verifikasi setelah deploy:

```sql
\d customer_addresses
\d orders
SELECT COUNT(*) FROM customer_addresses WHERE lat IS NOT NULL;
```

`deploy.sh` otomatis menjalankan `cargo clean` bila mendeteksi perubahan di direktori `migrations/`.
