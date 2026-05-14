import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Trash2, Loader2, Edit, FileText, Image as ImageIcon, Link as LinkIcon } from "lucide-solid";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getBlogs, Blog, createBlog, deleteBlog, getProducts } from "../lib/api";
import Button from "~/components/ui/Button";

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
      header: "Artikel",
      accessor: "title",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
          <div style={{ width: "3rem", height: "3rem", "border-radius": "0.5rem", "background-color": "var(--color-cream)", border: "1px solid var(--color-border)", overflow: "hidden", "flex-shrink": 0 }}>
            <Show when={item.image_url} fallback={<div style={{ width: "100%", height: "100%", display: "flex", "align-items": "center", "justify-content": "center", color: "var(--color-muted)" }}><ImageIcon size={18} /></div>}>
              <img src={item.image_url!} style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
            </Show>
          </div>
          <div>
            <div style={{ "font-weight": "700", color: "var(--color-ink)" }}>{item.title}</div>
            <div style={{ "font-size": "0.625rem", color: "var(--color-muted)", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>{item.slug}</div>
          </div>
        </div>
      )
    },
    {
      header: "Produk CTA",
      accessor: "cta_product_name",
      render: (item) => (
        <Show when={item.cta_product_name} fallback={<span style={{ color: "var(--color-muted)", "font-size": "0.75rem" }}>—</span>}>
          <div style={{ display: "flex", "align-items": "center", gap: "0.375rem", color: "#16a34a", "font-weight": "600" }}>
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
        <span class={`badge ${item.is_published ? 'badge-green' : 'badge-orange'}`}>
          {item.is_published ? 'Diterbitkan' : 'Draft'}
        </span>
      )
    },
    {
      header: "Tanggal",
      accessor: "created_at",
      render: (item) => <span style={{ color: "var(--color-ink-light)", "font-size": "0.875rem" }}>{new Date(item.created_at).toLocaleDateString()}</span>
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (item) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => { setBlogToDelete(item.id); setIsConfirmOpen(true); }}
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

    try {
      await createBlog({
        ...formData(),
        cta_product_id: formData().cta_product_id || null,
      });
      toast.success("Artikel berhasil dibuat");
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat artikel");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout title="Blog">
      <div class="page-header">
        <div>
          <h1 class="page-title">Artikel Blog</h1>
          <p class="page-subtitle">Buat dan kelola konten edukasi & promosi.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
          <span>Tulis Artikel</span>
        </Button>
      </div>

      <Show when={blogs()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat artikel...</div>}>
        <DataTable columns={columns} data={blogs()!} searchPlaceholder="Cari artikel..." />
      </Show>

      <Modal isOpen={isModalOpen()} onClose={() => setIsModalOpen(false)} title="Buat Artikel Baru">
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1rem" }}>
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Judul</label>
            <input
              type="text" required placeholder="Contoh: Tips Memilih Gamis untuk Acara Formal"
              class="login-input"
              onInput={(e) => setFormData({ ...formData(), title: e.currentTarget.value })}
            />
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Ringkasan (Singkat)</label>
            <textarea
              rows="2" placeholder="Ringkasan singkat untuk kartu blog..."
              class="login-input"
              onInput={(e) => setFormData({ ...formData(), excerpt: e.currentTarget.value })}
            ></textarea>
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
            <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Konten (Markdown/Teks)</label>
            <textarea
              rows="6" required placeholder="Tulis artikel lengkap Anda di sini..."
              class="login-input"
              style={{ "font-family": "monospace", "font-size": "0.875rem" }}
              onInput={(e) => setFormData({ ...formData(), content: e.currentTarget.value })}
            ></textarea>
          </div>

          <div style={{ display: "grid", "grid-template-columns": "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>URL Gambar Utama</label>
              <input
                type="text" placeholder="https://..."
                class="login-input"
                onInput={(e) => setFormData({ ...formData(), image_url: e.currentTarget.value })}
              />
            </div>
            <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
              <label style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink-light)", "margin-left": "0.25rem" }}>Produk CTA</label>
              <select
                class="login-input"
                onChange={(e) => setFormData({ ...formData(), cta_product_id: e.currentTarget.value || null })}
              >
                <option value="">Tanpa Produk CTA</option>
                <For each={products()}>
                  {(p) => <option value={p.id}>{p.name}</option>}
                </For>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", "align-items": "center", gap: "0.5rem", "padding-top": "0.5rem" }}>
            <input
              type="checkbox" id="published" checked={formData().is_published}
              onChange={(e) => setFormData({ ...formData(), is_published: e.currentTarget.checked })}
              style={{ width: "1rem", height: "1rem", "accent-color": "var(--color-green-500)" }}
            />
            <label for="published" style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink)", cursor: "pointer" }}>Terbitkan segera</label>
          </div>

          <div style={{ "padding-top": "1.5rem", display: "flex", gap: "0.75rem", position: "sticky", bottom: 0, "background-color": "white", "padding-bottom": "0.5rem" }}>
            <button
              type="button" onClick={() => setIsModalOpen(false)}
              style={{ flex: 1, padding: "0.75rem 1rem", "background-color": "var(--color-cream)", color: "var(--color-ink)", "font-weight": "700", "border-radius": "1rem", border: "none", cursor: "pointer" }}
            >
              Batal
            </button>
            <button
              type="submit" disabled={isSaving()}
              style={{ flex: 2, padding: "0.75rem 1rem", "background-color": "var(--color-green-500)", color: "white", "font-weight": "700", "border-radius": "1rem", border: "none", cursor: "pointer", display: "flex", "align-items": "center", "justify-content": "center", gap: "0.5rem" }}
            >
              <Show when={isSaving()}>
                <Loader2 class="animate-spin" size={20} />
              </Show>
              {isSaving() ? "Menyimpan..." : "Buat Artikel"}
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
            toast.success("Artikel berhasil dihapus");
            refetch();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
        title="Hapus Artikel"
        message="Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        isDanger={true}
      />
    </Layout>
  );
}
