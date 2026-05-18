import { For, createResource, Show } from "solid-js";

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  image_url: string;
  published_at: string;
  cta_product_name?: string;
}

const fetchLatestBlogs = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
  try {
    const res = await fetch(`${apiUrl}/api/blogs/latest`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (e) {
    console.error("Failed to fetch blogs", e);
    return [];
  }
};

export default function BlogSection() {
  const [blogs] = createResource<Blog[]>(fetchLatestBlogs);

  return (
    <section class="blog-section" id="blog">
      <div class="container">
        <div class="section-header">
          <span class="section-label">Artikel & Tips</span>
          <h2 class="section-title">Wawasan Untuk Anda</h2>
          <p class="section-sub">Dapatkan tips fashion, kesehatan, dan gaya hidup muslim terbaru dari kami.</p>
        </div>

        <div class="blog-grid">
          <Show when={!blogs.loading} fallback={<div class="loading-state">Memuat artikel...</div>}>
            <For each={blogs()}>
              {(post) => (
                <div class="blog-card">
                  <div class="blog-img">
                    <img src={post.image_url || "https://placehold.co/600x400/2a8a60/white?text=Aminah+Jaya"} alt={post.title} />
                    <div class="blog-date">
                      {new Date(post.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div class="blog-body">
                    <h3 class="blog-title">{post.title}</h3>
                    <p class="blog-excerpt">{post.excerpt}</p>
                    <div class="blog-footer">
                      <a href={`/blog/${post.id}`} class="blog-link">Baca Selengkapnya →</a>
                      <Show when={post.cta_product_name}>
                        <div class="blog-cta-badge">Produk Terkait</div>
                      </Show>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </section>
  );
}
