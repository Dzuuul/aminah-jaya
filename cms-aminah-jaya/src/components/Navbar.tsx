import { createSignal, Show, For, onMount, onCleanup } from "solid-js";
import { A } from "@solidjs/router";
import { Search, Bell, Menu, Command, ArrowLeft } from "lucide-solid";
import { setIsSearchOpen } from "../lib/searchStore";

const notifications = [
  { id: 1, title: "Pesanan baru diterima", body: "#ORD-7238 dari Rudi Hermawan", time: "2 menit lalu", read: false },
  { id: 2, title: "Peringatan stok rendah", body: "Minyak Zaitun 250ml hanya tersisa 12", time: "15 menit lalu", read: false },
  { id: 3, title: "Pembayaran dikonfirmasi", body: "#ORD-7236 telah dibayar", time: "1 jam lalu", read: true },
  { id: 4, title: "Pelanggan baru", body: "Rudi Hermawan baru saja mendaftar", time: "3 jam lalu", read: true },
];

export default function Navbar(props: { onOpenSidebar: () => void; title?: string; onBack?: () => void }) {
  const [notifOpen, setNotifOpen] = createSignal(false);
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  const unreadCount = () => notifications.filter((n) => !n.read).length;

  return (
    <header class="navbar">
      <div class="navbar-inner">
        {/* Left Section */}
        <div class="navbar-left">
          <button class="navbar-mobile-toggle" onClick={props.onOpenSidebar}>
            <Menu size={24} />
          </button>
          
          <Show when={props.onBack}>
            <button class="navbar-back-btn" onClick={props.onBack}>
              <ArrowLeft size={20} />
            </button>
          </Show>

          <h2 class="navbar-title">{props.title || "Ringkasan"}</h2>
        </div>

        {/* Right Section */}
        <div class="navbar-right">
          {/* Global Search Trigger */}
          <div class="navbar-search-container">
            <button class="navbar-search-input" onClick={() => setIsSearchOpen(true)}>
              <div class="flex items-center gap-2">
                <Search size={17} />
                <span>Cari sesuatu...</span>
              </div>
              <div class="navbar-search-shortcut">
                <Command size={10} />
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Notifications */}
          <div class="relative">
            <button
              class={`navbar-action-btn ${notifOpen() ? 'active' : ''}`}
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
                <div class="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div class="notif-dropdown">
                  <div class="notif-header">
                    <div>
                      <p class="notif-title">Notifikasi</p>
                      <Show when={unreadCount() > 0}>
                        <p class="notif-subtitle">{unreadCount()} belum dibaca</p>
                      </Show>
                    </div>
                    <button class="notif-mark-read">Tandai semua dibaca</button>
                  </div>

                  <div class="notif-list">
                    <For each={notifications}>
                      {(notif) => (
                        <div class={`notif-item ${!notif.read ? 'unread' : ''}`}>
                          <div class={`notif-dot ${!notif.read ? 'active' : 'inactive'}`} />
                          <div class="flex-1 min-w-0">
                            <p class="notif-content-title" style={{ "font-weight": !notif.read ? "700" : "500" }}>
                              {notif.title}
                            </p>
                            <p class="notif-content-body">{notif.body}</p>
                            <p class="notif-content-time">{notif.time}</p>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>

                  <div class="notif-footer">
                    <A href="/notifications" onClick={() => setNotifOpen(false)} class="notif-view-all">
                      Lihat semua notifikasi →
                    </A>
                  </div>
                </div>
              </>
            </Show>
          </div>

          {/* Avatar / Profile Link */}
          <A href="/profile" class="navbar-avatar" title="Lihat Profil">
            AD
          </A>
        </div>
      </div>
    </header>
  );
}
