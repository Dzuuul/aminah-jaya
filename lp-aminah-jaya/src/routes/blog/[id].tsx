import { createResource, Show } from "solid-js";
import { useParams, A } from "@solidjs/router";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

interface BlogDetail {
  id: string;
  title: string;
  content: string;
  image_url: string;
  published_at: string;
  author_name?: string;
  cta_product_id?: string;
  cta_product_name?: string;
  cta_product_price?: number;
}

const fetchBlog = async (id: string) => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
  try {
    const res = await fetch(`${apiUrl}/api/blogs/${id}`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (e) {
    console.error("Failed to fetch blog detail", e);
    return null;
  }
};

export default function BlogDetailPage() {
  const params = useParams();
  const [blog] = createResource(() => params.id, fetchBlog);

  return (
    <div class="min-h-screen bg-white">
      <Navbar />

      <main>
        <Show when={!blog.loading} fallback={
          <div class="container py-24 text-center">
            <div class="animate-pulse flex flex-col items-center gap-4">
              <div class="h-8 w-64 bg-gray-200 rounded"></div>
              <div class="h-4 w-32 bg-gray-100 rounded"></div>
              <div class="h-[400px] w-full max-w-4xl bg-gray-200 rounded-2xl mt-8"></div>
            </div>
          </div>
        }>
          <Show when={blog()} fallback={
            <div class="container py-24 text-center">
              <h1 class="text-3xl font-serif text-[#1b1c1c]">Artikel Tidak Ditemukan</h1>
              <A href="/" class="text-[#4a654f] mt-4 inline-block hover:underline">Kembali ke Beranda</A>
            </div>
          }>
            <article class="pb-24">
              {/* Hero Section */}
              <header class="bg-[#fcf9f8] pt-16 pb-24">
                <div class="container max-w-4xl">
                  <div class="flex flex-col items-center text-center space-y-6">
                    <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#4a654f]">
                      <span>Artikel & Wawasan</span>
                      <span class="w-1 h-1 rounded-full bg-[#4a654f]/30"></span>
                      <span>{new Date(blog()!.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    
                    <h1 class="font-serif text-4xl lg:text-6xl text-[#1b1c1c] leading-tight">
                      {blog()!.title}
                    </h1>

                    <div class="flex items-center gap-3 pt-4">
                      <div class="w-10 h-10 rounded-full bg-[#4a654f] flex items-center justify-center text-white font-bold">
                        {blog()!.author_name?.[0] || "A"}
                      </div>
                      <div class="text-left">
                        <p class="text-sm font-bold text-[#1b1c1c] leading-none">{blog()!.author_name || "Tim Aminah Jaya"}</p>
                        <p class="text-xs text-[#424842] mt-1">Editor & Penulis</p>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Image */}
              <div class="container max-w-5xl -mt-16">
                <div class="aspect-video lg:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img 
                    src={blog()!.image_url || "https://placehold.co/1200x600/2a8a60/white?text=Aminah+Jaya"} 
                    alt={blog()!.title} 
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Content */}
              <div class="container max-w-3xl mt-16 lg:mt-24">
                <div 
                  class="blog-content"
                  innerHTML={blog()!.content}
                />

                {/* CTA Block */}
                <Show when={blog()!.cta_product_id}>
                  <div class="mt-24 p-8 lg:p-12 bg-[#4a654f]/5 rounded-3xl border border-[#4a654f]/10 flex flex-col md:flex-row items-center gap-8">
                    <div class="flex-1 space-y-4 text-center md:text-left">
                      <span class="inline-block px-3 py-1 bg-[#4a654f] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                        Rekomendasi Produk
                      </span>
                      <h3 class="text-2xl font-serif text-[#1b1c1c]">{blog()!.cta_product_name}</h3>
                      <p class="text-[#424842]">Tingkatkan kualitas ibadah dan gaya hidup Anda dengan produk pilihan kami yang relevan dengan artikel ini.</p>
                      <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                        <A 
                          href={`/product/${blog()!.cta_product_id}`} 
                          class="bg-[#4a654f] text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all shadow-lg"
                        >
                          Lihat Produk
                        </A>
                        <Show when={blog()!.cta_product_price}>
                          <span class="text-xl font-bold text-[#924b25]">
                            Rp {blog()!.cta_product_price?.toLocaleString('id-ID')}
                          </span>
                        </Show>
                      </div>
                    </div>
                    <div class="w-48 h-48 bg-white rounded-2xl shadow-md flex items-center justify-center p-4 border border-[#4a654f]/10">
                      <img src="/logo.png" alt="Product" class="max-w-full max-h-full object-contain opacity-20" />
                    </div>
                  </div>
                </Show>

                {/* Share & Footer Article */}
                <div class="mt-24 pt-12 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div class="flex items-center gap-4">
                    <span class="text-sm font-bold text-[#1b1c1c]">Bagikan:</span>
                    <div class="flex gap-2">
                      <button class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#4a654f] hover:text-white transition-all">
                        <span class="material-symbols-outlined text-sm">share</span>
                      </button>
                    </div>
                  </div>
                  <A href="/" class="text-sm font-bold text-[#4a654f] flex items-center gap-2 hover:gap-3 transition-all">
                    <span>Kembali ke Beranda</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </A>
                </div>
              </div>
            </article>
          </Show>
        </Show>
      </main>

      <Footer />
    </div>
  );
}
