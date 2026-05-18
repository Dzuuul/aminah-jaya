import { For } from "solid-js";
import { BadgeCheck, MessageSquare, Truck } from "lucide-solid";

interface WhyCard {
  icon: any; // Storing the icon component itself
  title: string;
  desc: string;
}

const cards: WhyCard[] = [
  {
    icon: BadgeCheck,
    title: "Produk Berkualitas",
    desc: "Setiap produk telah melalui seleksi ketat dari supplier terpercaya. Kami menjamin keaslian dan kualitas setiap item yang kami jual.",
  },
  {
    icon: MessageSquare,
    title: "Respon Cepat",
    desc: "Tim kami siap membantu Anda melalui WhatsApp. Pertanyaan dan pesanan diproses dalam waktu singkat, bahkan di luar jam kerja.",
  },
  {
    icon: Truck,
    title: "Pengiriman Seluruh Indonesia",
    desc: "Kami mengirim ke seluruh penjuru Indonesia bekerja sama dengan JNE, J&T, SiCepat, dan ekspedisi lainnya. Pesanan dikemas rapi dan aman.",
  },
];

export default function WhyUs() {
  return (
    <section class="why">
      <div class="container">
        <div class="section-header">
          <span class="section-label">Keunggulan Kami</span>
          <h2 class="section-title">Mengapa Pilih Aminah Jaya?</h2>
          <p class="section-sub">
            Kami berkomitmen memberikan pengalaman belanja terbaik untuk setiap pelanggan.
          </p>
        </div>

        <div class="why-grid">
          <For each={cards}>
            {(card) => (
              <div class="why-card">
                <div class="why-icon">
                  <card.icon size={32} />
                </div>
                <div class="why-title">{card.title}</div>
                <p class="why-desc">{card.desc}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
