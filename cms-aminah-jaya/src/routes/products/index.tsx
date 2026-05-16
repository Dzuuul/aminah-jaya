import { createResource, createSignal, Show } from "solid-js";
import { Plus, Edit, Trash2, Image as ImageIcon, Star } from "lucide-solid";
import { useNavigate } from "@solidjs/router";
import Layout from "../../components/Layout";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ConfirmModal";
import DataTable, { Column } from "../../components/DataTable";
import { toast } from "../../lib/toast";
import { getProducts, Product, formatCurrency } from "../../lib/api";

export default function Products() {
  const [products, { refetch }] = createResource(getProducts);
  const navigate = useNavigate();

  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [productToDelete, setProductToDelete] = createSignal<string | null>(null);

  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg|mov)$/i);

  const handleEdit = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const id = productToDelete();
    if (!id) return;
    try {
      const { deleteProduct } = await import("../../lib/api");
      await deleteProduct(id);
      toast.success("Produk berhasil dihapus");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus produk");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const columns: Column<Product>[] = [
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
          <div>
            <div style={{ "font-weight": "600", color: "var(--color-ink)" }}>{item.name}</div>
            <div style={{ "font-size": "0.625rem", color: "var(--color-muted)" }}>{item.sku || "NO-SKU"}</div>
          </div>
        </div>
      )
    },
    {
      header: "Harga",
      accessor: "price",
      render: (item) => (
        <div>
          <div style={{ "font-weight": "700", color: "var(--color-ink)" }}>{formatCurrency(item.price)}</div>
          <Show when={item.price_compare}>
            <div style={{ "font-size": "0.625rem", color: "var(--color-muted)", "text-decoration": "line-through" }}>{formatCurrency(item.price_compare!)}</div>
          </Show>
        </div>
      )
    },
    {
      header: "Stok",
      accessor: "stock",
      render: (item) => <span style={{ color: "var(--color-ink-light)" }}>{item.stock}</span>
    },
    {
      header: "Rating",
      accessor: "rating",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.25rem", color: "#e8a020" }}>
          <Star size={14} fill="#e8a020" />
          <span style={{ "font-weight": "600" }}>{item.rating || "4.9"}</span>
          <span style={{ "font-size": "0.625rem", color: "var(--color-muted)" }}>({item.reviews_count || 0})</span>
        </div>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      render: (item) => (
        <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
          <button onClick={() => handleEdit(item)} class="action-btn action-btn-edit"><Edit size={18} /></button>
          <button onClick={() => handleDelete(item.id)} class="action-btn action-btn-delete"><Trash2 size={18} /></button>
        </div>
      )
    },
  ];

  const handleAddClick = () => {
    navigate("/products/create");
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
        <DataTable columns={columns} data={products()!} searchPlaceholder="Cari produk..." />
      </Show>

      <ConfirmModal isOpen={isConfirmOpen()} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} title="Hapus Produk" message="Apakah Anda yakin ingin menghapus produk ini?" confirmText="Hapus" isDanger={true} />
    </Layout>
  );
}
