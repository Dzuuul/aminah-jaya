import { createResource, createSignal, For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import TransitionLink from "~/components/TransitionLink";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  category_name: string;
  price: number;
  price_compare?: number; // harga coret
  stock: number;
  status: string;
  is_featured?: boolean;
  sku?: string;
  thumbnail_url?: string;
  average_rating?: number; // rata-rata rating (0-5)
  total_reviews?: number; // jumlah review
}

const fetchProducts = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
  try {
    const res = await fetch(`${apiUrl}/api/products?limit=100`);
    const json = await res.json();
    return json.success ? (json.data as Product[]) : [];
  } catch (e) {
    console.error("Failed to fetch products", e);
    return [];
  }
};

const fetchCategories = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
  try {
    const res = await fetch(`${apiUrl}/api/categories`);
    const json = await res.json();
    return json.success ? (json.data as Category[]) : [];
  } catch (e) {
    console.error("Failed to fetch categories", e);
    return [];
  }
};

const StarIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color: "#fbbf24" }}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const calculateDiscount = (price: number, priceCompare?: number) => {
  if (!priceCompare || priceCompare <= price) return null;
  return Math.round(((priceCompare - price) / priceCompare) * 100);
};

const renderStars = (rating?: number, count?: number) => {
  if (!rating || rating === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "6px",
        "font-size": "0.75rem",
        color: "var(--muted)",
      }}
    >
      <div style={{ display: "flex", gap: "2px" }}>
        <For each={Array(5).fill(0)}>
          {(_, i) => (
            <div style={{ opacity: i() < Math.round(rating) ? "1" : "0.3" }}>
              <StarIcon />
            </div>
          )}
        </For>
      </div>
      <span>
        {rating.toFixed(1)} {count && `(${count})`}
      </span>
    </div>
  );
};

