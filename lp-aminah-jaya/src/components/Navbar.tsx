import { createSignal, onMount } from "solid-js";

export default function Navbar() {
  const [scrolled, setScrolled] = createSignal(false);

  onMount(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  const handleAnchorClick = (e: MouseEvent, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      class="navbar"
      style={{ "box-shadow": scrolled() ? "0 4px 20px rgba(0,0,0,0.08)" : "none" }}
    >
      <div class="container">
        <a href="#beranda" class="nav-logo" onClick={(e) => handleAnchorClick(e, "#beranda")}>
          <div class="nav-logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span class="nav-logo-text">
            Aminah<span>Jaya</span>
          </span>
        </a>

        <ul class="nav-links">
          <li>
            <a href="#kategori" onClick={(e) => handleAnchorClick(e, "#kategori")}>
              Kategori
            </a>
          </li>
          <li>
            <a href="#produk" onClick={(e) => handleAnchorClick(e, "#produk")}>
              Produk
            </a>
          </li>
          <li>
            <a href="#tentang" onClick={(e) => handleAnchorClick(e, "#tentang")}>
              Tentang
            </a>
          </li>
          <li>
            <a href="#kontak" onClick={(e) => handleAnchorClick(e, "#kontak")}>
              Kontak
            </a>
          </li>
        </ul>

        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-wa nav-cta btn-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z" />
          </svg>
          WhatsApp
        </a>

        <button class="hamburger" aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
