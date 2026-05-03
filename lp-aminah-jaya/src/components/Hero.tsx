const WaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z" />
  </svg>
);

export default function Hero() {
  return (
    <section class="hero" id="beranda">
      <div class="container">
        <div class="hero-inner">
          {/* Content */}
          <div class="hero-content">
            <div class="hero-badge">
              <span class="hero-badge-dot" />
              Online &amp; Siap Kirim Seluruh Indonesia
            </div>

            <h1 class="hero-title">
              Toko Kebutuhan
              <br />
              Harian &amp; <em>Lifestyle</em>
              <br />
              Terpercaya
            </h1>

            <p class="hero-desc">
              Temukan produk suplemen kesehatan, fashion muslim berkualitas, hingga
              kebutuhan sehari-hari — semua dalam satu tempat. Belanja mudah, cepat,
              langsung via WhatsApp.
            </p>

            <div class="hero-actions">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-wa"
              >
                <WaIcon />
                Chat via WhatsApp
              </a>
              <a href="#produk" class="btn btn-outline">
                Lihat Produk
              </a>
            </div>

            <div class="hero-stats">
              <div>
                <div class="hero-stat-num">500+</div>
                <div class="hero-stat-label">Pelanggan Puas</div>
              </div>
              <div>
                <div class="hero-stat-num">3 Hari</div>
                <div class="hero-stat-label">Rata-rata Pengiriman</div>
              </div>
              <div>
                <div class="hero-stat-num">100%</div>
                <div class="hero-stat-label">Produk Original</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div class="hero-visual">
            <div class="hero-img-main">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p>Ilustrasi Toko</p>
            </div>
            <div class="hero-card-float top-left">
              <div class="float-label">Status Toko</div>
              <div class="float-value">
                <span class="float-dot" /> Buka &amp; Aktif
              </div>
            </div>
            <div class="hero-card-float bottom-right">
              <div class="float-label">Pesanan Hari Ini</div>
              <div class="float-value">🎉&nbsp;&nbsp;24 Pesanan</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
