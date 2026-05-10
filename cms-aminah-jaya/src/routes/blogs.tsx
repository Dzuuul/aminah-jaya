import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Trash2, Loader2, Edit, FileText, Image as ImageIcon, Link as LinkIcon } from "lucide-solid";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getBlogs, Blog, createBlog, deleteBlog, getProducts } from "../lib/api";

export default function Blogs() {
  const [blogs, { refetch }] = createResource(getBlogs);
  const [products] = createResource(getProducts);

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [blogToDelete, setBlogToDelete] = createSignal<string | null>(null);

  const [formData, setFormData] = createSignal({
    title: "",
    excerpt: "",
    content: "",
    image_url: "",
    cta_product_id: "" as string | null,
    is_published: true,
  });

  const columns: Column<Blog>[] = [
    {
      header: "Article",
      accessor: "title",
      render: (item) => (
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-cream border border-border overflow-hidden flex-shrink-0">
            <Show when={item.image_url} fallback={<div class="w-full h-full flex items-center justify-center text-muted"><ImageIcon size={18} /></div>}>
              <img src={item.image_url!} class="w-full h-full object-cover" />
            </Show>
          </div>
          <div>
            <div class="font-bold text-ink">{item.title}</div>
            <div class="text-[10px] text-muted uppercase tracking-wider">{item.slug}</div>
          </div>
        </div>
      )
    },
    {
      header: "CTA Product",
      accessor: "cta_product_name",
      render: (item) => (
        <Show when={item.cta_product_name} fallback={<span class="text-muted text-xs">—</span>}>
          <div class="flex items-center gap-1.5 text-green-600 font-semibold">
            <LinkIcon size={12} />
            <span>{item.cta_product_name}</span>
          </div>
        </Show>
      )
    },
    {
      header: "Status",
      accessor: "is_published",
      render: (item) => (
        <span class={`px-3 py-1 rounded-full text-xs font-bold ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {item.is_published ? 'Published' : 'Draft'}
        </span>
      )
    },
    {
      header: "Date",
      accessor: "created_at",
      render: (item) => <span class="text-ink-light text-sm">{new Date(item.created_at).toLocaleDateString()}</span>
    },
    {
      header: "Actions",
      accessor: "id",
      render: (item) => (
        <div class="flex gap-2">
          <button
            onClick={() => { setBlogToDelete(item.id); setIsConfirmOpen(true); }}
            class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

    try {
      await createBlog({
        ...formData(),
        cta_product_id: formData().cta_product_id || null,
      });
      toast.success("Article created successfully");
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create article");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout title="Blogs">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-ink">Blog Articles</h1>
          <p class="text-ink-light mt-1">Create and manage education content & promotions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          class="bg-green-500 text-white p-2.5 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-2 px-4"
        >
          <Plus size={20} />
          <span class="font-bold">Write Article</span>
        </button>
      </div>

      <Show when={blogs()} fallback={<div class="p-8 text-center text-muted">Loading articles...</div>}>
        <DataTable columns={columns} data={blogs()!} searchPlaceholder="Search articles..." />
      </Show>

      <Modal isOpen={isModalOpen()} onClose={() => setIsModalOpen(false)} title="Create New Article">
        <form onSubmit={handleSubmit} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Title</label>
            <input
              type="text" required placeholder="e.g. Tips Memilih Gamis untuk Acara Formal"
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              onInput={(e) => setFormData({ ...formData(), title: e.currentTarget.value })}
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Excerpt (Short Summary)</label>
            <textarea
              rows="2" placeholder="Brief summary for the blog card..."
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              onInput={(e) => setFormData({ ...formData(), excerpt: e.currentTarget.value })}
            ></textarea>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Content (Markdown/Text)</label>
            <textarea
              rows="6" required placeholder="Write your full article here..."
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-mono text-sm"
              onInput={(e) => setFormData({ ...formData(), content: e.currentTarget.value })}
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-bold text-ink-light ml-1">Featured Image URL</label>
              <input
                type="text" placeholder="https://..."
                class="w-full px-4 py-3 bg-cream border border-border rounded-2xl outline-none"
                onInput={(e) => setFormData({ ...formData(), image_url: e.currentTarget.value })}
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-bold text-ink-light ml-1">CTA Product</label>
              <select
                class="w-full px-4 py-3 bg-cream border border-border rounded-2xl outline-none appearance-none"
                onChange={(e) => setFormData({ ...formData(), cta_product_id: e.currentTarget.value || null })}
              >
                <option value="">No CTA Product</option>
                <For each={products()}>
                  {(p) => <option value={p.id}>{p.name}</option>}
                </For>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input
              type="checkbox" id="published" checked={formData().is_published}
              onChange={(e) => setFormData({ ...formData(), is_published: e.currentTarget.checked })}
              class="w-4 h-4 accent-green-500"
            />
            <label for="published" class="text-sm font-bold text-ink">Publish immediately</label>
          </div>

          <div class="pt-6 flex gap-3 sticky bottom-0 bg-white pb-2">
            <button
              type="button" onClick={() => setIsModalOpen(false)}
              class="flex-1 py-3 px-4 bg-cream text-ink font-bold rounded-2xl hover:bg-border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSaving()}
              class="flex-[2] py-3 px-4 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Show when={isSaving()}>
                <Loader2 class="animate-spin" size={20} />
              </Show>
              {isSaving() ? "Saving..." : "Create Article"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          if (!blogToDelete()) return;
          try {
            await deleteBlog(blogToDelete()!);
            toast.success("Article deleted");
            refetch();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
      />
    </Layout>
  );
}