export default function ShopPage() {
  const [products] = createResource<Product[]>(fetchProducts);
  const [categories] = createResource<Category[]>(fetchCategories);

  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedCategory, setSelectedCategory] = createSignal<string>("all");
  const [sortBy, setSortBy] = createSignal("newest");
  const [priceRange, setPriceRange] = createSignal(5000000);
  const [showFilters, setShowFilters] = createSignal(false);
  const [gridColumns, setGridColumns] = createSignal<1 | 2 | 4>(4);

  const filteredProducts = createMemo(() => {
    let list = products() || [];

    if (searchQuery()) {
      const q = searchQuery().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q),
      );
    }

    if (selectedCategory() !== "all") {
      list = list.filter((p) => p.category_name === selectedCategory());
    }

    list = list.filter((p) => p.price <= priceRange());

    if (sortBy() === "price-low") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy() === "price-high") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy() === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  });

  return (
    <div style={{ "min-height": "100vh", background: "var(--cream)" }}>
      <Navbar />

      <main class="container" style={{ padding: "30px 10px 60px 10px" }}>
        {/* Header Section */}
        <div class="shop-header-wrapper">
          <span class="section-label">Katalog Belanja</span>
          <h1 class="section-title">Temukan Kebutuhan Anda</h1>
          <p class="section-sub">
            Jelajahi koleksi produk kesehatan, fashion muslim, dan kebutuhan
            harian terbaik kami.
          </p>
        </div>

        {/* Mobile Filter Header */}
        <div class="shop-mobile-header">
          <button
            class="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters())}
            style={{ display: "flex", "align-items": "center", gap: "8px" }}
          >
            <span class="material-symbols-outlined">tune</span>
            Filter
          </button>
          <div style={{ "font-size": "0.9rem", color: "var(--muted)" }}>
            {filteredProducts().length} Produk
          </div>
          <select
            class="mobile-sort-select"
            value={sortBy()}
            onChange={(e) => setSortBy(e.currentTarget.value)}
          >
            <option value="newest">Terbaru</option>
            <option value="name">Nama (A-Z)</option>
            <option value="price-low">Harga Terendah</option>
            <option value="price-high">Harga Tertinggi</option>
          </select>
        </div>

        <div class="shop-layout">
          {/* Sidebar Filters - Hidden on mobile, shown as modal */}
          <Show when={showFilters()} fallback={<></>}>
            <div
              class="shop-mobile-overlay"
              onClick={() => setShowFilters(false)}
            />
          </Show>

          <aside class={`shop-sidebar ${showFilters() ? "show" : ""}`}>
            <div class="filter-header-mobile">
              <h3>Filter & Pencarian</h3>
              <button
                class="close-filter-btn"
                onClick={() => setShowFilters(false)}
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">Kategori</h3>
              <div>
                <button
                  onClick={() => setSelectedCategory("all")}
                  class={`filter-btn ${selectedCategory() === "all" ? "active" : ""}`}
                >
                  Semua Produk
                </button>
                <For each={categories()}>
                  {(cat) => (
                    <button
                      onClick={() => setSelectedCategory(cat.name)}
                      class={`filter-btn ${selectedCategory() === cat.name ? "active" : ""}`}
                    >
                      {cat.name}
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">Rentang Harga</h3>
              <div class="price-range-wrapper">
                <input
                  type="range"
                  min="0"
                  max="5000000"
                  step="50000"
                  value={priceRange()}
                  onInput={(e) =>
                    setPriceRange(parseInt(e.currentTarget.value))
                  }
                  class="price-input"
                />
                <div class="price-labels">
                  <span>Rp 0</span>
                  <span>Rp {priceRange().toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">Pencarian</h3>
              <div class="shop-search" style={{ "max-width": "100%" }}>
                <span class="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                />
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div class="shop-main">
            {/* Desktop Toolbar */}
            <div class="shop-toolbar-desktop">
              <div
                style={{
                  color: "var(--muted)",
                  "font-size": "0.95rem",
                  "font-weight": "600",
                }}
              >
                Menampilkan{" "}
                <span style={{ color: "var(--ink)", "font-weight": "700" }}>
                  {filteredProducts().length}
                </span>{" "}
                Produk
              </div>

              <div class="shop-toolbar-controls">
                <div class="shop-sort">
                  <span>Urutkan:</span>
                  <select
                    value={sortBy()}
                    onChange={(e) => setSortBy(e.currentTarget.value)}
                  >
                    <option value="newest">Terbaru</option>
                    <option value="name">Nama (A-Z)</option>
                    <option value="price-low">Harga Terendah</option>
                    <option value="price-high">Harga Tertinggi</option>
                  </select>
                </div>

                <div class="grid-toggle">
                  <button
                    class={`col-btn ${gridColumns() === 4 ? "active" : ""}`}
                    onClick={() => setGridColumns(4)}
                    title="4 Kolom"
                  >
                    <span class="material-symbols-outlined">grid_on</span>
                  </button>
                  <button
                    class={`col-btn ${gridColumns() === 2 ? "active" : ""}`}
                    onClick={() => setGridColumns(2)}
                    title="2 Kolom"
                  >
                    <span class="material-symbols-outlined">grid_view</span>
                  </button>
                  <button
                    class={`col-btn ${gridColumns() === 1 ? "active" : ""}`}
                    onClick={() => setGridColumns(1)}
                    title="1 Kolom"
                  >
                    <span class="material-symbols-outlined">menu</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div
              class="prod-grid"
              style={{
                "grid-template-columns": `repeat(${gridColumns()}, 1fr)`,
              }}
            >
              <For
                each={filteredProducts()}
                fallback={
                  <div class="empty-state">
                    <div class="material-symbols-outlined empty-state-icon">
                      inventory_2
                    </div>
                    <h3 class="empty-state-title">Produk tidak ditemukan</h3>
                    <p class="empty-state-desc">
                      Coba sesuaikan kata kunci atau filter pencarian Anda.
                    </p>
                  </div>
                }
              >
                {(product) => {
                  const discount = calculateDiscount(
                    product.price,
                    product.price_compare,
                  );
                  return (
                    <TransitionLink href={`/product/${product.slug}`} state={{ fallbackImg: product.thumbnail_url, fallbackId: product.id }} class="prod-card">
                      <div class="prod-img" style={{ "view-transition-name": `product-img-${product.id}` }}>
                        <Show
                          when={product.thumbnail_url}
                          fallback={
                            <>
                              <span
                                class="material-symbols-outlined"
                                style={{ "font-size": "48px", opacity: 0.2 }}
                              >
                                inventory_2
                              </span>
                              <p
                                style={{
                                  "margin-top": "10px",
                                  "font-size": "0.9rem",
                                  color: "var(--muted)",
                                }}
                              >
                                {product.name}
                              </p>
                            </>
                          }
                        >
                          <img
                            src={product.thumbnail_url}
                            alt={product.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              "object-fit": "cover",
                            }}
                          />
                        </Show>
                        <Show when={discount}>
                          <span
                            class="prod-badge"
                            style={{ background: "var(--red-sale)" }}
                          >
                            -{discount}%
                          </span>
                        </Show>
                        <Show when={!discount && product.status !== "In Stock"}>
                          <span
                            class="prod-badge"
                            style={{
                              background:
                                product.status === "Out of Stock"
                                  ? "var(--red-sale)"
                                  : "orange",
                            }}
                          >
                            {product.status}
                          </span>
                        </Show>
                      </div>
                      <div class="prod-body">
                        <div class="prod-cat">{product.category_name}</div>
                        <div class="prod-name">{product.name}</div>

                        <Show
                          when={
                            product.average_rating && product.average_rating > 0
                          }
                        >
                          <div style={{ "margin-bottom": "12px" }}>
                            {renderStars(
                              product.average_rating,
                              product.total_reviews,
                            )}
                          </div>
                        </Show>

                        <div class="prod-footer">
                          <div>
                            <span class="prod-price">
                              Rp {product.price.toLocaleString("id-ID")}
                            </span>
                            <Show
                              when={
                                product.price_compare != null &&
                                product.price_compare > product.price
                              }
                            >
                              <div
                                style={{
                                  "font-size": "0.75rem",
                                  color: "var(--muted)",
                                  "text-decoration": "line-through",
                                }}
                              >
                                Rp{" "}
                                {product.price_compare!.toLocaleString("id-ID")}
                              </div>
                            </Show>
                          </div>
                          <div
                            class="btn btn-wa btn-sm"
                            style={{
                              padding: "6px 12px",
                              "font-size": "0.85rem",
                            }}
                          >
                            Detail
                          </div>
                        </div>
                      </div>
                    </TransitionLink>
                  );
                }}
              </For>
            </div>

            {/* Pagination */}
            <div class="shop-pagination">
              <button class="btn btn-primary">1</button>
              <button class="btn btn-outline">2</button>
              <button class="btn btn-outline">3</button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
