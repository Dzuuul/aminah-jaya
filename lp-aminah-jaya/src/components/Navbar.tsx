import { createSignal, createResource, For, Show, onMount, createEffect } from "solid-js";
import { A } from "@solidjs/router";
import { Search, Bell, ShoppingCart, User as UserIcon, Heart } from "lucide-solid";

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

const fetchCategories = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
};

const fetchCollections = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/collections`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Failed to fetch collections:", e);
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

import { getCart, getMeCustomer, formatCurrency } from "~/lib/api";
import { setShowLoginModal, customerProfile, setCustomerProfile } from "~/lib/auth-store";
import { cartCount, refetchCartCount, cartItems } from "~/lib/cart-store";

export default function Navbar() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isCartHovered, setIsCartHovered] = createSignal(false);
  const [mobileShopOpen, setMobileShopOpen] = createSignal(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = createSignal(false);
  const [mobileJournalOpen, setMobileJournalOpen] = createSignal(false);
  const [products] = createResource(fetchProducts);
  const [categories] = createResource(fetchCategories);
  const [collections] = createResource(fetchCollections);
  const [activeFlashSale] = createResource(fetchActiveFlashSale);
  const [unreadCount] = createResource(fetchUnreadCount);
  const [isProfileHovered, setIsProfileHovered] = createSignal(false);
  const [isSearchExpanded, setIsSearchExpanded] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_profile");
    setCustomerProfile(null);
    window.location.href = "/login";
  };

  onMount(async () => {
    // 1. Restore stored profile from localStorage synchronously on mount (client-only)
    const stored = localStorage.getItem("customer_profile");
    if (stored) {
      try {
        setCustomerProfile(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored profile:", e);
      }
    }

    // 2. Fetch fresh profile from API to verify token validity
    const token = localStorage.getItem("customer_token");
    if (token) {
      try {
        const user = await getMeCustomer();
        setCustomerProfile(user);
      } catch (e) {
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_profile");
        setCustomerProfile(null);
      }
    }

    // 3. Fetch initial cart count
    refetchCartCount();
  });

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
      {/* Full-screen backdrop blur overlay */}
      <div class={`navbar-backdrop-overlay ${(isCartHovered() && customerProfile() && (cartCount() || 0) > 0) || (isProfileHovered() && customerProfile()) ? 'active' : ''}`}></div>

      {/* Main Bar */}
      <div class="navbar-main" style={{ position: "relative", "z-index": 101 }}>
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
              <a href="/" onClick={(e) => {
                if (window.innerWidth <= 900) {
                  e.preventDefault();
                  setMobileShopOpen(!mobileShopOpen());
                }
              }}>Shop</a>
              <span class={`mobile-arrow-icon ${mobileShopOpen() ? 'open' : ''}`} onClick={() => setMobileShopOpen(!mobileShopOpen())}>▼</span>
              <div class={`mega-menu ${mobileShopOpen() ? 'mobile-show' : ''}`}>
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

            {/* collections */}
            <li class="has-mega">
              <A href="/shop" onClick={(e) => {
                if (window.innerWidth <= 900) {
                  e.preventDefault();
                  setMobileCollectionsOpen(!mobileCollectionsOpen());
                }
              }}>Collections</A>
              <span class={`mobile-arrow-icon ${mobileCollectionsOpen() ? 'open' : ''}`} onClick={() => setMobileCollectionsOpen(!mobileCollectionsOpen())}>▼</span>
              <div class={`mega-menu ${mobileCollectionsOpen() ? 'mobile-show' : ''}`}>
                <div class="container">
                  <div class="mega-menu-inner">
                    <div class="mega-menu-content collections-grid">
                      <Show when={!collections.loading} fallback={<div style="color: var(--muted); padding: 20px;">Loading collections...</div>}>
                        <For each={collections()}>
                          {(collection: any) => {
                            return (
                              <div class="mega-col">
                                <A href={`/shop?collection=${collection.slug}`}>
                                  <h4>{collection.name}</h4>
                                </A>
                                <ul>
                                  <For each={collection.products || []}>
                                    {(product: any) => (
                                      <li>
                                        <A href={`/product/${product.slug}`}>{product.name}</A>
                                      </li>
                                    )}
                                  </For>
                                  <Show when={!collection.products || collection.products.length === 0}>
                                    <li style="color: var(--muted); font-style: italic; font-size: 0.85rem; padding: 4px 0;">Belum ada produk</li>
                                  </Show>
                                </ul>
                              </div>
                            );
                          }}
                        </For>
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
            </li>

            {/* Journal */}
            <li class="has-mega">
              <a href="/blog" onClick={(e) => {
                if (window.innerWidth <= 900) {
                  e.preventDefault();
                  setMobileJournalOpen(!mobileJournalOpen());
                }
              }}>Journal</a>
              <span class={`mobile-arrow-icon ${mobileJournalOpen() ? 'open' : ''}`} onClick={() => setMobileJournalOpen(!mobileJournalOpen())}>▼</span>
              <div class={`mega-menu ${mobileJournalOpen() ? 'mobile-show' : ''}`}>
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

            {/* About */}
            <li>
              <a href="#produk" onClick={(e) => handleAnchorClick(e, "#produk")}>About</a>
            </li>

            {/* Mobile Only: Icons & Actions shifted to Hamburger Menu */}
            <Show when={customerProfile()}>
              <li class="mobile-only-nav-item">
                <A href="/cart" onClick={() => setIsOpen(false)}>
                  Cart {cartCount() > 0 ? `(${cartCount()})` : ''}
                </A>
              </li>
              <li class="mobile-only-nav-item">
                <A href="/favorites" onClick={() => setIsOpen(false)}>
                  Wishlist
                </A>
              </li>
              <li class="mobile-only-nav-item">
                <A href="/profile?tab=profile" onClick={() => setIsOpen(false)}>
                  Profil Saya
                </A>
              </li>
              <li class="mobile-only-nav-item">
                <A href="/profile?tab=orders" onClick={() => setIsOpen(false)}>
                  Pesanan Saya
                </A>
              </li>
              <li class="mobile-only-nav-item">
                <A href="/profile?tab=shipping" onClick={() => setIsOpen(false)}>
                  Alamat Pengiriman
                </A>
              </li>
              <li class="mobile-only-nav-item">
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); setIsOpen(false); }} style="color: #dc2626 !important;">
                  Keluar
                </a>
              </li>
            </Show>

            <Show when={!customerProfile()}>
              <li class="mobile-only-nav-item">
                <a href="#" onClick={(e) => { e.preventDefault(); setShowLoginModal(true); setIsOpen(false); }}>
                  Masuk
                </a>
              </li>
              <li class="mobile-only-nav-item">
                <A href="/register" onClick={() => setIsOpen(false)}>
                  Daftar
                </A>
              </li>
            </Show>
          </ul>

          <div class="nav-icons">
            {/* Search Icon triggers expand */}
            <div class="nav-icon-wrapper search-trigger-btn" onClick={() => setIsSearchExpanded(true)} style="cursor: pointer;">
              <Search size={22} />
            </div>

            {/* Desktop Only Icons (hidden on mobile) */}
            <div class="nav-desktop-only-icons">
              <Show when={customerProfile()}>
                <div class="nav-icon-wrapper">
                  <Bell size={22} />
                  <Show when={unreadCount() > 0}>
                    <span class="icon-badge">{unreadCount()}</span>
                  </Show>
                </div>
              </Show>

              <A
                href={customerProfile() ? "/favorites" : "#"}
                class="nav-icon-wrapper"
                onClick={(e) => {
                  if (!customerProfile()) {
                    e.preventDefault();
                    setShowLoginModal(true);
                  }
                }}
                style={{ "margin-right": "8px" }}
              >
                <Heart size={22} />
              </A>

              <div
                class="nav-cart-container"
                onMouseEnter={() => setIsCartHovered(true)}
                onMouseLeave={() => setIsCartHovered(false)}
              >
                <A
                  href={customerProfile() ? "/cart" : "#"}
                  class="nav-icon-wrapper"
                  onClick={(e) => {
                    if (!customerProfile()) {
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

                {/* Cart Dropdown */}
                <Show when={customerProfile() && (cartCount() || 0) > 0}>
                  <div class="nav-cart-dropdown">
                    <div class="cart-dropdown-header">
                      <span class="cart-dropdown-title">Keranjang ({cartCount()})</span>
                      <A href="/cart" class="cart-dropdown-view-all">Lihat</A>
                    </div>
                    <div class="cart-dropdown-items">
                      <For each={cartItems()}>
                        {(item) => (
                          <div class="cart-dropdown-item">
                            <img src={item.product_thumbnail || "/placeholder.jpg"} alt={item.product_name} class="cart-item-dropdown-img" />
                            <div class="cart-item-dropdown-info">
                              <A href={`/product/${item.product_slug}`} class="cart-item-dropdown-name">{item.product_name}</A>
                              <span class="cart-item-dropdown-qty-price">{item.quantity} x {formatCurrency(item.product_price)}</span>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>

              <Show
                when={customerProfile()}
                fallback={
                  <div class="nav-auth-btns">
                    <div
                      class="btn-nav-login"
                      onClick={() => setShowLoginModal(true)}
                      style="cursor: pointer; user-select: none;"
                    >
                      MASUK
                    </div>
                    <A href="/register" class="btn-nav-register">DAFTAR</A>
                  </div>
                }
              >
                <div 
                  class="nav-profile-container"
                  onMouseEnter={() => setIsProfileHovered(true)}
                  onMouseLeave={() => setIsProfileHovered(false)}
                >
                  <A href="/profile" class="nav-icon-wrapper">
                    <UserIcon size={22} />
                    <span class="profile-status-dot"></span>
                  </A>

                  {/* Profile Submenu Dropdown */}
                  <div class="nav-profile-dropdown">
                    <div class="profile-dropdown-header">
                      <div class="profile-dropdown-greeting">Halo,</div>
                      <div class="profile-dropdown-name">{customerProfile()?.name || "Pelanggan"}</div>
                    </div>
                    <div class="profile-dropdown-menu">
                      <A href="/profile?tab=profile" class="profile-dropdown-item">
                        <span class="material-symbols-outlined">person</span>
                        Profil Saya
                      </A>
                      <A href="/profile?tab=orders" class="profile-dropdown-item">
                        <span class="material-symbols-outlined">shopping_bag</span>
                        Pesanan Saya
                      </A>
                      <A href="/profile?tab=wishlist" class="profile-dropdown-item">
                        <span class="material-symbols-outlined">favorite</span>
                        Wishlist
                      </A>
                      <A href="/profile?tab=shipping" class="profile-dropdown-item">
                        <span class="material-symbols-outlined">location_on</span>
                        Alamat Pengiriman
                      </A>
                      <button onClick={handleLogout} class="profile-dropdown-item logout-btn">
                        <span class="material-symbols-outlined">logout</span>
                        Keluar
                      </button>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </div>

          {/* Full-width Expanding Search Bar */}
          <div class={`nav-search-bar-container ${isSearchExpanded() ? 'expanded' : ''}`}>
            <div class="nav-search-input-wrapper">
              <Search size={20} class="nav-search-input-icon" />
              <input 
                type="text" 
                class="nav-search-input" 
                placeholder="Cari produk kesehatan & fashion di Aminah Jaya..." 
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    window.location.href = `/shop?search=${encodeURIComponent(searchQuery())}`;
                  }
                }}
                ref={(el) => {
                  createEffect(() => {
                    if (isSearchExpanded()) {
                      setTimeout(() => el?.focus(), 150);
                    }
                  });
                }}
              />
              <button class="nav-search-close-btn" onClick={() => setIsSearchExpanded(false)}>
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
