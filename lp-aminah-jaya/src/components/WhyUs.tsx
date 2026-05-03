import { For } from "solid-js";
import { JSX } from "solid-js";

interface WhyCard {
  icon: JSX.Element;
  title: string;
  desc: string;
}

const cards: WhyCard[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: "Produk Berkualitas",
    desc: "Setiap produk telah melalui seleksi ketat dari supplier terpercaya. Kami menjamin keaslian dan kualitas setiap item yang kami jual.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: "Respon Cepat",
    desc: "Tim kami siap membantu Anda melalui WhatsApp. Pertanyaan dan pesanan diproses dalam waktu singkat, bahkan di luar jam kerja.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
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
          <h2 class="section-title">Mengapa Pilih AminahJaya?</h2>
          <p class="section-sub">
            Kami berkomitmen memberikan pengalaman belanja terbaik untuk setiap pelanggan.
          </p>
        </div>

        <div class="why-grid">
          <For each={cards}>
            {(card) => (
              <div class="why-card">
                <div class="why-icon">{card.icon}</div>
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
