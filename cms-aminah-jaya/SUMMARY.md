# CMS Aminah Jaya — Project Summary

> Content Management System (CMS) untuk toko retail Aminah Jaya, dibangun menggunakan SolidStart dengan Tailwind CSS v4.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | [SolidStart](https://start.solidjs.com) v1.0 (SSR + file-based routing) |
| Runtime / Bundler | [Vinxi](https://vinxi.dev) + Vite 6 |
| UI Library | [Solid.js](https://solidjs.com) v1.9 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Icons | [lucide-solid](https://lucide.dev) v0.475 |
| Router | `@solidjs/router` v0.15 |
| Package Manager | Bun |
| Node Requirement | ≥ 20 |

---

## Struktur Direktori

```
cms-aminah-jaya/
├── src/
│   ├── app.css                  # Design system (tokens, global utilities)
│   ├── app.tsx                  # Root app entry
│   ├── entry-client.tsx         # Client-side hydration entry
│   ├── entry-server.tsx         # SSR entry
│   ├── components/              # Reusable UI components
│   │   ├── Layout.tsx           # Shell: Sidebar + Navbar + page wrapper
│   │   ├── Sidebar.tsx          # Navigasi sidebar (active-aware)
│   │   ├── Navbar.tsx           # Top bar: search, notif, avatar
│   │   ├── DataTable.tsx        # Generic data table + filter toolbar
│   │   ├── StatCard.tsx         # Metric card dengan icon, value, perubahan (%)
│   │   └── ProfileComponents.tsx # PageCard, InfoRow, ActivityItem
│   └── routes/                  # File-based pages (SolidStart)
│       ├── index.tsx            # Dashboard (/)
│       ├── login.tsx            # Halaman login (/login)
│       ├── products.tsx         # Produk (/products)
│       ├── orders.tsx           # Pesanan (/orders)
│       ├── customers.tsx        # Pelanggan (/customers)
│       ├── profile.tsx          # Profil admin (/profile)
│       └── settings.tsx         # Pengaturan (/settings)
└── SUMMARY.md                   # Dokumen ini
```

---

## Halaman & Fitur

### 🏠 Dashboard (`/`)
- **4 StatCard** metrik utama: Total Revenue, Orders, New Customers, Stock Items (dengan badge perubahan % merah/hijau)
- **Tabel Pesanan Terbaru** — 5 kolom, badge status warna
- **Performance Card** — highlight produk terlaris & conversion rate

### 📦 Products (`/products`)
- Tabel produk dengan kolom: ID, Nama, Kategori, Harga, Stok, Status, Aksi
- Filter checklist **Kategori** (Clothing, Health, Food) dan **Status** (In Stock, Low Stock, Out of Stock)
- Search bar global yang memfilter semua kolom
- Tombol aksi Edit dan Delete per baris

### 📋 Orders (`/orders`)
- Tabel pesanan: Order ID, Tanggal, Pelanggan, Produk, Jumlah, Status, Aksi
- Filter checklist **Status** (Paid, Pending, Shipped, Cancelled)
- **Date Range picker** untuk filter berdasarkan tanggal pesanan
- Search bar global

### 👥 Customers (`/customers`)
- **3 StatCard** ringkasan: Total Customers, Active, Total Revenue
- Tabel pelanggan dengan avatar inisial, info kontak (email + telepon) dalam satu kolom
- Filter checklist **Status** (Active, Inactive)

### 👤 Profile (`/profile`)
- **Hero banner** dengan gradient hijau, avatar yang overlap cover (absolute positioning), nama, role, badge aktif, bio
- **Stat chips** inline: Products, Orders, Rating
- Mode **Edit / View** yang dapat di-toggle tanpa navigasi — semua field berubah jadi input saat mode edit aktif
- Bagian kiri: Contact Details (icon-per-row) + About Me
- Bagian kanan: Personal Information form + Recent Activity timeline

### ⚙️ Settings (`/settings`)
- **Store Profile**: nama toko, email, nomor telepon, deskripsi
- **Localization**: pilihan mata uang (IDR, USD, EUR) dan bahasa
- **Notifications**: toggle on/off — Email Notif, New Orders, Low Stock Alerts
- **Appearance**: pilihan tema Light / Dark / System
- **Security**: link ke ganti password, 2FA, sesi aktif
- **Danger Zone**: tombol hapus data toko

---

## Komponen Reusable

### `Layout`
Shell utama untuk semua halaman. Mengelola state sidebar mobile (buka/tutup), menggunakan `<Sidebar>` dan `<Navbar>` secara internal.

```tsx
<Layout title="Products">
  {/* konten halaman */}
</Layout>
```

### `DataTable<T>`
Generic table component yang menerima konfigurasi kolom, data, dan filter.

| Prop | Tipe | Keterangan |
|---|---|---|
| `columns` | `Column<T>[]` | Definisi header + render function per kolom |
| `data` | `T[]` | Array data |
| `searchPlaceholder` | `string?` | Teks placeholder search bar |
| `searchable` | `boolean?` | Nonaktifkan search (default: `true`) |
| `filters` | `FilterDef[]?` | Checklist filter inline |
| `dateFilter` | `{ key, label }?` | Date range picker untuk kolom tanggal |

**Fitur bawaan:** live search (semua kolom), checklist multi-filter, date range filter, empty state, dan clear-all filters.

### `StatCard`
Kartu metrik dengan icon berwarna, nilai, dan badge perubahan (%).

```tsx
<StatCard
  label="Total Revenue"
  value="Rp 12.450.000"
  change="+12.5%"
  icon={TrendingUp}
  color="text-green-500"
  bg="bg-green-50"
/>
```

### `Sidebar`
Navigasi sidebar yang membaca `useLocation()` dari router untuk menentukan link mana yang aktif secara otomatis.

### `Navbar`
Top bar dengan 3 fitur:
1. **Global Search** — menampilkan dropdown hasil pencarian dari semua data (produk, pesanan, pelanggan)
2. **Notification Dropdown** — daftar notifikasi dengan indikator unread (titik merah + highlight)
3. **Avatar** — link ke halaman `/profile`

### `ProfileComponents`
- **`PageCard`** — Card wrapper dengan header title, subtitle, dan slot action opsional
- **`InfoRow`** — Baris info berlabel yang otomatis jadi `<input>` saat `editing={true}`
- **`ActivityItem`** — Item timeline aktivitas (dot, action, detail, timestamp)

---

## Design System (`app.css`)

### Color Palette
| Token | Hex | Penggunaan |
|---|---|---|
| `green-900` | `#0f3d2e` | Background gelap, hero cover |
| `green-700` | `#1a5c42` | Hover button |
| `green-500` | `#2a8a60` | Primary brand color, active states |
| `green-400` | `#3aac78` | Accent, activity dots |
| `green-100` | `#e6f5ee` | Avatar background, badge |
| `green-50`  | `#f3fbf7` | Subtle highlight |
| `sand`      | `#f7f4ef` | Input background, secondary surface |
| `cream`     | `#fdfcfa` | Page background |
| `ink`       | `#1a1a1a` | Teks utama |
| `ink-light` | `#4a4a4a` | Teks sekunder |
| `muted`     | `#8a8a8a` | Label, placeholder |
| `border`    | `#e5e0d8` | Border elemen |

### Typography
- **Sans**: `Plus Jakarta Sans` — body, label, angka
- **Serif**: `Lora` — heading (h1–h6)

### Global Component Classes
| Class | Kegunaan |
|---|---|
| `.filter-input` | Input teks standar (search, form) |
| `.filter-control` | Container filter toolbar (border, bg, rounded) |
| `.filter-date-input` | Input tanggal inline tanpa border sendiri |
| `.filter-label` | Label kecil uppercase di dalam filter-control |
| `.filter-checkbox-box` | Kotak checkbox kustom |
| `.filter-checkbox-box.active` | State terpilih (hijau) |
| `.filter-checkbox-text` | Teks label checkbox |
| `.filter-checkbox-text.active` | Bold saat terpilih |
| `.btn-primary` | Tombol CTA utama (hijau, rounded-xl, shadow) |
| `.glass` | Glassmorphism (bg putih transparan + backdrop blur) |

---

## Design Pattern

### 1. File-Based Routing
SolidStart membaca file di `src/routes/` secara otomatis sebagai halaman. Tidak ada konfigurasi router manual.

### 2. Layout Shell Pattern
Semua halaman dibungkus `<Layout>`. Layout mengelola sidebar state secara terpusat sehingga tidak perlu diulang per halaman.

### 3. Generic Data Table
`DataTable<T>` didesain generic dengan TypeScript sehingga bisa dipakai di halaman mana pun hanya dengan mendefinisikan `columns` dan `data`. Filter dan search sudah built-in.

### 4. Component Composition
Komponen besar dipecah menjadi sub-komponen kecil yang focused (contoh: `ProfileComponents.tsx` berisi `PageCard`, `InfoRow`, `ActivityItem`).

### 5. Inline Style untuk Dynamic Values
Warna dinamis (gradient cover, stat chips) menggunakan `style=""` inline untuk memastikan tidak di-purge oleh Tailwind CSS v4.

### 6. Controlled Edit Mode
Halaman yang memiliki form edit (Profile, Settings) menggunakan `createSignal<boolean>` untuk mengontrol mode view/edit secara reaktif tanpa navigasi ke halaman terpisah.

### 7. Design Token via `@theme`
Semua warna, font, dan radius didefinisikan di satu tempat (`@theme {}` di `app.css`) dan dipakai sebagai Tailwind utility class (`text-ink`, `bg-sand`, `border-border`, dll.).