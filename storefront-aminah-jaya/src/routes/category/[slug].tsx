import { createResource, createSignal, For, Show, createMemo } from "solid-js";
import { useParams, A } from "@solidjs/router";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import TransitionLink from "~/components/TransitionLink";

// Interfaces
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
  price_compare?: number;
  stock: number;
  status: string;
  thumbnail_url?: string;
  average_rating?: number;
  total_reviews?: number;
}

const fetchProductsByCategory = async (slug: string) => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
  try {
    const res = await fetch(`${apiUrl}/api/categories/slug/${slug}/products`);
    const json = await res.json();
    return json.success ? (json.data as Product[]) : [];
  } catch (e) {
    console.error("Failed to fetch category products", e);
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
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#fbbf24" }}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const calculateDiscount = (price: number, priceCompare?: number) => {
  if (!priceCompare || priceCompare <= price) return null;
  return Math.round(((priceCompare - price) / priceCompare) * 100);
};

export default function CategoryPage() {
  const params = useParams();
  const [products] = createResource(() => params.slug, fetchProductsByCategory);
  const [categories] = createResource<Category[]>(fetchCategories);

  const [sortBy, setSortBy] = createSignal("newest");
  const [filterStock, setFilterStock] = createSignal("all");
  const [filterPromo, setFilterPromo] = createSignal(false);

  const categoryName = createMemo(() => {
    const slug = params.slug || "";
    const cat = categories()?.find(c => (c.slug || c.name.toLowerCase().replace(/\s+/g, '-')) === slug);
    if (cat) return cat.name;
    const prod = products()?.find(p => p.category_name.toLowerCase().replace(/\s+/g, '-') === slug);
    if (prod) return prod.category_name;
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  });

  const filteredProducts = createMemo(() => {
    let list = products() || [];

    if (filterStock() === "in-stock") {
      list = list.filter(p => p.stock > 0);
    }
    if (filterPromo()) {
      list = list.filter(p => p.price_compare && p.price_compare > p.price);
    }

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
    <div class="category-page">
      <Navbar />

      <main class="container category-container">
        {/* Breadcrumb */}
        <div class="breadcrumb">
          <A href="/">Beranda</A>
          <span class="separator">/</span>
          <A href="/shop">Kategori</A>
          <span class="separator">/</span>
          <span class="current">{categoryName()}</span>
        </div>

        {/* Title and Count */}
        <div class="category-header">
          <h1>{categoryName()}</h1>
          <span class="product-count">{filteredProducts().length} Produk</span>
        </div>

        {/* Categories Pills */}
        <div class="category-pills">
          <For each={categories()}>
            {(cat) => {
              const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
              const isActive = catSlug === params.slug;
              const productCount = isActive ? products()?.length : null;
              return (
                <A
                  href={`/category/${catSlug}`}
                  class={`pill ${isActive ? "active" : ""}`}
                >
                  {cat.name} {productCount != null && <span class="count">{productCount}</span>}
                </A>
              );
            }}
          </For>
        </div>

        {/* Filter Bar */}
        <div class="category-filter-bar">
          <div class="filter-left">
            <button class="btn-filter" style={{ "pointer-events": "none", "background": "transparent" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filter
            </button>

            <select
              class="filter-dropdown-select"
              value={filterStock()}
              onChange={(e) => setFilterStock(e.currentTarget.value)}
              style={{ "background": "transparent", "border": "1px solid var(--border)", "border-radius": "20px", "padding": "6px 16px", "font-size": "0.85rem", "cursor": "pointer", "outline": "none", "color": "var(--ink)", "font-weight": "500" }}
            >
              <option value="all">Semua Stok</option>
              <option value="in-stock">Tersedia Saja</option>
            </select>

            <button
              class={`filter-dropdown-select ${filterPromo() ? "active" : ""}`}
              onClick={() => setFilterPromo(!filterPromo())}
              style={{ "background": filterPromo() ? "var(--green-50)" : "transparent", "color": filterPromo() ? "var(--green-700)" : "var(--ink)", "border": "1px solid", "border-color": filterPromo() ? "var(--green-400)" : "var(--border)", "border-radius": "20px", "padding": "6px 16px", "font-size": "0.85rem", "cursor": "pointer", "transition": "all 0.2s", "font-weight": "500" }}
            >
              Promo / Diskon
            </button>
          </div>

          <div class="filter-right">
            <span>Berdasarkan:</span>
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

        {/* Product Grid */}
        <div class="prod-grid">
          <For each={filteredProducts()} fallback={<div style={{ "grid-column": "1 / -1", "text-align": "center", "padding": "60px", "color": "var(--muted)", "font-size": "16px" }}>Tidak ada produk di kategori ini.</div>}>
            {(product) => {
              const discount = calculateDiscount(product.price, product.price_compare);
              return (
                <TransitionLink href={`/product/${product.slug}`} state={{ fallbackImg: product.thumbnail_url, fallbackId: product.id }} class="prod-card">
                  <div class="prod-img" style={{ "view-transition-name": `product-img-${product.id}` }}>
                    <Show when={product.thumbnail_url} fallback={
                      <>
                        <span class="material-symbols-outlined" style={{ "font-size": "48px", opacity: 0.2 }}>inventory_2</span>
                        <p style={{ "margin-top": "10px", "font-size": "0.9rem", color: "var(--muted)" }}>{product.name}</p>
                      </>
                    }>
                      <img src={product.thumbnail_url} alt={product.name} style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
                    </Show>

                    <Show when={discount}>
                      <span class="prod-badge" style={{ background: "var(--red-sale)" }}>
                        Diskon {discount}%
                      </span>
                    </Show>
                    <Show when={!discount && product.status !== "In Stock"}>
                      <span class="prod-badge" style={{ background: product.status === "Out of Stock" ? "var(--red-sale)" : "orange" }}>
                        {product.status}
                      </span>
                    </Show>
                  </div>

                  <div class="prod-body">
                    {/* Mock Variants */}
                    <div style={{ "display": "flex", "gap": "6px", "margin-bottom": "8px" }}>
                      <div style={{ "width": "20px", "height": "20px", "border-radius": "4px", "background": "#4b5563", "border": "1px solid var(--border)" }}></div>
                      <div style={{ "width": "20px", "height": "20px", "border-radius": "4px", "background": "#d1d5db", "border": "1px solid var(--border)" }}></div>
                    </div>

                    <div class="prod-cat">{product.category_name}</div>
                    <div class="prod-name">{product.name}</div>

                    <Show when={product.average_rating && product.average_rating > 0}>
                      <div style={{ "display": "flex", "align-items": "center", "gap": "6px", "margin-bottom": "12px", "font-size": "0.75rem", "color": "var(--muted)" }}>
                        <div style={{ display: "flex", gap: "2px" }}>
                          <StarIcon />
                        </div>
                        <span>{product.average_rating?.toFixed(1)} {product.total_reviews && `(${product.total_reviews})`}</span>
                      </div>
                    </Show>

                    <div class="prod-footer">
                      <div>
                        <span class="prod-price">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                        <Show when={product.price_compare != null && product.price_compare > product.price}>
                          <div style={{ "font-size": "0.75rem", "color": "var(--muted)", "text-decoration": "line-through" }}>
                            Rp {product.price_compare!.toLocaleString("id-ID")}
                          </div>
                        </Show>
                      </div>
                      <div class="btn btn-wa btn-sm" style={{ padding: "6px 12px", "font-size": "0.85rem" }}>
                        Detail
                      </div>
                    </div>
                  </div>
                </TransitionLink>
              );
            }}
          </For>
        </div>
      </main>

      <Footer />
    </div>
  );
}
