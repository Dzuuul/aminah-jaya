import {
  LayoutDashboard,
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
  Shield
} from "lucide-solid";

import { A, useLocation, useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";

function SidebarLink(props: { icon: any, label: string, href: string, active?: boolean }) {
  return (
    <A
      href={props.href}
      class={`sidebar-link ${props.active ? 'active' : ''}`}
      activeClass=""
    >
      <props.icon size={20} class="sidebar-link-icon" />
      <span class="sidebar-link-label">{props.label}</span>
      {props.active && <div class="sidebar-link-dot"></div>}
    </A>
  );
}

export default function Sidebar(props: { isOpen: boolean, onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = createMemo(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <aside class={`sidebar ${props.isOpen ? 'is-open' : ''}`}>
      <div class="sidebar-content">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <img src="/logo.png" alt="Logo" style={{ width: "3rem" }} />
          </div>
          <span class="sidebar-title">Aminah <span>Jaya</span></span>
          <button class="sidebar-close-btn" onClick={props.onClose}>
            <X size={20} />
          </button>
        </div>

        <nav class="sidebar-nav">
          <SidebarLink href="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarLink href="/products" icon={ShoppingBag} label="Produk" active={location.pathname.startsWith('/products')} />
          <SidebarLink href="/categories" icon={LayoutGrid} label="Kategori" active={location.pathname.startsWith('/categories')} />
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
          <div class="sidebar-user-card">
            <p class="sidebar-user-label">Masuk sebagai</p>
            <div class="sidebar-user-info">
              <div class="sidebar-user-avatar">
                {user()?.name ? getInitials(user().name) : 'AD'}
              </div>
              <div class="sidebar-user-details">
                <p class="sidebar-user-name">{user()?.name || 'Admin Aminah'}</p>
                <p class="sidebar-user-email">{user()?.email || 'Super Admin'}</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} class="sidebar-logout-btn">
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
