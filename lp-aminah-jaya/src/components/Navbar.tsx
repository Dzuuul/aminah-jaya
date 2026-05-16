import { createSignal, createResource, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Search, Bell, ShoppingCart, User as UserIcon } from "lucide-solid";

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

const fetchUnreadCount = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/unread-count`);
    const json = await res.json();
    return json.count || 0;
  } catch (e) {
    return 0;
  }
};

import { getCart, getMeCustomer } from "~/lib/api";
import { setShowLoginModal } from "~/lib/auth-store";

const fetchCartItems = async () => {
  try {
    const items = await getCart();
    return items.length;
  } catch (e) {
    return 0;
  }
};

const fetchUserProfile = async () => {
  try {
    return await getMeCustomer();
  } catch (e) {
    return null;
  }
};

export default function Navbar() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [products] = createResource(fetchProducts);
  const [activeFlashSale] = createResource(fetchActiveFlashSale);
  const [unreadCount] = createResource(fetchUnreadCount);
  const [cartCount] = createResource(fetchCartItems);
  const [userProfile] = createResource(fetchUserProfile);

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
            <A href="/" class="nav-logo">
              <img src="/logo_inverted.png" alt="Logo" style={{ "width": "45px", "height": "auto" }} />
            </A>
          </div>

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
                              <li><A href={`/product/${product.slug}`}>{product.name}</A></li>
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

            {/* Health & Wellness */}
            <li class="has-mega">
              <a href="#produk">Journal</a>
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
            <div class="nav-icon-wrapper">
              <Search size={22} />
            </div>
            
            <Show when={userProfile()}>
              <div class="nav-icon-wrapper">
                <Bell size={22} />
                <Show when={unreadCount() > 0}>
                  <span class="icon-badge">{unreadCount()}</span>
                </Show>
              </div>
            </Show>

            <A 
              href={userProfile() ? "/cart" : "#"} 
              class="nav-icon-wrapper"
              onClick={(e) => {
                if (!userProfile()) {
                  e.preventDefault();
                  setShowLoginModal(true);
                }
              }}
            >
              <ShoppingCart size={22} />
              <Show when={(cartCount() || 0) > 0}>
                <span class="icon-badge">{cartCount()}</span>
              </Show>
            </A>

            <Show 
              when={userProfile()} 
              fallback={
                <div class="nav-auth-btns">
                  <button 
                    class="btn-nav-login" 
                    onClick={() => setShowLoginModal(true)}
                    style="background: none; cursor: pointer;"
                  >
                    Masuk
                  </button>
                  <A href="/register" class="btn-nav-register">Daftar</A>
                </div>
              }
            >
              <A href="/profile" class="nav-icon-wrapper">
                <UserIcon size={22} />
                <span class="profile-status-dot"></span>
              </A>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
}
