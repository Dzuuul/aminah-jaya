# Maps Implementation — Pemilih Lokasi Alamat Pengiriman

## Ringkasan

Customer memilih titik pengiriman lewat komponen `MapPicker` di halaman profil (`/profile`), saat menambah atau mengubah alamat. Koordinat yang dipilih disimpan bersama alamat sehingga dapat dipakai untuk perhitungan ongkir Biteship di checkout.

> **Riwayat:** implementasi awal memakai Biteship Maps Widget dan `VITE_BITESHIP_MAPS_API_KEY`. Widget itu sudah diganti — versi sekarang memakai **MapLibre GL + OpenStreetMap** dan **tidak membutuhkan API key peta**.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Rendering peta | `maplibre-gl` (di-`import()` dinamis saat modal dibuka) |
| Tile | OpenStreetMap (`a/b/c.tile.openstreetmap.org`) |
| Geocoding & reverse geocoding | Nominatim OpenStreetMap |
| Pencarian area kurir | `GET /shipping/maps/areas` di `api-integrasi` (via `searchShippingAreas` di `src/lib/api.ts`) |
| Penyimpanan | `api-cms-aminah-jaya` — tabel `customer_addresses` |

## Komponen `MapPicker`

File: `src/components/MapPicker.tsx` (+ `MapPicker.css`).

```tsx
<MapPicker
  isOpen={isMapPickerOpen()}
  onClose={() => setIsMapPickerOpen(false)}
  onLocationSelect={(location) => handleMapLocationSelect(location)}
  initialLat={editLat() || undefined}
  initialLng={editLng() || undefined}
  initialAddress={editAddress() || undefined}
/>
```

| Prop | Tipe | Keterangan |
| --- | --- | --- |
| `isOpen` | `boolean` | Modal terbuka; peta baru diinisialisasi saat bernilai `true` |
| `onClose` | `() => void` | Dipanggil saat modal ditutup |
| `onLocationSelect` | `(location: { lat, lng, address }) => void` | Hasil akhir pemilihan |
| `initialLat` / `initialLng` | `number?` | Default `-6.2088`, `106.8456` (Jakarta) |
| `initialAddress` | `string?` | Alamat awal untuk field teks |

### Alur 3 langkah

1. **Pilih titik** — geser peta/marker, cari nama area (hasil dari `/shipping/maps/areas`, dilengkapi geocoding Nominatim bila koordinatnya kosong), atau tekan tombol “gunakan lokasi saya” (Geolocation API browser).
2. **Lengkapi alamat** — teks alamat hasil reverse geocoding dapat diedit manual.
3. **Catatan kurir** — opsional; digabung ke alamat akhir sebagai baris `Catatan untuk kurir: ...`.

`onLocationSelect` menerima `{ lat, lng, address }` dengan `address` berupa gabungan alamat lengkap + catatan kurir (dipisah baris baru).

## Penyimpanan di Backend

Koordinat disimpan di tabel `customer_addresses` (multi-alamat per customer):

```
POST /api/customer/addresses
PATCH /api/customer/addresses/:id
```

```json
{
  "label": "Rumah",
  "recipient_name": "Fikri",
  "recipient_phone": "08123456789",
  "address": "Jl. Sudirman No. 1\nCatatan untuk kurir: titip satpam",
  "province": "Jawa Barat",
  "city": "Bandung",
  "district": "Coblong",
  "postal_code": "40132",
  "lat": -6.914744,
  "lng": 107.609810,
  "is_default": true
}
```

Kolom lama `storefront_customers.shipping_address/shipping_lat/shipping_lng` sudah **dihapus** oleh migration `20260522000001` yang memperkenalkan tabel multi-alamat. Detail backend: [`../api-cms-aminah-jaya/BACKEND_COORDINATES_IMPLEMENTATION.md`](../api-cms-aminah-jaya/BACKEND_COORDINATES_IMPLEMENTATION.md).

## Pemakaian di Checkout

Koordinat alamat terpilih dikirim sebagai `destination_lat` / `destination_lng` ke:

- `POST /shipping/rates` (api-integrasi) untuk menghitung ongkir, dan
- `POST /api/customer/orders` (api-cms) saat order dibuat.

## Troubleshooting

**Peta tidak muncul** — pastikan modal benar-benar `isOpen` (peta hanya diinisialisasi setelah kontainer ter-render), lalu cek konsol untuk kegagalan memuat `maplibre-gl` atau tile OSM (jaringan/ad-blocker).

**Pencarian area kosong** — endpoint `/shipping/maps/areas` berasal dari api-integrasi; pastikan `VITE_INTEGRASI_API_BASE` benar dan `BITESHIP_API_KEY` terpasang di sisi server.

**Alamat hasil reverse geocoding kurang tepat** — Nominatim punya rate limit dan cakupan yang bervariasi; alamat selalu bisa diedit manual di langkah 2.

**Tombol lokasi saya gagal** — Geolocation API hanya berjalan di konteks aman (HTTPS atau `localhost`) dan butuh izin browser.
