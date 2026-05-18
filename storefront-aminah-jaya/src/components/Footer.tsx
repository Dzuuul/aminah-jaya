import { A } from "@solidjs/router";
import { Phone, Mail, Camera, Globe } from "lucide-solid";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div class="container">
        <div class="footer-top">
          {/* Brand */}
          <div class="footer-brand">
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
                <a href="https://wa.me/62895634039130" target="_blank" rel="noopener noreferrer" style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
                  <Phone size={18} color="white" />
                  <span>+62 8956-3403-9130</span>
                </a>
              </li>
              <li>
                <a href="mailto:halo@aminahjaya.com" style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
                  <Mail size={18} color="white" />
                  <span>halo@aminahjaya.com</span>
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/aminahjaya_official?igsh=em1hNnNhOHo4MHRz" target="_blank" rel="noopener noreferrer" style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
                  <Camera size={18} color="white" />
                  <span>aminahjaya_official</span>
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/share/1Cqnvzgs6E/" target="_blank" rel="noopener noreferrer" style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
                  <Globe size={18} color="white" />
                  <span>Siti Aminah</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© {year} Aminah Jaya. Hak cipta dilindungi.</span>
          <div class="footer-bottom-links">
            <a href="/kebijakan-privasi">Kebijakan Privasi</a>
            <a href="/syarat-ketentuan">Syarat &amp; Ketentuan</a>
            <a href="/kebijakan-pengembalian">Kebijakan Pengembalian</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
