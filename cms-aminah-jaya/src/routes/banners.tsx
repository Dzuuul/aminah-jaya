import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, ExternalLink, Calendar } from "lucide-solid";
import Layout from "../components/Layout";
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
      toast.success("Banner deleted successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete banner");
    }
  };

  const columns: Column<Banner>[] = [
    {
      header: "Banner",
      accessor: "image_url",
      render: (item) => (
        <div class="w-32 h-16 rounded-lg bg-cream border border-border overflow-hidden flex items-center justify-center text-muted">
          <Show when={item.image_url} fallback={<ImageIcon size={20} />}>
            <img src={item.image_url!} alt="Banner" class="w-full h-full object-cover" />
          </Show>
        </div>
      )
    },
    {
      header: "Link",
      accessor: "link_url",
      render: (item) => (
        <div class="flex items-center gap-1 text-xs text-ink-light">
          <Show when={item.link_url} fallback={<span>-</span>}>
            <ExternalLink size={12} />
            <span class="truncate max-w-[150px]">{item.link_url}</span>
          </Show>
        </div>
      )
    },
    {
        header: "Status",
        accessor: "is_active",
        render: (item) => (
          <span class={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        )
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

      if (!imageUrl) {
          throw new Error("Image is required");
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
      toast.success(bannerToEdit ? "Banner updated successfully" : "Banner created successfully");
      refetch();
    } catch (err: any) {
      setError(err.message || "Failed to save banner");
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
    <Layout title="Hero Banners">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-ink">Hero Banners</h1>
          <p class="text-ink-light mt-1">Manage the hero slider banners on your landing page.</p>
        </div>
        <button
          onClick={handleAddClick}
          class="bg-green-500 text-white p-2.5 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-2 px-4"
        >
          <Plus size={20} />
          <span class="font-bold">Add Banner</span>
        </button>
      </div>

      <Show when={banners()} fallback={<div class="p-8 text-center text-muted">Loading banners...</div>}>
        <DataTable
          columns={columns}
          data={banners()!}
          searchPlaceholder="Search banners..."
        />
      </Show>

      {/* Add/Edit Banner Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={handleCloseModal}
        title={editingBanner() ? "Edit Banner" : "Add New Banner"}
      >
        <form onSubmit={handleSubmit} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <Show when={error()}>
            <div class="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100">
              {error()}
            </div>
          </Show>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Banner Image</label>
            <div class="flex flex-col gap-4">
              <div class="w-full aspect-[21/9] rounded-2xl bg-cream border border-border overflow-hidden flex items-center justify-center text-muted relative group">
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
              <p class="text-xs text-ink-light text-center">Recommended: Wide image (e.g. 1920x800px). PNG or JPG.</p>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Link URL (Optional)</label>
            <input
              type="text"
              placeholder="https://..."
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              value={formData().link_url}
              onInput={(e) => setFormData({ ...formData(), link_url: e.currentTarget.value })}
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
                <label class="text-sm font-bold text-ink-light ml-1">Sort Order</label>
                <input
                type="number"
                class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                value={formData().sort_order}
                onInput={(e) => setFormData({ ...formData(), sort_order: parseInt(e.currentTarget.value) })}
                />
            </div>
            <div class="space-y-1">
                <label class="text-sm font-bold text-ink-light ml-1">Active Status</label>
                <div class="flex items-center h-[50px]">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData().is_active} 
                            class="sr-only peer"
                            onChange={(e) => setFormData({ ...formData(), is_active: e.currentTarget.checked })}
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span class="ml-3 text-sm font-medium text-ink-light">{formData().is_active ? 'Active' : 'Hidden'}</span>
                    </label>
                </div>
            </div>
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
              {isSaving() ? "Saving..." : (editingBanner() ? "Update Banner" : "Save Banner")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
      />
    </Layout>
  );
}
