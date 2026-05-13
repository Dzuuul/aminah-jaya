import { For } from "solid-js";
import { JSX } from "solid-js";

interface Product {
  id: string;
  badge?: string;
  icon: JSX.Element;
  imgLabel: string;
  category: string;
  name: string;
  desc: string;
  price: string;
  waText: string;
}

const products: Product[] = [
  {
    id: "whey-protein",
    badge: "Terlaris",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    imgLabel: "Whey Protein",
    category: "Suplemen",
    name: "Whey Protein Premium",
    desc: "Tinggi protein untuk mendukung pembentukan otot. Berbagai rasa tersedia.",
    price: "Rp 350.000",
    waText: "Halo,%20saya%20mau%20pesan%20Whey%20Protein%20Premium",
  },
  {
    id: "susu-kesehatan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1M21 12h1M4.22 19.778l.707-.707M18.364 5.636l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    ),
    imgLabel: "Susu Kesehatan",
    category: "Suplemen",
    name: "Susu Kesehatan Full Cream",
    desc: "Susu berkualitas tinggi, kaya kalsium dan vitamin untuk nutrisi keluarga.",
    price: "Rp 65.000",
    waText: "Halo,%20saya%20mau%20pesan%20Susu%20Kesehatan",
  },
  {
    id: "gamis-muslimah",
    badge: "New",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M7.5 3.75a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V9L13.5 3.75H7.5zM13.5 3.75v4.5a.75.75 0 00.75.75h4.5" />
      </svg>
    ),
    imgLabel: "Gamis Muslimah",
    category: "Fashion Muslim",
    name: "Gamis Syar'i Polos",
    desc: "Gamis bahan premium, adem, dan nyaman dipakai seharian. Tersedia berbagai warna.",
    price: "Rp 185.000",
    waText: "Halo,%20saya%20mau%20pesan%20Gamis%20Syar'i",
  },
  {
    id: "baju-koko",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m-3 0h13.5M6 9v10.25A1.75 1.75 0 007.75 21h8.5A1.75 1.75 0 0018 19.25V9" />
      </svg>
    ),
    imgLabel: "Baju Koko",
    category: "Fashion Muslim",
    name: "Baju Koko Elegan",
    desc: "Tampil rapi dan islami dengan baju koko bahan katun premium, cocok untuk keseharian.",
    price: "Rp 120.000",
    waText: "Halo,%20saya%20mau%20pesan%20Baju%20Koko",
  },
  {
    id: "vitamin-harian",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-3.776 3.763A2.25 2.25 0 0114.25 21H9.75a2.25 2.25 0 01-1.774-.863L4.2 15m15.6 0l-4.2-5.5M4.2 15l4.2-5.5" />
      </svg>
    ),
    imgLabel: "Vitamin Harian",
    category: "Suplemen",
    name: "Vitamin C & Zinc Combo",
    desc: "Daya tahan tubuh meningkat dengan kombinasi vitamin C dosis tinggi dan zinc.",
    price: "Rp 45.000",
    waText: "Halo,%20saya%20mau%20pesan%20Vitamin%20C%20%26%20Zinc",
  },
  {
    id: "kebutuhan-harian",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    imgLabel: "Kebutuhan Harian",
    category: "Kebutuhan Harian",
    name: "Paket Sembako Hemat",
    desc: "Paket kebutuhan dapur lengkap — beras, minyak, gula, dan lainnya dalam satu paket.",
    price: "Rp 250.000",
    waText: "Halo,%20saya%20mau%20pesan%20Paket%20Sembako%20Hemat",
  },
];

const WaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z" />
  </svg>
);

export default function Products() {
  return (
    <section class="products" id="produk">
      <div class="container">
        <div class="products-header-row">
          <div>
            <span class="section-label">Produk Unggulan</span>
            <h2 class="section-title">Rekomendasi Minggu Ini</h2>
            <p class="section-sub">Koleksi khusus pilihan kami, kurasi terbaik untuk memulai perjalanan Anda</p>
          </div>
          <a
            href="https://wa.me/6281234567890?text=Halo,%20saya%20ingin%20melihat%20katalog%20lengkap"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline btn-sm"
            style={{ "white-space": "nowrap", "flex-shrink": "0" }}
          >
            Katalog Lengkap →
          </a>
        </div>

        <div class="prod-grid">
          <For each={products}>
            {(product) => (
              <a href={`/product/${product.id}`} class="prod-card" style={{ "text-decoration": "none", "color": "inherit", "display": "block" }}>
                <div class="prod-img">
                  {product.badge && <span class="prod-badge">{product.badge}</span>}
                  {product.icon}
                  <p>{product.imgLabel}</p>
                </div>
                <div class="prod-body">
                  <div class="prod-cat">{product.category}</div>
                  <div class="prod-name">{product.name}</div>
                  <p class="prod-desc">{product.desc}</p>
                  <div class="prod-footer">
                    <span class="prod-price">{product.price}</span>
                    <div class="btn btn-wa btn-sm">
                      <WaIcon />
                      Detail
                    </div>
                  </div>
                </div>
              </a>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
