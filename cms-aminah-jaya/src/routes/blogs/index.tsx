import { createResource, createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Calendar } from "lucide-solid";
import Layout from "../../components/Layout";
import ConfirmModal from "../../components/ConfirmModal";
import DataTable, { Column } from "../../components/DataTable";
import { toast } from "../../lib/toast";
import { getBlogs, Blog, deleteBlog, getProducts } from "../../lib/api";
import Button from "../../components/ui/Button";

export default function Blogs() {
  const navigate = useNavigate();
  const [blogs, { refetch }] = createResource(getBlogs);
  const [products] = createResource(getProducts);

  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [blogToDelete, setBlogToDelete] = createSignal<string | null>(null);

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
          <div style={{ display: "flex", "align-items": "center", gap: "0.375rem", color: "var(--color-green-700)", "font-weight": "600" }}>
            <LinkIcon size={12} />
            <span>{item.cta_product_name}</span>
          </div>
        </Show>
      )
    },
    {
      header: "Status",
      accessor: "is_published",
      render: (item) => {
        const isFuture = item.published_at && new Date(item.published_at) > new Date();
        return (
          <span class={`badge ${item.is_published ? (isFuture ? 'badge-orange' : 'badge-green') : 'badge-gray'}`}>
            {item.is_published ? (isFuture ? 'Terjadwal' : 'Diterbitkan') : 'Draft'}
          </span>
        );
      }
    },
    {
      header: "Tgl Terbit",
      accessor: "published_at",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.375rem", "font-size": "0.875rem", color: "var(--color-ink-light)" }}>
          <Calendar size={14} style={{ opacity: 0.5 }} />
          <span>{item.published_at ? new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
        </div>
      )
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

  return (
    <Layout title="Blog">
      <div class="page-header">
        <div>
          <h1 class="page-title">Artikel Blog</h1>
          <p class="page-subtitle">Buat dan kelola konten edukasi & promosi.</p>
        </div>
        <Button
          onClick={() => navigate("/blogs/create")}
        >
          <Plus size={20} />
          <span>Tulis Artikel</span>
        </Button>
      </div>

      <Show when={blogs()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat artikel...</div>}>
        <DataTable columns={columns} data={blogs()!} searchPlaceholder="Cari artikel..." />
      </Show>

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
