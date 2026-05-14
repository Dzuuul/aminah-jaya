import { createResource, Show } from "solid-js";
import { Eye, Phone, Users, ShoppingBag, TrendingUp, MapPin } from "lucide-solid";
import Layout from "../components/Layout";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import StatCard from "../components/StatCard";
import { getCustomers, getCustomerStats, Customer, formatCurrency } from "../lib/api";

export default function Customers() {
  const [customers] = createResource(getCustomers);
  const [stats] = createResource(getCustomerStats);

  const columns: Column<Customer>[] = [
    {
      header: "Nama",
      accessor: "name",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
          <div style={{ width: "2.25rem", height: "2.25rem", "border-radius": "50%", "background-color": "#dcfce7", color: "#15803d", "font-weight": "700", "font-size": "0.875rem", display: "flex", "align-items": "center", "justify-content": "center", "flex-shrink": 0 }}>
            {item.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "?"}
          </div>
          <span style={{ "font-weight": "600", color: "var(--color-ink)" }}>{item.name}</span>
        </div>
      )
    },
    {
      header: "Kontak",
      accessor: "phone",
      render: (item) => (
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.125rem" }}>
          <div style={{ display: "flex", "align-items": "center", gap: "0.375rem", color: "var(--color-ink-light)", "font-size": "0.875rem" }}>
            <Phone size={13} style={{ color: "var(--color-muted)", "flex-shrink": 0 }} />
            <span>{item.phone}</span>
          </div>
          <Show when={item.city}>
            <div style={{ display: "flex", "align-items": "center", gap: "0.375rem", color: "var(--color-ink-light)", "font-size": "0.875rem" }}>
              <MapPin size={13} style={{ color: "var(--color-muted)", "flex-shrink": 0 }} />
              <span>{item.city}</span>
            </div>
          </Show>
        </div>
      )
    },
    {
      header: "Pesanan",
      accessor: "total_orders",
      render: (item) => <span style={{ "font-weight": "700", color: "var(--color-ink)" }}>{item.total_orders}</span>
    },
    {
      header: "Total Belanja",
      accessor: "total_spent",
      render: (item) => <span style={{ "font-weight": "700", color: "#16a34a" }}>{formatCurrency(item.total_spent)}</span>
    },
    {
      header: "Status",
      accessor: "is_blocked",
      render: (item) => {
        const isBlocked = item.is_blocked;
        return (
          <span class={`badge ${!isBlocked ? "badge-green" : "badge-red"}`}>
            {!isBlocked ? "Aktif" : "Diblokir"}
          </span>
        );
      }
    },
    {
      header: "Aksi",
      accessor: "id",
      render: () => (
        <button class="action-btn" style={{ color: "var(--color-ink-light)" }}>
          <Eye size={18} />
        </button>
      )
    }
  ];

  const filters: FilterDef[] = [
    {
      key: "is_blocked",
      label: "Status",
      options: [
        { label: "Aktif", value: "false" },
        { label: "Diblokir", value: "true" },
      ]
    }
  ];

  return (
    <Layout title="Pelanggan">
      <div class="page-header">
        <div>
          <h1 class="page-title">Pelanggan</h1>
          <p class="page-subtitle">Lihat dan kelola basis pelanggan Anda.</p>
        </div>
      </div>

      <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", "margin-bottom": "1.5rem" }}>
        <Show when={stats()} fallback={<div style={{ "grid-column": "1 / -1", padding: "1rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat statistik...</div>}>
          <StatCard label="Total Kontak" value={stats()!.total_customers.toString()} icon={Users} color="#a855f7" bg="#faf5ff" />
          <StatCard label="Aktif (30 Hari)" value={stats()!.active_customers.toString()} icon={ShoppingBag} color="#22c55e" bg="#f0fdf4" />
          <StatCard label="Total Pendapatan" value={formatCurrency(stats()!.total_revenue)} icon={TrendingUp} color="#3b82f6" bg="#eff6ff" />
        </Show>
      </div>

      <Show when={customers()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat pelanggan...</div>}>
        <DataTable
          columns={columns}
          data={customers()!}
          searchPlaceholder="Cari pelanggan..."
          filters={filters}
        />
      </Show>
    </Layout>
  );
}
