import { For } from "solid-js";

const categories = [
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
      </svg>
    ),
    title: "Kesehatan & Suplemen",
    desc: "Whey protein, susu kesehatan, vitamin, dan suplemen berkualitas untuk mendukung gaya hidup aktif Anda.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    ),
    title: "Fashion Muslim",
    desc: "Koleksi gamis, baju koko, mukena, dan busana muslim modern dengan bahan nyaman dan harga terjangkau.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    title: "Kebutuhan Harian",
    desc: "Produk rumah tangga, makanan, minuman, dan barang kebutuhan sehari-hari untuk keluarga Anda.",
  },
];

export default function Categories() {
  return (
    <section class="categories" id="kategori">
      <div class="container">
        <div class="section-header">
          <span class="section-label">Kategori Produk</span>
          <h2 class="section-title">Semua Ada di Sini</h2>
          <p class="section-sub">
            Dari kesehatan, fashion, hingga kebutuhan rumah tangga — kami siap melayani
            dengan produk berkualitas pilihan.
          </p>
        </div>

        <div class="cat-grid">
          <For each={categories}>
            {(cat) => (
              <div class="cat-card">
                <div class="cat-icon">{cat.icon}</div>
                <div class="cat-title">{cat.title}</div>
                <p class="cat-desc">{cat.desc}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
