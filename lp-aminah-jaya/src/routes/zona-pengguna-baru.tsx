import { createSignal, onMount } from "solid-js";
import { A } from "@solidjs/router";
import Navbar from "~/components/Navbar";

export default function NewUserZone() {
  return (
    <main class="new-user-zone">
      <Navbar />
      
      {/* Hero Section */}
      <section class="hero-mini" style={{
        background: "linear-gradient(135deg, var(--green-700) 0%, var(--green-900) 100%)",
        padding: "100px 0 60px",
        color: "white",
        "text-align": "center"
      }}>
        <div class="container">
          <span class="section-label" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>Khusus Pengguna Baru</span>
          <h1 class="hero-title" style={{ color: "white", "margin-top": "20px" }}>Selamat Datang di <em>Aminah Jaya</em></h1>
          <p class="hero-desc" style={{ color: "rgba(255,255,255,0.8)", margin: "0 auto 30px" }}>
            Nikmati penawaran eksklusif, diskon spesial, dan berbagai keuntungan lainnya hanya untuk Anda yang baru bergabung.
          </p>
        </div>
      </section>

      {/* Benefits Grid */}
      <section class="benefits-new" style={{ padding: "80px 0", background: "var(--cream)" }}>
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Keuntungan Anda</h2>
            <p class="section-sub">Mulai perjalanan belanja Anda dengan pengalaman yang menyenangkan.</p>
          </div>

          <div class="why-grid" style={{ "margin-top": "40px" }}>
            <div class="why-card">
              <div class="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                  <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
                </svg>
              </div>
              <h3 class="why-title">Voucher Diskon 50%</h3>
              <p class="why-desc">Gunakan kode promo AMINAHBARU untuk potongan langsung pada pesanan pertama Anda.</p>
            </div>

            <div class="why-card">
              <div class="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <h3 class="why-title">Gratis Ongkir Se-Indonesia</h3>
              <p class="why-desc">Tanpa minimal belanja untuk pengiriman pertama ke seluruh wilayah Indonesia.</p>
            </div>

            <div class="why-card">
              <div class="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <h3 class="why-title">Poin Reward Ganda</h3>
              <p class="why-desc">Dapatkan poin 2x lebih banyak untuk setiap transaksi selama bulan pertama.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section class="cta-section" style={{ padding: "80px 0", background: "white" }}>
        <div class="container" style={{ "text-align": "center" }}>
          <div class="contact-card" style={{ "max-width": "800px", margin: "0 auto" }}>
            <h3>Siap Mulai Berbelanja?</h3>
            <p>Jelajahi koleksi busana muslim dan perlengkapan ibadah terbaik kami sekarang juga.</p>
            <div class="hero-actions" style={{ "justify-content": "center" }}>
              <A href="/shop" class="btn btn-primary">Lihat Koleksi Produk</A>
              <A href="/" class="btn btn-outline">Kembali ke Beranda</A>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ background: "var(--ink)", color: "white", padding: "40px 0", "text-align": "center" }}>
        <div class="container">
          <p>&copy; 2025 Aminah Jaya. Semua Hak Dilindungi.</p>
        </div>
      </footer>
    </main>
  );
}
