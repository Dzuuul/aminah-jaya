import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, ExternalLink, Calendar } from "lucide-solid";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getBanners, createBanner, updateBanner, deleteBanner, uploadFile, Banner } from "../lib/api";

export default function Banners() {
  const [banners, { refetch }] = createResource(() => getBanners(true));

  // Modal states
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [editingBanner, setEditingBanner] = createSignal<Banner | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [bannerToDelete, setBannerToDelete] = createSignal<string | null>(null);

  // Form states
  const [formData, setFormData] = createSignal({
    image_url: "",
    link_url: "",
    sort_order: 0,
    is_active: true,
  });

  const [previewFile, setPreviewFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    setPreviewUrl(banner.image_url);
    setPreviewFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setBannerToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const id = bannerToDelete();
    if (!id) return;

    try {
      await deleteBanner(id);
      toast.success("Banner berhasil dihapus");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus banner");
    }
  };

  const columns: Column<Banner>[] = [
    {
      header: "Banner",
      accessor: "image_url",
      render: (item) => (
        <div style={{ width: "8rem", height: "4rem", "border-radius": "0.5rem", "background-color": "var(--color-cream)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", "align-items": "center", "justify-content": "center", color: "var(--color-muted)" }}>
          <Show when={item.image_url} fallback={<ImageIcon size={20} />}>
            <img src={item.image_url!} alt="Banner" style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
          </Show>
        </div>
      )
    },
    {
      header: "Tautan",
      accessor: "link_url",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.25rem", "font-size": "0.75rem", color: "var(--color-ink-light)" }}>
          <Show when={item.link_url} fallback={<span>-</span>}>
            <ExternalLink size={12} />
            <span style={{ overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", "max-width": "150px" }}>{item.link_url}</span>
          </Show>
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
      header: "Urutan",
      accessor: "sort_order",
      render: (item) => <span style={{ "font-family": "monospace", color: "var(--color-ink-light)" }}>{item.sort_order}</span>
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

  const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      setPreviewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      let imageUrl = formData().image_url;
      
      if (previewFile()) {
        imageUrl = await uploadFile(previewFile()!);
      }

      if (!imageUrl) {
          throw new Error("Gambar wajib diunggah");
      }

      const payload = {
        ...formData(),
        image_url: imageUrl,
      };

      const bannerToEdit = editingBanner();
      if (bannerToEdit) {
        await updateBanner(bannerToEdit.id, payload);
      } else {
        await createBanner(payload);
      }

      handleCloseModal();
      toast.success(bannerToEdit ? "Banner berhasil diperbarui" : "Banner berhasil ditambahkan");
      refetch();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan banner");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setFormData({ image_url: "", link_url: "", sort_order: 0, is_active: true });
    setEditingBanner(null);
    setPreviewUrl(null);
    setPreviewFile(null);
    setIsModalOpen(false);
  };

  const handleAddClick = () => {
    setEditingBanner(null);
    setFormData({ image_url: "", link_url: "", sort_order: 0, is_active: true });
    setPreviewUrl(null);
    setPreviewFile(null);
    setIsModalOpen(true);
  };

  return (
    <Layout title="Banner Utama">
      <div class="page-header">
        <div>
          <h1 class="page-title">Banner Utama</h1>
          <p class="page-subtitle">Kelola banner slider utama pada halaman depan.</p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={20} />
          <span>Tambah Banner</span>
        </Button>
      </div>

      <Show when={banners()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat banner...</div>}>
        <DataTable
          columns={columns}
          data={banners()!}
          searchPlaceholder="Cari banner..."
        />
      </Show>

      {/* Add/Edit Banner Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={handleCloseModal}
        title={editingBanner() ? "Edit Banner" : "Tambah Banner Baru"}
      >
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <Show when={error()}>
            <div style={{ padding: "1rem", "background-color": "#fef2f2", color: "#dc2626", "font-size": "0.875rem", "border-radius": "1rem", border: "1px solid #fee2e2" }}>
              {error()}
            </div>
          </Show>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Gambar Banner</label>
            <div style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
              <div style={{ width: "100%", "aspect-ratio": "21/9", "border-radius": "1rem", "background-color": "var(--color-cream)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", "align-items": "center", "justify-content": "center", color: "var(--color-muted)", position: "relative" }} class="group">
                <Show when={previewUrl()} fallback={<ImageIcon size={32} />}>
                  <img src={previewUrl()!} style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
                </Show>
                <div style={{ position: "absolute", inset: 0, "background-color": "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s", display: "flex", "align-items": "center", "justify-content": "center", color: "white", "pointer-events": "none" }} class="group-hover:opacity-100">
                  <Edit size={20} />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  onChange={handleFileChange}
                />
              </div>
              <p style={{ "font-size": "0.75rem", color: "var(--color-ink-light)", "text-align": "center" }}>Rekomendasi: Gambar lebar (Contoh: 1920x800px). PNG atau JPG.</p>
            </div>
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>URL Tautan (Opsional)</label>
            <input
              type="text"
              placeholder="https://..."
              class="login-input"
              value={formData().link_url}
              onInput={(e) => setFormData({ ...formData(), link_url: e.currentTarget.value })}
            />
          </div>

          <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
                <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Urutan</label>
                <input
                type="number"
                class="login-input"
                value={formData().sort_order}
                onInput={(e) => setFormData({ ...formData(), sort_order: parseInt(e.currentTarget.value) })}
                />
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
                <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Status Aktif</label>
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
                        <span style={{ "margin-left": "0.75rem", "font-size": "0.875rem", "font-weight": "500", color: "var(--color-ink-light)" }}>{formData().is_active ? 'Aktif' : 'Disembunyikan'}</span>
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
              {isSaving() ? "Menyimpan..." : (editingBanner() ? "Update Banner" : "Simpan Banner")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Banner"
        message="Apakah Anda yakin ingin menghapus banner ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        isDanger={true}
      />
    </Layout>
  );
}
