export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div class="container">
        <div class="footer-top">
          {/* Brand */}
          <div class="footer-brand">
            <div class="footer-logo">
              <div class="footer-logo-icon">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span class="footer-logo-text">Aminah Jaya Store</span>
            </div>
            <p>
              Toko online terpercaya untuk kebutuhan kesehatan, fashion muslim, dan
              kebutuhan harian Anda. Belanja mudah, langsung via WhatsApp.
            </p>
          </div>

          {/* Navigasi */}
          <div class="footer-col">
            <h4>Navigasi</h4>
            <ul>
              <li><a href="#beranda">Beranda</a></li>
              <li><a href="#kategori">Kategori</a></li>
              <li><a href="#produk">Produk</a></li>
              <li><a href="#tentang">Tentang Kami</a></li>
              <li><a href="#kontak">Kontak</a></li>
            </ul>
          </div>

          {/* Kontak */}
          <div class="footer-col">
            <h4>Kontak</h4>
            <ul>
              <li>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  +62 812-3456-7890
                </a>
              </li>
              {/* <li>
                <a href="mailto:hello@AminahJaya.id">hello@AminahJaya.id</a>
              </li>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Facebook</a></li> */}
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© {year} Aminah Jaya Store. Hak cipta dilindungi.</span>
          <div class="footer-bottom-links">
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat &amp; Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
