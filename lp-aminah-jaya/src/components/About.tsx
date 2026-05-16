import { For } from "solid-js";
import { Check } from "lucide-solid";

const checkItems = [
  "Koleksi Pilihan: Produk orisinal yang kami kurasi dengan teliti.",
  "Layanan Personal: Konsultasi produk langsung via WhatsApp untuk kenyamanan Anda.",
  "Pengiriman Aman: Jangkauan pengiriman luas dengan pengemasan yang terjaga.",
  "Harga Jujur: Transparansi harga tanpa biaya tambahan yang membingungkan.",
];



export default function About() {
  return (
    <section class="about" id="tentang">
      <div class="container">
        <div class="about-inner">
          {/* Visual */}
          <div class="about-visual">
            <img src="/store_illustration.jpeg" alt="Ilustrasi Toko" />
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
                      <Check size={11} stroke-width={3} />
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
