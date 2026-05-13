import { createSignal, Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { Search, Bell, Menu, ShoppingBag, Package, Users, X, ChevronRight } from "lucide-solid";

// Mock searchable data — in a real app this would come from a global store/API
const searchIndex = [
  { type: "Product", label: "Gamis Al-Fatih", sub: "PRD-001 · In Stock", href: "/products" },
  { type: "Product", label: "Minyak Zaitun 250ml", sub: "PRD-002 · Low Stock", href: "/products" },
  { type: "Product", label: "Kurma Ajwa 1kg", sub: "PRD-003 · Out of Stock", href: "/products" },
  { type: "Product", label: "Hijab Pashmina", sub: "PRD-004 · In Stock", href: "/products" },
  { type: "Order", label: "#ORD-7234 – Ahmad Fauzi", sub: "Rp 350.000 · Paid", href: "/orders" },
  { type: "Order", label: "#ORD-7235 – Siti Aminah", sub: "Rp 85.000 · Pending", href: "/orders" },
  { type: "Order", label: "#ORD-7236 – Budi Santoso", sub: "Rp 210.000 · Paid", href: "/orders" },
  { type: "Customer", label: "Ahmad Fauzi", sub: "12 orders · Active", href: "/customers" },
  { type: "Customer", label: "Siti Aminah", sub: "7 orders · Active", href: "/customers" },
  { type: "Customer", label: "Budi Santoso", sub: "3 orders · Inactive", href: "/customers" },
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
  { id: 1, title: "New order received", body: "#ORD-7238 from Rudi Hermawan", time: "2 min ago", read: false },
  { id: 2, title: "Low stock alert", body: "Minyak Zaitun 250ml has only 12 left", time: "15 min ago", read: false },
  { id: 3, title: "Payment confirmed", body: "#ORD-7236 has been paid", time: "1 hour ago", read: true },
  { id: 4, title: "New customer", body: "Rudi Hermawan just registered", time: "3 hours ago", read: true },
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
    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border/50 px-4 lg:px-8 py-4">
      <div class="flex items-center justify-between gap-4">

        {/* Left */}
        <div class="flex items-center gap-4 flex-shrink-0">
          <button
            class="lg:hidden p-2 hover:bg-cream rounded-xl text-ink"
            onClick={props.onOpenSidebar}
          >
            <Menu size={24} />
          </button>
          <h2 class="text-xl font-bold text-ink hidden sm:block">{props.title || "Overview"}</h2>
        </div>

        {/* Right controls */}
        <div class="flex items-center gap-3">

          {/* Global Search */}
          <div class="relative hidden md:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" size={17} />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              class="pl-10 pr-10 py-2.5 bg-cream border border-border rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none w-72 transition-all text-sm"
            />
            <Show when={query().length > 0}>
              <button
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
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
                    <div class="px-4 py-6 text-center text-muted text-sm">No results for "{query()}"</div>
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
          <div class="relative">
            <button
              class="p-2.5 bg-cream hover:bg-border/30 rounded-xl text-ink-light transition-colors relative"
              onClick={() => setNotifOpen(!notifOpen())}
            >
              <Bell size={20} />
              <Show when={unreadCount() > 0}>
                <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </Show>
            </button>

            {/* Notification Dropdown */}
            <Show when={notifOpen()}>
              <>
                <div class="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden z-50">
                  <div class="px-5 py-4 border-b border-border/30 flex justify-between items-center">
                    <div>
                      <p class="font-bold text-ink text-sm">Notifications</p>
                      <Show when={unreadCount() > 0}>
                        <p class="text-xs text-muted">{unreadCount()} unread</p>
                      </Show>
                    </div>
                    <button class="text-xs font-bold text-green-500 hover:text-green-700 transition-colors">
                      Mark all read
                    </button>
                  </div>
                  <div class="divide-y divide-border/30 max-h-72 overflow-y-auto">
                    <For each={notifications}>
                      {(notif) => (
                        <div class={`px-5 py-3.5 flex gap-3 items-start hover:bg-cream transition-colors cursor-pointer ${!notif.read ? 'bg-green-50/50' : ''}`}>
                          <div class={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.read ? 'bg-green-500' : 'bg-border'}`} />
                          <div class="flex-1 min-w-0">
                            <p class={`text-sm leading-tight ${!notif.read ? 'font-semibold text-ink' : 'font-medium text-ink-light'}`}>
                              {notif.title}
                            </p>
                            <p class="text-xs text-muted mt-0.5">{notif.body}</p>
                            <p class="text-xs text-muted/70 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                  <div class="px-5 py-3 border-t border-border/30">
                    <a href="#" class="text-xs font-bold text-green-500 hover:text-green-700 transition-colors">
                      View all notifications →
                    </a>
                  </div>
                </div>
              </>
            </Show>
          </div>

          {/* Avatar → Profile */}
          <A
            href="/profile"
            class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm hover:bg-green-200 transition-colors flex-shrink-0"
            title="View Profile"
          >
            AD
          </A>

        </div>
      </div>
    </header>
  );
}
