import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from "lucide-solid";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import { getProducts, Product, formatCurrency, createProduct, getCategories, uploadFile, fetchApi, ProductImage } from "../lib/api";

export default function Products() {
  const [products, { refetch }] = createResource(getProducts);
  const [categories] = createResource(getCategories);

  // Modal states
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [editingProduct, setEditingProduct] = createSignal<Product | null>(null);

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
      alert(err.message || "Failed to fetch product details");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await import("../lib/api").then(api => api.deleteProduct(id));
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  const columns: Column<Product>[] = [
    {
      header: "SKU / ID",
      accessor: "id",
      render: (item) => <span class="font-bold text-ink">{item.sku || item.id.substring(0, 8).toUpperCase()}</span>
    },
    {
      header: "Product",
      accessor: "name",
      render: (item) => (
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-cream border border-border overflow-hidden flex-shrink-0 flex items-center justify-center text-muted">
            <Show when={item.thumbnail_url} fallback={<ImageIcon size={18} />}>
              <Show when={isVideo(item.thumbnail_url!)} fallback={
                <img src={item.thumbnail_url!} alt={item.name} class="w-full h-full object-cover" />
              }>
                <div class="w-full h-full bg-ink flex items-center justify-center">
                  <div class="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                </div>
              </Show>
            </Show>
          </div>
          <span class="font-semibold text-ink">{item.name}</span>
        </div>
      )
    },
    {
      header: "Category",
      accessor: "category_name",
      render: (item) => <span class="text-ink-light">{item.category_name}</span>
    },
    {
      header: "Price",
      accessor: "price",
      render: (item) => <span class="font-bold text-ink">{formatCurrency(item.price)}</span>
    },
    {
      header: "Stock",
      accessor: "stock",
      render: (item) => <span class="text-ink-light">{item.stock}</span>
    },
    {
      header: "Status",
      accessor: "status",
      render: (item) => (
        <span class={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'In Stock' ? 'bg-green-100 text-green-700' :
          item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
          }`}>
          {item.status}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      render: (item) => (
        <div class="flex items-center gap-2">
          <button
            onClick={() => handleEdit(item)}
            class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        { label: "In Stock", value: "In Stock" },
        { label: "Low Stock", value: "Low Stock" },
        { label: "Out of Stock", value: "Out of Stock" },
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
      refetch();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
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
    <Layout title="Products">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-ink">Products</h1>
          <p class="text-ink-light mt-1">Manage your product inventory and catalog.</p>
        </div>
        <button
          onClick={handleAddClick}
          class="bg-green-500 text-white p-2.5 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-2 px-4"
        >
          <Plus size={20} />
          <span class="font-bold">Add Product</span>
        </button>
      </div>

      <Show when={products()} fallback={<div class="p-8 text-center text-muted">Loading products...</div>}>
        <DataTable
          columns={columns}
          data={products()!}
          searchPlaceholder="Search products..."
          filters={filters}
        />
      </Show>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={handleCloseModal}
        title={editingProduct() ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleSubmit} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <Show when={error()}>
            <div class="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100">
              {error()}
            </div>
          </Show>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Product Media (Images/Videos)</label>
            <div class="grid grid-cols-4 gap-3">
              <For each={previewItems()}>
                {(item, index) => (
                  <div class="aspect-square rounded-2xl bg-cream border border-border overflow-hidden relative group">
                    <Show when={item.type === 'image'} fallback={
                      <div class="w-full h-full bg-ink flex items-center justify-center">
                        <div class="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                      </div>
                    }>
                      <img src={item.url} class="w-full h-full object-cover" />
                    </Show>
                    <button
                      type="button"
                      onClick={() => removePreview(index())}
                      class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus size={14} class="rotate-45" />
                    </button>
                    <Show when={index() === 0}>
                      <div class="absolute bottom-0 inset-x-0 bg-green-500 text-white text-[10px] font-bold py-0.5 text-center">Thumbnail</div>
                    </Show>
                  </div>
                )}
              </For>
              <div class="aspect-square rounded-2xl bg-cream border-2 border-dashed border-border flex items-center justify-center text-muted relative hover:border-green-500 hover:text-green-500 transition-colors">
                <ImageIcon size={24} />
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <p class="text-[10px] text-muted mt-2 ml-1">
              * The first item will be used as the product thumbnail.
            </p>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Product Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Gamis Premium"
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              value={formData().name}
              onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Category</label>
            <select
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all appearance-none"
              value={formData().category_id || ""}
              onChange={(e) => setFormData({ ...formData(), category_id: e.currentTarget.value || null })}
            >
              <option value="">Uncategorized</option>
              <For each={categories()}>
                {(category) => (
                  <option value={category.id}>{category.name}</option>
                )}
              </For>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-bold text-ink-light ml-1">Price (IDR)</label>
              <input
                type="number"
                required
                placeholder="0"
                class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                value={formData().price}
                onInput={(e) => setFormData({ ...formData(), price: parseFloat(e.currentTarget.value) })}
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-bold text-ink-light ml-1">Stock</label>
              <input
                type="number"
                required
                placeholder="0"
                class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                value={formData().stock}
                onInput={(e) => setFormData({ ...formData(), stock: parseInt(e.currentTarget.value) })}
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">SKU (Optional)</label>
            <input
              type="text"
              placeholder="e.g. GMS-001"
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              value={formData().sku}
              onInput={(e) => setFormData({ ...formData(), sku: e.currentTarget.value })}
            />
          </div>

          <div class="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={handleCloseModal}
              class="flex-1 py-3 px-4 bg-cream text-ink font-bold rounded-2xl hover:bg-border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving()}
              class="flex-[2] py-3 px-4 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <Show when={isSaving()}>
                <Loader2 class="animate-spin" size={20} />
              </Show>
              {isSaving() ? "Saving..." : (editingProduct() ? "Update Product" : "Save Product")}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
