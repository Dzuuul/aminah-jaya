# Storefront Aminah Jaya

Toko online customer-facing Aminah Jaya — SolidStart (SSR aktif) dengan styling SCSS modular.

Terhubung ke dua backend: `api-cms-aminah-jaya` (katalog, cart, order, auth) dan `api-integrasi-aminah-jaya` (ongkir Biteship, pembayaran Duitku).

---

## Menjalankan

```bash
bun install
bun run dev      # http://localhost:3002
```

Script `dev`/`start` menambahkan `NODE_OPTIONS=--dns-result-order=ipv4first` agar pemanggilan API tidak tersangkut resolusi IPv6 di beberapa lingkungan.

```bash
bun run build    # output Nitro (node-server)
bun run start
```

Node ≥ 20.

---

## Environment

```env
VITE_API_BASE=http://localhost:8001/api          # api-cms, dipakai src/lib/api.ts
VITE_API_URL=http://localhost:8001               # api-cms tanpa /api (komponen lama: shop, kategori, legal, flash sale)
VITE_INTEGRASI_API_BASE=http://localhost:8002/api # api-integrasi, dipakai src/lib/integrasi-api.ts
VITE_GOOGLE_CLIENT_ID=...                        # Google Identity Services untuk login
```

Dua variabel pertama menunjuk backend yang sama dengan/ tanpa sufiks `/api` — keduanya perlu diisi.

---

## Struktur

```
src/
├── app.tsx, entry-client.tsx, entry-server.tsx
├── app.scss                  # meng-@use seluruh partial di styles/
├── styles/
│   ├── base/                 # variables, reset, transitions, responsive
│   ├── components/           # buttons, navbar, footer, modal, stepper, loading
│   └── pages/                # home, shop, cart, checkout, product-detail, profile, auth, legal, ...
├── lib/
│   ├── api.ts                # fetchApi ke api-cms (+ tipe Product, endpoint customer)
│   ├── integrasi-api.ts      # fetchIntegrasiApi: ongkir & Duitku
│   ├── auth-store.ts         # session customer (token di localStorage: customer_token)
│   ├── cart-store.ts         # jumlah & isi keranjang
│   ├── legal-store.ts        # konten halaman legal dari CMS
│   ├── shipping-couriers.ts  # metadata kurir untuk UI
│   └── markdown.ts           # render konten blog
├── components/               # Navbar, Hero, Products, FlashSale, Categories, BlogSection,
│                             # LoginModal, MapPicker, TransitionLink, Footer, ...
└── routes/
    ├── index.tsx             # Beranda
    ├── shop.tsx              # Katalog + filter
    ├── category/[slug].tsx   # Produk per kategori
    ├── product/[id].tsx      # Detail produk
    ├── cart.tsx              # Keranjang
    ├── checkout.tsx          # Alamat → ongkir → metode bayar → Duitku
    ├── success.tsx           # Instruksi pembayaran / konfirmasi order
    ├── favorites.tsx, profile.tsx
    ├── login.tsx, register.tsx
    ├── blog/[id].tsx, about.tsx, zona-pengguna-baru.tsx
    ├── syarat-ketentuan.tsx, kebijakan-privasi.tsx, kebijakan-pengembalian.tsx
    └── [...404].tsx
```

---

## Alur Checkout

1. Pilih alamat (bisa pin lokasi lewat `MapPicker`, lihat [`MAPS_IMPLEMENTATION.md`](./MAPS_IMPLEMENTATION.md)).
2. `POST {VITE_INTEGRASI_API_BASE}/shipping/rates` → daftar layanan kurir + harga (berat dihitung dari `cart_items` yang dikirim).
3. `GET {VITE_INTEGRASI_API_BASE}/../payments/duitku/methods?amount=` → metode pembayaran aktif beserta fee.
4. `POST {VITE_API_BASE}/customer/orders` → order tersimpan di api-cms (+ shipment Biteship).
5. Untuk non-COD: `POST .../payments/duitku` → instruksi bayar (VA/QRIS/URL) ditampilkan di halaman sukses dan disimpan sementara di `localStorage` (`duitku_payment_<order_number>`).
6. Duitku mengirim callback ke api-integrasi → diteruskan ke webhook api-cms → status order berubah menjadi `paid`/`processing`.

---

## Catatan Teknis

- **SSR aktif.** Setiap akses `window`, `localStorage`, atau `document` harus dijaga `typeof window !== "undefined"` atau dijalankan di `onMount`.
- **Styling** memakai SCSS (`sass` sebagai devDependency); tidak ada framework utility. Tambahkan partial baru di `src/styles/**` lalu `@use` dari `app.scss`.
- **State global** berupa modul signal sederhana di `src/lib/*-store.ts`.
- **Peta** memakai MapLibre GL + tile OpenStreetMap dan geocoding Nominatim (tanpa API key).
- Token customer disimpan di `localStorage` dengan key `customer_token` dan dikirim otomatis oleh `fetchApi`/`fetchIntegrasiApi`.

---

## Deployment

```bash
./deploy.sh
```

Build image Docker lokal → `docker save | gzip` → `scp` ke VPS → `docker compose up -d --force-recreate`. Konfigurasi VPS dibaca dari `.env`.
