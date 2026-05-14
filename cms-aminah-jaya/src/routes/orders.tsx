import { createResource, Show } from "solid-js";
import { Eye } from "lucide-solid";
import Layout from "../components/Layout";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import { getOrders, Order, formatCurrency } from "../lib/api";

export default function Orders() {
  const [orders] = createResource(getOrders);

  const columns: Column<Order>[] = [
    {
      header: "Nomor Pesanan",
      accessor: "order_number",
      render: (item) => <span style={{ "font-weight": "700", color: "var(--color-ink)" }}>{item.order_number}</span>
    },
    {
      header: "Tanggal",
      accessor: "ordered_at",
      render: (item) => {
        const d = new Date(item.ordered_at);
        return <span style={{ color: "var(--color-ink-light)", "white-space": "nowrap" }}>{d.toLocaleDateString('id-ID')} {d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
      }
    },
    {
      header: "Pelanggan",
      accessor: "customer_name",
      render: (item) => <span style={{ "font-weight": "600", color: "var(--color-ink)" }}>{item.customer_name}</span>
    },
    {
      header: "Produk",
      accessor: "product_name",
      render: (item) => <span style={{ color: "var(--color-ink-light)", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis", "max-width": "200px", display: "inline-block" }} title={item.product_name}>{item.product_name}</span>
    },
    {
      header: "Total",
      accessor: "grand_total",
      render: (item) => <span style={{ "font-weight": "700", color: "var(--color-ink)" }}>{formatCurrency(item.grand_total)}</span>
    },
    {
      header: "Status",
      accessor: "status",
      render: (item) => (
        <span class={`badge ${
          item.status === 'paid' || item.status === 'delivered' ? 'badge-green' : 
          item.status === 'shipped' ? 'badge-blue' : 
          item.status === 'pending' ? 'badge-orange' : 'badge-red'
        }`}>
          {item.status === 'paid' ? 'Dibayar' : 
           item.status === 'shipped' ? 'Dikirim' : 
           item.status === 'delivered' ? 'Diterima' :
           item.status === 'pending' ? 'Menunggu' : 'Dibatalkan'}
        </span>
      )
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
      key: "status",
      label: "Status",
      options: [
        { label: "Dibayar", value: "paid" },
        { label: "Menunggu", value: "pending" },
        { label: "Dikirim", value: "shipped" },
        { label: "Diterima", value: "delivered" },
        { label: "Dibatalkan", value: "cancelled" },
      ]
    }
  ];

  return (
    <Layout title="Pesanan">
      <div class="page-header">
        <div>
          <h1 class="page-title">Pesanan</h1>
          <p class="page-subtitle">Lacak dan kelola pesanan pelanggan Anda.</p>
        </div>
      </div>

      <Show when={orders()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat pesanan...</div>}>
        <DataTable 
          columns={columns} 
          data={orders()!} 
          searchPlaceholder="Cari pesanan..."
          filters={filters}
          // The search/filter logic works on string values, so format it early if exact date matching is needed,
          // but for basic data passing it's fine.
        />
      </Show>
    </Layout>
  );
}
