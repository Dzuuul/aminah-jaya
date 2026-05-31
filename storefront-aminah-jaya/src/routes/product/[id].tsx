import { createSignal, For, Show, onMount } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";

// --- Types ---

type ProductCategory = "wellness" | "fashion" | "skincare" | "ibadah";

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
  category: ProductCategory;
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
    image_mobile?: string;
  };
  macro: {
    title: string;
    desc: string;
    image: string;
    specs: { icon: string; name: string; desc: string }[];
  };
  benefits: Benefit[];
  dosage: { goal: string; dose: string; duration: string; time: string }[];
  reviews: {
    name: string;
    date: string;
    text: string;
    tag: string;
    avatar: string;
  }[];
  related: RelatedProduct[];
  waText: string;
};

// --- Category Config ---

type CategoryConfig = {
  variantLabel: string;
  ingredientLabel: string;
  howToLabel: string;
  tableTitle: string;
  tableDesc: string;
  tableHeaders: [string, string, string, string];
  macroLabel: string;
  ingredientIcon: string;
  storyHeadingReplace?: { from: string; to: string }[];
  macroTitleReplace?: { from: string; to: string }[];
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  wellness: {
    variantLabel: "Pilih Varian",
    ingredientLabel: "Kandungan",
    howToLabel: "Cara Pakai",
    tableTitle: "Panduan Konsumsi & Dosis",
    tableDesc: "Pastikan Anda mengonsumsi sesuai kebutuhan dan anjuran.",
    tableHeaders: ["Tujuan", "Dosis Harian", "Durasi", "Waktu/Keterangan"],
    macroLabel: "Premium Formula",
    ingredientIcon: "✨",
    storyHeadingReplace: [
      { from: "Graceful", to: "<em>Graceful</em>" },
      { from: "Inside Out", to: "<em>Inside Out</em>" },
    ],
    macroTitleReplace: [{ from: "Presisi", to: "<em>Presisi</em>" }],
  },
  skincare: {
    variantLabel: "Pilih Ukuran",
    ingredientLabel: "Bahan Aktif",
    howToLabel: "Cara Pemakaian",
    tableTitle: "Panduan Pemakaian Sesuai Jenis Kulit",
    tableDesc: "Gunakan produk sesuai jenis kulit dan rutinitas skincare kamu.",
    tableHeaders: ["Jenis Kulit", "Frekuensi", "Tahap Pemakaian", "Keterangan"],
    macroLabel: "Skincare Science",
    ingredientIcon: "🌿",
    storyHeadingReplace: [{ from: "Glow", to: "<em>Glow</em>" }],
    macroTitleReplace: [{ from: "Formula", to: "<em>Formula</em>" }],
  },
  fashion: {
    variantLabel: "Pilih Warna",
    ingredientLabel: "Material",
    howToLabel: "Perawatan",
    tableTitle: "Panduan Ukuran (Size Chart)",
    tableDesc: "Pastikan Anda memilih ukuran yang tepat sesuai tubuh.",
    tableHeaders: ["Ukuran", "Lingkar Dada", "Panjang Baju", "Keterangan"],
    macroLabel: "Design Philosophy",
    ingredientIcon: "🧵",
    storyHeadingReplace: [{ from: "Style", to: "<em>Style</em>" }],
    macroTitleReplace: [{ from: "Detail", to: "<em>Detail</em>" }],
  },
  ibadah: {
    variantLabel: "Pilih Ukuran/Warna",
    ingredientLabel: "Material & Bahan",
    howToLabel: "Panduan Perawatan",
    tableTitle: "Panduan Ukuran & Spesifikasi",
    tableDesc:
      "Pilih ukuran dan spesifikasi yang sesuai kebutuhan ibadah Anda.",
    tableHeaders: ["Ukuran", "Dimensi", "Berat", "Keterangan"],
    macroLabel: "Crafted with Care",
    ingredientIcon: "🕌",
    storyHeadingReplace: [{ from: "Khusyuk", to: "<em>Khusyuk</em>" }],
    macroTitleReplace: [{ from: "Kualitas", to: "<em>Kualitas</em>" }],
  },
};

