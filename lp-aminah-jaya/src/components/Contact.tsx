const WaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z" />
  </svg>
);

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
              <div class="contact-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z" />
                </svg>
              </div>
              <div>
                <div class="contact-item-label">WhatsApp</div>
                <div class="contact-item-val">+62 812-3456-7890</div>
              </div>
            </div>

            {/* Email */}
            {/* <div class="contact-item">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <div class="contact-item-label">Email</div>
                <div class="contact-item-val">hello@AminahJaya.id</div>
              </div>
            </div> */}

            {/* Lokasi */}
            <div class="contact-item">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div>
                <div class="contact-item-label">Lokasi</div>
                <div class="contact-item-val">Kediri (Online Store)</div>
              </div>
            </div>

            {/* Jam Operasional */}
            <div class="contact-item">
              <div class="contact-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
              <WaIcon />
              Hubungi via WhatsApp
            </a>
            {/* <div class="divider-or">atau</div>
            <a href="mailto:hello@AminahJaya.id" class="contact-email-link">
              hello@AminahJaya.id
            </a> */}
          </div>
        </div>
      </div>
    </section>
  );
}
