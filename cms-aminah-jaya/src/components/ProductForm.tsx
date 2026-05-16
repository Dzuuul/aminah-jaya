import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Trash2, Loader2, Image as ImageIcon, X, Zap } from "lucide-solid";
import Button from "./ui/Button";
import ConfirmModal from "./ConfirmModal";
import { toast } from "../lib/toast";
import { getCategories, uploadFile, createProduct, updateProduct, Product, ProductImage } from "../lib/api";
import { useNavigate } from "@solidjs/router";

interface ProductFormProps {
  initialData?: Product;
}

export default function ProductForm(props: ProductFormProps) {
  const [categories] = createResource(getCategories);
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [activeTab, setActiveTab] = createSignal("general");
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);

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

  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg|mov)$/i);

  const initData = () => {
    if (props.initialData) {
      const fullProduct = props.initialData;
      return {
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
        story: {
          heading: fullProduct.story?.heading || "",
          subheading: fullProduct.story?.subheading || "",
          image: fullProduct.story?.image || ""
        },
        macro_detail: {
          title: fullProduct.macro_detail?.title || "",
          desc: fullProduct.macro_detail?.desc || "",
          image: fullProduct.macro_detail?.image || "",
          specs: Array.isArray(fullProduct.macro_detail?.specs) ? fullProduct.macro_detail.specs : []
        },
        benefits: fullProduct.benefits || [],
        dosage: fullProduct.dosage || [],
        discount_label: fullProduct.discount_label || "",
        wa_message_template: fullProduct.wa_message_template || "",
      };
    }
    return JSON.parse(JSON.stringify(initialFormData));
  };

  const [formData, setFormData] = createSignal<any>(initData());
  
  const initPreviews = () => {
    if (props.initialData?.images) {
      return props.initialData.images.map((img: ProductImage) => ({
        url: img.url,
        type: isVideo(img.url) ? 'video' : 'image'
      }));
    }
    return [];
  };
  const [previewItems, setPreviewItems] = createSignal<{ url: string, type: string, file?: File }[]>(initPreviews());

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const executeSubmit = async () => {
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

      if (props.initialData) {
        await updateProduct(props.initialData.id, payload);
        toast.success("Produk diperbarui");
      } else {
        await createProduct(payload);
        toast.success("Produk ditambahkan");
      }

      navigate("/products");
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan produk");
    } finally {
      setIsSaving(false);
    }
  };



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
    <div style={{ "background-color": "var(--color-bg-alt)", border: "1px solid var(--color-border)", "border-radius": "0.75rem", overflow: "hidden" }}>
      <div style={{ display: "flex", "border-bottom": "1px solid var(--color-border)", padding: "0 1.5rem" }}>
        <button onClick={() => setActiveTab("general")} class={`tab-item ${activeTab() === 'general' ? 'active' : ''}`}>Umum</button>
        <button onClick={() => setActiveTab("visual")} class={`tab-item ${activeTab() === 'visual' ? 'active' : ''}`}>Halaman Produk</button>
        <button onClick={() => setActiveTab("detail")} class={`tab-item ${activeTab() === 'detail' ? 'active' : ''}`}>Detail & Kandungan</button>
        <button onClick={() => setActiveTab("advanced")} class={`tab-item ${activeTab() === 'advanced' ? 'active' : ''}`}>Lanjutan</button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", "flex-direction": "column", gap: "1.5rem" }}>
        <Show when={error()}><div class="error-box">{error()}</div></Show>

        <Show when={activeTab() === "general"}>
          <div class="form-section">
            <label class="form-label">Media Produk</label>
            <div style={{ display: "grid", "grid-template-columns": "repeat(4, 1fr)", gap: "0.75rem" }}>
              <For each={previewItems()}>{(item, i) => (
                <div class="media-preview group">
                  <Show when={item.type === 'image'} fallback={<div class="video-icon"><Zap size={24} /></div>}>
                    <img src={item.url} class="preview-img" />
                  </Show>
                  <button type="button" onClick={() => { const list = [...previewItems()]; list.splice(i(), 1); setPreviewItems(list); }} class="remove-media-btn"><X size={14} /></button>
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
                <For each={formData().macro_detail?.specs || []}>{(spec, i) => (
                  <div class="list-item-row">
                    <input type="text" class="form-input" style={{ width: "60px" }} value={spec.icon} placeholder="Ikon" onInput={e => { const list = [...(formData().macro_detail?.specs || [])]; list[i()].icon = e.currentTarget.value; setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: list } }); }} />
                    <input type="text" class="form-input" value={spec.name} placeholder="Nama" onInput={e => { const list = [...(formData().macro_detail?.specs || [])]; list[i()].name = e.currentTarget.value; setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: list } }); }} />
                    <input type="text" class="form-input" value={spec.desc} placeholder="Deskripsi" onInput={e => { const list = [...(formData().macro_detail?.specs || [])]; list[i()].desc = e.currentTarget.value; setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: list } }); }} />
                    <button type="button" class="remove-btn" onClick={() => { const list = [...(formData().macro_detail?.specs || [])]; list.splice(i(), 1); setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: list } }); }}><Trash2 size={16} /></button>
                  </div>
                )}</For>
                <button type="button" class="add-row-btn" onClick={() => { setFormData({ ...formData(), macro_detail: { ...formData().macro_detail, specs: [...(formData().macro_detail?.specs || []), { icon: "", name: "", desc: "" }] } }); }}><Plus size={16} /> Tambah Spec</button>
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

        <div style={{ display: "flex", "justify-content": "flex-end", gap: "1rem", "margin-top": "1rem" }}>
          <Button type="submit" variant="primary">
            {props.initialData ? "Update Produk" : "Simpan Produk"}
          </Button>
        </div>
      </form>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSubmit}
        title={props.initialData ? "Update Produk" : "Simpan Produk"}
        message={props.initialData ? "Apakah Anda yakin ingin memperbarui data produk ini?" : "Apakah Anda yakin ingin menambahkan produk ini ke katalog?"}
        confirmText={props.initialData ? "Update" : "Simpan"}
        cancelText="Batal"
      />
    </div>
  );
}
