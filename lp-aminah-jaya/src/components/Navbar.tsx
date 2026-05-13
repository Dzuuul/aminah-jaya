import { createSignal } from "solid-js";

export default function Navbar() {
  const [isOpen, setIsOpen] = createSignal(false);

  const handleAnchorClick = (e: MouseEvent, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsOpen(false);
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

          <a href="/" class="nav-logo">
            <img src="/logo_inverted.png" alt="Logo" style={{ "width": "45px", "height": "auto" }} />
          </a>

          <ul class={`nav-links ${isOpen() ? "mobile-open" : ""}`}>
            {/* Fashion Muslim */}
            <li class="has-mega">
              <a href="#produk">Fashion Muslim</a>
              <div class="mega-menu">
                <div class="container">
                  <div class="mega-menu-inner">
                    <div class="mega-menu-content">
                      <div class="mega-col">
                        <h4>Kategori Fashion</h4>
                        <ul>
                          <li><a href="#">Koko</a></li>
                          <li><a href="#">Dress</a></li>
                          <li><a href="#">Sarung</a></li>
                        </ul>
                      </div>
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
