import { createResource, Show } from "solid-js";
import { useParams, A } from "@solidjs/router";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import { Share2, ArrowRight, User } from "lucide-solid";
import "./BlogDetail.css";

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
    <div class="blog-detail-page">
      <Navbar />

      <main>
        <Show when={!blog.loading} fallback={
          <div class="container blog-loading-container">
            <div class="blog-skeleton">
              <div class="skeleton-title"></div>
              <div class="skeleton-meta"></div>
              <div class="skeleton-image"></div>
            </div>
          </div>
        }>
          <Show when={blog()} fallback={
            <div class="container blog-error-container">
              <h1 class="blog-not-found-title">Artikel Tidak Ditemukan</h1>
              <A href="/" class="blog-back-link">Kembali ke Beranda</A>
            </div>
          }>
            <article class="blog-article">
              {/* Hero Section */}
              <header class="blog-article-header">
                <div class="container max-w-4xl">
                  <div class="blog-header-inner">
                    <div class="blog-meta-top">
                      <span>Artikel & Wawasan</span>
                      <span class="blog-meta-dot"></span>
                      <span>{new Date(blog()!.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>

                    <h1 class="blog-title">
                      {blog()!.title}
                    </h1>

                    <div class="blog-author-box">
                      <div class="blog-author-avatar">
                        <Show when={blog()!.author_name} fallback={<User size={20} />}>
                          {blog()!.author_name?.[0]}
                        </Show>
                      </div>
                      <div class="blog-author-info">
                        <p class="blog-author-name">{blog()!.author_name || "Tim Aminah Jaya"}</p>
                        <p class="blog-author-role">Editor & Penulis</p>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Image */}
              <div class="container max-w-5xl blog-main-image-container">
                <div class="blog-main-image-wrapper">
                  <img
                    src={blog()!.image_url || "https://placehold.co/1200x600/2a8a60/white?text=Aminah+Jaya"}
                    alt={blog()!.title}
                    class="blog-main-image"
                  />
                </div>
              </div>

              {/* Content */}
              <div class="container max-w-3xl blog-content-wrapper">
                <div
                  class="blog-content"
                  innerHTML={blog()!.content}
                />

                {/* CTA Block */}
                <Show when={blog()!.cta_product_id}>
                  <div class="blog-cta-block">
                    <div class="blog-cta-content">
                      <span class="blog-cta-badge">
                        Rekomendasi Produk
                      </span>
                      <h3 class="blog-cta-title">{blog()!.cta_product_name}</h3>
                      <p class="blog-cta-desc">Tingkatkan kualitas ibadah dan gaya hidup Anda dengan produk pilihan kami yang relevan dengan artikel ini.</p>
                      <div class="blog-cta-actions">
                        <A
                          href={`/product/${blog()!.cta_product_id}`}
                          class="btn btn-primary"
                        >
                          Lihat Produk
                        </A>
                        <Show when={blog()!.cta_product_price}>
                          <span class="blog-cta-price">
                            Rp {blog()!.cta_product_price?.toLocaleString('id-ID')}
                          </span>
                        </Show>
                      </div>
                    </div>
                    <div class="blog-cta-image-box">
                      <img src="/logo.png" alt="Product" class="blog-cta-logo-placeholder" />
                    </div>
                  </div>
                </Show>

                {/* Share & Footer Article */}
                <div class="blog-footer-actions">
                  <div class="blog-share-box">
                    <span class="blog-share-label">Bagikan:</span>
                    <div class="flex gap-2">
                      <button class="blog-share-btn" title="Bagikan Artikel">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                  <A href="/" class="blog-nav-back">
                    <span>Kembali ke Beranda</span>
                    <ArrowRight size={16} />
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
