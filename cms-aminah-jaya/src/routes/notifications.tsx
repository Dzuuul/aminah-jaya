import { For, Show, createSignal } from "solid-js";
import { 
  Bell, 
  Check, 
  Trash2, 
  Package, 
  ShoppingBag, 
  Users, 
  AlertCircle,
  MoreVertical,
  Filter,
  Search,
  CheckCircle2
} from "lucide-solid";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";

interface Notification {
  id: number;
  title: string;
  body: string;
  time: string;
  date: string;
  read: boolean;
  type: 'order' | 'stock' | 'customer' | 'system';
}

const initialNotifications: Notification[] = [
  { 
    id: 1, 
    title: "Pesanan baru diterima", 
    body: "#ORD-7238 dari Rudi Hermawan senilai Rp 450.000", 
    time: "2 menit lalu", 
    date: "16 Mei 2026",
    read: false,
    type: 'order'
  },
  { 
    id: 2, 
    title: "Peringatan stok rendah", 
    body: "Minyak Zaitun 250ml hanya tersisa 12 botol di gudang utama", 
    time: "15 menit lalu", 
    date: "16 Mei 2026",
    read: false,
    type: 'stock'
  },
  { 
    id: 3, 
    title: "Pembayaran dikonfirmasi", 
    body: "#ORD-7236 telah berhasil dibayar via Transfer Bank", 
    time: "1 jam lalu", 
    date: "16 Mei 2026",
    read: true,
    type: 'order'
  },
  { 
    id: 4, 
    title: "Pelanggan baru terdaftar", 
    body: "Rudi Hermawan baru saja membuat akun pelanggan", 
    time: "3 jam lalu", 
    date: "16 Mei 2026",
    read: true,
    type: 'customer'
  },
  { 
    id: 5, 
    title: "Pembaruan sistem berhasil", 
    body: "CMS Aminah Jaya telah diperbarui ke versi 2.4.0", 
    time: "5 jam lalu", 
    date: "16 Mei 2026",
    read: true,
    type: 'system'
  },
  { 
    id: 6, 
    title: "Gagal memproses pengiriman", 
    body: "#ORD-7230 mengalami kendala pada kurir JNE", 
    time: "1 hari lalu", 
    date: "15 Mei 2026",
    read: true,
    type: 'system'
  },
];

const typeIcon: Record<string, any> = {
  order: Package,
  stock: AlertCircle,
  customer: Users,
  system: CheckCircle2,
};

const typeColor: Record<string, string> = {
  order: "text-blue-500 bg-blue-50",
  stock: "text-orange-500 bg-orange-50",
  customer: "text-purple-500 bg-purple-50",
  system: "text-green-500 bg-green-50",
};


