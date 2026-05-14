import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Trash2, Loader2, Calendar, Tag, Package } from "lucide-solid";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getFlashSales, FlashSale, createFlashSale, deleteFlashSale, getProducts, formatCurrency } from "../lib/api";

export default function FlashSales() {
  const [sales, { refetch }] = createResource(getFlashSales);
  const [products] = createResource(getProducts);

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [saleToDelete, setSaleToDelete] = createSignal<string | null>(null);

  const [formData, setFormData] = createSignal({
    name: "",
    description: "",
    start_at: "",
    end_at: "",
    items: [] as { product_id: string; sale_price: number; stock_limit: number }[],
  });

  const columns: Column<FlashSale>[] = [
    {
      header: "Nama Event",
      accessor: "name",
      render: (item) => <span style={{ "font-weight": "700", color: "var(--color-ink)" }}>{item.name}</span>
    },
    {
      header: "Waktu Mulai",
      accessor: "start_at",
      render: (item) => <span style={{ color: "var(--color-ink-light)" }}>{new Date(item.start_at).toLocaleString()}</span>
    },
    {
      header: "Waktu Berakhir",
      accessor: "end_at",
      render: (item) => <span style={{ color: "var(--color-ink-light)" }}>{new Date(item.end_at).toLocaleString()}</span>
    },
    {
      header: "Status",
      accessor: "is_active",
      render: (item) => {
        const now = new Date();
        const start = new Date(item.start_at);
        const end = new Date(item.end_at);
        const isActive = now >= start && now <= end;

        return (
          <span class={`badge ${isActive ? 'badge-green' : 'badge-orange'}`}>
            {isActive ? 'Berjalan' : now < start ? 'Akan Datang' : 'Berakhir'}
          </span>
        );
      }
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (item) => (
        <button
          onClick={() => { setSaleToDelete(item.id); setIsConfirmOpen(true); }}
          class="action-btn action-btn-delete"
        >
          <Trash2 size={18} />
        </button>
      )
    },
  ];

  const addItem = () => {
    setFormData({
      ...formData(),
      items: [...formData().items, { product_id: "", sale_price: 0, stock_limit: 10 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData().items];
    newItems.splice(index, 1);
    setFormData({ ...formData(), items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData().items];
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData(), items: newItems });
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await createFlashSale({
        ...formData(),
        start_at: new Date(formData().start_at).toISOString(),
        end_at: new Date(formData().end_at).toISOString(),
      });
      toast.success("Flash sale berhasil dibuat");
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat flash sale");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout title="Flash Sale">
      <div class="page-header">
        <div>
          <h1 class="page-title">Flash Sale</h1>
          <p class="page-subtitle">Kelola event promosi terbatas waktu.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="danger"
        >
          <Plus size={20} />
          <span>Event Baru</span>
        </Button>
      </div>

      <Show when={sales()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat event...</div>}>
        <DataTable columns={columns} data={sales()!} searchPlaceholder="Cari event..." />
      </Show>

      <Modal isOpen={isModalOpen()} onClose={() => setIsModalOpen(false)} title="Buat Flash Sale Baru">
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Nama Event</label>
            <input
              type="text" required placeholder="Contoh: 5.5 Super Sale"
              class="login-input"
              onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
            />
          </div>

          <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Waktu Mulai</label>
              <input
                type="datetime-local" required
                class="login-input"
                onInput={(e) => setFormData({ ...formData(), start_at: e.currentTarget.value })}
              />
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Waktu Berakhir</label>
              <input
                type="datetime-local" required
                class="login-input"
                onInput={(e) => setFormData({ ...formData(), end_at: e.currentTarget.value })}
              />
            </div>
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.75rem", "padding-top": "1rem" }}>
            <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
              <h3 style={{ "font-weight": "700", color: "var(--color-ink)" }}>Produk dalam Promo</h3>
              <button type="button" onClick={addItem} style={{ "font-size": "0.875rem", color: "#ef4444", "font-weight": "700", display: "flex", "align-items": "center", gap: "0.25rem", background: "none", border: "none", cursor: "pointer" }}>
                <Plus size={14} /> Tambah Produk
              </button>
            </div>

            <For each={formData().items}>
              {(item, index) => (
                <div style={{ padding: "1rem", "background-color": "var(--color-cream)", border: "1px solid var(--color-border)", "border-radius": "1rem", position: "relative", display: "flex", "flex-direction": "column", gap: "0.75rem" }}>
                  <button type="button" onClick={() => removeItem(index())} style={{ position: "absolute", top: "0.5rem", right: "0.5rem", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer" }}>
                    <Trash2 size={16} />
                  </button>
                  
                  <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
                    <label style={{ "font-size": "0.625rem", "font-weight": "700", "text-transform": "uppercase", color: "var(--color-muted)", "margin-left": "0.25rem" }}>Pilih Produk</label>
                    <select
                      required style={{ width: "100%", "background-color": "white", border: "1px solid var(--color-border)", "border-radius": "0.5rem", padding: "0.5rem", "font-size": "0.875rem", outline: "none" }}
                      onChange={(e) => updateItem(index(), "product_id", e.currentTarget.value)}
                    >
                      <option value="">Pilih produk...</option>
                      <For each={products()}>
                        {(p) => <option value={p.id}>{p.name} ({formatCurrency(p.price)})</option>}
                      </For>
                    </select>
                  </div>

                  <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "0.75rem" }}>
                    <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
                      <label style={{ "font-size": "0.625rem", "font-weight": "700", "text-transform": "uppercase", color: "var(--color-muted)", "margin-left": "0.25rem" }}>Harga Promo</label>
                      <input
                        type="number" required placeholder="0"
                        style={{ width: "100%", "background-color": "white", border: "1px solid var(--color-border)", "border-radius": "0.5rem", padding: "0.5rem", "font-size": "0.875rem", outline: "none" }}
                        onInput={(e) => updateItem(index(), "sale_price", parseFloat(e.currentTarget.value))}
                      />
                    </div>
                    <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
                      <label style={{ "font-size": "0.625rem", "font-weight": "700", "text-transform": "uppercase", color: "var(--color-muted)", "margin-left": "0.25rem" }}>Batas Stok</label>
                      <input
                        type="number" required placeholder="0"
                        style={{ width: "100%", "background-color": "white", border: "1px solid var(--color-border)", "border-radius": "0.5rem", padding: "0.5rem", "font-size": "0.875rem", outline: "none" }}
                        onInput={(e) => updateItem(index(), "stock_limit", parseInt(e.currentTarget.value))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div style={{ "padding-top": "1.5rem", display: "flex", gap: "0.75rem", position: "sticky", bottom: 0, "background-color": "white", "padding-bottom": "0.5rem" }}>
            <button
              type="button" onClick={() => setIsModalOpen(false)}
              style={{ flex: 1, padding: "0.75rem 1rem", "background-color": "var(--color-cream)", color: "var(--color-ink)", "font-weight": "700", "border-radius": "1rem", border: "none", cursor: "pointer" }}
            >
              Batal
            </button>
            <button
              type="submit" disabled={isSaving() || formData().items.length === 0}
              style={{ flex: 2, padding: "0.75rem 1rem", "background-color": "#ef4444", color: "white", "font-weight": "700", "border-radius": "1rem", border: "none", cursor: "pointer", display: "flex", "align-items": "center", "justify-content": "center", gap: "0.5rem", "box-shadow": "0 10px 15px -3px rgba(239, 68, 68, 0.2)", opacity: (isSaving() || formData().items.length === 0) ? 0.5 : 1 }}
            >
              <Show when={isSaving()}>
                <Loader2 class="animate-spin" size={20} />
              </Show>
              {isSaving() ? "Menyimpan..." : "Buat Event"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          if (!saleToDelete()) return;
          try {
            await deleteFlashSale(saleToDelete()!);
            toast.success("Event berhasil dihapus");
            refetch();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
        title="Hapus Flash Sale"
        message="Apakah Anda yakin ingin menghapus event ini? Tindakan ini juga akan menghapus harga flash sale untuk semua produk terkait."
        confirmText="Hapus"
        isDanger={true}
      />
    </Layout>
  );
}
