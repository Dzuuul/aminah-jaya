import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, LayoutGrid } from "lucide-solid";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getCategories, createCategory, updateCategory, deleteCategory, uploadFile, Category } from "../lib/api";

export default function Categories() {
  const [categories, { refetch }] = createResource(getCategories);

  // Modal states
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [editingCategory, setEditingCategory] = createSignal<Category | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [categoryToDelete, setCategoryToDelete] = createSignal<string | null>(null);

  // Form states
  const [formData, setFormData] = createSignal({
    name: "",
    description: "",
    image_url: "" as string | null,
    sort_order: 0,
  });

  const [previewFile, setPreviewFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url,
      sort_order: category.sort_order,
    });
    setPreviewUrl(category.image_url);
    setPreviewFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const id = categoryToDelete();
    if (!id) return;

    try {
      await deleteCategory(id);
      toast.success("Category deleted successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  const columns: Column<Category>[] = [
    {
      header: "Thumbnail",
      accessor: "image_url",
      render: (item) => (
        <div class="w-12 h-12 rounded-lg bg-cream border border-border overflow-hidden flex items-center justify-center text-muted">
          <Show when={item.image_url} fallback={<LayoutGrid size={20} />}>
            <img src={item.image_url!} alt={item.name} class="w-full h-full object-cover" />
          </Show>
        </div>
      )
    },
    {
      header: "Name",
      accessor: "name",
      render: (item) => (
        <div>
          <div class="font-semibold text-ink">{item.name}</div>
          <div class="text-xs text-ink-light font-mono">{item.slug}</div>
        </div>
      )
    },
    {
      header: "Description",
      accessor: "description",
      render: (item) => <span class="text-ink-light truncate max-w-[200px] inline-block">{item.description || "-"}</span>
    },
    {
      header: "Order",
      accessor: "sort_order",
      render: (item) => <span class="font-mono text-ink-light">{item.sort_order}</span>
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

      const categoryToEdit = editingCategory();
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, payload);
      } else {
        await createCategory(payload);
      }

      handleCloseModal();
      toast.success(categoryToEdit ? "Category updated successfully" : "Category created successfully");
      refetch();
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setFormData({ name: "", description: "", image_url: null, sort_order: 0 });
    setEditingCategory(null);
    setPreviewUrl(null);
    setPreviewFile(null);
    setIsModalOpen(false);
  };

  const handleAddClick = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", image_url: null, sort_order: 0 });
    setPreviewUrl(null);
    setPreviewFile(null);
    setIsModalOpen(true);
  };

  return (
    <Layout title="Categories">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-ink">Categories</h1>
          <p class="text-ink-light mt-1">Manage product categories and thumbnails.</p>
        </div>
        <button
          onClick={handleAddClick}
          class="bg-green-500 text-white p-2.5 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-2 px-4"
        >
          <Plus size={20} />
          <span class="font-bold">Add Category</span>
        </button>
      </div>

      <Show when={categories()} fallback={<div class="p-8 text-center text-muted">Loading categories...</div>}>
        <DataTable
          columns={columns}
          data={categories()!}
          searchPlaceholder="Search categories..."
        />
      </Show>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={handleCloseModal}
        title={editingCategory() ? "Edit Category" : "Add New Category"}
      >
        <form onSubmit={handleSubmit} class="p-6 space-y-4">
          <Show when={error()}>
            <div class="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100">
              {error()}
            </div>
          </Show>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Thumbnail</label>
            <div class="flex items-center gap-4">
              <div class="w-24 h-24 rounded-2xl bg-cream border border-border overflow-hidden flex items-center justify-center text-muted relative group">
                <Show when={previewUrl()} fallback={<ImageIcon size={32} />}>
                  <img src={previewUrl()!} class="w-full h-full object-cover" />
                </Show>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                  <Edit size={20} />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>
              <div class="flex-1">
                <p class="text-xs text-ink-light">Recommended: Square image (512x512px). PNG or JPG.</p>
                <button 
                  type="button"
                  class="mt-2 text-xs font-bold text-green-600 hover:text-green-700 underline"
                  onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                >
                  Upload New Image
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Gamis"
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              value={formData().name}
              onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Description (Optional)</label>
            <textarea
              placeholder="Brief description of this category..."
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all min-h-[100px]"
              value={formData().description}
              onInput={(e) => setFormData({ ...formData(), description: e.currentTarget.value })}
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Sort Order</label>
            <input
              type="number"
              placeholder="0"
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              value={formData().sort_order}
              onInput={(e) => setFormData({ ...formData(), sort_order: parseInt(e.currentTarget.value) })}
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
              {isSaving() ? "Saving..." : (editingCategory() ? "Update Category" : "Save Category")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This will not delete the products in it."
        confirmText="Delete"
        isDanger={true}
      />
    </Layout>
  );
}
