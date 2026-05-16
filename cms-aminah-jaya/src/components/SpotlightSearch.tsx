import { createSignal, Show, For, onMount, onCleanup, createEffect } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { Search, ShoppingBag, Package, Users, ChevronRight, X } from "lucide-solid";
import "./SpotlightSearch.css";

// Mock searchable data
const searchIndex = [
  { type: "Product", label: "Gamis Al-Fatih", sub: "PRD-001 · Tersedia", href: "/products" },
  { type: "Product", label: "Minyak Zaitun 250ml", sub: "PRD-002 · Stok Rendah", href: "/products" },
  { type: "Product", label: "Kurma Ajwa 1kg", sub: "PRD-003 · Stok Habis", href: "/products" },
  { type: "Product", label: "Hijab Pashmina", sub: "PRD-004 · Tersedia", href: "/products" },
  { type: "Order", label: "#ORD-7234 – Ahmad Fauzi", sub: "Rp 350.000 · Dibayar", href: "/orders" },
  { type: "Order", label: "#ORD-7235 – Siti Aminah", sub: "Rp 85.000 · Menunggu", href: "/orders" },
  { type: "Order", label: "#ORD-7236 – Budi Santoso", sub: "Rp 210.000 · Dibayar", href: "/orders" },
  { type: "Customer", label: "Ahmad Fauzi", sub: "12 pesanan · Aktif", href: "/customers" },
  { type: "Customer", label: "Siti Aminah", sub: "7 pesanan · Aktif", href: "/customers" },
  { type: "Customer", label: "Budi Santoso", sub: "3 pesanan · Tidak Aktif", href: "/customers" },
];

const typeIcon: Record<string, any> = {
  Product: ShoppingBag,
  Order: Package,
  Customer: Users,
};

const typeClass: Record<string, string> = {
  Product: "product",
  Order: "order",
  Customer: "customer",
};

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpotlightSearch(props: SpotlightSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const results = () => {
    const q = query().toLowerCase().trim();
    if (!q) return [];
    return searchIndex.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    ).slice(0, 8);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results().length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (results().length || 1)) % (results().length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results()[selectedIndex()];
      if (selected) {
        navigate(selected.href);
        props.onClose();
        setQuery("");
      }
    } else if (e.key === 'Escape') {
      props.onClose();
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  createEffect(() => {
    if (query()) setSelectedIndex(0);
  });

  return (
    <Show when={props.isOpen}>
      <div class="spotlight-overlay">
        {/* Backdrop */}
        <div class="spotlight-backdrop" onClick={props.onClose} />

        {/* Search Card */}
        <div class="spotlight-card">
          <div class="spotlight-header">
            <Search class="spotlight-header-icon" size={20} />
            <input
              type="text"
              placeholder="Apa yang Anda cari?"
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              class="spotlight-input"
              autofocus
            />
            <div class="spotlight-header-actions">
              <span class="spotlight-esc">ESC</span>
              <button onClick={props.onClose} class="spotlight-close-btn">
                <X size={18} />
              </button>
            </div>
          </div>

          <div class="spotlight-results">
            <Show 
              when={query().length > 0}
              fallback={
                <div class="spotlight-empty">
                  <div class="spotlight-empty-icon">
                    <Search size={20} />
                  </div>
                  <p class="spotlight-empty-title">Cari produk, pesanan, atau pelanggan</p>
                  <p class="spotlight-empty-subtitle">Gunakan tombol panah untuk menavigasi hasil</p>
                </div>
              }
            >
              <Show 
                when={results().length > 0}
                fallback={
                  <div class="spotlight-empty spotlight-empty-subtitle">
                    Tidak ada hasil untuk "<span style={{ color: "var(--color-ink)", "font-weight": "700" }}>{query()}</span>"
                  </div>
                }
              >
                <For each={results()}>
                  {(item, index) => {
                    const Icon = typeIcon[item.type];
                    const isActive = () => index() === selectedIndex();
                    return (
                      <A
                        href={item.href}
                        onClick={() => {
                          props.onClose();
                          setQuery("");
                        }}
                        onMouseEnter={() => setSelectedIndex(index())}
                        class={`spotlight-result-item ${isActive() ? 'active' : ''}`}
                      >
                        <Show when={isActive()}>
                          <div class="spotlight-result-active-indicator" />
                        </Show>
                        <div class={`spotlight-result-icon ${typeClass[item.type]}`}>
                          <Icon size={18} />
                        </div>
                        <div class="spotlight-result-content">
                          <div class="spotlight-result-meta">
                            <span class="spotlight-result-type">{item.type}</span>
                            <Show when={isActive()}>
                              <span class="spotlight-result-badge">Enter</span>
                            </Show>
                          </div>
                          <p class="spotlight-result-title">{item.label}</p>
                          <p class="spotlight-result-sub">{item.sub}</p>
                        </div>
                        <ChevronRight size={14} class="spotlight-result-chevron" />
                      </A>
                    );
                  }}
                </For>
              </Show>
            </Show>
          </div>

          <div class="spotlight-footer">
            <div class="spotlight-hints">
              <div class="spotlight-hint">
                <span class="spotlight-key">↑↓</span>
                <span>Navigasi</span>
              </div>
              <div class="spotlight-hint">
                <span class="spotlight-key">Enter</span>
                <span>Pilih</span>
              </div>
            </div>
            <div class="spotlight-brand">
              <ChevronRight size={10} />
              <span>Aminah Jaya Spotlight</span>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
