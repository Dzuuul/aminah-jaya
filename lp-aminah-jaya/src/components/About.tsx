import { For } from "solid-js";

const checkItems = [
  "Koleksi Pilihan: Produk orisinal yang kami kurasi dengan teliti.",
  "Layanan Personal: Konsultasi produk langsung via WhatsApp untuk kenyamanan Anda.",
  "Pengiriman Aman: Jangkauan pengiriman luas dengan pengemasan yang terjaga.",
  "Harga Jujur: Transparansi harga tanpa biaya tambahan yang membingungkan.",
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export default function About() {
  return (
    <section class="about" id="tentang">
      <div class="container">
        <div class="about-inner">
          {/* Visual */}
          <div class="about-visual">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
            <p>Ilustrasi Toko</p>
            <div class="about-visual-badge">
              <div class="num">100% ✨</div>
              <div class="lbl">Jaminan Produk Original</div>
            </div>
          </div>

          {/* Content */}
          <div class="about-content">
            <span class="section-label">Tentang Kami</span>
            <h2 class="section-title">
              Solusi Kebutuhan Keluarga dengan Kualitas Terkurasi
            </h2>
            <p class="section-sub">
              Aminah Jaya hadir untuk menjawab kebutuhan Anda akan produk kesehatan, fashion muslim, dan perlengkapan harian berkualitas. Kami percaya bahwa setiap pelanggan layak mendapatkan produk terbaik tanpa proses yang rumit.
            </p>
            <p class="section-sub" style={{ "margin-top": "12px" }}>
              Setiap item yang kami sediakan telah melalui proses pemilihan yang ketat untuk memastikan keaslian dan manfaatnya bagi Anda. Kami tidak hanya sekadar menjual, tapi ingin menjadi bagian dari perjalanan gaya hidup sehat dan nyaman keluarga Anda.
            </p>

            <div class="about-list">
              <For each={checkItems}>
                {(item) => (
                  <div class="about-item">
                    <div class="about-check">
                      <CheckIcon />
                    </div>
                    <p class="about-item-text">{item}</p>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
