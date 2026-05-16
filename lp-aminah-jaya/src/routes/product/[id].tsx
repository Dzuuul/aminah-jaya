import { createSignal, Switch, Match, For, Show, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";

// --- Types ---

type Ingredient = {
  name: string;
  desc: string;
};

type HowTo = {
  num: number;
  text: string;
};

type Benefit = {
  name: string;
  icon: string;
};

type RelatedProduct = {
  name: string;
  price: string;
  image: string;
  rating: string;
};

type Product = {
  id: string;
  name: string;
  subtitle?: string;
  category: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  rating: number;
  reviewsCount: number;
  soldCount: string;
  images: string[];
  certifications: string[];
  variants: string[];
  desc: string;
  ingredients: Ingredient[];
  howToUse: HowTo[];
  story: {
    heading: string;
    subheading: string;
    image: string;
  };
  macro: {
    title: string;
    desc: string;
    image: string;
    specs: { icon: string; name: string; desc: string }[];
  };
  benefits: Benefit[];
  dosage: { goal: string; dose: string; duration: string; time: string }[];
  reviews: { name: string; date: string; text: string; tag: string; avatar: string }[];
  related: RelatedProduct[];
  waText: string;
};

const fetchProductBySlug = async (slug: string) => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const res = await fetch(`${apiUrl}/api/products/slug/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  
  const p = json.data;
  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    category: p.category_name?.toLowerCase().includes("fashion") ? "fashion" : "wellness",
    price: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.price),
    originalPrice: p.price_compare ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.price_compare) : undefined,
    discount: p.discount_label,
    rating: p.rating || 4.9,
    reviewsCount: p.reviews_count || 0,
    soldCount: p.sold_count || "0",
    images: p.images?.length ? p.images.map((img: any) => img.url) : (p.thumbnail_url ? [p.thumbnail_url] : []),
    certifications: p.certifications || [],
    variants: p.variants_chips || [],
    desc: p.description || p.subtitle || "",
    ingredients: p.ingredients || [],
    howToUse: p.how_to_use || [],
    story: p.story || { heading: "", subheading: "", image: "" },
    macro: p.macro_detail || { title: "", desc: "", image: "", specs: [] },
    benefits: p.benefits || [],
    dosage: p.dosage || [],
    reviews: [],
    related: [],
    waText: p.wa_message_template || `Halo, saya ingin memesan ${p.name}.`,
  } as Product;
};

// --- Sub-Components ---

const Breadcrumb = (props: { name: string }) => (
  <div class="pd-container">
    <div class="breadcrumb">
      <a href="/">Beranda</a>
      <span class="material-symbols-outlined" style="font-size: 1rem;">chevron_right</span>
      <a href="/shop">Shop</a>
      <span class="material-symbols-outlined" style="font-size: 1rem;">chevron_right</span>
      <span style="color: var(--ink); font-weight: 600;">{props.name}</span>
    </div>
  </div>
);

const Gallery = (props: { images: string[]; certs: string[] }) => {
  const [activeImg, setActiveImg] = createSignal(props.images[0]);
  return (
    <div class="pd-gallery-wrap">
      <div class="pd-main-img">
        <img src={activeImg()} alt="Main Product" />
      </div>
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <For each={props.images}>
          {(img) => (
            <div 
              class={`pd-thumb ${activeImg() === img ? 'active' : ''}`} 
              onClick={() => setActiveImg(img)}
              style={`cursor: pointer; border: 2px solid ${activeImg() === img ? 'var(--green-500)' : 'transparent'}`}
            >
              <img src={img} alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          )}
        </For>
      </div>
      <div class="cert-strip">
        <span style="font-size: 0.8rem; font-weight: 600; color: var(--muted);">Sertifikasi:</span>
        <For each={props.certs}>
          {(cert) => <span class="cert-pill">{cert}</span>}
        </For>
      </div>
    </div>
  );
};

const ProductInfo = (props: { product: Product; onAction: (msg: string) => void }) => {
  const [variant, setVariant] = createSignal(props.product.variants[0]);
  const [qty, setQty] = createSignal(1);

  return (
    <div class="pd-info">
      <span class="pd-label">{props.product.category.toUpperCase()}</span>
      <h1 class="pd-title">{props.product.name}</h1>
      <Show when={props.product.subtitle}>
        <p style="font-family: 'Lora', serif; font-size: 1.2rem; font-style: italic; color: var(--muted); margin-top: -15px; margin-bottom: 20px;">
          {props.product.subtitle}
        </p>
      </Show>

      <div class="rating-row">
        <div class="stars">
          <For each={[1,2,3,4,5]}>
            {() => <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>}
          </For>
        </div>
        <span style="font-weight: 700;">{props.product.rating}</span>
        <span class="rating-count">({props.product.reviewsCount} ulasan)</span>
        <span class="sold-pill">🔥 {props.product.soldCount} terjual</span>
      </div>

      <div class="price-block" style="margin-bottom: 30px; border-bottom: 1px solid var(--border); padding-bottom: 30px;">
        <Show when={props.product.originalPrice}>
          <div class="pd-price-old">{props.product.originalPrice}</div>
        </Show>
        <div class="pd-price-row">
          <span class="pd-price">{props.product.price}</span>
          <Show when={props.product.discount}>
            <span style="background: var(--red-500); color: white; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;">{props.product.discount}</span>
          </Show>
        </div>
        <p style="font-size: 0.85rem; color: var(--muted); margin-top: 10px;">Gratis ongkir seluruh Indonesia · 7 Hari pengembalian</p>
      </div>

      <div class="field-block">
        <span class="field-label">{props.product.category === 'fashion' ? 'Pilih Warna' : 'Pilih Varian'}</span>
        <div class="chip-row">
          <For each={props.product.variants}>
            {(v) => (
              <button 
                class={`chip ${variant() === v ? 'active' : ''}`}
                onClick={() => setVariant(v)}
              >
                {v}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="field-block">
        <span class="field-label">Jumlah</span>
        <div class="qty-row">
          <div class="qty-ctrl">
            <button class="qty-btn" onClick={() => setQty(Math.max(1, qty() - 1))}>−</button>
            <div class="qty-num">{qty()}</div>
            <button class="qty-btn" onClick={() => setQty(qty() + 1)}>+</button>
          </div>
          <span style="font-size: 0.85rem; color: var(--muted);">Tersedia dalam stok</span>
        </div>
      </div>

      <div class="pd-actions" style="flex-direction: row; flex-wrap: wrap;">
        <button class="btn-buy" style="flex: 1; min-width: 180px;" onClick={() => props.onAction("Produk ditambahkan ke keranjang!")}>
          <span class="material-symbols-outlined">shopping_cart</span>
          Keranjang
        </button>
        <button class="btn-buy" style="flex: 1.5; min-width: 220px; background: var(--green-700);" onClick={() => props.onAction("Lanjut ke pembayaran...")}>
          <span class="material-symbols-outlined">bolt</span>
          Beli Sekarang
        </button>
        <button class="wishlist-btn" style="width: 56px; height: 56px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; background: white; cursor: pointer;">
          <span class="material-symbols-outlined">favorite</span>
        </button>
      </div>
    </div>
  );
};

// --- Page Components ---

export default function ProductDetail() {
  const params = useParams();
  const [product, setProduct] = createSignal<Product | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [activeTab, setActiveTab] = createSignal("desc");
  const [showToast, setShowToast] = createSignal(false);
  const [toastMsg, setToastMsg] = createSignal("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  onMount(async () => {
    try {
      if (!params.id) throw new Error("ID Produk tidak valid.");
      const data = await fetchProductBySlug(params.id);
      setProduct(data);
    } catch (err: any) {
      setError(err.message || "Produk tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="min-h-screen bg-white">
      <Navbar />

      <Show when={!loading() && !error()} fallback={
        <div style="height: 80vh; display: flex; align-items: center; justify-content: center;">
          <Show when={error()} fallback={<Loading message="Menyiapkan detail produk..." />}>
            <div style="text-align: center; color: var(--muted); font-size: 1.2rem;">{error()}</div>
          </Show>
        </div>
      }>
        <main>
          <Breadcrumb name={product()!.name} />

          <section class="pd-section" style="padding-top: 20px;">
            <div class="pd-container">
              <div class="pd-hero-grid">
                <Gallery images={product()!.images} certs={product()!.certifications} />
                <ProductInfo product={product()!} onAction={triggerToast} />
              </div>

              {/* Tabs Section */}
              <div class="tabs">
                <div class="tab-head">
                  <button class={`tab-btn ${activeTab() === 'desc' ? 'active' : ''}`} onClick={() => setActiveTab('desc')}>Deskripsi</button>
                  <button class={`tab-btn ${activeTab() === 'ingred' ? 'active' : ''}`} onClick={() => setActiveTab('ingred')}>
                    {product()!.category === 'wellness' ? 'Kandungan' : 'Material'}
                  </button>
                  <button class={`tab-btn ${activeTab() === 'how' ? 'active' : ''}`} onClick={() => setActiveTab('how')}>
                    {product()!.category === 'wellness' ? 'Cara Pakai' : 'Perawatan'}
                  </button>
                </div>

                <div class="tab-content">
                  <Show when={activeTab() === 'desc'}>
                    <div class="pd-desc" style="max-width: 800px;">
                      <p>{product()!.desc}</p>
                    </div>
                  </Show>
                  <Show when={activeTab() === 'ingred'}>
                    <div class="spec-list">
                      <For each={product()!.ingredients}>
                        {(item) => (
                          <div class="spec-item" style="background: var(--sand); padding: 20px; border-radius: 16px;">
                            <div class="spec-icon" style="background: var(--white);">{product()!.category === 'wellness' ? '✨' : '🧵'}</div>
                            <div>
                              <div style="font-weight: 700; color: var(--ink);">{item.name}</div>
                              <div style="font-size: 0.9rem; color: var(--muted);">{item.desc}</div>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                  <Show when={activeTab() === 'how'}>
                    <div class="spec-list">
                      <For each={product()!.howToUse}>
                        {(item) => (
                          <div class="spec-item" style="align-items: center;">
                            <div class="spec-icon" style="border-radius: 50%; width: 40px; height: 40px; background: var(--green-500); color: white;">{item.num}</div>
                            <div style="font-size: 1rem; color: var(--ink-light);">{item.text}</div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </section>

          {/* Story Block */}
          <section class="story-block">
            <img class="story-img" src={product()!.story.image} alt="Story" />
            <div class="story-overlay"></div>
            <div class="story-content">
              <h2 class="story-heading" innerHTML={product()!.story.heading.replace('Graceful', '<em>Graceful</em>').replace('Inside Out', '<em>Inside Out</em>')}></h2>
              <p style="max-width: 400px; line-height: 1.8; opacity: 0.9;">{product()!.story.subheading}</p>
            </div>
          </section>

          {/* Macro Detail Block */}
          <section class="pd-section">
            <div class="pd-container">
              <div class="macro-grid">
                <div style="border-radius: 24px; overflow: hidden; aspect-ratio: 4/3;">
                  <img src={product()!.macro.image} alt="Macro" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div>
                  <span class="pd-label">{product()!.category === 'wellness' ? 'Premium Formula' : 'Design Philosophy'}</span>
                  <h2 class="pd-title" innerHTML={product()!.macro.title.replace('Presisi', '<em>Presisi</em>').replace('Detail', '<em>Detail</em>')}></h2>
                  <p class="pd-desc" style="margin-bottom: 30px;">{product()!.macro.desc}</p>
                  <div class="spec-list">
                    <For each={product()!.macro.specs}>
                      {(spec) => (
                        <div class="spec-item">
                          <div class="spec-icon">{spec.icon}</div>
                          <div>
                            <div style="font-weight: 700;">{spec.name}</div>
                            <div style="font-size: 0.85rem; color: var(--muted);">{spec.desc}</div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Grid */}
          <section class="pd-section" style="background: var(--green-700); color: white;">
            <div class="pd-container">
              <div style="text-align: center; margin-bottom: 60px;">
                <span style="color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Value & Quality</span>
                <h2 class="pd-title" style="color: white; margin-top: 10px;">Why Choose Aminah Jaya?</h2>
              </div>
              <div class="feat-grid">
                <For each={product()!.benefits}>
                  {(item) => (
                    <div class="feat-card">
                      <div class="feat-icon">{item.icon}</div>
                      <div class="feat-name">{item.name}</div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </section>

          {/* Dynamic Table Section (Dosage or Size Chart) */}
          <section class="pd-section">
            <div class="pd-container">
              <h2 class="pd-title">{product()!.category === 'wellness' ? 'Panduan Konsumsi & Dosis' : 'Panduan Ukuran (Size Chart)'}</h2>
              <p class="pd-desc">Pastikan Anda memilih sesuai kebutuhan dan ukuran yang tepat.</p>
              <div class="size-table-wrap">
                <table class="size-table">
                  <thead>
                    <tr>
                      <th>{product()!.category === 'wellness' ? 'Tujuan' : 'Ukuran'}</th>
                      <th>{product()!.category === 'wellness' ? 'Dosis Harian' : 'Lingkar Dada'}</th>
                      <th>{product()!.category === 'wellness' ? 'Durasi' : 'Panjang Baju'}</th>
                      <th>{product()!.category === 'wellness' ? 'Waktu' : 'Keterangan'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={product()!.dosage}>
                      {(row) => (
                        <tr>
                          <td><strong>{row.goal}</strong></td>
                          <td>{row.dose}</td>
                          <td>{row.duration}</td>
                          <td>{row.time}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Reviews Summary */}
          <section class="pd-section" style="background: var(--white);">
            <div class="pd-container">
              <h2 class="pd-title">Ulasan Pembeli</h2>
              <div class="review-summary">
                <div style="text-align: center;">
                  <div class="score-big">{product()!.rating}</div>
                  <div class="stars" style="justify-content: center; margin: 10px 0;">
                    <For each={[1,2,3,4,5]}>
                      {() => <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>}
                    </For>
                  </div>
                  <div style="font-size: 0.85rem; color: var(--muted);">dari {product()!.reviewsCount} ulasan</div>
                </div>
                <div class="review-bars">
                  <div class="bar-row">
                    <span class="bar-label">5★</span>
                    <div class="bar-track"><div class="bar-fill" style="width: 88%;"></div></div>
                    <span style="font-size: 0.8rem; width: 40px;">88%</span>
                  </div>
                  <div class="bar-row">
                    <span class="bar-label">4★</span>
                    <div class="bar-track"><div class="bar-fill" style="width: 9%;"></div></div>
                    <span style="font-size: 0.8rem; width: 40px;">9%</span>
                  </div>
                  <div class="bar-row">
                    <span class="bar-label">3★</span>
                    <div class="bar-track"><div class="bar-fill" style="width: 2%;"></div></div>
                    <span style="font-size: 0.8rem; width: 40px;">2%</span>
                  </div>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <For each={product()!.reviews}>
                  {(review) => (
                    <div style="padding: 30px; border-radius: 20px; border: 1px solid var(--border); border-left: 4px solid var(--green-500);">
                      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--green-100); color: var(--green-700); display: flex; align-items: center; justify-content: center; font-weight: 700;">{review.avatar}</div>
                        <div>
                          <div style="font-weight: 700;">{review.name}</div>
                          <div style="font-size: 0.75rem; color: var(--muted);">{review.date} · Verified Buyer</div>
                        </div>
                      </div>
                      <p style="font-size: 0.9rem; color: var(--ink-light); line-height: 1.6;">"{review.text}"</p>
                      <div style="margin-top: 15px; font-size: 0.75rem; font-weight: 700; color: var(--green-500);">{review.tag}</div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </section>

          {/* Related Products */}
          <section class="pd-section">
            <div class="pd-container">
              <h2 class="pd-title" style="margin-bottom: 40px;">Produk Terkait</h2>
              <div class="related-grid">
                <For each={product()!.related}>
                  {(item) => (
                    <div class="related-card">
                      <div class="related-img">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div class="related-body">
                        <div class="related-name">{item.name}</div>
                        <div class="related-price">{item.price}</div>
                        <div style="display: flex; align-items: center; gap: 5px; margin-top: 10px; font-size: 0.8rem; color: var(--muted);">
                          <span class="material-symbols-outlined" style="color: #e8a020; font-size: 1rem; font-variation-settings: 'FILL' 1;">star</span>
                          {item.rating}
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </section>

          <Footer />
        </main>
      </Show>

      {/* Toast Notification */}
      <div class={`toast ${showToast() ? 'show' : ''}`}>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="material-symbols-outlined">check_circle</span>
          {toastMsg()}
        </div>
      </div>
    </div>
  );
}