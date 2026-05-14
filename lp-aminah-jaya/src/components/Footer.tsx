export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div class="container">
        <div class="footer-top">
          {/* Brand */}
          <div>
            <div class="footer-logo">
              <img src="/logo_new.png" alt="Logo" />
              <span>Aminah Jaya</span>
            </div>
            <p>
              Destinasi belanja produk original untuk kebutuhan kesehatan dan fashion muslim. Transaksi aman, layanan ramah, dan kirim ke seluruh Indonesia.
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
