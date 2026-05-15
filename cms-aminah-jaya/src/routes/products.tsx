import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, X, ChevronRight, Star, Info, Layout as LayoutIcon, Zap, FileText } from "lucide-solid";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getProducts, Product, formatCurrency, createProduct, getCategories, uploadFile, fetchApi, ProductImage, updateProduct } from "../lib/api";

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
  const [activeTab, setActiveTab] = createSignal("general");

  // Form states
  const initialFormData = {
    name: "",
    category_id: "" as string | null,
    price: 0,
    price_compare: 0 as number | null,
    stock: 0,
    sku: "",
    image_urls: [] as string[],
    subtitle: "",
    rating: 4.9,
    reviews_count: 0,
    sold_count: "",
    certifications: [] as string[],
    variants_chips: [] as string[],
    ingredients: [] as { name: string, desc: string }[],
    how_to_use: [] as { num: number, text: string }[],
    story: { heading: "", subheading: "", image: "" },
    macro_detail: { title: "", desc: "", image: "", specs: [] as { icon: string, name: string, desc: string }[] },
    benefits: [] as { name: string, icon: string }[],
    dosage: [] as { goal: string, dose: string, duration: string, time: string }[],
    discount_label: "",
    wa_message_template: "",
  };

  const [formData, setFormData] = createSignal(JSON.parse(JSON.stringify(initialFormData)));
  const [previewItems, setPreviewItems] = createSignal<{ url: string, type: string, file?: File }[]>([]);

  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg|mov)$/i);

  const handleEdit = async (product: Product) => {
    try {
      const fullProduct = await fetchApi<Product>(`/products/${product.id}`);

      setFormData({
        name: fullProduct.name,
        category_id: fullProduct.category_id,
        price: fullProduct.price,
        price_compare: fullProduct.price_compare || 0,
        stock: fullProduct.stock,
        sku: fullProduct.sku || "",
        image_urls: fullProduct.images?.map((img: ProductImage) => img.url) || [],
        subtitle: fullProduct.subtitle || "",
        rating: fullProduct.rating || 4.9,
        reviews_count: fullProduct.reviews_count || 0,
        sold_count: fullProduct.sold_count || "",
        certifications: fullProduct.certifications || [],
        variants_chips: fullProduct.variants_chips || [],
        ingredients: fullProduct.ingredients || [],
        how_to_use: fullProduct.how_to_use || [],
        story: fullProduct.story || initialFormData.story,
        macro_detail: fullProduct.macro_detail || initialFormData.macro_detail,
        benefits: fullProduct.benefits || [],
        dosage: fullProduct.dosage || [],
        discount_label: fullProduct.discount_label || "",
        wa_message_template: fullProduct.wa_message_template || "",
      });

      setPreviewItems(fullProduct.images?.map((img: ProductImage) => ({
        url: img.url,
        type: isVideo(img.url) ? 'video' : 'image'
      })) || []);
      setEditingProduct(fullProduct);
      setActiveTab("general");
      setIsModalOpen(true);
    } catch (err: any) {
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
      toast.success("Produk berhasil dihapus");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus produk");
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

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const currentUrls = previewItems().filter(item => !item.file).map(item => item.url);
      const filesToUpload = previewItems().filter(item => item.file).map(item => item.file!);
      const newUrls = await Promise.all(filesToUpload.map(file => uploadFile(file)));

      const payload = {
        ...formData(),
        category_id: formData().category_id || null,
        image_urls: [...currentUrls, ...newUrls],
      };

      const productToEdit = editingProduct();
      if (productToEdit) {
        await updateProduct(productToEdit.id, payload);
      } else {
        await createProduct(payload);
      }

      handleCloseModal();
      toast.success(productToEdit ? "Produk diperbarui" : "Produk ditambahkan");
      refetch();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan produk");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setFormData(JSON.parse(JSON.stringify(initialFormData)));
    setEditingProduct(null);
    setPreviewItems([]);
    setIsModalOpen(false);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormData(JSON.parse(JSON.stringify(initialFormData)));
    setPreviewItems([]);
    setActiveTab("general");
    setIsModalOpen(true);
  };

  // Helper for adding/removing items from lists
  const addToList = (key: string, value: any) => {
    const current = formData()[key];
    setFormData({ ...formData(), [key]: [...current, value] });
  };

  const removeFromList = (key: string, index: number) => {
    const current = [...formData()[key]];
    current.splice(index, 1);
    setFormData({ ...formData(), [key]: current });
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

      <Modal isOpen={isModalOpen()} onClose={handleCloseModal} title={editingProduct() ? "Edit Produk" : "Tambah Produk Baru"}>
        <div style={{ display: "flex", "border-bottom": "1px solid var(--color-border)", padding: "0 1.5rem" }}>
          <button onClick={() => setActiveTab("general")} class={`tab-item ${activeTab() === 'general' ? 'active' : ''}`}>Umum</button>
          <button onClick={() => setActiveTab("visual")} class={`tab-item ${activeTab() === 'visual' ? 'active' : ''}`}>Halaman Produk</button>
          <button onClick={() => setActiveTab("detail")} class={`tab-item ${activeTab() === 'detail' ? 'active' : ''}`}>Detail & Kandungan</button>
          <button onClick={() => setActiveTab("advanced")} class={`tab-item ${activeTab() === 'advanced' ? 'active' : ''}`}>Lanjutan</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1.5rem", "max-height": "70vh", "overflow-y": "auto" }}>
          <Show when={error()}><div class="error-box">{error()}</div></Show>

          {/* GENERAL TAB */}
          <Show when={activeTab() === "general"}>
            <div class="form-section">
              <label class="form-label">Media Produk</label>
              <div style={{ display: "grid", "grid-template-columns": "repeat(4, 1fr)", gap: "0.75rem" }}>
                <For each={previewItems()}>{(item, i) => (
                  <div class="media-preview group">
                    <Show when={item.type === 'image'} fallback={<div class="video-icon"><Zap size={24} /></div>}>
                      <img src={item.url} class="preview-img" />
                    </Show>
                    <button type="button" onClick={() => removeFromList('image_urls', i())} class="remove-media-btn"><X size={14} /></button>
                  </div>
                )}</For>
                <div class="upload-btn">
                  <ImageIcon size={24} /><input type="file" multiple accept="image/*,video/*" class="file-input" onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setPreviewItems([...previewItems(), ...files.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image', file: f }))]);
                  }} />
                </div>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Nama Produk</label>
                <input type="text" required class="form-input" value={formData().name} onInput={e => setFormData({ ...formData(), name: e.currentTarget.value })} />
              </div>
              <div class="form-group">
                <label class="form-label">Kategori</label>
                <select class="form-input" value={formData().category_id || ""} onChange={e => setFormData({ ...formData(), category_id: e.currentTarget.value || null })}>
                  <option value="">Tanpa Kategori</option>
                  <For each={categories()}>{c => <option value={c.id}>{c.name}</option>}</For>
                </select>
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Harga (Rp)</label>
                <input type="number" required class="form-input" value={formData().price} onInput={e => setFormData({ ...formData(), price: parseFloat(e.currentTarget.value) })} />
              </div>
              <div class="form-group">
                <label class="form-label">Harga Coret (Rp)</label>
                <input type="number" class="form-input" value={formData().price_compare || 0} onInput={e => setFormData({ ...formData(), price_compare: parseFloat(e.currentTarget.value) })} />
              </div>
              <div class="form-group">
                <label class="form-label">Stok</label>
                <input type="number" required class="form-input" value={formData().stock} onInput={e => setFormData({ ...formData(), stock: parseInt(e.currentTarget.value) })} />
              </div>
            </div>
          </Show>

          {/* VISUAL TAB */}
          <Show when={activeTab() === "visual"}>
            <div class="form-group">
              <label class="form-label">Subtitle Produk</label>
              <input type="text" class="form-input" placeholder="Contoh: 3X Brightening Injection Formula" value={formData().subtitle} onInput={e => setFormData({ ...formData(), subtitle: e.currentTarget.value })} />
            </div>
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Rating</label>
                <input type="number" step="0.1" class="form-input" value={formData().rating} onInput={e => setFormData({ ...formData(), rating: parseFloat(e.currentTarget.value) })} />
              </div>
              <div class="form-group">
                <label class="form-label">Jumlah Ulasan</label>
                <input type="number" class="form-input" value={formData().reviews_count} onInput={e => setFormData({ ...formData(), reviews_count: parseInt(e.currentTarget.value) })} />
              </div>
              <div class="form-group">
                <label class="form-label">Terjual (Label)</label>
                <input type="text" class="form-input" placeholder="Contoh: 13rb+" value={formData().sold_count} onInput={e => setFormData({ ...formData(), sold_count: e.currentTarget.value })} />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Label Diskon</label>
              <input type="text" class="form-input" placeholder="Contoh: –30%" value={formData().discount_label} onInput={e => setFormData({ ...formData(), discount_label: e.currentTarget.value })} />
            </div>
            <div class="form-group">
              <label class="form-label">Template Pesan WhatsApp</label>
              <textarea class="form-input" rows={3} value={formData().wa_message_template} onInput={e => setFormData({ ...formData(), wa_message_template: e.currentTarget.value })} />
            </div>
          </Show>

          {/* DETAIL TAB */}
          <Show when={activeTab() === "detail"}>
            <div class="form-section">
              <label class="form-label">Sertifikasi (Contoh: BPOM RI, HALAL MUI)</label>
              <div class="tag-input-wrap">
                <For each={formData().certifications}>{(c, i) => (
                  <span class="tag-pill">{c} <X size={12} onClick={() => removeFromList('certifications', i())} /></span>
                )}</For>
                <input type="text" class="tag-input" placeholder="Tekan Enter untuk tambah" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('certifications', e.currentTarget.value); e.currentTarget.value = ""; } }} />
              </div>
            </div>

            <div class="form-section">
              <label class="form-label">{
                categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion')
                  ? "Pilihan Warna / Ukuran (Chips)"
                  : "Varian Rasa / Pilihan (Chips)"
              }</label>
              <div class="tag-input-wrap">
                <For each={formData().variants_chips}>{(v, i) => (
                  <span class="tag-pill" style={{ background: "var(--color-green-500)", color: "white" }}>{v} <X size={12} onClick={() => removeFromList('variants_chips', i())} /></span>
                )}</For>
                <input type="text" class="tag-input" placeholder="Contoh: XL atau Emerald" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('variants_chips', e.currentTarget.value); e.currentTarget.value = ""; } }} />
              </div>
            </div>

            <div class="form-section">
              <label class="form-label">{
                categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion')
                  ? "Material / Bahan"
                  : "Kandungan Utama (Ingredients)"
              }</label>
              <div class="list-editor">
                <For each={formData().ingredients}>{(ing, i) => (
                  <div class="list-item-row">
                    <input type="text" class="form-input" value={ing.name} placeholder="Nama Kandungan/Bahan" onInput={e => { const list = [...formData().ingredients]; list[i()].name = e.currentTarget.value; setFormData({ ...formData(), ingredients: list }); }} />
                    <input type="text" class="form-input" value={ing.desc} placeholder="Deskripsi Singkat" onInput={e => { const list = [...formData().ingredients]; list[i()].desc = e.currentTarget.value; setFormData({ ...formData(), ingredients: list }); }} />
                    <button type="button" class="remove-btn" onClick={() => removeFromList('ingredients', i())}><Trash2 size={16} /></button>
                  </div>
                )}</For>
                <button type="button" class="add-row-btn" onClick={() => addToList('ingredients', { name: "", desc: "" })}>
                  <Plus size={16} /> {categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion') ? "Tambah Material" : "Tambah Kandungan"}
                </button>
              </div>
            </div>

            <div class="form-section">
              <label class="form-label">{
                categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion')
                  ? "Instruksi Perawatan"
                  : "Cara Pakai (Langkah)"
              }</label>
              <div class="list-editor">
                <For each={formData().how_to_use}>{(step, i) => (
                  <div class="list-item-row">
                    <input type="number" class="form-input" style={{ width: "60px" }} value={step.num} onInput={e => { const list = [...formData().how_to_use]; list[i()].num = parseInt(e.currentTarget.value); setFormData({ ...formData(), how_to_use: list }); }} />
                    <input type="text" class="form-input" value={step.text} placeholder="Instruksi" onInput={e => { const list = [...formData().how_to_use]; list[i()].text = e.currentTarget.value; setFormData({ ...formData(), how_to_use: list }); }} />
                    <button type="button" class="remove-btn" onClick={() => removeFromList('how_to_use', i())}><Trash2 size={16} /></button>
                  </div>
                )}</For>
                <button type="button" class="add-row-btn" onClick={() => addToList('how_to_use', { num: formData().how_to_use.length + 1, text: "" })}>
                  <Plus size={16} /> Tambah Langkah
                </button>
              </div>
            </div>
          </Show>

          {/* ADVANCED TAB */}
          <Show when={activeTab() === "advanced"}>
            <div class="form-section">
              <label class="form-label">Story Section</label>
              <div class="nested-form">
                <input type="text" class="form-input" placeholder="Story Heading" value={formData().story.heading} onInput={e => setFormData({ ...formData(), story: { ...formData().story, heading: e.currentTarget.value } })} />
                <textarea class="form-input" placeholder="Story Subheading" value={formData().story.subheading} onInput={e => setFormData({ ...formData(), story: { ...formData().story, subheading: e.currentTarget.value } })} />
                <input type="text" class="form-input" placeholder="Story Image URL" value={formData().story.image} onInput={e => setFormData({ ...formData(), story: { ...formData().story, image: e.currentTarget.value } })} />
              </div>
            </div>

            <div class="form-section">
              <label class="form-label">Macro Details & Specs</label>
              <div class="nested-form">
                <input type="text" class="form-input" placeholder="Macro Title" value={formData().macro_detail.title} onInput={e => setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, title: e.currentTarget.value } })} />
                <textarea class="form-input" placeholder="Macro Description" value={formData().macro_detail.desc} onInput={e => setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, desc: e.currentTarget.value } })} />
                <div class="list-editor">
                  <For each={formData().macro_detail.specs}>{(spec, i) => (
                    <div class="list-item-row">
                      <input type="text" class="form-input" style={{ width: "60px" }} value={spec.icon} placeholder="Ikon" onInput={e => { const list = [...formData().macro_detail.specs]; list[i()].icon = e.currentTarget.value; setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: list } }); }} />
                      <input type="text" class="form-input" value={spec.name} placeholder="Nama" onInput={e => { const list = [...formData().macro_detail.specs]; list[i()].name = e.currentTarget.value; setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: list } }); }} />
                      <input type="text" class="form-input" value={spec.desc} placeholder="Deskripsi" onInput={e => { const list = [...formData().macro_detail.specs]; list[i()].desc = e.currentTarget.value; setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: list } }); }} />
                      <button type="button" class="remove-btn" onClick={() => { const list = [...formData().macro_detail.specs]; list.splice(i(), 1); setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: list } }); }}><Trash2 size={16} /></button>
                    </div>
                  )}</For>
                  <button type="button" class="add-row-btn" onClick={() => { setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: [...formData().macro_detail.specs, { icon: "", name: "", desc: "" }] } }); }}><Plus size={16} /> Tambah Spec</button>
                </div>
              </div>
            </div>

            <div class="form-section">
              <label class="form-label">{
                categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion')
                  ? "Panduan Ukuran / Size Chart (Table)"
                  : "Panduan Dosis (Table)"
              }</label>
              <div class="list-editor">
                <For each={formData().dosage}>{(row, i) => (
                  <div class="list-item-row" style={{ display: "grid", "grid-template-columns": "1fr 1fr 1fr 1fr auto" }}>
                    <input type="text" class="form-input" value={row.goal} placeholder={categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion') ? "Size (L, XL)" : "Tujuan"} onInput={e => { const list = [...formData().dosage]; list[i()].goal = e.currentTarget.value; setFormData({ ...formData(), dosage: list }); }} />
                    <input type="text" class="form-input" value={row.dose} placeholder={categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion') ? "Lebar Dada" : "Dosis"} onInput={e => { const list = [...formData().dosage]; list[i()].dose = e.currentTarget.value; setFormData({ ...formData(), dosage: list }); }} />
                    <input type="text" class="form-input" value={row.duration} placeholder={categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion') ? "Panjang" : "Durasi"} onInput={e => { const list = [...formData().dosage]; list[i()].duration = e.currentTarget.value; setFormData({ ...formData(), dosage: list }); }} />
                    <input type="text" class="form-input" value={row.time} placeholder={categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion') ? "Keterangan" : "Waktu"} onInput={e => { const list = [...formData().dosage]; list[i()].time = e.currentTarget.value; setFormData({ ...formData(), dosage: list }); }} />
                    <button type="button" class="remove-btn" onClick={() => removeFromList('dosage', i())}><Trash2 size={16} /></button>
                  </div>
                )}</For>
                <button type="button" class="add-row-btn" onClick={() => addToList('dosage', { goal: "", dose: "", duration: "", time: "" })}>
                  <Plus size={16} /> {categories()?.find(c => c.id === formData().category_id)?.name?.toLowerCase().includes('fashion') ? "Tambah Baris Ukuran" : "Tambah Baris Dosis"}
                </button>
              </div>
            </div>
          </Show>

          <div class="modal-footer-sticky">
            <button type="button" onClick={handleCloseModal} class="btn-secondary">Batal</button>
            <button type="submit" disabled={isSaving()} class="btn-primary">
              <Show when={isSaving()}><Loader2 class="animate-spin" size={20} /></Show>
              {isSaving() ? "Menyimpan..." : (editingProduct() ? "Update Produk" : "Simpan Produk")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isConfirmOpen()} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} title="Hapus Produk" message="Apakah Anda yakin ingin menghapus produk ini?" confirmText="Hapus" isDanger={true} />

    </Layout>
  );
}
