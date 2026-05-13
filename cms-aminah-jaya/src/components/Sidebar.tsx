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
  Image
} from "lucide-solid";
import { A, useLocation, useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";

function SidebarLink(props: { icon: any, label: string, href: string, active?: boolean }) {
  return (
    <A
      href={props.href}
      class={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${props.active
        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
        : 'text-ink-light hover:bg-cream hover:text-green-500'
        }`}
    >
      <props.icon size={20} class={`${props.active ? 'text-white' : 'text-muted group-hover:text-green-500'}`} />
      <span class="font-bold text-sm tracking-wide">{props.label}</span>
      {props.active && <div class="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <aside
      class={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-border/50 z-50 transition-transform duration-300 transform lg:translate-x-0 ${props.isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div class="p-8 flex flex-col h-full">
        <div class="flex items-center gap-3 mb-12">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center">
            <img src="/logo.png" alt="Logo" class="w-16" />
          </div>
          <span class="text-xl font-serif font-bold text-ink">Aminah <span class="text-green-500">Jaya</span></span>
          <button class="lg:hidden ml-auto p-2 hover:bg-cream rounded-lg" onClick={props.onClose}>
            <X size={20} />
          </button>
        </div>

        <nav class="flex-1 space-y-2">
          <SidebarLink href="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarLink href="/products" icon={ShoppingBag} label="Products" active={location.pathname.startsWith('/products')} />
          <SidebarLink href="/categories" icon={LayoutGrid} label="Categories" active={location.pathname.startsWith('/categories')} />
          <SidebarLink href="/flash-sales" icon={Zap} label="Flash Sales" active={location.pathname.startsWith('/flash-sales')} />
          <SidebarLink href="/blogs" icon={FileText} label="Blogs" active={location.pathname.startsWith('/blogs')} />
          <SidebarLink href="/banners" icon={Image} label="Banners" active={location.pathname.startsWith('/banners')} />
          <SidebarLink href="/orders" icon={Package} label="Orders" active={location.pathname.startsWith('/orders')} />
          <SidebarLink href="/customers" icon={Users} label="Customers" active={location.pathname.startsWith('/customers')} />
          <SidebarLink href="/settings" icon={Settings} label="Settings" active={location.pathname.startsWith('/settings')} />
        </nav>

        <div class="pt-8 border-t border-border/50">
          <div class="bg-cream rounded-2xl p-4 mb-6">
            <p class="text-xs font-bold text-muted uppercase tracking-wider mb-2">Logged in as</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                {user()?.name ? getInitials(user().name) : 'AD'}
              </div>
              <div class="overflow-hidden">
                <p class="text-sm font-bold text-ink leading-tight truncate">{user()?.name || 'Admin Aminah'}</p>
                <p class="text-xs text-muted truncate">{user()?.email || 'Super Admin'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            class="flex items-center gap-3 w-full px-4 py-3 text-red-500 font-semibold hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
