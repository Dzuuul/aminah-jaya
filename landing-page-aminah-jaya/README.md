# Landing Page Aminah Jaya

Landing page multi-brand berbasis SolidStart. Satu aplikasi menampung beberapa halaman brand yang berdiri sendiri, masing-masing dengan CSS terisolasi.

---

## Menjalankan

```bash
bun install
bun run dev      # http://localhost:3003
bun run build && bun run start
```

Node ≥ 22.

---

## Halaman

| Route | Isi |
| ----- | --- |
| `/` | Redirect ke `/waiteu` |
| `/waiteu` | Landing brand WaitEu (`waiteu.tsx` + `waiteu.css`) |
| `/milkmee` | Landing brand MilkMee (`milkmee.tsx` + `milkmee.css`) |

Setiap brand punya file CSS sendiri yang di-`import` dari komponen route-nya. CSS tersebut **belum di-scope** — keduanya mendefinisikan variabel di `:root` dan memakai nama kelas generik (`.hero`, `.topbar`, dst.), jadi style bisa saling menimpa bila kedua halaman dimuat dalam sesi navigasi yang sama. Saat menambah brand, sebaiknya bungkus markup dan selector dengan kelas khusus halaman.

---

## API Route Internal

Proxy sederhana ke [wilayah.id](https://wilayah.id) supaya form alamat tidak memanggil layanan eksternal langsung dari browser:

| Route | Sumber |
| ----- | ------ |
| `GET /api/wilayah/provinces` | `https://wilayah.id/api/provinces.json` |
| `GET /api/wilayah/regencies/:code` | `https://wilayah.id/api/regencies/{code}.json` |

---

## Menambah Brand Baru

1. Buat `src/routes/<brand>.tsx` dan `src/routes/<brand>.css`, lalu `import "./<brand>.css"` di komponen route.
2. Bungkus markup dengan `<div class="<brand>-page">` dan beri prefix kelas itu pada semua selector CSS agar tidak bentrok dengan brand lain.
3. Metadata halaman (`<Title>`, `<Meta>`, `<Link>`) memakai `@solidjs/meta`; animasi scroll-reveal dipasang manual lewat `IntersectionObserver` di dalam `onMount`.
4. `convert.py` di root project membantu mengubah HTML statis satu file (dengan `<style>` inline) menjadi komponen + CSS terpisah. Script ini membaca `src/routes/example.html` dan memetakan `:root`/`body`/`*` ke `.waiteu-page` — sesuaikan nama kelas di dalamnya bila dipakai untuk brand lain.

---

## Deployment

```bash
./deploy.sh
```

Build image Docker lokal → kirim ke VPS → `docker compose up -d --force-recreate`, sama seperti modul lain di ekosistem ini.