const getCategoryConfig = (cat: string): CategoryConfig =>
  CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG["fashion"];

const applyReplaces = (
  text: string,
  replaces?: { from: string; to: string }[],
): string => {
  if (!replaces) return text;
  return replaces.reduce((acc, r) => acc.replace(r.from, r.to), text);
};

// --- API Fetch ---

const mapCategory = (name: string = ""): ProductCategory => {
  const n = name.toLowerCase();
  if (
    n.includes("skincare") ||
    n.includes("kecantikan") ||
    n.includes("beauty")
  )
    return "skincare";
  if (
    n.includes("ibadah") ||
    n.includes("muslim") ||
    n.includes("sajadah") ||
    n.includes("mukena") ||
    n.includes("tasbih") ||
    n.includes("quran")
  )
    return "ibadah";
  if (
    n.includes("fashion") ||
    n.includes("pakaian") ||
    n.includes("baju") ||
    n.includes("kaos") ||
    n.includes("celana")
  )
    return "fashion";
  return "wellness";
};

const fetchProductBySlug = async (slug: string): Promise<Product> => {
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
    category: mapCategory(p.category_name),
    price: new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(p.price),
    originalPrice: p.price_compare
      ? new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(p.price_compare)
      : undefined,
    discount: p.discount_label,
    rating: p.rating || 4.9,
    reviewsCount: p.reviews_count || 0,
    soldCount: p.sold_count || "0",
    images: p.images?.length
      ? p.images.map((img: any) => img.url)
      : p.thumbnail_url
        ? [p.thumbnail_url]
        : [],
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
  };
};

// --- Sub-Components ---

const Breadcrumb = (props: { name: string }) => (
  <div class="pd-container">
    <div class="breadcrumb">
      <a href="/">Beranda</a>
      <span class="material-symbols-outlined breadcrumb-chevron">
        chevron_right
      </span>
      <a href="/shop">Shop</a>
      <span class="material-symbols-outlined breadcrumb-chevron">
        chevron_right
      </span>
      <span class="breadcrumb-current">{props.name}</span>
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
      <div class="pd-thumb-row">
        <For each={props.images}>
          {(img) => (
            <div
              class={`pd-thumb ${activeImg() === img ? "active" : ""}`}
              onClick={() => setActiveImg(img)}
            >
              <img src={img} alt="Thumb" class="pd-thumb-img" />
            </div>
          )}
        </For>
      </div>
      <Show when={props.certs.length > 0}>
        <div class="cert-strip">
          <span class="pd-cert-label">Sertifikasi:</span>
          <For each={props.certs}>
            {(cert) => <span class="cert-pill">{cert}</span>}
          </For>
        </div>
      </Show>
    </div>
  );
};

// --- Imports for cart/auth ---
import {
  addToCart,
  getMeCustomer,
  getFavorites,
  addFavorite,
  removeFavoriteByProduct,
  getFavoriteFolders,
} from "~/lib/api";
import { setShowLoginModal } from "~/lib/auth-store";
import { refetchCartCount } from "~/lib/cart-store";

