import { A } from "@solidjs/router";
import Navbar from "~/components/Navbar";

export default function NotFound() {
  return (
    <div class="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main class="flex-1 flex items-center justify-center py-20 px-4">
        <div class="container max-w-2xl text-center space-y-8">
          <div class="relative flex flex-col items-center">
            {/* Background 404 text */}
            <h1 class="font-serif text-[120px] lg:text-[200px] leading-none text-[#4a654f] opacity-10 select-none">
              404
            </h1>
            {/* Foreground title */}
            <h2 class="font-serif text-3xl lg:text-5xl text-[#1b1c1c] absolute bottom-4 lg:bottom-8 w-full">
              Halaman Tidak Ditemukan
            </h2>
          </div>

          <p class="text-lg text-[#424842] leading-relaxed max-w-md mx-auto font-sans">
            Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan. Mari kembali ke beranda untuk melanjutkan belanja Anda.
          </p>

          <div class="pt-4">
            <A
              href="/"
              class="inline-flex items-center justify-center px-10 py-4 bg-[#4a654f] text-white font-bold rounded-full hover:opacity-90 transition-all shadow-lg hover:shadow-xl group gap-2"
            >
              <span class="material-symbols-outlined">home</span>
              Kembali ke Beranda
            </A>
          </div>

          <div class="pt-12 opacity-30 flex justify-center">
            <div class="w-16 h-1 bg-[#924b25] rounded-full"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
