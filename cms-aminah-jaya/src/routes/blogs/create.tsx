import { createSignal, Show, For, createResource } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Loader2, Calendar, Image as ImageIcon, Link as LinkIcon, FileText, AlignLeft } from "lucide-solid";
import Layout from "../../components/Layout";
import { createBlog, getProducts, CreateBlogPayload } from "../../lib/api";
import { toast } from "../../lib/toast";
import Button from "../../components/ui/Button";

export default function BlogCreate() {
  const navigate = useNavigate();
  const [products] = createResource(getProducts);
  const [isSaving, setIsSaving] = createSignal(false);
  
  const [formData, setFormData] = createSignal<CreateBlogPayload>({
    title: "",
    excerpt: "",
    content: "",
    image_url: "",
    cta_product_id: null,
    is_published: true,
    published_at: new Date().toISOString().slice(0, 16),
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = { ...formData() };
      
      if (payload.published_at) {
        payload.published_at = new Date(payload.published_at).toISOString();
      } else {
        delete payload.published_at;
      }

      await createBlog(payload);
      toast.success("Artikel berhasil dibuat");
      navigate("/blogs");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat artikel");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout title="Tulis Artikel" onBack={() => navigate("/blogs")}>
      <div class="page-header">
        <div>
          <h1 class="page-title">Tulis Artikel Baru</h1>
          <p class="page-subtitle">Bagikan wawasan dan edukasi kepada pelanggan Anda.</p>
        </div>
      </div>

      <div class="blog-create-container">
        <form onSubmit={handleSubmit} class="blog-form-page">
          <div class="blog-form-main">
            <div class="blog-form-card">
              <div class="form-group">
                <label class="form-label">
                  <FileText size={14} />
                  <span>Judul Artikel</span>
                </label>
                <input
                  type="text" required placeholder="Contoh: Manfaat Madu untuk Kesehatan Keluarga"
                  class="login-input"
                  value={formData().title}
                  onInput={(e) => setFormData({ ...formData(), title: e.currentTarget.value })}
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <AlignLeft size={14} />
                  <span>Ringkasan Singkat</span>
                </label>
                <textarea
                  rows="2" placeholder="Tulis ringkasan singkat untuk menarik pembaca..."
                  class="login-input"
                  value={formData().excerpt || ""}
                  onInput={(e) => setFormData({ ...formData(), excerpt: e.currentTarget.value })}
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <AlignLeft size={14} />
                  <span>Konten (Markdown Support)</span>
                </label>
                <textarea
                  rows="15" required placeholder="Tulis isi artikel lengkap Anda di sini..."
                  class="login-input"
                  style={{ "font-family": "monospace", "font-size": "0.875rem", "line-height": "1.6" }}
                  value={formData().content}
                  onInput={(e) => setFormData({ ...formData(), content: e.currentTarget.value })}
                ></textarea>
              </div>
            </div>
          </div>

          <div class="blog-form-sidebar">
            <div class="blog-form-card">
              <h3 class="card-section-title">Publikasi</h3>
              
              <div class="publish-toggle-box">
                <input
                  type="checkbox" id="published" checked={formData().is_published}
                  onChange={(e) => setFormData({ ...formData(), is_published: e.currentTarget.checked })}
                  class="custom-checkbox"
                />
                <label for="published" class="checkbox-label">Terbitkan Sekarang</label>
              </div>

              <div class={`schedule-box ${!formData().is_published ? 'active' : ''}`}>
                <label class="form-label">
                  <Calendar size={14} />
                  <span>Waktu Terbit</span>
                </label>
                <input
                  type="datetime-local"
                  required={!formData().is_published}
                  class="login-input"
                  value={formData().published_at || ""}
                  onInput={(e) => setFormData({ ...formData(), published_at: e.currentTarget.value })}
                />
              </div>

              <hr class="divider" />

              <div class="form-group">
                <label class="form-label">
                  <ImageIcon size={14} />
                  <span>Gambar Sampul</span>
                </label>
                <input
                  type="text" placeholder="URL Gambar..."
                  class="login-input"
                  value={formData().image_url || ""}
                  onInput={(e) => setFormData({ ...formData(), image_url: e.currentTarget.value })}
                />
                <Show when={formData().image_url}>
                  <div class="image-preview-mini">
                    <img src={formData().image_url!} alt="Preview" />
                  </div>
                </Show>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <LinkIcon size={14} />
                  <span>Produk CTA</span>
                </label>
                <select
                  class="login-input"
                  value={formData().cta_product_id || ""}
                  onChange={(e) => setFormData({ ...formData(), cta_product_id: e.currentTarget.value || null })}
                >
                  <option value="">Tanpa Produk CTA</option>
                  <Show when={!products.loading}>
                    <For each={products() || []}>
                      {(p) => <option value={p.id}>{p.name}</option>}
                    </For>
                  </Show>
                </select>
              </div>

              <div class="action-footer">
                <Button
                  type="submit"
                  disabled={isSaving()}
                  style={{ width: "100%" }}
                >
                  <Show when={isSaving()} fallback={<FileText size={18} />}>
                    <Loader2 class="animate-spin" size={18} />
                  </Show>
                  <span>{isSaving() ? "Menyimpan..." : "Simpan Artikel"}</span>
                </Button>
                <button
                  type="button"
                  onClick={() => navigate("/blogs")}
                  class="btn-cancel"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .blog-create-container {
          padding-bottom: 3rem;
        }
        .blog-form-page {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
          align-items: flex-start;
        }
        @media (max-width: 1024px) {
          .blog-form-page {
            grid-template-columns: 1fr;
          }
        }
        .blog-form-card {
          background-color: white;
          border: 1px solid var(--color-border);
          border-radius: 1.5rem;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: var(--shadow-sm);
        }
        .card-section-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--color-ink);
          margin-bottom: 0.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-ink-light);
          margin-left: 0.25rem;
        }
        .publish-toggle-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: var(--color-green-50);
          padding: 1rem;
          border-radius: 0.75rem;
          border: 1px solid var(--color-green-100);
        }
        .custom-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          accent-color: var(--color-green-500);
          cursor: pointer;
        }
        .checkbox-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-ink);
          cursor: pointer;
        }
        .schedule-box {
          opacity: 0.6;
          transition: opacity 0.2s;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .schedule-box.active {
          opacity: 1;
        }
        .divider {
          border: none;
          border-top: 1px solid var(--color-border);
          margin: 0.5rem 0;
        }
        .image-preview-mini {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid var(--color-border);
          background-color: var(--color-cream);
        }
        .image-preview-mini img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .action-footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .btn-cancel {
          background: none;
          border: none;
          color: var(--color-muted);
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          text-align: center;
          transition: color 0.2s;
        }
        .btn-cancel:hover {
          color: #ef4444;
        }
      `}</style>
    </Layout>
  );
}
