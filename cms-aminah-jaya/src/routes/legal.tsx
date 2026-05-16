import { createSignal, createResource, For, Show, createEffect } from "solid-js";
import { Shield, FileText, RefreshCw, Save, Globe } from "lucide-solid";
import Layout from "../components/Layout";
import { getLegalPages, updateLegalPage, LegalPage } from "../lib/api";
import { toast } from "../lib/toast";
import Button from "../components/ui/Button";
import { TextArea } from "../components/ui/Input";

export default function LegalSettings() {
  const [pages, { refetch }] = createResource(getLegalPages);
  const [selectedKey, setSelectedKey] = createSignal<string>("terms");
  const [activeLang, setActiveLang] = createSignal<"id" | "en">("id");
  const [isSaving, setIsSaving] = createSignal(false);

  // Form states
  const [titleId, setTitleId] = createSignal("");
  const [contentId, setContentId] = createSignal("");
  const [titleEn, setTitleEn] = createSignal("");
  const [contentEn, setContentEn] = createSignal("");

  // Sync form with selected page
  createEffect(() => {
    const allPages = pages();
    if (allPages) {
      const selected = allPages.find(p => p.key === selectedKey());
      if (selected) {
        setTitleId(selected.title_id as string);
        setContentId(selected.content_id as string);
        setTitleEn(selected.title_en as string);
        setContentEn(selected.content_en as string);
      }
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLegalPage(selectedKey(), {
        title_id: titleId(),
        content_id: contentId(),
        title_en: titleEn(),
        content_en: contentEn(),
      });
      toast.success("Halaman legal berhasil diperbarui");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui halaman legal");
    } finally {
      setIsSaving(false);
    }
  };

  const getIcon = (key: string) => {
    switch (key) {
      case 'terms': return FileText;
      case 'privacy': return Shield;
      case 'refund': return RefreshCw;
      default: return FileText;
    }
  };

  return (
    <Layout title="Dokumen Legal">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dokumen Legal</h1>
          <p class="page-subtitle">Kelola syarat, ketentuan, dan kebijakan privasi toko Anda.</p>
        </div>
        <Button onClick={handleSave} loading={isSaving()} disabled={pages.loading}>
          <Save size={18} class="mr-2" />
          Simpan Perubahan
        </Button>
      </div>

      <div class="legal-manager-grid">
        {/* Sidebar: Page Selection */}
        <div class="legal-sidebar">
          <div class="legal-nav-card">
            <h3 class="legal-nav-title">Pilih Dokumen</h3>
            <div class="legal-nav-list">
              <Show when={!pages.loading} fallback={<div class="p-4 text-center">Loading...</div>}>
                <For each={pages()}>
                  {(page) => (
                    <button
                      class={`legal-nav-item ${selectedKey() === page.key ? 'active' : ''}`}
                      onClick={() => setSelectedKey(page.key)}
                    >
                      <div class="icon-box">
                        {(() => {
                          const Icon = getIcon(page.key);
                          return <Icon size={18} />;
                        })()}
                      </div>
                      <div class="text-box">
                        <p class="name">{page.title_id}</p>
                        <p class="update-at">Update: {new Date(page.updated_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </button>
                  )}
                </For>
              </Show>
            </div>
          </div>

          <div class="legal-info-card">
            <div class="flex items-center gap-2 mb-2 text-green-600">
              <Globe size={16} />
              <span class="font-bold text-xs uppercase tracking-wider">Tips Midtrans</span>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">
              Pastikan menyertakan informasi kontak yang jelas, kebijakan pengiriman, dan instruksi refund untuk memenuhi standar verifikasi Midtrans.
            </p>
          </div>
        </div>

        {/* Content: Editor */}
        <div class="legal-content-main">
          <div class="editor-body">
            <div class="field-group">
              <label>Judul Halaman</label>
              <input
                type="text"
                class="legal-input"
                value={titleId()}
                onInput={(e) => setTitleId(e.currentTarget.value)}
                placeholder="Masukkan judul halaman (contoh: Syarat & Ketentuan)..."
              />
            </div>

            <div class="field-group">
              <div class="flex justify-between items-center mb-2">
                <label>Konten Dokumen</label>
              </div>
              <TextArea
                rows={20}
                class="legal-textarea font-sans text-sm"
                value={contentId()}
                onInput={(e) => setContentId(e.currentTarget.value)}
                placeholder="Masukkan isi dokumen di sini..."
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
