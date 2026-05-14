import { createResource, For, Show } from "solid-js";
import {
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowUpRight,
  Package
} from "lucide-solid";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import { getDashboardStats, getRecentOrders, getPerformanceStats, getUserProfile, formatCurrency, authToken } from "../lib/api";

export default function Dashboard() {
  const [stats] = createResource(authToken, () => getDashboardStats());
  const [recentOrders] = createResource(authToken, () => getRecentOrders());
  const [performance] = createResource(authToken, () => getPerformanceStats());
  const [user] = createResource(authToken, () => getUserProfile());

  // Debug log
  console.log("User resource state:", {
    data: user(),
    loading: user.loading,
    error: user.error
  });

  const formatChange = (val?: number) => {
    if (val === undefined) return "+0%";
    return val > 0 ? `+${val}%` : `${val}%`;
  };

  const getTimeData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return { greeting: "Selamat Pagi", context: "pagi ini" };
    if (hour >= 11 && hour < 15) return { greeting: "Selamat Siang", context: "siang ini" };
    if (hour >= 15 && hour < 18) return { greeting: "Selamat Sore", context: "sore ini" };
    return { greeting: "Selamat Malam", context: "malam ini" };
  };

  const timeData = getTimeData();

  return (
    <Layout title="Ringkasan">
      {/* Welcome Text */}
      <div class="dashboard-header">
        <h1 class="dashboard-title">
          {timeData.greeting}, <Show when={user()} fallback="Aminah">{user()!.name}</Show>! 👋
        </h1>
        <p class="dashboard-subtitle">Berikut adalah ringkasan aktivitas toko Anda {timeData.context}.</p>
      </div>

      {/* Stats Grid */}
      <div class="stats-grid">
        <Show when={stats()} fallback={<div style={{ "grid-column": "span 4", padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat statistik...</div>}>
          <StatCard
            label="Total Pendapatan"
            value={formatCurrency(stats()!.total_revenue)}
            change={formatChange(stats()!.revenue_change)}
            icon={TrendingUp}
            color="#22c55e"
            bg="#f0fdf4"
          />
          <StatCard
            label="Pesanan"
            value={stats()!.total_orders.toString()}
            change={formatChange(stats()!.orders_change)}
            icon={ShoppingBag}
            color="#3b82f6"
            bg="#eff6ff"
          />
          <StatCard
            label="Pelanggan Baru"
            value={stats()!.new_customers.toString()}
            change={formatChange(stats()!.customers_change)}
            icon={Users}
            color="#a855f7"
            bg="#faf5ff"
          />
          <StatCard
            label="Stok Barang"
            value={stats()!.stock_items.toString()}
            change={formatChange(stats()!.stock_change)}
            icon={Package}
            color="#f97316"
            bg="#fff7ed"
          />
        </Show>
      </div>

      {/* Table & Chart placeholder section */}
      <div class="dashboard-charts-grid">
        {/* Recent Orders Table */}
        <div class="dashboard-orders-table">
          <div style={{ padding: "1.5rem", "border-bottom": "1px solid rgba(229, 224, 216, 0.4)", display: "flex", "justify-content": "space-between", "align-items": "center" }}>
            <h3 style={{ "font-size": "1.125rem", "font-weight": "700", color: "var(--color-ink)", margin: 0 }}>Pesanan Terbaru</h3>
            <a href="/orders" style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-green-500)", "text-decoration": "none" }}>Lihat Semua</a>
          </div>
          <div style={{ "overflow-x": "auto", flex: 1 }}>
            <Show when={recentOrders()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat pesanan terbaru...</div>}>
              <table style={{ width: "100%", "text-align": "left", "border-collapse": "collapse" }}>
                <thead style={{ "background-color": "var(--color-cream)", color: "var(--color-muted)", "font-size": "0.75rem", "font-weight": "700", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>
                  <tr>
                    <th style={{ padding: "1rem 1.5rem" }}>Nomor Pesanan</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Pelanggan</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Produk</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Total</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={recentOrders()}>
                    {(order) => (
                      <tr style={{ "border-bottom": "1px solid rgba(229, 224, 216, 0.3)", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-cream)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                        <td style={{ padding: "1rem 1.5rem", "font-weight": "700", color: "var(--color-ink)" }}>{order.order_number}</td>
                        <td style={{ padding: "1rem 1.5rem", color: "var(--color-ink-light)" }}>{order.customer_name}</td>
                        <td style={{ padding: "1rem 1.5rem", color: "var(--color-ink-light)", "max-width": "200px", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }} title={order.product_name}>{order.product_name}</td>
                        <td style={{ padding: "1rem 1.5rem", "font-weight": "700", color: "var(--color-ink)" }}>{formatCurrency(order.grand_total)}</td>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <span style={{
                            padding: "0.25rem 0.75rem",
                            "border-radius": "9999px",
                            "font-size": "0.75rem",
                            "font-weight": "700",
                            "text-transform": "capitalize",
                            "background-color": order.status === 'paid' ? "rgba(220, 252, 231, 1)" : order.status === 'shipped' ? "rgba(219, 234, 254, 1)" : "rgba(255, 237, 213, 1)",
                            color: order.status === 'paid' ? "rgba(21, 128, 61, 1)" : order.status === 'shipped' ? "rgba(29, 78, 216, 1)" : "rgba(194, 65, 12, 1)"
                          }}>
                            {order.status === 'paid' ? 'Dibayar' : order.status === 'shipped' ? 'Dikirim' : 'Menunggu'}
                          </span>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </div>
        </div>

        {/* Side Card / Activity */}
        <div class="dashboard-performance-card">
          <div style={{ position: "relative", "z-index": 10 }}>
            <h3 style={{ "font-size": "1.25rem", "font-weight": "700", "margin-bottom": "0.5rem" }}>Peningkatan Performa</h3>
            <Show when={performance()} fallback={<p style={{ color: "rgba(220, 252, 231, 0.7)", "font-size": "0.875rem", "margin-bottom": "2rem", "line-height": 1.625 }}>Memuat performa...</p>}>
              <p style={{ color: "rgba(220, 252, 231, 0.7)", "font-size": "0.875rem", "margin-bottom": "2rem", "line-height": 1.625 }}>
                Penjualan Anda naik {performance()!.sales_growth.toFixed(0)}% dibanding bulan lalu. Terus tingkatkan!
              </p>

              <div style={{ "margin-top": "auto", display: "flex", "flex-direction": "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                  <div style={{ width: "3rem", height: "3rem", "background-color": "rgba(255, 255, 255, 0.1)", "border-radius": "1rem", display: "flex", "align-items": "center", "justify-content": "center" }}>
                    <TrendingUp size={24} color="#4ade80" />
                  </div>
                  <div>
                    <p style={{ "font-size": "0.875rem", "font-weight": "700" }}>Produk Terlaris</p>
                    <p style={{ "font-size": "0.75rem", color: "rgba(220, 252, 231, 0.5)" }}>{performance()!.top_selling_product}</p>
                  </div>
                </div>
                <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                  <div style={{ width: "3rem", height: "3rem", "background-color": "rgba(255, 255, 255, 0.1)", "border-radius": "1rem", display: "flex", "align-items": "center", "justify-content": "center" }}>
                    <ArrowUpRight size={24} color="#60a5fa" />
                  </div>
                  <div>
                    <p style={{ "font-size": "0.875rem", "font-weight": "700" }}>Tingkat Konversi</p>
                    <p style={{ "font-size": "0.75rem", color: "rgba(220, 252, 231, 0.5)" }}>
                      {performance()!.conversion_rate.toFixed(1)}% ({performance()!.conversion_rate > 3 ? 'Tinggi' : 'Rata-rata'})
                    </p>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Background accent */}
          <div style={{ position: "absolute", bottom: "-2.5rem", right: "-2.5rem", width: "10rem", height: "10rem", "background-color": "var(--color-green-500)", "border-radius": "50%", filter: "blur(24px)", opacity: 0.2 }}></div>
        </div>
      </div>
    </Layout>
  );
}
