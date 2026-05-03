import { createComponent, ssr, ssrHydrationKey, escape, ssrStyleProperty } from 'file:///home/prime/Projects/Bussiness/Aminah/lp-aminah-jaya/node_modules/solid-js/web/dist/server.js';
import { createSignal, onMount, For } from 'file:///home/prime/Projects/Bussiness/Aminah/lp-aminah-jaya/node_modules/solid-js/dist/server.js';

var _tmpl$$8 = ["<nav", ' class="navbar" style="', '"><div class="container"><a href="#beranda" class="nav-logo"><div class="nav-logo-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg></div><span class="nav-logo-text">Aminah<span>Jaya</span></span></a><ul class="nav-links"><li><a href="#kategori">Kategori</a></li><li><a href="#produk">Produk</a></li><li><a href="#tentang">Tentang</a></li><li><a href="#kontak">Kontak</a></li></ul><a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" class="btn btn-wa nav-cta btn-sm"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path><path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"></path></svg>WhatsApp</a><button class="hamburger" aria-label="Menu"><span></span><span></span><span></span></button></div></nav>'];
function Navbar() {
  const [scrolled, setScrolled] = createSignal(false);
  onMount(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });
  return ssr(_tmpl$$8, ssrHydrationKey(), ssrStyleProperty("box-shadow:", scrolled() ? "0 4px 20px rgba(0,0,0,0.08)" : "none"));
}
var _tmpl$$7 = ["<svg", ' width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path><path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"></path></svg>'], _tmpl$2$5 = ["<section", ' class="hero" id="beranda"><div class="container"><div class="hero-inner"><div class="hero-content"><div class="hero-badge"><span class="hero-badge-dot"></span>Online &amp; Siap Kirim Seluruh Indonesia</div><h1 class="hero-title">Toko Kebutuhan<br>Harian &amp; <em>Lifestyle</em><br>Terpercaya</h1><p class="hero-desc">Temukan produk suplemen kesehatan, fashion muslim berkualitas, hingga kebutuhan sehari-hari \u2014 semua dalam satu tempat. Belanja mudah, cepat, langsung via WhatsApp.</p><div class="hero-actions"><a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" class="btn btn-wa"><!--$-->', '<!--/-->Chat via WhatsApp</a><a href="#produk" class="btn btn-outline">Lihat Produk</a></div><div class="hero-stats"><div><div class="hero-stat-num">500+</div><div class="hero-stat-label">Pelanggan Puas</div></div><div><div class="hero-stat-num">3 Hari</div><div class="hero-stat-label">Rata-rata Pengiriman</div></div><div><div class="hero-stat-num">100%</div><div class="hero-stat-label">Produk Original</div></div></div></div><div class="hero-visual"><div class="hero-img-main"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg><p>Ilustrasi Toko</p></div><div class="hero-card-float top-left"><div class="float-label">Status Toko</div><div class="float-value"><span class="float-dot"></span> Buka &amp; Aktif</div></div><div class="hero-card-float bottom-right"><div class="float-label">Pesanan Hari Ini</div><div class="float-value">\u{1F389}&nbsp;&nbsp;24 Pesanan</div></div></div></div></div></section>'];
const WaIcon$2 = () => ssr(_tmpl$$7, ssrHydrationKey());
function Hero() {
  return ssr(_tmpl$2$5, ssrHydrationKey(), escape(createComponent(WaIcon$2, {})));
}
var _tmpl$$6 = ["<svg", ' viewBox="0 0 24 24"><path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z"></path></svg>'], _tmpl$2$4 = ["<svg", ' viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"></path></svg>'], _tmpl$3$3 = ["<svg", ' viewBox="0 0 24 24"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"></path></svg>'], _tmpl$4$2 = ["<section", ' class="categories" id="kategori"><div class="container"><div class="section-header"><span class="section-label">Kategori Produk</span><h2 class="section-title">Semua Ada di Sini</h2><p class="section-sub">Dari kesehatan, fashion, hingga kebutuhan rumah tangga \u2014 kami siap melayani dengan produk berkualitas pilihan.</p></div><div class="cat-grid">', "</div></div></section>"], _tmpl$5$2 = ["<div", ' class="cat-card"><div class="cat-icon">', '</div><div class="cat-title">', '</div><p class="cat-desc">', "</p></div>"];
const categories = [{
  icon: ssr(_tmpl$$6, ssrHydrationKey()),
  title: "Kesehatan & Suplemen",
  desc: "Whey protein, susu kesehatan, vitamin, dan suplemen berkualitas untuk mendukung gaya hidup aktif Anda."
}, {
  icon: ssr(_tmpl$2$4, ssrHydrationKey()),
  title: "Fashion Muslim",
  desc: "Koleksi gamis, baju koko, mukena, dan busana muslim modern dengan bahan nyaman dan harga terjangkau."
}, {
  icon: ssr(_tmpl$3$3, ssrHydrationKey()),
  title: "Kebutuhan Harian",
  desc: "Produk rumah tangga, makanan, minuman, dan barang kebutuhan sehari-hari untuk keluarga Anda."
}];
function Categories() {
  return ssr(_tmpl$4$2, ssrHydrationKey(), escape(createComponent(For, {
    each: categories,
    children: (cat) => ssr(_tmpl$5$2, ssrHydrationKey(), escape(cat.icon), escape(cat.title), escape(cat.desc))
  })));
}
var _tmpl$$5 = ["<svg", ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'], _tmpl$2$3 = ["<svg", ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1M21 12h1M4.22 19.778l.707-.707M18.364 5.636l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>'], _tmpl$3$2 = ["<svg", ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M7.5 3.75a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V9L13.5 3.75H7.5zM13.5 3.75v4.5a.75.75 0 00.75.75h4.5"></path></svg>'], _tmpl$4$1 = ["<svg", ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m-3 0h13.5M6 9v10.25A1.75 1.75 0 007.75 21h8.5A1.75 1.75 0 0018 19.25V9"></path></svg>'], _tmpl$5$1 = ["<svg", ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-3.776 3.763A2.25 2.25 0 0114.25 21H9.75a2.25 2.25 0 01-1.774-.863L4.2 15m15.6 0l-4.2-5.5M4.2 15l4.2-5.5"></path></svg>'], _tmpl$6 = ["<svg", ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"></path></svg>'], _tmpl$7 = ["<svg", ' width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path><path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"></path></svg>'], _tmpl$8 = ["<section", ' class="products" id="produk"><div class="container"><div class="products-header-row"><div><span class="section-label">Produk Unggulan</span><h2 class="section-title">Pilihan Terlaris</h2><p class="section-sub">Produk paling banyak dipesan oleh pelanggan kami.</p></div><a href="https://wa.me/6281234567890?text=Halo,%20saya%20ingin%20melihat%20katalog%20lengkap" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="', '">Katalog Lengkap \u2192</a></div><div class="prod-grid">', "</div></div></section>"], _tmpl$9 = ["<div", ' class="prod-card"><div class="prod-img"><!--$-->', "<!--/--><!--$-->", "<!--/--><p>", '</p></div><div class="prod-body"><div class="prod-cat">', '</div><div class="prod-name">', '</div><p class="prod-desc">', '</p><div class="prod-footer"><span class="prod-price">', '</span><a href="', '" target="_blank" rel="noopener noreferrer" class="btn btn-wa btn-sm"><!--$-->', "<!--/-->Pesan</a></div></div></div>"], _tmpl$0 = ["<span", ' class="prod-badge">', "</span>"];
const products = [{
  badge: "Terlaris",
  icon: ssr(_tmpl$$5, ssrHydrationKey()),
  imgLabel: "Whey Protein",
  category: "Suplemen",
  name: "Whey Protein Premium",
  desc: "Tinggi protein untuk mendukung pembentukan otot. Berbagai rasa tersedia.",
  price: "Rp 350.000",
  waText: "Halo,%20saya%20mau%20pesan%20Whey%20Protein%20Premium"
}, {
  icon: ssr(_tmpl$2$3, ssrHydrationKey()),
  imgLabel: "Susu Kesehatan",
  category: "Suplemen",
  name: "Susu Kesehatan Full Cream",
  desc: "Susu berkualitas tinggi, kaya kalsium dan vitamin untuk nutrisi keluarga.",
  price: "Rp 65.000",
  waText: "Halo,%20saya%20mau%20pesan%20Susu%20Kesehatan"
}, {
  badge: "New",
  icon: ssr(_tmpl$3$2, ssrHydrationKey()),
  imgLabel: "Gamis Muslimah",
  category: "Fashion Muslim",
  name: "Gamis Syar'i Polos",
  desc: "Gamis bahan premium, adem, dan nyaman dipakai seharian. Tersedia berbagai warna.",
  price: "Rp 185.000",
  waText: "Halo,%20saya%20mau%20pesan%20Gamis%20Syar'i"
}, {
  icon: ssr(_tmpl$4$1, ssrHydrationKey()),
  imgLabel: "Baju Koko",
  category: "Fashion Muslim",
  name: "Baju Koko Elegan",
  desc: "Tampil rapi dan islami dengan baju koko bahan katun premium, cocok untuk keseharian.",
  price: "Rp 120.000",
  waText: "Halo,%20saya%20mau%20pesan%20Baju%20Koko"
}, {
  icon: ssr(_tmpl$5$1, ssrHydrationKey()),
  imgLabel: "Vitamin Harian",
  category: "Suplemen",
  name: "Vitamin C & Zinc Combo",
  desc: "Daya tahan tubuh meningkat dengan kombinasi vitamin C dosis tinggi dan zinc.",
  price: "Rp 45.000",
  waText: "Halo,%20saya%20mau%20pesan%20Vitamin%20C%20%26%20Zinc"
}, {
  icon: ssr(_tmpl$6, ssrHydrationKey()),
  imgLabel: "Kebutuhan Harian",
  category: "Kebutuhan Harian",
  name: "Paket Sembako Hemat",
  desc: "Paket kebutuhan dapur lengkap \u2014 beras, minyak, gula, dan lainnya dalam satu paket.",
  price: "Rp 250.000",
  waText: "Halo,%20saya%20mau%20pesan%20Paket%20Sembako%20Hemat"
}];
const WaIcon$1 = () => ssr(_tmpl$7, ssrHydrationKey());
function Products() {
  return ssr(_tmpl$8, ssrHydrationKey(), ssrStyleProperty("white-space:", "nowrap") + ssrStyleProperty(";flex-shrink:", "0"), escape(createComponent(For, {
    each: products,
    children: (product) => ssr(_tmpl$9, ssrHydrationKey(), product.badge && ssr(_tmpl$0, ssrHydrationKey(), escape(product.badge)), escape(product.icon), escape(product.imgLabel), escape(product.category), escape(product.name), escape(product.desc), escape(product.price), `https://wa.me/6281234567890?text=${escape(product.waText, true)}`, escape(createComponent(WaIcon$1, {})))
  })));
}
var _tmpl$$4 = ["<svg", ' viewBox="0 0 24 24"><path d="M4.5 12.75l6 6 9-13.5"></path></svg>'], _tmpl$2$2 = ["<section", ' class="about" id="tentang"><div class="container"><div class="about-inner"><div class="about-visual"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"></path></svg><p>Ilustrasi Toko</p><div class="about-visual-badge"><div class="num">4.9 \u2B50</div><div class="lbl">Rating Pelanggan</div></div></div><div class="about-content"><span class="section-label">Tentang Kami</span><h2 class="section-title">Toko Terpercaya untuk Semua Kebutuhan Anda</h2><p class="section-sub">Aminah Jaya Store hadir untuk memudahkan Anda mendapatkan produk kesehatan, fashion muslim, dan kebutuhan sehari-hari dengan kualitas terjamin dan harga yang bersahabat.</p><p class="section-sub" style="', '">Kami beroperasi secara online dan melayani seluruh wilayah Indonesia melalui WhatsApp Business. Kepuasan pelanggan adalah prioritas utama kami, dengan respon cepat dan proses pemesanan yang mudah.</p><div class="about-list">', "</div></div></div></div></section>"], _tmpl$3$1 = ["<div", ' class="about-item"><div class="about-check">', '</div><p class="about-item-text">', "</p></div>"];
const checkItems = ["Produk 100% original, dipilih dari supplier terpercaya", "Layanan via WhatsApp Business, respon dalam hitungan menit", "Pengiriman ke seluruh Indonesia dengan jasa ekspedisi terpercaya", "Harga transparan, tanpa biaya tersembunyi"];
const CheckIcon = () => ssr(_tmpl$$4, ssrHydrationKey());
function About() {
  return ssr(_tmpl$2$2, ssrHydrationKey(), ssrStyleProperty("margin-top:", "12px"), escape(createComponent(For, {
    each: checkItems,
    children: (item) => ssr(_tmpl$3$1, ssrHydrationKey(), escape(createComponent(CheckIcon, {})), escape(item))
  })));
}
var _tmpl$$3 = ["<svg", ' viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"></path></svg>'], _tmpl$2$1 = ["<svg", ' viewBox="0 0 24 24"><path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"></path></svg>'], _tmpl$3 = ["<svg", ' viewBox="0 0 24 24"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"></path></svg>'], _tmpl$4 = ["<section", ' class="why"><div class="container"><div class="section-header"><span class="section-label">Keunggulan Kami</span><h2 class="section-title">Mengapa Pilih AminahJaya?</h2><p class="section-sub">Kami berkomitmen memberikan pengalaman belanja terbaik untuk setiap pelanggan.</p></div><div class="why-grid">', "</div></div></section>"], _tmpl$5 = ["<div", ' class="why-card"><div class="why-icon">', '</div><div class="why-title">', '</div><p class="why-desc">', "</p></div>"];
const cards = [{
  icon: ssr(_tmpl$$3, ssrHydrationKey()),
  title: "Produk Berkualitas",
  desc: "Setiap produk telah melalui seleksi ketat dari supplier terpercaya. Kami menjamin keaslian dan kualitas setiap item yang kami jual."
}, {
  icon: ssr(_tmpl$2$1, ssrHydrationKey()),
  title: "Respon Cepat",
  desc: "Tim kami siap membantu Anda melalui WhatsApp. Pertanyaan dan pesanan diproses dalam waktu singkat, bahkan di luar jam kerja."
}, {
  icon: ssr(_tmpl$3, ssrHydrationKey()),
  title: "Pengiriman Seluruh Indonesia",
  desc: "Kami mengirim ke seluruh penjuru Indonesia bekerja sama dengan JNE, J&T, SiCepat, dan ekspedisi lainnya. Pesanan dikemas rapi dan aman."
}];
function WhyUs() {
  return ssr(_tmpl$4, ssrHydrationKey(), escape(createComponent(For, {
    each: cards,
    children: (card) => ssr(_tmpl$5, ssrHydrationKey(), escape(card.icon), escape(card.title), escape(card.desc))
  })));
}
var _tmpl$$2 = ["<svg", ' width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path><path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"></path></svg>'], _tmpl$2 = ["<section", ' class="contact" id="kontak"><div class="container"><div class="section-header"><span class="section-label">Hubungi Kami</span><h2 class="section-title">Siap Membantu Anda</h2><p class="section-sub">Jangan ragu untuk menghubungi kami. Kami senang menjawab pertanyaan dan membantu proses pemesanan Anda.</p></div><div class="contact-inner" style="', '"><div class="contact-info"><div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path><path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"></path></svg></div><div><div class="contact-item-label">WhatsApp</div><div class="contact-item-val">+62 812-3456-7890</div></div></div><div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"></path></svg></div><div><div class="contact-item-label">Lokasi</div><div class="contact-item-val">Kediri (Online Store)</div></div></div><div class="contact-item"><div class="contact-icon"><svg viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><div class="contact-item-label">Jam Operasional</div><div class="contact-item-val">Senin \u2013 Sabtu, 08.00 \u2013 21.00 WIB</div></div></div></div><div class="contact-card"><h3>Langsung Chat Sekarang</h3><p>Tidak perlu formulir panjang. Hubungi kami via WhatsApp dan dapatkan respons dalam hitungan menit. Kami siap membantu!</p><a href="https://wa.me/6281234567890?text=Halo%20Aminah%20Jaya%20Store,%20saya%20ingin%20bertanya%20tentang%20produk" target="_blank" rel="noopener noreferrer" class="btn btn-wa"><!--$-->', "<!--/-->Hubungi via WhatsApp</a></div></div></div></section>"];
const WaIcon = () => ssr(_tmpl$$2, ssrHydrationKey());
function Contact() {
  return ssr(_tmpl$2, ssrHydrationKey(), ssrStyleProperty("margin-top:", "48px"), escape(createComponent(WaIcon, {})));
}
var _tmpl$$1 = ["<footer", '><div class="container"><div class="footer-top"><div class="footer-brand"><div class="footer-logo"><div class="footer-logo-icon"><svg viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg></div><span class="footer-logo-text">Aminah Jaya Store</span></div><p>Toko online terpercaya untuk kebutuhan kesehatan, fashion muslim, dan kebutuhan harian Anda. Belanja mudah, langsung via WhatsApp.</p></div><div class="footer-col"><h4>Navigasi</h4><ul><li><a href="#beranda">Beranda</a></li><li><a href="#kategori">Kategori</a></li><li><a href="#produk">Produk</a></li><li><a href="#tentang">Tentang Kami</a></li><li><a href="#kontak">Kontak</a></li></ul></div><div class="footer-col"><h4>Kontak</h4><ul><li><a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">+62 812-3456-7890</a></li></ul></div></div><div class="footer-bottom"><span>\xA9 <!--$-->', '<!--/--> Aminah Jaya Store. Hak cipta dilindungi.</span><div class="footer-bottom-links"><a href="#">Kebijakan Privasi</a><a href="#">Syarat &amp; Ketentuan</a></div></div></div></footer>'];
function Footer() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return ssr(_tmpl$$1, ssrHydrationKey(), escape(year));
}
var _tmpl$ = ["<main", "><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--></main>"];
const id$$ = "src/routes/index.tsx?pick=default&pick=$css";
function Home() {
  return [createComponent(Navbar, {}), ssr(_tmpl$, ssrHydrationKey(), escape(createComponent(Hero, {})), escape(createComponent(Categories, {})), escape(createComponent(Products, {})), escape(createComponent(About, {})), escape(createComponent(WhyUs, {})), escape(createComponent(Contact, {}))), createComponent(Footer, {})];
}

export { Home as default, id$$ };
//# sourceMappingURL=index-ejhj5Jbj.mjs.map
