import { createResource, createSignal, For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";
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
  name: string;
  category_name: string;
  price: number;
  stock: number;
  status: string;
  sku?: string;
  thumbnail_url?: string;
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

export default function ShopPage() {
  const [products] = createResource<Product[]>(fetchProducts);
  const [categories] = createResource<Category[]>(fetchCategories);

  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedCategory, setSelectedCategory] = createSignal<string>("all");
  const [sortBy, setSortBy] = createSignal("newest");
  const [priceRange, setPriceRange] = createSignal(5000000);

  const filteredProducts = createMemo(() => {
    let list = products() || [];

    if (searchQuery()) {
      const q = searchQuery().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q));
    }

    if (selectedCategory() !== "all") {
      list = list.filter(p => p.category_name === selectedCategory());
    }

    list = list.filter(p => p.price <= priceRange());

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

      <main class="container" style={{ padding: "60px 0" }}>
        {/* Header Section */}
        <div class="shop-header-wrapper">
          <span class="section-label">Katalog Belanja</span>
          <h1 class="section-title">Temukan Kebutuhan Anda</h1>
          <p class="section-sub">Jelajahi koleksi produk kesehatan, fashion muslim, dan kebutuhan harian terbaik kami.</p>
        </div>

        <div class="shop-layout">
          {/* Sidebar Filters */}
          <aside class="shop-sidebar">
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
                  onInput={(e) => setPriceRange(parseInt(e.currentTarget.value))}
                  class="price-input"
                />
                <div class="price-labels">
                  <span>Rp 0</span>
                  <span>Rp {priceRange().toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Mobile Search (Hidden on large screens by CSS if needed, or we just render it here for all screens to be safe) */}
            <div class="filter-section" style={{ "margin-top": "30px" }}>
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
            {/* Toolbar */}
            <div class="shop-toolbar">
              <div style={{ color: "var(--muted)", "font-size": "0.95rem", "font-weight": "600" }}>
                Menampilkan <span style={{ color: "var(--ink)", "font-weight": "700" }}>{filteredProducts().length}</span> Produk
              </div>

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
            </div>

            {/* Grid */}
            <div class="prod-grid">
              <For each={filteredProducts()} fallback={
                <div class="empty-state">
                  <div class="material-symbols-outlined empty-state-icon">inventory_2</div>
                  <h3 class="empty-state-title">Produk tidak ditemukan</h3>
                  <p class="empty-state-desc">Coba sesuaikan kata kunci atau filter pencarian Anda.</p>
                </div>
              }>
                {(product) => (
                  <A href={`/product/${product.id}`} class="prod-card">
                    <div class="prod-img">
                      <Show when={product.thumbnail_url} fallback={
                        <>
                          <span class="material-symbols-outlined" style={{ "font-size": "48px", opacity: 0.2 }}>inventory_2</span>
                          <p style={{ "margin-top": "10px", "font-size": "0.9rem", color: "var(--muted)" }}>{product.name}</p>
                        </>
                      }>
                        <img 
                          src={product.thumbnail_url} 
                          alt={product.name} 
                          style={{ width: "100%", height: "100%", "object-fit": "cover" }}
                        />
                      </Show>
                      <Show when={product.status !== "In Stock"}>
                        <span class="prod-badge" style={{ background: product.status === 'Out of Stock' ? 'var(--red-sale)' : 'orange' }}>
                          {product.status}
                        </span>
                      </Show>
                    </div>
                    <div class="prod-body">
                      <div class="prod-cat">{product.category_name}</div>
                      <div class="prod-name">{product.name}</div>
                      <div class="prod-footer">
                        <span class="prod-price">Rp {product.price.toLocaleString('id-ID')}</span>
                        <div class="btn btn-wa btn-sm" style={{ padding: "6px 12px", "font-size": "0.85rem" }}>
                          Detail
                        </div>
                      </div>
                    </div>
                  </A>
                )}
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
