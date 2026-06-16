import { createResource, createSignal, Show } from "solid-js";
import { Eye, Loader2 } from "lucide-solid";
import Layout from "../components/Layout";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import Modal from "../components/Modal";
import { toast } from "../lib/toast";
import { getOrders, Order, formatCurrency, updateOrderStatus } from "../lib/api";

export default function Orders() {
  // Pagination states
  const [currentPage, setCurrentPage] = createSignal(1);
  const [itemsPerPage, setItemsPerPage] = createSignal(10);

  // createResource automatically refetches when the source (first argument function) returns a new value.
  const [orders, { refetch }] = createResource(
    () => ({ page: currentPage(), limit: itemsPerPage() }),
    ({ page, limit }) => getOrders(page, limit)
  );
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = createSignal<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isUpdating, setIsUpdating] = createSignal(false);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    const order = selectedOrder();
    if (!order) return;

    setIsUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      toast.success(`Status pesanan ${order.order_number} berhasil diperbarui`);
      refetch();
      // Update local state to reflect change immediately in modal
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui status pesanan");
    } finally {
      setIsUpdating(false);
    }
  };

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
        return <span style={{ color: "var(--color-ink-light)", "white-space": "nowrap" }}>{d.toLocaleDateString('id-ID')} {d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
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
      render: (item) => {
        const getLabel = () => {
          if (item.status === 'pending') {
            if (item.payment_status === 'expired') return { text: 'Kadaluarsa', color: 'badge-red' };
            if (item.payment_status === 'failed') return { text: 'Gagal', color: 'badge-red' };
          }
          switch (item.status) {
            case 'paid':
              return { text: 'Dibayar', color: 'badge-green' };
            case 'shipped':
              return { text: 'Dikirim', color: 'badge-blue' };
            case 'delivered':
              return { text: 'Diterima', color: 'badge-green' };
            case 'pending':
              return { text: 'Menunggu', color: 'badge-orange' };
            case 'cancelled':
              return { text: 'Dibatalkan', color: 'badge-red' };
            default:
              return { text: item.status, color: 'badge-red' };
          }
        };
        const { text, color } = getLabel();
        return <span class={`badge ${color}`}>{text}</span>;
      }
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (item) => (
        <button 
          class="action-btn" 
          style={{ color: "var(--color-ink-light)" }}
          onClick={() => handleViewOrder(item)}
          title="Lihat Detail Pesanan"
        >
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
        { label: "Kadaluarsa", value: "expired" },
        { label: "Gagal", value: "failed" },
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
          data={orders()?.data ?? []}
          searchPlaceholder="Cari pesanan..."
          filters={filters}
          pagination={true}
          serverSide={true}
          totalItems={orders()?.meta?.total_items ?? 0}
          currentPage={currentPage()}
          itemsPerPage={itemsPerPage()}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </Show>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        title={`Detail Pesanan: ${selectedOrder()?.order_number || ''}`}
      >
        <Show when={selectedOrder()}>
          {(order) => (
            <div style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1.25rem" }}>
              
              {/* Order Info Grid */}
              <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div>
                  <div style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase" }}>Nomor Pesanan</div>
                  <div style={{ "font-size": "1rem", "font-weight": "700", color: "var(--color-ink)", "margin-top": "0.25rem" }}>{order().order_number}</div>
                </div>
                <div>
                  <div style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase" }}>Tanggal Transaksi</div>
                  <div style={{ "font-size": "0.95rem", color: "var(--color-ink)", "margin-top": "0.25rem" }}>
                    {new Date(order().ordered_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </div>
                </div>
                <div>
                  <div style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase" }}>Nama Pelanggan</div>
                  <div style={{ "font-size": "0.95rem", "font-weight": "600", color: "var(--color-ink)", "margin-top": "0.25rem" }}>{order().customer_name}</div>
                </div>
                <div>
                  <div style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase" }}>Total Tagihan</div>
                  <div style={{ "font-size": "1rem", "font-weight": "700", color: "var(--color-green-700)", "margin-top": "0.25rem" }}>{formatCurrency(order().grand_total)}</div>
                </div>
              </div>

              <hr style={{ border: "none", "border-top": "1px solid var(--color-border)", margin: "0.5rem 0" }} />

              {/* Items Section */}
              <div>
                <div style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase", "margin-bottom": "0.5rem" }}>Detail Produk</div>
                <div style={{ padding: "1rem", "background-color": "var(--color-sand)", "border-radius": "0.75rem", border: "1px solid var(--color-border)" }}>
                  <div style={{ "font-weight": "600", color: "var(--color-ink)" }}>{order().product_name}</div>
                </div>
              </div>

              <hr style={{ border: "none", "border-top": "1px solid var(--color-border)", margin: "0.5rem 0" }} />

              {/* Status Management */}
              <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
                <div style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase" }}>Ubah Status Pesanan</div>
                <div style={{ display: "flex", "align-items": "center", gap: "1rem", "margin-top": "0.25rem" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <select
                      class="pagination-size-select"
                      style={{ width: "100%", padding: "0.75rem 1rem", "font-size": "0.95rem" }}
                      value={order().status}
                      disabled={isUpdating()}
                      onChange={(e) => handleStatusChange(e.currentTarget.value)}
                    >
                      <option value="pending">Menunggu (Pending)</option>
                      <option value="paid">Dibayar (Paid)</option>
                      <option value="shipped">Dikirim (Shipped)</option>
                      <option value="delivered">Diterima (Delivered)</option>
                      <option value="cancelled">Dibatalkan (Cancelled)</option>
                    </select>
                  </div>
                  <Show when={isUpdating()}>
                    <div style={{ display: "flex", "align-items": "center", gap: "0.5rem", color: "var(--color-muted)" }}>
                      <Loader2 class="animate-spin" size={18} />
                      <span style={{ "font-size": "0.875rem" }}>Memperbarui...</span>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Close Button */}
              <div style={{ "padding-top": "1rem", display: "flex", "justify-content": "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "0.75rem 1.5rem", "background-color": "var(--color-ink)", color: "white", "font-weight": "700", "border-radius": "1rem", border: "none", cursor: "pointer", transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  Tutup
                </button>
              </div>

            </div>
          )}
        </Show>
      </Modal>
    </Layout>
  );
}
