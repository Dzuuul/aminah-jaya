import { createSignal, createResource, For, Show } from "solid-js";
import { A } from "@solidjs/router";

const fetchProducts = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Failed to fetch products:", e);
    return [];
  }
};

const fetchActiveFlashSale = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/flash-sales/active`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (e) {
    console.error("Failed to fetch flash sale:", e);
    return null;
  }
};

export default function Navbar() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [products] = createResource(fetchProducts);
  const [activeFlashSale] = createResource(fetchActiveFlashSale);

  const handleAnchorClick = (e: MouseEvent, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setIsOpen(false);
    }
  };

  return (
    <nav class="navbar-wrapper" style={{ position: "sticky", top: 0, "z-index": 100 }}>
      {/* Main Bar */}
      <div class="navbar-main">
        <div class="container">
          <div class="nav-left">
            <button class="hamburger-new" onClick={() => setIsOpen(!isOpen())}>
              <span class={isOpen() ? "open" : ""}></span>
              <span class={isOpen() ? "open" : ""}></span>
              <span class={isOpen() ? "open" : ""}></span>
            </button>
          </div>

          <A href="/" class="nav-logo">
            <img src="/logo_inverted.png" alt="Logo" style={{ "width": "45px", "height": "auto" }} />
          </A>

          <ul class={`nav-links ${isOpen() ? "mobile-open" : ""}`}>
            <li class="has-mega">
              <a href="/">Shop</a>
              <div class="mega-menu">
                <div class="container">
                  <div class="mega-menu-content" style={{ display: "grid", "grid-template-columns": "repeat(3, 1fr)", gap: "40px" }}>

                    {/* Kolom 1: Yang Baru (Dynamic Products) */}
                    <div class="mega-col">
                      <h4>Yang Baru</h4>
                      <ul>
                        <Show when={!products.loading} fallback={<li>Loading...</li>}>
                          <For each={products()?.slice(0, 8)}>
                            {(product: any) => (
                              <li><A href={`/product/${product.id}`}>{product.name}</A></li>
                            )}
                          </For>
                        </Show>
                      </ul>
                    </div>

                    {/* Kolom 2: Event Penting (Dynamic Flash Sale) */}
                    <div class="mega-col">
                      <h4>Event Penting</h4>
                      <ul>
                        <Show when={!activeFlashSale.loading} fallback={<li>Loading...</li>}>
                          <Show
                            when={activeFlashSale()}
                            fallback={<li>Belum ada event berlangsung</li>}
                          >
                            <li>
                              <A href="/shop" style={{ color: "var(--red-sale)", "font-weight": "700" }}>
                                🔥 {activeFlashSale().name}
                              </A>
                            </li>
                          </Show>
                        </Show>
                      </ul>
                    </div>

                    {/* Kolom 3: Fitur Aminah Jaya */}
                    <div class="mega-col">
                      <h4>Fitur aminahjaya.com</h4>
                      <ul>
                        <li>
                          <A href="/zona-pengguna-baru">
                            <span class="sale-badge" style={{ "margin-left": "0", "margin-right": "8px" }}>NEW</span>
                            Zona Pengguna Baru
                          </A>
                        </li>
                      </ul>
                    </div>

                  </div>
                </div>
              </div>
            </li>

            {/* Perlengkapan Ibadah */}
            <li class="has-mega">
              <a href="#produk">Perlengkapan Ibadah</a>
              <div class="mega-menu">
                <div class="container">
                  <div class="mega-menu-inner">
                    <div class="mega-menu-content">
                      <div class="mega-col">
                        <h4>Perlengkapan</h4>
                        <ul>
                          <li><a href="#">Mukena</a></li>
                          <li><a href="#">Sarung</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>

            {/* Health & Wellness */}
            <li class="has-mega">
              <a href="#produk">Health & Wellness</a>
              <div class="mega-menu">
                <div class="container">
                  <div class="mega-menu-inner">
                    <div class="mega-menu-content">
                      <div class="mega-col">
                        <h4>Suplemen</h4>
                        <ul>
                          <li><a href="#">Waiteu</a></li>
                          <li><a href="#">Susu Kambing</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>

            {/* Beauty & Skincare */}
            <li class="has-mega">
              <a href="#produk">Beauty & Skincare</a>
              <div class="mega-menu">
                <div class="container">
                  <div class="mega-menu-inner">
                    <div class="mega-menu-content">
                      <div class="mega-col">
                        <h4>Skincare</h4>
                        <ul>
                          <li><a href="#">Skin Care</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>

          <div class="nav-icons">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <a href="/cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </a>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
}
