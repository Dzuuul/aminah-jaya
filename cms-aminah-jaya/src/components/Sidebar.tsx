import {
  LayoutDashboard,
  Bell,
  ShoppingBag,
  Users,
  Settings,
  Package,
  LogOut,
  X,
  Zap,
  FileText,
  LayoutGrid,
  Image,
  Ticket,
  Shield,
  ChevronLeft,
  ChevronRight,
  Folder
} from "lucide-solid";

import { A, useLocation, useNavigate } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { sidebarFolded, toggleSidebarFolded } from "../lib/sidebarStore";
import { updateToken } from "../lib/api";

function SidebarLink(props: { icon: any, label: string, href: string, active?: boolean }) {
  return (
    <A
      href={props.href}
      class={`sidebar-link ${props.active ? 'active' : ''}`}
      activeClass=""
      title={sidebarFolded() ? props.label : ""}
    >
      <props.icon size={20} class="sidebar-link-icon" />
      <Show when={!sidebarFolded()}>
        <span class="sidebar-link-label">{props.label}</span>
      </Show>
      {props.active && !sidebarFolded() && <div class="sidebar-link-dot"></div>}
    </A>
  );
}

export default function Sidebar(props: { isOpen: boolean, onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    updateToken(null);
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <aside class={`sidebar ${props.isOpen ? 'is-open' : ''} ${sidebarFolded() ? 'is-folded' : ''}`}>
      <div class="sidebar-content">
        <div class="sidebar-header">
          <Show 
            when={!sidebarFolded()} 
            fallback={
              <button class="sidebar-fold-btn" onClick={toggleSidebarFolded} title="Buka Sidebar">
                <ChevronRight size={20} />
              </button>
            }
          >
            <div class="sidebar-logo">
              <img src="/logo.png" alt="Logo" style={{ width: "2.5rem" }} />
            </div>
            <span class="sidebar-title">Aminah <span>Jaya</span></span>
            <button class="sidebar-fold-btn" onClick={toggleSidebarFolded} title="Lipat Sidebar">
              <ChevronLeft size={18} />
            </button>
          </Show>

          <button class="sidebar-close-btn" onClick={props.onClose}>
            <X size={20} />
          </button>
        </div>

        <nav class="sidebar-nav">
          <SidebarLink href="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarLink href="/notifications" icon={Bell} label="Notifikasi" active={location.pathname === '/notifications'} />
          <SidebarLink href="/products" icon={ShoppingBag} label="Produk" active={location.pathname.startsWith('/products')} />
          <SidebarLink href="/categories" icon={LayoutGrid} label="Kategori" active={location.pathname.startsWith('/categories')} />
          <SidebarLink href="/collections" icon={Folder} label="Koleksi" active={location.pathname.startsWith('/collections')} />
          <SidebarLink href="/flash-sales" icon={Zap} label="Flash Sale" active={location.pathname.startsWith('/flash-sales')} />
          <SidebarLink href="/blogs" icon={FileText} label="Blog" active={location.pathname.startsWith('/blogs')} />
          <SidebarLink href="/banners" icon={Image} label="Banner" active={location.pathname.startsWith('/banners')} />
          <SidebarLink href="/coupons" icon={Ticket} label="Kupon" active={location.pathname.startsWith('/coupons')} />
          <SidebarLink href="/orders" icon={Package} label="Pesanan" active={location.pathname.startsWith('/orders')} />
          <SidebarLink href="/customers" icon={Users} label="Pelanggan" active={location.pathname.startsWith('/customers')} />
          <SidebarLink href="/legal" icon={Shield} label="Dokumen Legal" active={location.pathname.startsWith('/legal')} />
          <SidebarLink href="/settings" icon={Settings} label="Pengaturan" active={location.pathname.startsWith('/settings')} />

        </nav>

        <div class="sidebar-footer">
          <button onClick={handleLogout} class="sidebar-logout-btn">
            <LogOut size={18} />
            <Show when={!sidebarFolded()}>
              <span>Keluar</span>
            </Show>
          </button>
        </div>
      </div>
    </aside>
  );
}
