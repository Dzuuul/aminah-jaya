import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from "lucide-solid";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getProducts, Product, formatCurrency, createProduct, getCategories, uploadFile, fetchApi, ProductImage } from "../lib/api";

export default function Products() {
  const [products, { refetch }] = createResource(getProducts);
  const [categories] = createResource(getCategories);

  // Modal states
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [editingProduct, setEditingProduct] = createSignal<Product | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [productToDelete, setProductToDelete] = createSignal<string | null>(null);

  // Form states
  const [formData, setFormData] = createSignal({
    name: "",
    category_id: "" as string | null,
    price: 0,
    stock: 0,
    sku: "",
    image_urls: [] as string[],
  });

  const [previewItems, setPreviewItems] = createSignal<{ url: string, type: string, file?: File }[]>([]);

  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg|mov)$/i);

  const handleEdit = async (product: Product) => {
    try {
      // Fetch full product details to get all images
      const fullProduct = await fetchApi<Product>(`/products/${product.id}`);

      setFormData({
        name: fullProduct.name,
        category_id: fullProduct.category_id,
        price: fullProduct.price,
        stock: fullProduct.stock,
        sku: fullProduct.sku || "",
        image_urls: fullProduct.images?.map((img: ProductImage) => img.url) || [],
      });


      setPreviewItems(fullProduct.images?.map((img: ProductImage) => ({
        url: img.url,
        type: isVideo(img.url) ? 'video' : 'image'
      })) || []);
      setEditingProduct(fullProduct);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error("❌ Failed to fetch product details:", err);
      toast.error(err.message || "Failed to fetch product details");
    }
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const id = productToDelete();
    if (!id) return;

    try {
      const { deleteProduct } = await import("../lib/api");
      await deleteProduct(id);
      toast.success("Product deleted successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  const columns: Column<Product>[] = [
    {
      header: "SKU / ID",
      accessor: "id",
      render: (item) => <span style={{ "font-weight": "700", color: "var(--color-ink)" }}>{item.sku || item.id.substring(0, 8).toUpperCase()}</span>
    },
    {
      header: "Produk",
      accessor: "name",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", "border-radius": "0.5rem", "background-color": "var(--color-cream)", border: "1px solid var(--color-border)", overflow: "hidden", "flex-shrink": 0, display: "flex", "align-items": "center", "justify-content": "center", color: "var(--color-muted)" }}>
            <Show when={item.thumbnail_url} fallback={<ImageIcon size={18} />}>
              <Show when={isVideo(item.thumbnail_url!)} fallback={
                <img src={item.thumbnail_url!} alt={item.name} style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
              }>
                <div style={{ width: "100%", height: "100%", "background-color": "var(--color-ink)", display: "flex", "align-items": "center", "justify-content": "center" }}>
                  <div style={{ width: 0, height: 0, "border-top": "4px solid transparent", "border-left": "6px solid white", "border-bottom": "4px solid transparent", "margin-left": "0.125rem" }}></div>
                </div>
              </Show>
            </Show>
          </div>
          <span style={{ "font-weight": "600", color: "var(--color-ink)" }}>{item.name}</span>
        </div>
      )
    },
    {
      header: "Kategori",
      accessor: "category_name",
      render: (item) => <span style={{ color: "var(--color-ink-light)" }}>{item.category_name}</span>
    },
    {
      header: "Harga",
      accessor: "price",
      render: (item) => <span style={{ "font-weight": "700", color: "var(--color-ink)" }}>{formatCurrency(item.price)}</span>
    },
    {
      header: "Stok",
      accessor: "stock",
      render: (item) => <span style={{ color: "var(--color-ink-light)" }}>{item.stock}</span>
    },
    {
      header: "Status",
      accessor: "status",
      render: (item) => (
        <span class={`badge ${item.status === 'In Stock' ? 'badge-green' :
          item.status === 'Low Stock' ? 'badge-orange' : 'badge-red'
          }`}>
          {item.status === 'In Stock' ? 'Tersedia' : item.status === 'Low Stock' ? 'Hampir Habis' : 'Stok Habis'}
        </span>
      )
    },
    {
      header: "Actions",
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

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Tersedia", value: "In Stock" },
        { label: "Hampir Habis", value: "Low Stock" },
        { label: "Stok Habis", value: "Out of Stock" },
      ]
    }
  ];

  const handleFileChange = (e: Event) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (files.length > 0) {
      const newPreviews = files.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        file: file
      }));

      setPreviewItems([...previewItems(), ...newPreviews]);
    }
  };

  const removePreview = (index: number) => {
    const item = previewItems()[index];
    if (item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    }

    const newItems = [...previewItems()];
    newItems.splice(index, 1);
    setPreviewItems(newItems);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // 1. Identify existing URLs to keep
      const currentUrls = previewItems()
        .filter(item => !item.file) // Items without a File object are already on the server
        .map(item => item.url);

      // 2. Identify new Files to upload
      const filesToUpload = previewItems()
        .filter(item => item.file)
        .map(item => item.file!);

      // 3. Upload new files
      const newUrls = await Promise.all(
        filesToUpload.map(file => uploadFile(file))
      );

      const payload = {
        ...formData(),
        category_id: formData().category_id || null,
        image_urls: [...currentUrls, ...newUrls],
      };

      console.log("🚀 Submitting payload:", payload);

      const productToEdit = editingProduct();
      if (productToEdit) {
        const { updateProduct } = await import("../lib/api");
        await updateProduct(productToEdit.id, payload);
      } else {
        await createProduct(payload);
      }

      handleCloseModal();
      toast.success(productToEdit ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan");
      refetch();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan produk");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setFormData({ name: "", category_id: null, price: 0, stock: 0, sku: "", image_urls: [] });
    setEditingProduct(null);
    setPreviewItems([]);
    setIsModalOpen(false);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormData({ name: "", category_id: null, price: 0, stock: 0, sku: "", image_urls: [] });
    setPreviewItems([]);
    setIsModalOpen(true);
  };

  return (
    <Layout title="Produk">
      <div class="page-header">
        <div>
          <h1 class="page-title">Produk</h1>
          <p class="page-subtitle">Kelola inventaris dan katalog produk Anda.</p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={20} />
          <span>Tambah Produk</span>
        </Button>
      </div>

      <Show when={products()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat produk...</div>}>
        <DataTable
          columns={columns}
          data={products()!}
          searchPlaceholder="Cari produk..."
          filters={filters}
        />
      </Show>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={handleCloseModal}
        title={editingProduct() ? "Edit Produk" : "Tambah Produk Baru"}
      >
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1rem", "max-height": "80vh", "overflow-y": "auto" }}>
          <Show when={error()}>
            <div style={{ padding: "1rem", "background-color": "#fef2f2", color: "#dc2626", "font-size": "0.875rem", "border-radius": "1rem", border: "1px solid #fee2e2" }}>
              {error()}
            </div>
          </Show>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Media Produk (Gambar/Video)</label>
            <div style={{ display: "grid", "grid-template-columns": "repeat(4, minmax(0, 1fr))", gap: "0.75rem" }}>
              <For each={previewItems()}>
                {(item, index) => (
                  <div style={{ "aspect-ratio": "1 / 1", "border-radius": "1rem", "background-color": "var(--color-cream)", border: "1px solid var(--color-border)", overflow: "hidden", position: "relative" }} class="group">
                    <Show when={item.type === 'image'} fallback={
                      <div style={{ width: "100%", height: "100%", "background-color": "var(--color-ink)", display: "flex", "align-items": "center", "justify-content": "center" }}>
                        <div style={{ width: 0, height: 0, "border-top": "10px solid transparent", "border-left": "15px solid white", "border-bottom": "10px solid transparent", "margin-left": "0.25rem" }}></div>
                      </div>
                    }>
                      <img src={item.url} style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
                    </Show>
                    <button
                      type="button"
                      onClick={() => removePreview(index())}
                      style={{ position: "absolute", top: "0.25rem", right: "0.25rem", width: "1.5rem", height: "1.5rem", "background-color": "#ef4444", color: "white", "border-radius": "50%", display: "flex", "align-items": "center", "justify-content": "center", "border": "none", cursor: "pointer", opacity: 0, transition: "opacity 0.2s" }}
                      class="group-hover:opacity-100"
                    >
                      <Plus size={14} style={{ transform: "rotate(45deg)" }} />
                    </button>
                    <Show when={index() === 0}>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, "background-color": "var(--color-green-500)", color: "white", "font-size": "0.625rem", "font-weight": "700", padding: "0.125rem 0", "text-align": "center" }}>Utama</div>
                    </Show>
                  </div>
                )}
              </For>
              <div style={{ "aspect-ratio": "1 / 1", "border-radius": "1rem", "background-color": "var(--color-cream)", border: "2px dashed var(--color-border)", display: "flex", "align-items": "center", "justify-content": "center", color: "var(--color-muted)", position: "relative", transition: "all 0.2s", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-green-500)'; e.currentTarget.style.color = 'var(--color-green-500)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted)'; }}>
                <ImageIcon size={24} />
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <p style={{ "font-size": "0.625rem", color: "var(--color-muted)", "margin-top": "0.5rem", "margin-left": "0.25rem" }}>
              * Item pertama akan digunakan sebagai thumbnail produk.
            </p>
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Nama Produk</label>
            <input
              type="text"
              required
              placeholder="Contoh: Gamis Premium"
              class="login-input"
              value={formData().name}
              onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
            />
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Kategori</label>
            <select
              class="login-input"
              value={formData().category_id || ""}
              onChange={(e) => setFormData({ ...formData(), category_id: e.currentTarget.value || null })}
            >
              <option value="">Tanpa Kategori</option>
              <For each={categories()}>
                {(category) => (
                  <option value={category.id}>{category.name}</option>
                )}
              </For>
            </select>
          </div>

          <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Harga (Rp)</label>
              <input
                type="number"
                required
                placeholder="0"
                class="login-input"
                value={formData().price}
                onInput={(e) => setFormData({ ...formData(), price: parseFloat(e.currentTarget.value) })}
              />
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Stok</label>
              <input
                type="number"
                required
                placeholder="0"
                class="login-input"
                value={formData().stock}
                onInput={(e) => setFormData({ ...formData(), stock: parseInt(e.currentTarget.value) })}
              />
            </div>
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>SKU (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: GMS-001"
              class="login-input"
              value={formData().sku}
              onInput={(e) => setFormData({ ...formData(), sku: e.currentTarget.value })}
            />
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
              {isSaving() ? "Menyimpan..." : (editingProduct() ? "Update Produk" : "Simpan Produk")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        isDanger={true}
      />
    </Layout>
  );
}
