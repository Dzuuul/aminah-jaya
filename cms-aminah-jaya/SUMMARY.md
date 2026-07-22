# CMS Aminah Jaya — Project Summary

> Content Management System (CMS) untuk toko retail Aminah Jaya, dibangun dengan SolidStart yang dijalankan sebagai **SPA** (`ssr: false`) dan CSS custom (tanpa framework utility).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | [SolidStart](https://start.solidjs.com) v1.0 — file-based routing, mode SPA (`ssr: false` di `app.config.ts`) |
| Runtime / Bundler | [Vinxi](https://vinxi.dev) + Vite 6 |
| UI Library | [Solid.js](https://solidjs.com) v1.9 |
| Styling | CSS murni + CSS custom properties di `src/app.css` (**tidak memakai Tailwind**) |
| Ikon | [lucide-solid](https://lucide.dev) v0.475 |
| Animasi | GSAP v3 |
| Router | `@solidjs/router` v0.15 |
| Package Manager | Bun |
| Node Requirement | ≥ 20 |

```bash
bun install
bun run dev      # http://localhost:3001
bun run build && bun run start
```

Backend: `api-cms-aminah-jaya` lewat `VITE_API_BASE` (default `http://localhost:8001/api`).

---

## Struktur Direktori

```
cms-aminah-jaya/
├── app.config.ts                # defineConfig({ ssr: false, ... })
├── src/
│   ├── app.css                  # Design system + seluruh style aplikasi (~2.5k baris)
│   ├── app.tsx                  # Root app entry
│   ├── entry-client.tsx         # Entry client
│   ├── entry-server.tsx         # Entry server (shell HTML)
│   ├── lib/
│   │   ├── api.ts               # fetchApi, token reaktif, formatCurrency
│   │   ├── toast.ts             # Store toast global
│   │   ├── searchStore.ts       # State spotlight search
│   │   └── sidebarStore.ts      # State sidebar terlipat (persist ke localStorage)
│   ├── components/
│   │   ├── Layout.tsx           # Shell: Sidebar + Navbar + wrapper halaman
│   │   ├── Sidebar.tsx          # Navigasi (active-aware, dapat dilipat)
│   │   ├── Navbar.tsx           # Top bar: search, notifikasi, avatar
│   │   ├── DataTable.tsx        # Tabel generic + filter + pagination
│   │   ├── SpotlightSearch.tsx  # Command palette (+ SpotlightSearch.css)
│   │   ├── ProductForm.tsx      # Form produk (create & edit)
│   │   ├── Modal.tsx / ConfirmModal.tsx
│   │   ├── ToastContainer.tsx
│   │   ├── StatCard.tsx
│   │   ├── ProfileComponents.tsx # PageCard, InfoRow, ActivityItem
│   │   └── ui/                  # Button, Input, Toggle, SettingsLayout
│   └── routes/
│       ├── index.tsx            # Dashboard (/)
│       ├── login.tsx            # Login (/login)
│       ├── notifications.tsx    # Notifikasi
│       ├── products/            # index.tsx, create.tsx, [id].tsx
│       ├── categories.tsx
│       ├── collections.tsx
│       ├── flash-sales.tsx
│       ├── blogs/               # index.tsx, create.tsx
│       ├── banners.tsx
│       ├── coupons.tsx
│       ├── orders.tsx
│       ├── customers.tsx
│       ├── legal.tsx
│       ├── profile.tsx
│       └── settings.tsx
└── SUMMARY.md                   # Dokumen ini
```

---

## Navigasi (Sidebar)

Dashboard · Notifikasi · Produk · Kategori · Koleksi · Flash Sale · Blog · Banner · Kupon · Pesanan · Pelanggan · Dokumen Legal · Pengaturan.

Sidebar membaca `useLocation()` untuk menandai link aktif (`startsWith` agar sub-route seperti `/products/create` tetap aktif) dan dapat dilipat — status lipatan disimpan di `localStorage` lewat `sidebarStore`.

---

## Halaman & Fitur

### 🏠 Dashboard (`/`)
- **StatCard** metrik utama dari `/api/dashboard/stats` (revenue, pesanan, pelanggan baru, stok) dengan badge perubahan %
- **Pesanan terbaru** dari `/api/dashboard/recent-orders`
- **Performance card** dari `/api/dashboard/performance`

### 🔐 Login (`/login`)
- `POST /api/auth/login` → token disimpan lewat `updateToken()` ke `localStorage` (`token`) dan signal `authToken`
- Respons `401` dari endpoint mana pun otomatis menghapus token (logout paksa)

### 📦 Produk (`/products`, `/products/create`, `/products/:id`)
- List memakai pagination bawaan `DataTable` di sisi klien; mode server-side saat ini hanya dipakai halaman Pesanan
- Form produk (`ProductForm`) mencakup harga, harga coret, stok, SKU, berat (`weight_gram`), kategori, gambar multi (upload ke R2 via `/api/upload`), serta detail panjang (ingredients, how to use, story, benefits, dosage, dsb.)

### 🗂️ Kategori & Koleksi
- CRUD kategori (`/api/categories`) dan koleksi produk (`/api/collections`)

### ⚡ Flash Sale (`/flash-sales`)
- Event promo dengan waktu mulai/berakhir, harga khusus, dan kuota stok per item
- Status otomatis: *Ongoing*, *Upcoming*, *Ended*

### 📝 Blog (`/blogs`, `/blogs/create`)
- Konten edukasi dengan gambar, status publikasi, dan CTA produk

### 🖼️ Banner (`/banners`)
- Banner storefront dengan gambar, urutan, dan status aktif

### 🎟️ Kupon (`/coupons`)
- Kupon persentase/nominal, minimum belanja, batas pemakaian, masa berlaku

### 📋 Pesanan (`/orders`)
- Tabel pesanan dengan **pagination server-side** (`serverSide` + `meta.total_items`) serta filter status dan rentang tanggal
- Update status via `PATCH /api/orders/:id/status`; menampilkan status pembayaran (termasuk hasil webhook Duitku) dan info kurir/tracking Biteship

### 👥 Pelanggan (`/customers`)
- StatCard ringkasan (`/api/customers/stats`) + tabel pelanggan dengan avatar inisial dan kontak

### 🔔 Notifikasi (`/notifications`)
- List notifikasi, jumlah belum dibaca, dan tandai dibaca

### 📜 Dokumen Legal (`/legal`)
- Editor halaman legal by key (syarat & ketentuan, privasi, pengembalian) — dikonsumsi storefront

### 👤 Profil (`/profile`)
- Hero banner + avatar, stat chips, mode View/Edit tanpa navigasi

### ⚙️ Pengaturan (`/settings`)
- Profil toko, lokalisasi, notifikasi (Toggle), tampilan, dan keamanan — disimpan via `PATCH /api/settings`

---

## Komponen Reusable

### `Layout`
Shell utama semua halaman: mengelola state sidebar mobile dan menyisipkan `<Sidebar>` + `<Navbar>`. `<SpotlightSearch>` dan `<ToastContainer>` dipasang sekali di `src/app.tsx`, bukan di Layout.

```tsx
<Layout title="Produk">
  {/* konten halaman */}
</Layout>
```

### `DataTable<T>`
Tabel generic dengan search, filter checklist, filter tanggal, dan pagination (lokal **atau** server-side).

| Prop | Tipe | Keterangan |
|---|---|---|
| `columns` | `Column<T>[]` | Definisi header + render per kolom |
| `data` | `T[]` | Data baris (halaman aktif saja bila server-side) |
| `searchPlaceholder` | `string?` | Placeholder search bar |
| `searchable` | `boolean?` | Nonaktifkan search (default `true`) |
| `filters` | `FilterDef[]?` | Checklist filter inline |
| `dateFilter` | `{ key, label }?` | Date range picker |
| `pagination` | `boolean?` | Matikan pagination dengan `false` |
| `serverSide` | `boolean?` | Pakai `totalItems` + `onPageChange` alih-alih memotong data di klien |
| `totalItems` | `number?` | Total entri dari `meta.total_items` |
| `currentPage` / `onPageChange` | `number?` / `(page) => void` | Kontrol halaman dari luar |

Footer pagination menampilkan “Menampilkan X hingga Y dari Z entri” dengan nomor halaman ringkas (`1 … 4 5 6 … 12`) dan responsif untuk layar kecil.

### `StatCard`
Kartu metrik dengan ikon berwarna, nilai, dan badge perubahan (%).

### `SpotlightSearch`
Command palette global (dibuka dari Navbar / shortcut) yang menelusuri produk, pesanan, dan pelanggan.

### `ProfileComponents`
`PageCard` (card + header + slot aksi), `InfoRow` (berubah jadi input saat `editing`), `ActivityItem` (timeline).

### `ui/`
`Button`, `Input`, `Toggle`, dan `SettingsLayout` — primitif kecil untuk form dan halaman pengaturan.

---

## Design System (`src/app.css`)

Semua style aplikasi berada di satu file (`app.css`) plus dua CSS pendamping (`SpotlightSearch.css`). Token didefinisikan sebagai CSS custom properties di `:root`.

### Color Palette
| Token | Hex | Penggunaan |
|---|---|---|
| `--color-green-900` | `#0f3d2e` | Background gelap, hero cover |
| `--color-green-700` | `#1a5c42` | Hover button |
| `--color-green-500` | `#2a8a60` | Primary brand color, active state |
| `--color-green-400` | `#3aac78` | Aksen, activity dot |
| `--color-green-100` | `#e6f5ee` | Background avatar, badge |
| `--color-green-50`  | `#f3fbf7` | Highlight halus |
| `--color-sand`      | `#f7f4ef` | Background input, surface sekunder |
| `--color-cream`     | `#fdfcfa` | Background halaman |
| `--color-ink`       | `#1a1a1a` | Teks utama |
| `--color-ink-light` | `#4a4a4a` | Teks sekunder |
| `--color-muted`     | `#8a8a8a` | Label, placeholder |
| `--color-border`    | `#e5e0d8` | Border elemen |

### Typography
- **Sans**: `Plus Jakarta Sans` — body, label, angka
- **Serif**: `Lora` — heading (h1–h6)

### Class Global
| Class | Kegunaan |
|---|---|
| `.filter-input` | Input teks standar (search, form) |
| `.filter-control` | Container filter toolbar |
| `.filter-date-input` | Input tanggal inline |
| `.filter-label` | Label kecil uppercase di dalam filter-control |
| `.filter-checkbox-box` (+ `.active`) | Checkbox kustom |
| `.filter-checkbox-text` (+ `.active`) | Teks label checkbox |
| `.data-table-*` | Bagian tabel: header, baris, pagination |
| `.btn-primary` | Tombol CTA utama |
| `.glass` | Glassmorphism (transparan + backdrop blur) |

---

## Design Pattern

### 1. File-Based Routing
Halaman ditentukan oleh struktur `src/routes/`. Sub-direktori (`products/`, `blogs/`) memakai `index.tsx`, `create.tsx`, dan `[id].tsx`.

### 2. SPA, bukan SSR
`ssr: false` — seluruh render terjadi di browser. Akses `localStorage`/`window` aman, tetapi jangan mengandalkan data yang harus tersedia saat SSR.

### 3. Layout Shell Pattern
Semua halaman dibungkus `<Layout>` yang memusatkan state sidebar, search, dan toast.

### 4. Generic Data Table
`DataTable<T>` cukup diberi `columns` + `data`. Untuk dataset besar, aktifkan `serverSide` dan sambungkan ke pagination `ApiResponse.meta`.

### 5. Signal Store Sederhana
State global (`toast`, `searchStore`, `sidebarStore`, `authToken`) hanya berupa modul yang mengekspor signal — tanpa library state management.

### 6. Satu Sumber Style
Karena tidak ada utility framework, kelas baru ditulis langsung di `app.css` mengikuti penamaan blok yang sudah ada (`data-table-*`, `filter-*`, `sidebar-*`). Nilai dinamis (gradient, warna stat) tetap memakai `style=""` inline.

> **Catatan:** beberapa komponen (mis. `Layout.tsx`) masih memakai nama kelas bergaya Tailwind seperti `fixed inset-0 z-40 lg:hidden`. Kelas itu **tidak terdefinisi di mana pun** dan tidak menghasilkan style apa pun — sisa dari masa sebelum Tailwind dilepas. Jangan menambah kelas serupa; tulis CSS-nya di `app.css`.

### 7. Controlled Edit Mode
Halaman dengan form (Profil, Pengaturan) memakai `createSignal<boolean>` untuk beralih mode view/edit tanpa pindah halaman.