const ProductInfo = (props: {
  product: Product;
  onAction: (msg: string) => void;
}) => {
  const navigate = useNavigate();
  const config = () => getCategoryConfig(props.product.category);

  const [variant, setVariant] = createSignal(props.product.variants[0]);
  const [qty, setQty] = createSignal(1);
  const [adding, setAdding] = createSignal(false);

  // Favorites logic
  const [isFavorited, setIsFavorited] = createSignal(false);
  const [userFolders, setUserFolders] = createSignal<string[]>([]);
  const [productFolders, setProductFolders] = createSignal<string[]>([]);
  const [showFavModal, setShowFavModal] = createSignal(false);
  const [newFolderName, setNewFolderName] = createSignal("");
  const [loadingFav, setLoadingFav] = createSignal(false);

  const checkFavoriteStatus = async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;
    try {
      const favorites = await getFavorites();
      const match = favorites.filter(
        (f: any) => f.product_id === props.product.id,
      );
      setIsFavorited(match.length > 0);
      setProductFolders(match.map((f: any) => f.folder_name));

      const folders = await getFavoriteFolders();
      if (!folders.includes("Favorit Saya")) {
        setUserFolders(["Favorit Saya", ...folders]);
      } else {
        setUserFolders(folders);
      }
    } catch (e) {
      console.error("Error fetching favorites", e);
    }
  };

  onMount(() => {
    checkFavoriteStatus();
  });

  const handleFavoriteClick = async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    setLoadingFav(true);
    try {
      const folders = await getFavoriteFolders();
      if (!folders.includes("Favorit Saya")) {
        setUserFolders(["Favorit Saya", ...folders]);
      } else {
        setUserFolders(folders);
      }
      setShowFavModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFav(false);
    }
  };

  const toggleFolderFavorite = async (folderName: string) => {
    const isCurrentlyInFolder = productFolders().includes(folderName);
    try {
      if (isCurrentlyInFolder) {
        await removeFavoriteByProduct(props.product.id, folderName);
        props.onAction(`Dihapus dari folder "${folderName}"`);
      } else {
        await addFavorite(props.product.id, folderName);
        props.onAction(`Ditambahkan ke folder "${folderName}"`);
      }
      await checkFavoriteStatus();
    } catch (e: any) {
      props.onAction(`Gagal memperbarui favorit: ${e.message}`);
    }
  };

  const handleCreateFolder = async (e: Event) => {
    e.preventDefault();
    const name = newFolderName().trim();
    if (!name) return;
    try {
      await addFavorite(props.product.id, name);
      props.onAction(`Ditambahkan ke folder baru "${name}"`);
      setNewFolderName("");
      await checkFavoriteStatus();
    } catch (e: any) {
      props.onAction(`Gagal membuat folder: ${e.message}`);
    }
  };

  const ensureLoggedIn = async (): Promise<boolean> => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setShowLoginModal(true);
      return false;
    }
    try {
      const user = await getMeCustomer();
      if (!user) {
        setShowLoginModal(true);
        return false;
      }
      return true;
    } catch {
      setShowLoginModal(true);
      return false;
    }
  };

  const handleAddToCart = async () => {
    if (!(await ensureLoggedIn())) return;
    setAdding(true);
    try {
      await addToCart(props.product.id, qty());
      await refetchCartCount();
      props.onAction(
        `${props.product.name} berhasil ditambahkan ke keranjang!`,
      );
    } catch (e: any) {
      props.onAction(`Gagal menambahkan ke keranjang: ${e.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!(await ensureLoggedIn())) return;
    setAdding(true);
    try {
      await addToCart(props.product.id, qty());
      await refetchCartCount();
      navigate("/checkout");
    } catch (e: any) {
      props.onAction(`Gagal memproses pembelian: ${e.message}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div class="pd-info">
      <span class="pd-label">{props.product.category.toUpperCase()}</span>
      <h1 class="pd-title">{props.product.name}</h1>
      <Show when={props.product.subtitle}>
        <p class="pd-subtitle">{props.product.subtitle}</p>
      </Show>

      <Show
        when={
          props.product.reviewsCount > 0 ||
          (props.product.soldCount && props.product.soldCount !== "0")
        }
      >
        <div class="rating-row">
          <Show when={props.product.reviewsCount > 0}>
            <div class="stars">
              <For each={[1, 2, 3, 4, 5]}>
                {() => (
                  <span class="material-symbols-outlined star-icon-fill">
                    star
                  </span>
                )}
              </For>
            </div>
            <span class="rating-val">{props.product.rating}</span>
            <span class="rating-count">
              ({props.product.reviewsCount} ulasan)
            </span>
          </Show>
          <Show
            when={props.product.soldCount && props.product.soldCount !== "0"}
          >
            <span class="sold-pill">🔥 {props.product.soldCount} terjual</span>
          </Show>
        </div>
      </Show>

      <div class="pd-price-block">
        <Show when={props.product.originalPrice}>
          <div class="pd-price-old">{props.product.originalPrice}</div>
        </Show>
        <div class="pd-price-row">
          <span class="pd-price">{props.product.price}</span>
          <Show when={props.product.discount}>
            <span class="pd-discount-badge">{props.product.discount}</span>
          </Show>
        </div>
        <p class="pd-shipping-info">
          Gratis ongkir seluruh Indonesia · 7 Hari pengembalian
        </p>
      </div>

      {/* Variant Selector */}
      <Show when={props.product.variants.length > 0}>
        <div class="field-block">
          <span class="field-label">{config().variantLabel}</span>
          <div class="chip-row">
            <For each={props.product.variants}>
              {(v) => (
                <button
                  class={`chip ${variant() === v ? "active" : ""}`}
                  onClick={() => setVariant(v)}
                >
                  {v}
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      <div class="field-block">
        <span class="field-label">Jumlah</span>
        <div class="qty-row">
          <div class="qty-ctrl">
            <button
              class="qty-btn"
              onClick={() => setQty(Math.max(1, qty() - 1))}
            >
              −
            </button>
            <div class="qty-num">{qty()}</div>
            <button class="qty-btn" onClick={() => setQty(qty() + 1)}>
              +
            </button>
          </div>
          <span class="pd-stock-label">Tersedia dalam stok</span>
        </div>
      </div>

      <div class="pd-actions pd-actions-row">
        <button
          class="btn-buy pd-cart-btn"
          onClick={handleAddToCart}
          disabled={adding()}
        >
          <span class="material-symbols-outlined">
            {adding() ? "sync" : "shopping_cart"}
          </span>
          {adding() ? "Menambahkan..." : "Keranjang"}
        </button>
        <button
          class="btn-buy pd-buy-btn"
          onClick={handleBuyNow}
          disabled={adding()}
        >
          <span class="material-symbols-outlined">bolt</span>
          Beli Sekarang
        </button>
        <button
          class="pd-wishlist-btn"
          classList={{ favorited: isFavorited() }}
          onClick={handleFavoriteClick}
          disabled={loadingFav()}
        >
          <span class="material-symbols-outlined">favorite</span>
        </button>
      </div>

      {/* Favorite Folders Modal */}
      <Show when={showFavModal()}>
        <div class="pd-modal-overlay" onClick={() => setShowFavModal(false)}>
          <div
            class="pd-modal-content auth-card modern"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              class="pd-modal-close"
              onClick={() => setShowFavModal(false)}
            >
              <span class="material-symbols-outlined">close</span>
            </button>

            <h3 class="pd-modal-title">Simpan ke Favorit</h3>
            <p class="pd-modal-subtitle">
              Pilih atau buat folder untuk menyimpan produk ini.
            </p>

            <div class="pd-modal-folder-list">
              <For each={userFolders()}>
                {(folder) => {
                  const active = productFolders().includes(folder);
                  return (
                    <button
                      onClick={() => toggleFolderFavorite(folder)}
                      class="pd-modal-folder-item"
                      classList={{ active }}
                    >
                      <div class="pd-modal-folder-meta">
                        <span class="material-symbols-outlined pd-modal-folder-icon">
                          folder
                        </span>
                        <span class="pd-modal-folder-name">{folder}</span>
                      </div>
                      <span class="material-symbols-outlined pd-modal-folder-check">
                        check_circle
                      </span>
                    </button>
                  );
                }}
              </For>
            </div>

            <form onSubmit={handleCreateFolder} class="pd-modal-form">
              <input
                type="text"
                placeholder="Folder baru..."
                value={newFolderName()}
                onInput={(e) => setNewFolderName(e.currentTarget.value)}
                required
                class="pd-modal-input"
              />
              <button type="submit" class="pd-modal-submit-btn">
                <span class="material-symbols-outlined">add</span>
              </button>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
};

// --- Main Page ---

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

  // Derived helper — only call inside Show when product() is not null
  const config = () => getCategoryConfig(product()!.category);

  return (
    <div class="min-h-screen bg-white">
      <Navbar />

      <Show
        when={!loading() && !error()}
        fallback={
          <div class="pd-loading-container">
            <Show
              when={error()}
              fallback={<Loading message="Menyiapkan detail produk..." />}
            >
              <div class="pd-error-container">{error()}</div>
            </Show>
          </div>
        }
      >
        <main>
          <Breadcrumb name={product()!.name} />

          {/* Hero: Gallery + Info */}
          <section class="pd-section pd-section-hero">
            <div class="pd-container">
              <div class="pd-hero-grid">
                <Gallery
                  images={product()!.images}
                  certs={product()!.certifications}
                />
                <ProductInfo product={product()!} onAction={triggerToast} />
              </div>

              {/* Tabs */}
              <div class="tabs">
                <div class="tab-head">
                  <button
                    class={`tab-btn ${activeTab() === "desc" ? "active" : ""}`}
                    onClick={() => setActiveTab("desc")}
                  >
                    Deskripsi
                  </button>

                  <Show when={product()!.ingredients.length > 0}>
                    <button
                      class={`tab-btn ${activeTab() === "ingred" ? "active" : ""}`}
                      onClick={() => setActiveTab("ingred")}
                    >
                      {config().ingredientLabel}
                    </button>
                  </Show>

                  <Show when={product()!.howToUse.length > 0}>
                    <button
                      class={`tab-btn ${activeTab() === "how" ? "active" : ""}`}
                      onClick={() => setActiveTab("how")}
                    >
                      {config().howToLabel}
                    </button>
                  </Show>
                </div>

                <div class="tab-content">
                  <Show when={activeTab() === "desc"}>
                    <div class="pd-desc pd-desc-limited">
                      <p>{product()!.desc}</p>
                    </div>
                  </Show>

                  <Show when={activeTab() === "ingred"}>
                    <div class="spec-list">
                      <For each={product()!.ingredients}>
                        {(item) => (
                          <div class="spec-item spec-item-sand">
                            <div class="spec-icon spec-icon-white">
                              {config().ingredientIcon}
                            </div>
                            <div>
                              <div class="spec-item-title">{item.name}</div>
                              <div class="spec-item-desc">{item.desc}</div>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>

                  <Show when={activeTab() === "how"}>
                    <div class="spec-list">
                      <For each={product()!.howToUse}>
                        {(item) => (
                          <div class="spec-item spec-item-centered">
                            <div class="spec-icon spec-icon-step">
                              {item.num}
                            </div>
                            <div class="spec-step-text">{item.text}</div>
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
          <Show when={product()!.story.image}>
            <section class="story-block">
              <picture class="story-picture">
                <Show when={product()!.story.image_mobile}>
                  <source
                    media="(max-width: 768px)"
                    srcset={product()!.story.image_mobile}
                  />
                </Show>
                <img
                  class="story-img"
                  src={product()!.story.image}
                  alt="Story"
                />
              </picture>
              <div class="story-overlay" />
              <div class="story-content">
                <h2
                  class="story-heading"
                  innerHTML={applyReplaces(
                    product()!.story.heading,
                    config().storyHeadingReplace,
                  )}
                />
                <p class="story-subheading">{product()!.story.subheading}</p>
              </div>
            </section>
          </Show>

          {/* Macro Detail Block */}
          <Show when={product()!.macro.image || product()!.macro.title}>
            <section class="pd-section">
              <div class="pd-container">
                <div class="macro-grid">
                  <Show when={product()!.macro.image}>
                    <div class="macro-img-wrap">
                      <img
                        src={product()!.macro.image}
                        alt="Macro"
                        class="macro-img-inner"
                      />
                    </div>
                  </Show>
                  <div>
                    <span class="pd-label">{config().macroLabel}</span>
                    <h2
                      class="pd-title"
                      innerHTML={applyReplaces(
                        product()!.macro.title,
                        config().macroTitleReplace,
                      )}
                    />
                    <p class="pd-desc pd-desc-margin">
                      {product()!.macro.desc}
                    </p>
                    <Show when={product()!.macro.specs.length > 0}>
                      <div class="spec-list">
                        <For each={product()!.macro.specs}>
                          {(spec) => (
                            <div class="spec-item">
                              <div class="spec-icon">{spec.icon}</div>
                              <div>
                                <div class="macro-spec-name">{spec.name}</div>
                                <div class="macro-spec-desc">{spec.desc}</div>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </section>
          </Show>

          {/* Benefits Grid */}
          <Show when={product()!.benefits.length > 0}>
            <section class="pd-section pd-section-benefits">
              <div class="pd-container">
                <div class="pd-benefits-header">
                  <span class="pd-benefits-label">Keunggulan & Manfaat</span>
                  <h2 class="pd-title">Manfaat Produk Ini</h2>
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
          </Show>

          {/* Dynamic Table: Dosage / Size Chart */}
          <Show when={product()!.dosage.length > 0}>
            <section class="pd-section">
              <div class="pd-container">
                <h2 class="pd-title">{config().tableTitle}</h2>
                <p class="pd-desc">{config().tableDesc}</p>
                <div class="size-table-wrap">
                  <table class="size-table">
                    <thead>
                      <tr>
                        <For each={config().tableHeaders}>
                          {(h) => <th>{h}</th>}
                        </For>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={product()!.dosage}>
                        {(row) => (
                          <tr>
                            <td>
                              <strong>{row.goal}</strong>
                            </td>
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
          </Show>

          {/* Reviews */}
          <Show when={product()!.reviewsCount > 0}>
            <section class="pd-section pd-section-reviews">
              <div class="pd-container">
                <h2 class="pd-title">Ulasan Pembeli</h2>
                <div class="review-summary">
                  <div class="pd-review-summary-col">
                    <div class="score-big">{product()!.rating}</div>
                    <div class="stars stars-centered">
                      <For each={[1, 2, 3, 4, 5]}>
                        {() => (
                          <span class="material-symbols-outlined star-icon-fill">
                            star
                          </span>
                        )}
                      </For>
                    </div>
                    <div class="pd-review-total">
                      dari {product()!.reviewsCount} ulasan
                    </div>
                  </div>
                  <div class="review-bars">
                    <div class="bar-row">
                      <span class="bar-label">5★</span>
                      <div class="bar-track">
                        <div class="bar-fill" style="width: 88%;" />
                      </div>
                      <span class="pd-review-bar-percent">88%</span>
                    </div>
                    <div class="bar-row">
                      <span class="bar-label">4★</span>
                      <div class="bar-track">
                        <div class="bar-fill" style="width: 9%;" />
                      </div>
                      <span class="pd-review-bar-percent">9%</span>
                    </div>
                    <div class="bar-row">
                      <span class="bar-label">3★</span>
                      <div class="bar-track">
                        <div class="bar-fill" style="width: 2%;" />
                      </div>
                      <span class="pd-review-bar-percent">2%</span>
                    </div>
                  </div>
                </div>

                <Show when={product()!.reviews.length > 0}>
                  <div class="pd-reviews-grid">
                    <For each={product()!.reviews}>
                      {(review) => (
                        <div class="pd-review-card">
                          <div class="pd-review-user-row">
                            <div class="pd-review-avatar">{review.avatar}</div>
                            <div>
                              <div class="pd-review-user-name">
                                {review.name}
                              </div>
                              <div class="pd-review-user-date">
                                {review.date} · Verified Buyer
                              </div>
                            </div>
                          </div>
                          <p class="pd-review-text">"{review.text}"</p>
                          <div class="pd-review-tag">{review.tag}</div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </section>
          </Show>

          {/* Related Products */}
          <Show when={product()!.related.length > 0}>
            <section class="pd-section">
              <div class="pd-container">
                <h2 class="pd-title pd-title-related">Produk Terkait</h2>
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
                          <div class="pd-related-rating">
                            <span class="material-symbols-outlined pd-related-star">
                              star
                            </span>
                            {item.rating}
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </section>
          </Show>

          <Footer />
        </main>
      </Show>

      {/* Toast */}
      <div class={`toast ${showToast() ? "show" : ""}`}>
        <div class="toast-inner">
          <span class="material-symbols-outlined">check_circle</span>
          {toastMsg()}
        </div>
      </div>
    </div>
  );
}