export default function NotificationsPage() {
  const [notifications, setNotifications] = createSignal<Notification[]>(initialNotifications);
  const [filter, setFilter] = createSignal<'all' | 'unread'>('all');

  const filteredNotifications = () => {
    if (filter() === 'unread') {
      return notifications().filter(n => !n.read);
    }
    return notifications();
  };

  const markAllAsRead = () => {
    setNotifications(notifications().map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications().map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = (id: number) => {
    setNotifications(notifications().filter(n => n.id !== id));
  };

  const unreadCount = () => notifications().filter(n => !n.read).length;

  return (
    <Layout title="Notifikasi">
      <div class="page-header">
        <div>
          <h1 class="page-title">Notifikasi</h1>
          <p class="page-subtitle">Kelola semua pemberitahuan aktivitas toko Anda.</p>
        </div>
        
        <Button 
          variant="secondary"
          size="sm"
          onClick={markAllAsRead}
        >
          <Check size={16} class="text-green-500" />
          <span>Tandai Semua Dibaca</span>
        </Button>
      </div>

      {/* Content Card */}
      <div style={{ "background-color": "#ffffff", "border-radius": "1.5rem", border: "1px solid rgba(229, 224, 216, 0.4)", "box-shadow": "0 1px 2px 0 rgba(0, 0, 0, 0.05)", overflow: "hidden", "margin-bottom": "2rem" }}>
        
        {/* Tabs */}
        <div style={{ display: "flex", "border-bottom": "1px solid rgba(229, 224, 216, 0.3)", padding: "0 1rem" }}>
          <button 
            onClick={() => setFilter('all')}
            style={{ 
              padding: "1rem 1.5rem", 
              "font-size": "0.875rem", 
              "font-weight": "700", 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              "border-bottom": filter() === 'all' ? "2px solid var(--color-green-500)" : "2px solid transparent",
              color: filter() === 'all' ? "var(--color-green-500)" : "var(--color-muted)",
              transition: "all 0.2s"
            }}
          >
            Semua
            <Show when={notifications().length > 0}>
              <span style={{ "margin-left": "0.5rem", padding: "0.125rem 0.5rem", "background-color": "rgba(229, 224, 216, 0.3)", "border-radius": "9999px", "font-size": "0.625rem" }}>
                {notifications().length}
              </span>
            </Show>
          </button>
          <button 
            onClick={() => setFilter('unread')}
            style={{ 
              padding: "1rem 1.5rem", 
              "font-size": "0.875rem", 
              "font-weight": "700", 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              "border-bottom": filter() === 'unread' ? "2px solid var(--color-green-500)" : "2px solid transparent",
              color: filter() === 'unread' ? "var(--color-green-500)" : "var(--color-muted)",
              transition: "all 0.2s"
            }}
          >
            Belum Dibaca
            <Show when={unreadCount() > 0}>
              <span style={{ "margin-left": "0.5rem", padding: "0.125rem 0.5rem", "background-color": "var(--color-green-100)", color: "var(--color-green-700)", "border-radius": "9999px", "font-size": "0.625rem" }}>
                {unreadCount()}
              </span>
            </Show>
          </button>
        </div>

        <div style={{ "display": "flex", "flex-direction": "column" }}>
          <Show 
            when={filteredNotifications().length > 0} 
            fallback={
              <div style={{ padding: "5rem 1rem", display: "flex", "flex-direction": "column", "align-items": "center", "text-align": "center" }}>
                <div style={{ width: "4rem", height: "4rem", "background-color": "var(--color-cream)", "border-radius": "50%", display: "flex", "align-items": "center", "justify-content": "center", "margin-bottom": "1rem" }}>
                  <Bell size={24} style={{ color: "var(--color-muted)" }} />
                </div>
                <h3 style={{ color: "var(--color-ink)", "font-weight": "700", margin: 0 }}>Tidak ada notifikasi</h3>
                <p style={{ color: "var(--color-muted)", "font-size": "0.875rem", "margin-top": "0.5rem" }}>Anda sudah melihat semua pemberitahuan.</p>
              </div>
            }
          >
            <For each={filteredNotifications()}>
              {(notif) => {
                const Icon = typeIcon[notif.type];
                return (
                  <div 
                    style={{ 
                      display: "flex", 
                      gap: "1.25rem", 
                      padding: "1.5rem", 
                      "border-bottom": "1px solid rgba(229, 224, 216, 0.3)", 
                      position: "relative",
                      "background-color": !notif.read ? "var(--color-green-50)" : "transparent",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => { if (notif.read) e.currentTarget.style.backgroundColor = "var(--color-cream)"; }}
                    onMouseLeave={(e) => { if (notif.read) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {/* Read Indicator Line */}
                    <Show when={!notif.read}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", "background-color": "var(--color-green-500)", "border-top-right-radius": "4px", "border-bottom-right-radius": "4px" }} />
                    </Show>

                    {/* Icon */}
                    <div class={typeColor[notif.type]} style={{ width: "3rem", height: "3rem", "border-radius": "0.875rem", display: "flex", "align-items": "center", "justify-content": "center", "flex-shrink": 0 }}>
                      <Icon size={20} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, "min-width": 0 }}>
                      <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "0.5rem", "margin-bottom": "0.25rem" }}>
                        <h4 style={{ "font-size": "0.875rem", "font-weight": "700", color: !notif.read ? "var(--color-ink)" : "var(--color-ink-light)", margin: 0, "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>
                          {notif.title}
                        </h4>
                        <span style={{ "font-size": "0.6875rem", color: "var(--color-muted)", "white-space": "nowrap" }}>{notif.time}</span>
                      </div>
                      <p style={{ "font-size": "0.875rem", color: "var(--color-ink-light)", "line-height": "1.5", margin: "0 0 1rem 0" }}>
                        {notif.body}
                      </p>
                      
                      <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                        <Show when={!notif.read}>
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            style={{ "font-size": "0.6875rem", "font-weight": "700", color: "var(--color-green-500)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                          >
                            Tandai dibaca
                          </button>
                        </Show>
                        <button 
                          onClick={() => deleteNotif(notif.id)}
                          style={{ "font-size": "0.6875rem", "font-weight": "700", color: "#f87171", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#dc2626"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#f87171"}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    {/* Date Indicator (Sticky/Right) */}
                    <div style={{ display: "none" }} class="lg:block">
                      <span style={{ "font-size": "0.6875rem", color: "rgba(138, 138, 138, 0.4)", "font-weight": "600" }}>{notif.date}</span>
                    </div>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>

        <Show when={filteredNotifications().length > 0}>
          <div style={{ padding: "1rem", "background-color": "rgba(253, 252, 250, 0.5)", "text-align": "center", "border-top": "1px solid rgba(229, 224, 216, 0.3)" }}>
            <p style={{ "font-size": "0.75rem", color: "var(--color-muted)", margin: 0 }}>Menampilkan semua notifikasi terbaru</p>
          </div>
        </Show>
      </div>
    </Layout>
  );
}
