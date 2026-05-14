import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Edit, Trash2, Loader2, Ticket, Calendar, DollarSign, Percent, Info } from "lucide-solid";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, Coupon, formatCurrency } from "../lib/api";

export default function Coupons() {
  const [coupons, { refetch }] = createResource(getCoupons);

  // Modal states
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [editingCoupon, setEditingCoupon] = createSignal<Coupon | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [couponToDelete, setCouponToDelete] = createSignal<string | null>(null);

  // Form states
  const [formData, setFormData] = createSignal({
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    min_purchase: 0,
    max_discount: 0,
    start_at: new Date().toISOString().split('T')[0],
    end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usage_limit: 0,
    is_active: true,
  });

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_discount: coupon.max_discount || 0,
      start_at: new Date(coupon.start_at).toISOString().split('T')[0],
      end_at: new Date(coupon.end_at).toISOString().split('T')[0],
      usage_limit: coupon.usage_limit || 0,
      is_active: coupon.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setCouponToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const id = couponToDelete();
    if (!id) return;

    try {
      await deleteCoupon(id);
      toast.success("Kupon berhasil dihapus");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus kupon");
    }
  };

  const columns: Column<Coupon>[] = [
    {
      header: "Kode",
      accessor: "code",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", "border-radius": "0.75rem", "background-color": "#f0fdf4", color: "#16a34a", display: "flex", "align-items": "center", "justify-content": "center" }}>
            <Ticket size={18} />
          </div>
          <div>
            <p style={{ "font-weight": "700", color: "var(--color-ink)", "font-family": "monospace" }}>{item.code}</p>
            <p style={{ "font-size": "0.75rem", color: "var(--color-ink-light)" }}>Dibuat {new Date(item.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      )
    },
    {
      header: "Diskon",
      accessor: "discount_value",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
          <span style={{ "font-weight": "700", color: "var(--color-ink)" }}>
            {item.discount_type === 'percentage' ? `${item.discount_value}%` : formatCurrency(item.discount_value)}
          </span>
          <span style={{ "font-size": "0.625rem", "background-color": "var(--color-cream)", padding: "0.125rem 0.375rem", "border-radius": "0.25rem", border: "1px solid var(--color-border)", color: "var(--color-muted)", "text-transform": "uppercase", "font-weight": "700" }}>
            {item.discount_type === 'percentage' ? 'Persentase' : 'Tetap'}
          </span>
        </div>
      )
    },
    {
      header: "Masa Berlaku",
      accessor: "start_at",
      render: (item) => (
        <div style={{ "font-size": "0.75rem", display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", "align-items": "center", gap: "0.25rem", color: "var(--color-ink-light)" }}>
            <Calendar size={12} />
            <span>{new Date(item.start_at).toLocaleDateString()} - {new Date(item.end_at).toLocaleDateString()}</span>
          </div>
          <Show when={new Date(item.end_at) < new Date()}>
            <span style={{ color: "#ef4444", "font-weight": "700", "text-transform": "uppercase", "font-size": "0.5625rem" }}>Kadaluarsa</span>
          </Show>
        </div>
      )
    },
    {
      header: "Penggunaan",
      accessor: "used_count",
      render: (item) => (
        <div style={{ "font-size": "0.75rem" }}>
          <p style={{ "font-weight": "700", color: "var(--color-ink)" }}>{item.used_count} <span style={{ color: "var(--color-muted)", "font-weight": "400" }}>terpakai</span></p>
          <p style={{ color: "var(--color-muted)", "font-style": "italic" }}>{item.usage_limit ? `Batas: ${item.usage_limit}` : 'Tanpa batas'}</p>
        </div>
      )
    },
    {
      header: "Status",
      accessor: "is_active",
      render: (item) => (
        <span class={`badge ${item.is_active ? 'badge-green' : 'badge-red'}`} style={{ "font-size": "0.625rem" }}>
          {item.is_active ? 'AKTIF' : 'NONAKTIF'}
        </span>
      )
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
          <button
            onClick={() => handleEdit(item)}
            class="action-btn action-btn-edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            class="action-btn action-btn-delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    },
  ];

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData(),
        start_at: new Date(formData().start_at).toISOString(),
        end_at: new Date(formData().end_at).toISOString(),
        usage_limit: formData().usage_limit > 0 ? formData().usage_limit : undefined,
        max_discount: formData().max_discount > 0 ? formData().max_discount : undefined,
      };

      const couponToEdit = editingCoupon();
      if (couponToEdit) {
        await updateCoupon(couponToEdit.id, payload);
      } else {
        await createCoupon(payload);
      }

      handleCloseModal();
      toast.success(couponToEdit ? "Kupon berhasil diperbarui" : "Kupon berhasil ditambahkan");
      refetch();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan kupon");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setEditingCoupon(null);
    setIsModalOpen(false);
  };

  const handleAddClick = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase: 0,
      max_discount: 0,
      start_at: new Date().toISOString().split('T')[0],
      end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usage_limit: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  return (
    <Layout title="Manajemen Kupon">
      <div class="page-header">
        <div>
          <h1 class="page-title">Kupon</h1>
          <p class="page-subtitle">Buat dan kelola kode diskon untuk toko Anda.</p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={20} />
          <span>Tambah Kupon</span>
        </Button>
      </div>

      <Show when={coupons()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat kupon...</div>}>
        <DataTable
          columns={columns}
          data={coupons()!}
          searchPlaceholder="Cari kupon berdasarkan kode..."
        />
      </Show>

      {/* Add/Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={handleCloseModal}
        title={editingCoupon() ? "Edit Kupon" : "Tambah Kupon Baru"}
      >
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <Show when={error()}>
            <div style={{ padding: "1rem", "background-color": "#fef2f2", color: "#dc2626", "font-size": "0.875rem", "border-radius": "1rem", border: "1px solid #fee2e2" }}>
              {error()}
            </div>
          </Show>

          <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem", "grid-column": "span 2" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Kode Kupon</label>
              <input
                type="text"
                placeholder="PROMO2024"
                class="login-input"
                style={{ "font-family": "monospace", "text-transform": "uppercase" }}
                value={formData().code}
                onInput={(e) => setFormData({ ...formData(), code: e.currentTarget.value })}
                required
              />
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem", "grid-column": "span 2" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Tipe Diskon</label>
              <select
                class="login-input"
                value={formData().discount_type}
                onChange={(e) => setFormData({ ...formData(), discount_type: e.currentTarget.value })}
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Nilai Diskon</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-muted)" }}>
                  {formData().discount_type === 'percentage' ? <Percent size={14} /> : <DollarSign size={14} />}
                </div>
                <input
                  type="number"
                  class="login-input"
                  style={{ "padding-left": "2.5rem" }}
                  value={formData().discount_value}
                  onInput={(e) => setFormData({ ...formData(), discount_value: parseFloat(e.currentTarget.value) })}
                  required
                />
              </div>
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Min. Belanja (Rp)</label>
              <input
                type="number"
                class="login-input"
                value={formData().min_purchase}
                onInput={(e) => setFormData({ ...formData(), min_purchase: parseFloat(e.currentTarget.value) })}
              />
            </div>
          </div>

          <Show when={formData().discount_type === 'percentage'}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Diskon Maksimal (Opsional)</label>
              <input
                type="number"
                placeholder="Contoh: 50000"
                class="login-input"
                value={formData().max_discount}
                onInput={(e) => setFormData({ ...formData(), max_discount: parseFloat(e.currentTarget.value) })}
              />
              <p style={{ "font-size": "0.625rem", color: "var(--color-muted)", "margin-left": "0.25rem", display: "flex", "align-items": "center", gap: "0.25rem" }}><Info size={10} /> Kasih batas maksimal potongan harga biar tidak boncos (rugi).</p>
            </div>
          </Show>

          <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Tanggal Mulai</label>
              <input
                type="date"
                class="login-input"
                value={formData().start_at}
                onInput={(e) => setFormData({ ...formData(), start_at: e.currentTarget.value })}
                required
              />
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Tanggal Berakhir</label>
              <input
                type="date"
                class="login-input"
                value={formData().end_at}
                onInput={(e) => setFormData({ ...formData(), end_at: e.currentTarget.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Batas Penggunaan</label>
              <input
                type="number"
                placeholder="0 untuk tanpa batas"
                class="login-input"
                value={formData().usage_limit}
                onInput={(e) => setFormData({ ...formData(), usage_limit: parseInt(e.currentTarget.value) })}
              />
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Status</label>
              <div style={{ display: "flex", "align-items": "center", height: "3rem" }}>
                <label style={{ position: "relative", display: "inline-flex", "align-items": "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData().is_active}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    onChange={(e) => setFormData({ ...formData(), is_active: e.currentTarget.checked })}
                  />
                  <div style={{ width: "2.75rem", height: "1.5rem", "background-color": formData().is_active ? "var(--color-green-500)" : "#e5e7eb", "border-radius": "9999px", transition: "all 0.2s", position: "relative" }}>
                    <div style={{ position: "absolute", top: "0.125rem", left: formData().is_active ? "1.375rem" : "0.125rem", width: "1.25rem", height: "1.25rem", "background-color": "white", "border-radius": "50%", transition: "all 0.2s" }}></div>
                  </div>
                  <span style={{ "margin-left": "0.75rem", "font-size": "0.875rem", "font-weight": "500", color: "var(--color-ink-light)" }}>{formData().is_active ? 'Aktif' : 'Nonaktif'}</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ "padding-top": "1rem", display: "flex", gap: "0.75rem", position: "sticky", bottom: 0, "background-color": "white", "padding-bottom": "0.5rem" }}>
            <button
              type="button"
              onClick={handleCloseModal}
              style={{ flex: 1, padding: "0.75rem 1rem", "background-color": "var(--color-cream)", color: "var(--color-ink)", "font-weight": "700", "border-radius": "1rem", border: "none", cursor: "pointer" }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving()}
              style={{ flex: 2, padding: "0.75rem 1rem", "background-color": "var(--color-green-500)", color: "white", "font-weight": "700", "border-radius": "1rem", border: "none", cursor: "pointer", display: "flex", "align-items": "center", "justify-content": "center", gap: "0.5rem" }}
            >
              <Show when={isSaving()}>
                <Loader2 class="animate-spin" size={20} />
              </Show>
              {isSaving() ? "Menyimpan..." : (editingCoupon() ? "Update Kupon" : "Simpan Kupon")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Kupon"
        message="Apakah Anda yakin ingin menghapus kupon ini? Kode ini akan dihapus permanen dari sistem."
        confirmText="Hapus"
        isDanger={true}
      />
    </Layout>
  );
}
