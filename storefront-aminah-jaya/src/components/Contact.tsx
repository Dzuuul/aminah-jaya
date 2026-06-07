import { MessageCircle, MapPin, Clock } from "lucide-solid";

export default function Contact() {
  return (
    <section class="contact" id="kontak">
      <div class="container">
        <div class="section-header">
          <span class="section-label">Hubungi Kami</span>
          <h2 class="section-title">Siap Membantu Anda</h2>
          <p class="section-sub">
            Jangan ragu untuk menghubungi kami. Kami senang menjawab pertanyaan dan
            membantu proses pemesanan Anda.
          </p>
        </div>

        <div class="contact-inner" style={{ "margin-top": "48px" }}>
          {/* Info kiri */}
          <div class="contact-info">
            {/* WhatsApp */}
            <div class="contact-item">
              <div>
                <MessageCircle size={20} />
              </div>
              <div>
                <div class="contact-item-label">WhatsApp</div>
                <div class="contact-item-val">+62 812-3456-7890</div>
              </div>
            </div>

            {/* Lokasi */}
            <div class="contact-item">
              <div>
                <MapPin size={20} />
              </div>
              <div>
                <div class="contact-item-label">Lokasi</div>
                <div class="contact-item-val">
                  Jl Raya Gampeng RT 01 RW 03, Gampengrejo, Kediri, Jawa Timur,
                  Indonesia
                </div>
              </div>
            </div>

            {/* Jam Operasional */}
            <div class="contact-item">
              <div>
                <Clock size={20} />
              </div>
              <div>
                <div class="contact-item-label">Jam Operasional</div>
                <div class="contact-item-val">Senin – Sabtu, 08.00 – 21.00 WIB</div>
              </div>
            </div>
          </div>

          {/* Card kanan */}
          <div class="contact-card">
            <h3>Langsung Chat Sekarang</h3>
            <p>
              Tidak perlu formulir panjang. Hubungi kami via WhatsApp dan dapatkan
              respons dalam hitungan menit. Kami siap membantu!
            </p>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Aminah%20Jaya%20Store,%20saya%20ingin%20bertanya%20tentang%20produk"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-wa"
            >
              <MessageCircle size={18} />
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
