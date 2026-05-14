import { createSignal, Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { Search, Bell, Menu, ShoppingBag, Package, Users, X, ChevronRight } from "lucide-solid";

// Mock searchable data — in a real app this would come from a global store/API
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

const typeColor: Record<string, string> = {
  Product: "text-blue-500 bg-blue-50",
  Order: "text-orange-500 bg-orange-50",
  Customer: "text-purple-500 bg-purple-50",
};

const notifications = [
  { id: 1, title: "Pesanan baru diterima", body: "#ORD-7238 dari Rudi Hermawan", time: "2 menit lalu", read: false },
  { id: 2, title: "Peringatan stok rendah", body: "Minyak Zaitun 250ml hanya tersisa 12", time: "15 menit lalu", read: false },
  { id: 3, title: "Pembayaran dikonfirmasi", body: "#ORD-7236 telah dibayar", time: "1 jam lalu", read: true },
  { id: 4, title: "Pelanggan baru", body: "Rudi Hermawan baru saja mendaftar", time: "3 jam lalu", read: true },
];

export default function Navbar(props: { onOpenSidebar: () => void; title?: string }) {
  const [query, setQuery] = createSignal("");
  const [searchFocused, setSearchFocused] = createSignal(false);
  const [notifOpen, setNotifOpen] = createSignal(false);

  const results = () => {
    const q = query().toLowerCase().trim();
    if (!q) return [];
    return searchIndex.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    ).slice(0, 6);
  };

  const unreadCount = () => notifications.filter((n) => !n.read).length;

  const showSearchResults = () => searchFocused() && query().length > 0;

  return (
    <header class="navbar">
      <div class="navbar-inner">

        {/* Left */}
        <div class="navbar-left">
          <button
            class="navbar-mobile-toggle"
            onClick={props.onOpenSidebar}
          >
            <Menu size={24} />
          </button>
          <h2 class="navbar-title">{props.title || "Ringkasan"}</h2>
        </div>

        {/* Right controls */}
        <div class="navbar-right">

          {/* Global Search */}
          <div class="navbar-search-container">
            <Search class="navbar-search-icon" size={17} />
            <input
              type="text"
              placeholder="Cari produk, pesanan, pelanggan..."
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              class="navbar-search-input"
            />
            <Show when={query().length > 0}>
              <button
                class="navbar-search-clear"
                onClick={() => setQuery("")}
              >
                <X size={15} />
              </button>
            </Show>

            {/* Results Dropdown */}
            <Show when={showSearchResults()}>
              <div class="absolute top-full left-0 mt-2 w-full min-w-80 bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden z-50">
                <Show
                  when={results().length > 0}
                  fallback={
                    <div class="px-4 py-6 text-center text-muted text-sm">Tidak ada hasil untuk "{query()}"</div>
                  }
                >
                  <div class="py-2">
                    <For each={results()}>
                      {(item) => {
                        const Icon = typeIcon[item.type];
                        return (
                          <A
                            href={item.href}
                            class="flex items-center gap-3 px-4 py-2.5 hover:bg-cream transition-colors group"
                          >
                            <div class={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor[item.type]}`}>
                              <Icon size={15} />
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-semibold text-ink truncate">{item.label}</p>
                              <p class="text-xs text-muted truncate">{item.sub}</p>
                            </div>
                            <ChevronRight size={14} class="text-muted group-hover:text-green-500 transition-colors flex-shrink-0" />
                          </A>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>
            </Show>
          </div>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              class="navbar-action-btn"
              onClick={() => setNotifOpen(!notifOpen())}
            >
              <Bell size={20} />
              <Show when={unreadCount() > 0}>
                <span class="navbar-badge"></span>
              </Show>
            </button>

            {/* Notification Dropdown */}
            <Show when={notifOpen()}>
              <>
                <div style={{ position: "fixed", inset: 0, "z-index": 40 }} onClick={() => setNotifOpen(false)} />
                <div style={{ position: "absolute", right: 0, "margin-top": "0.5rem", width: "20rem", "background-color": "#ffffff", "border-radius": "1.5rem", "box-shadow": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", border: "1px solid rgba(229, 224, 216, 0.5)", overflow: "hidden", "z-index": 50 }}>
                  <div style={{ padding: "1rem 1.25rem", "border-bottom": "1px solid rgba(229, 224, 216, 0.3)", display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                    <div>
                      <p style={{ "font-weight": "700", color: "var(--color-ink)", "font-size": "0.875rem" }}>Notifikasi</p>
                      <Show when={unreadCount() > 0}>
                        <p style={{ "font-size": "0.75rem", color: "var(--color-muted)" }}>{unreadCount()} belum dibaca</p>
                      </Show>
                    </div>
                    <button style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-green-500)", background: "none", border: "none", cursor: "pointer" }}>
                      Tandai semua dibaca
                    </button>
                  </div>
                  <div style={{ "max-height": "18rem", "overflow-y": "auto" }}>
                    <For each={notifications}>
                      {(notif) => (
                        <div style={{ padding: "0.875rem 1.25rem", display: "flex", gap: "0.75rem", "align-items": "flex-start", cursor: "pointer", "border-bottom": "1px solid rgba(229, 224, 216, 0.3)", "background-color": !notif.read ? "rgba(243, 251, 247, 0.5)" : "transparent" }}>
                          <div style={{ width: "0.5rem", height: "0.5rem", "border-radius": "50%", "margin-top": "0.375rem", "flex-shrink": 0, "background-color": !notif.read ? "var(--color-green-500)" : "var(--color-border)" }} />
                          <div style={{ flex: 1, "min-width": 0 }}>
                            <p style={{ "font-size": "0.875rem", "line-height": 1.25, "font-weight": !notif.read ? "600" : "500", color: !notif.read ? "var(--color-ink)" : "var(--color-ink-light)" }}>
                              {notif.title}
                            </p>
                            <p style={{ "font-size": "0.75rem", color: "var(--color-muted)", "margin-top": "0.125rem" }}>{notif.body}</p>
                            <p style={{ "font-size": "0.75rem", color: "rgba(138, 138, 138, 0.7)", "margin-top": "0.25rem" }}>{notif.time}</p>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                  <div style={{ padding: "0.75rem 1.25rem", "border-top": "1px solid rgba(229, 224, 216, 0.3)" }}>
                    <a href="#" style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-green-500)", "text-decoration": "none" }}>
                      Lihat semua notifikasi →
                    </a>
                  </div>
                </div>
              </>
            </Show>
          </div>

          {/* Avatar → Profile */}
          <A
            href="/profile"
            class="navbar-avatar"
            title="Lihat Profil"
          >
            AD
          </A>

        </div>
      </div>
    </header>
  );
}
