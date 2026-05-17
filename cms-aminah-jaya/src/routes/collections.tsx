import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, Folder } from "lucide-solid";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getCollections, getCollectionDetails, createCollection, updateCollection, deleteCollection, getProducts, uploadFile, Collection } from "../lib/api";

export default function Collections() {
  const [collections, { refetch }] = createResource(getCollections);
  const [products] = createResource(getProducts);

  // Modal states
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [editingCollection, setEditingCollection] = createSignal<Collection | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [collectionToDelete, setCollectionToDelete] = createSignal<string | null>(null);

  // Form states
  const [formData, setFormData] = createSignal({
    name: "",
    description: "",
    image_url: "" as string | null,
    sort_order: 0,
    product_ids: [] as string[],
  });

  const [previewFile, setPreviewFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);

  const handleEdit = async (collection: Collection) => {
    setIsSaving(true);
    try {
      // Fetch full details (which includes product_ids)
      const details = await getCollectionDetails(collection.id);
      setEditingCollection(details);
      setFormData({
        name: details.name,
        description: details.description || "",
        image_url: details.image_url,
        sort_order: details.sort_order,
        product_ids: details.product_ids || [],
      });
      setPreviewUrl(details.image_url);
      setPreviewFile(null);
      setIsModalOpen(true);
    } catch (err: any) {
      toast.error("Gagal memuat detail koleksi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setCollectionToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const id = collectionToDelete();
    if (!id) return;

    try {
      await deleteCollection(id);
      toast.success("Koleksi berhasil dihapus");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus koleksi");
    }
  };

  const columns: Column<Collection>[] = [
    {
      header: "Thumbnail",
      accessor: "image_url",
      render: (item) => (
        <div style={{ width: "3rem", height: "3rem", "border-radius": "0.5rem", "background-color": "var(--color-cream)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", "align-items": "center", "justify-content": "center", color: "var(--color-muted)" }}>
          <Show when={item.image_url} fallback={<Folder size={20} />}>
            <img src={item.image_url!} alt={item.name} style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
          </Show>
        </div>
      )
    },
    {
      header: "Nama Koleksi",
      accessor: "name",
      render: (item) => (
        <div>
          <div style={{ "font-weight": "600", color: "var(--color-ink)" }}>{item.name}</div>
          <div style={{ "font-size": "0.75rem", color: "var(--color-ink-light)", "font-family": "monospace" }}>{item.slug}</div>
        </div>
      )
    },
    {
      header: "Deskripsi",
      accessor: "description",
      render: (item) => <span style={{ color: "var(--color-ink-light)", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis", "max-width": "250px", display: "inline-block" }}>{item.description || "-"}</span>
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

      const payload = {
        ...formData(),
        image_url: imageUrl,
      };

      const collectionToEdit = editingCollection();
      if (collectionToEdit) {
        await updateCollection(collectionToEdit.id, payload);
      } else {
        await createCollection(payload);
      }

      handleCloseModal();
      toast.success(collectionToEdit ? "Koleksi berhasil diperbarui" : "Koleksi berhasil ditambahkan");
      refetch();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan koleksi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setFormData({ name: "", description: "", image_url: null, sort_order: 0, product_ids: [] });
    setEditingCollection(null);
    setPreviewUrl(null);
    setPreviewFile(null);
    setIsModalOpen(false);
  };

  const handleAddClick = () => {
    setEditingCollection(null);
    setFormData({ name: "", description: "", image_url: null, sort_order: 0, product_ids: [] });
    setPreviewUrl(null);
    setPreviewFile(null);
    setIsModalOpen(true);
  };

  return (
    <Layout title="Koleksi">
      <div class="page-header">
        <div>
          <h1 class="page-title">Koleksi</h1>
          <p class="page-subtitle">Kelola kelompok produk pilihan atau kampanye tertentu.</p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={20} />
          <span>Tambah Koleksi</span>
        </Button>
      </div>

      <Show when={collections()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat koleksi...</div>}>
        <DataTable
          columns={columns}
          data={collections()!}
          searchPlaceholder="Cari koleksi..."
        />
      </Show>

      {/* Add/Edit Collection Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={handleCloseModal}
        title={editingCollection() ? "Edit Koleksi" : "Tambah Koleksi Baru"}
      >
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <Show when={error()}>
            <div style={{ padding: "1rem", "background-color": "#fef2f2", color: "#dc2626", "font-size": "0.875rem", "border-radius": "1rem", border: "1px solid #fee2e2" }}>
              {error()}
            </div>
          </Show>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Thumbnail</label>
            <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
              <div style={{ width: "6rem", height: "6rem", "border-radius": "1rem", "background-color": "var(--color-cream)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", "align-items": "center", "justify-content": "center", color: "var(--color-muted)", position: "relative" }} class="group">
                <Show when={previewUrl()} fallback={<Folder size={32} />}>
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
              <div style={{ flex: 1 }}>
                <p style={{ "font-size": "0.75rem", color: "var(--color-ink-light)" }}>Rekomendasi: Gambar persegi (512x512px). PNG atau JPG.</p>
                <button 
                  type="button"
                  style={{ "margin-top": "0.5rem", "font-size": "0.75rem", "font-weight": "700", color: "var(--color-green-500)", "text-decoration": "underline", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                >
                  Unggah Gambar Baru
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Nama Koleksi</label>
            <input
              type="text"
              required
              placeholder="Contoh: Raya Collection"
              class="login-input"
              value={formData().name}
              onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
            />
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Deskripsi (Opsional)</label>
            <textarea
              placeholder="Deskripsi singkat mengenai koleksi ini..."
              class="login-input"
              style={{ "min-height": "80px", "font-family": "inherit" }}
              value={formData().description}
              onInput={(e) => setFormData({ ...formData(), description: e.currentTarget.value })}
            />
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Urutan</label>
            <input
              type="number"
              placeholder="0"
              class="login-input"
              value={formData().sort_order}
              onInput={(e) => setFormData({ ...formData(), sort_order: parseInt(e.currentTarget.value) })}
            />
          </div>

          {/* Product selection checkboxes */}
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Produk dalam Koleksi</label>
            <div style={{
              border: "1px solid var(--color-border)",
              "border-radius": "1rem",
              padding: "0.75rem 1rem",
              "max-height": "160px",
              "overflow-y": "auto",
              display: "flex",
              "flex-direction": "column",
              gap: "0.5rem",
              "background-color": "var(--color-cream)"
            }}>
              <Show when={products()} fallback={<div style={{ "font-size": "0.875rem", color: "var(--color-muted)" }}>Memuat produk...</div>}>
                <For each={products()}>
                  {(product) => {
                    const isChecked = () => formData().product_ids.includes(product.id);
                    const handleToggle = () => {
                      const current = formData().product_ids;
                      if (current.includes(product.id)) {
                        setFormData({ ...formData(), product_ids: current.filter(id => id !== product.id) });
                      } else {
                        setFormData({ ...formData(), product_ids: [...current, product.id] });
                      }
                    };
                    return (
                      <label style={{ display: "flex", "align-items": "center", gap: "0.5rem", cursor: "pointer", padding: "2px 0" }}>
                        <input
                          type="checkbox"
                          checked={isChecked()}
                          onChange={handleToggle}
                          style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
                        />
                        <span style={{ "font-size": "0.875rem", color: "var(--color-ink)" }}>{product.name}</span>
                      </label>
                    );
                  }}
                </For>
              </Show>
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
              {isSaving() ? "Menyimpan..." : (editingCollection() ? "Update Koleksi" : "Simpan Koleksi")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Koleksi"
        message="Apakah Anda yakin ingin menghapus koleksi ini? Ini tidak akan menghapus produk yang ada di dalamnya."
        confirmText="Hapus"
        isDanger={true}
      />
    </Layout>
  );
}
