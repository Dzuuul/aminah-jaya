import { createSignal, createResource, createEffect, Show } from "solid-js";
import { User, Bell, Lock, Globe, Palette, Save, ChevronRight, Loader2 } from "lucide-solid";
import Layout from "../components/Layout";
import { getSettings, updateSettings } from "../lib/api";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "../lib/toast";

// Reusable UI Components
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";
import Input, { TextArea, Select } from "../components/ui/Input";
import { SettingsSection, SettingsField } from "../components/ui/SettingsLayout";

export default function Settings() {
  const [data, { mutate, refetch }] = createResource(getSettings);
  
  const [storeName, setStoreName] = createSignal("");
  const [storeEmail, setStoreEmail] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [currency, setCurrency] = createSignal("IDR");
  const [language, setLanguage] = createSignal("id");
  const [emailNotif, setEmailNotif] = createSignal(true);
  const [orderNotif, setOrderNotif] = createSignal(true);
  const [lowStockNotif, setLowStockNotif] = createSignal(false);
  const [appearanceMode, setAppearanceMode] = createSignal("light");
  
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [isDangerConfirmOpen, setIsDangerConfirmOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);

  // Sync state with loaded data
  createEffect(() => {
    const s = data();
    if (s) {
      setStoreName(s.store_name);
      setStoreEmail(s.store_email);
      setPhone(s.phone_number);
      setDescription(s.store_description || "");
      setCurrency(s.currency);
      setLanguage(s.language);
      setEmailNotif(s.email_notifications);
      setOrderNotif(s.order_notifications);
      setLowStockNotif(s.low_stock_notifications);
      setAppearanceMode(s.appearance_mode || "light");
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        store_name: storeName(),
        store_email: storeEmail(),
        phone_number: phone(),
        store_description: description(),
        currency: currency(),
        language: language(),
        email_notifications: emailNotif(),
        order_notifications: orderNotif(),
        low_stock_notifications: lowStockNotif(),
        appearance_mode: appearanceMode(),
      });
      toast.success("Pengaturan berhasil diperbarui");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui pengaturan");
    } finally {
      setIsSaving(false);
      setIsConfirmOpen(false);
    }
  };

  const updateAppearance = async (mode: string) => {
    setAppearanceMode(mode);
    try {
      await updateSettings({ appearance_mode: mode });
      toast.success(`Tema diubah ke mode ${mode === 'light' ? 'terang' : mode === 'dark' ? 'gelap' : 'sistem'}`);
    } catch (err: any) {
      toast.error("Gagal memperbarui preferensi tema");
    }
  };

  const handleDeleteData = async () => {
    // Implementasi delete data di sini
    toast.error("Tindakan belum diimplementasikan: Hapus Data Toko");
  };

  return (
    <Layout title="Pengaturan">
      <div class="page-header">
        <div>
          <h1 class="page-title">Pengaturan</h1>
          <p class="page-subtitle">Kelola preferensi toko dan akun Anda secara efisien.</p>
        </div>
        <Button 
          onClick={() => setIsConfirmOpen(true)}
          loading={isSaving()}
          disabled={data.loading}
        >
          {!isSaving() && <Save size={18} class="mr-2" />}
          {isSaving() ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <Show when={!data.loading} fallback={
        <div class="loading-overlay" style={{ position: "static", "min-height": "400px", "border-radius": "1.5rem" }}>
          <div class="spinner"></div>
          <p class="loading-text">Memuat pengaturan toko Anda...</p>
        </div>
      }>
        <div class="settings-grid animate-in fade-in duration-500">
          {/* Left column — main settings */}
          <div class="settings-col-main">

            {/* Store Profile */}
            <SettingsSection icon={User} title="Profil Toko" description="Informasi identitas dasar toko Anda">
              <SettingsField label="Nama Toko">
                <Input
                  type="text"
                  value={storeName()}
                  onInput={(e) => setStoreName(e.currentTarget.value)}
                  placeholder="Nama Toko Anda"
                />
              </SettingsField>
              <SettingsField label="Email Kontak">
                <Input
                  type="email"
                  value={storeEmail()}
                  onInput={(e) => setStoreEmail(e.currentTarget.value)}
                  placeholder="admin@aminahjaya.com"
                />
              </SettingsField>
              <SettingsField label="Nomor Telepon">
                <Input
                  type="tel"
                  value={phone()}
                  onInput={(e) => setPhone(e.currentTarget.value)}
                  placeholder="+62 812..."
                />
              </SettingsField>
              <SettingsField label="Deskripsi Toko" hint="Akan ditampilkan pada cetakan invoice">
                <TextArea
                  rows={3}
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  placeholder="Masukkan deskripsi toko atau slogan..."
                  class="resize-none"
                />
              </SettingsField>
            </SettingsSection>

            {/* Localization */}
            <SettingsSection icon={Globe} title="Lokalisasi" description="Konfigurasi bahasa, wilayah, dan mata uang">
              <SettingsField label="Mata Uang Utama">
                <Select
                  value={currency()}
                  onChange={(e) => setCurrency(e.currentTarget.value)}
                >
                  <option value="IDR">IDR — Rupiah Indonesia</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                </Select>
              </SettingsField>
              <SettingsField label="Bahasa Antarmuka">
                <Select
                  value={language()}
                  onChange={(e) => setLanguage(e.currentTarget.value)}
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English (US)</option>
                </Select>
              </SettingsField>
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection icon={Bell} title="Notifikasi" description="Atur preferensi pemberitahuan aktivitas toko">
              <SettingsField label="Update via Email" hint="Terima laporan ringkasan berkala">
                <Toggle checked={emailNotif()} onChange={setEmailNotif} />
              </SettingsField>
              <SettingsField label="Pesanan Baru" hint="Notifikasi instan setiap ada pesanan masuk">
                <Toggle checked={orderNotif()} onChange={setOrderNotif} />
              </SettingsField>
              <SettingsField label="Peringatan Stok" hint="Pemberitahuan jika stok produk hampir habis">
                <Toggle checked={lowStockNotif()} onChange={setLowStockNotif} />
              </SettingsField>
            </SettingsSection>

          </div>

          {/* Right column — secondary settings */}
          <div class="settings-col-side">

            {/* Appearance */}
            <SettingsSection icon={Palette} title="Tampilan" description="Personalisasi tema antarmuka CMS">
              <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
                {[
                  { id: "light", label: "Mode Terang" },
                  { id: "dark", label: "Mode Gelap" },
                  { id: "system", label: "Mode Sistem" }
                ].map((mode) => (
                  <button 
                    onClick={() => updateAppearance(mode.id)}
                    class={`settings-appearance-btn ${appearanceMode() === mode.id ? 'active' : ''}`}
                  >
                    <span>{mode.label}</span>
                    {appearanceMode() === mode.id && <span style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-green-500)" }}>Aktif</span>}
                  </button>
                ))}
              </div>
            </SettingsSection>

            {/* Security */}
            <SettingsSection icon={Lock} title="Keamanan" description="Pengaturan sandi dan akses akun">
              {[
                { label: "Ubah Kata Sandi", hint: "Terakhir diperbarui 30 hari yang lalu", action: () => toast.info("Fitur ubah sandi segera hadir") },
                { label: "Autentikasi 2FA", hint: "Belum aktif - Sangat disarankan", action: () => toast.info("Konfigurasi 2FA segera hadir") },
                { label: "Manajemen Sesi", hint: "Lihat perangkat yang terhubung", action: () => toast.info("Manajemen sesi segera hadir") },
              ].map((item) => (
                <button 
                  onClick={item.action}
                  class="settings-security-item group"
                >
                  <div>
                    <p class="settings-security-title">{item.label}</p>
                    <p class="settings-security-hint">{item.hint}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--color-muted)", transition: "color 0.2s", "flex-shrink": 0 }} class="group-hover:text-green-500" />
                </button>
              ))}
            </SettingsSection>

            {/* Danger Zone */}
            <div class="settings-danger-zone">
              <p class="settings-danger-title">Zona Bahaya</p>
              <p class="settings-danger-desc">Tindakan berikut bersifat permanen dan tidak dapat dipulihkan.</p>
              <Button 
                variant="danger"
                onClick={() => setIsDangerConfirmOpen(true)}
                class="w-full"
                style={{ width: "100%" }}
              >
                Hapus Seluruh Data Toko
              </Button>
            </div>

          </div>
        </div>
      </Show>

      <ConfirmModal 
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
        title="Perbarui Pengaturan"
        message="Apakah Anda yakin ingin menyimpan perubahan pada konfigurasi toko?"
        confirmText="Simpan Perubahan"
      />

      <ConfirmModal 
        isOpen={isDangerConfirmOpen()}
        onClose={() => setIsDangerConfirmOpen(false)}
        onConfirm={handleDeleteData}
        title="Hapus Data Toko"
        message="PERINGATAN: Tindakan ini akan menghapus permanen seluruh data produk, pesanan, dan pelanggan. Lanjutkan?"
        confirmText="Hapus Permanen"
        isDanger={true}
      />
    </Layout>
  );
}
