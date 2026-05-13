import { createSignal, createResource, createEffect, Show } from "solid-js";
import { User, Bell, Lock, Globe, Palette, Save, ChevronRight, Loader2 } from "lucide-solid";
import Layout from "../components/Layout";
import { getSettings, updateSettings } from "../lib/api";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "../lib/toast";

function SettingsSection(props: { icon: any; title: string; description: string; children: any }) {
  return (
    <div class="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-border/30 flex items-center gap-3">
        <div class="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
          <props.icon size={18} />
        </div>
        <div>
          <h3 class="font-bold text-ink text-sm">{props.title}</h3>
          <p class="text-xs text-muted">{props.description}</p>
        </div>
      </div>
      <div class="p-6 space-y-5">{props.children}</div>
    </div>
  );
}

function SettingsField(props: { label: string; hint?: string; children: any }) {
  return (
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
      <div class="sm:w-48 flex-shrink-0">
        <p class="text-sm font-semibold text-ink">{props.label}</p>
        {props.hint && <p class="text-xs text-muted mt-0.5">{props.hint}</p>}
      </div>
      <div class="flex-1">{props.children}</div>
    </div>
  );
}

function Toggle(props: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={props.checked}
      onClick={props.onChange}
      class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        props.checked ? "bg-green-500" : "bg-border"
      }`}
    >
      <span class={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        props.checked ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}

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
      toast.success("Settings updated successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
      setIsConfirmOpen(false);
    }
  };

  const updateAppearance = async (mode: string) => {
    setAppearanceMode(mode);
    try {
      await updateSettings({ appearance_mode: mode });
      toast.success(`Theme switched to ${mode} mode`);
    } catch (err: any) {
      toast.error("Failed to update theme preference");
    }
  };

  const handleDeleteData = async () => {
    // Implementasi delete data di sini
    toast.error("Action not implemented: Delete Store Data");
  };

  const fieldClass = "filter-input";

  return (
    <Layout title="Settings">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-ink">Settings</h1>
          <p class="text-ink-light mt-1">Manage your store preferences and account.</p>
        </div>
        <button 
          onClick={() => setIsConfirmOpen(true)}
          disabled={data.loading || isSaving()}
          class="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Show when={isSaving()} fallback={<Save size={18} />}>
            <Loader2 size={18} class="animate-spin" />
          </Show>
          <span>{isSaving() ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <Show when={!data.loading} fallback={
        <div class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-border/40">
          <Loader2 size={40} class="text-green-500 animate-spin mb-4" />
          <p class="text-muted font-medium">Loading settings...</p>
        </div>
      }>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {/* Left column — main settings */}
          <div class="xl:col-span-2 space-y-6">

            {/* Store Profile */}
            <SettingsSection icon={User} title="Store Profile" description="Basic information about your store">
              <SettingsField label="Store Name">
                <input
                  type="text"
                  value={storeName()}
                  onInput={(e) => setStoreName(e.currentTarget.value)}
                  class={fieldClass}
                />
              </SettingsField>
              <SettingsField label="Contact Email">
                <input
                  type="email"
                  value={storeEmail()}
                  onInput={(e) => setStoreEmail(e.currentTarget.value)}
                  class={fieldClass}
                />
              </SettingsField>
              <SettingsField label="Phone Number">
                <input
                  type="tel"
                  value={phone()}
                  onInput={(e) => setPhone(e.currentTarget.value)}
                  class={fieldClass}
                />
              </SettingsField>
              <SettingsField label="Store Description" hint="Shown on invoices">
                <textarea
                  rows={3}
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  placeholder="Enter store description..."
                  class={`${fieldClass} resize-none`}
                />
              </SettingsField>
            </SettingsSection>

            {/* Localization */}
            <SettingsSection icon={Globe} title="Localization" description="Language and currency settings">
              <SettingsField label="Currency">
                <select
                  value={currency()}
                  onChange={(e) => setCurrency(e.currentTarget.value)}
                  class={fieldClass}
                >
                  <option value="IDR">IDR — Indonesian Rupiah</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </SettingsField>
              <SettingsField label="Language">
                <select
                  value={language()}
                  onChange={(e) => setLanguage(e.currentTarget.value)}
                  class={fieldClass}
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </SettingsField>
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection icon={Bell} title="Notifications" description="Control when and how you get notified">
              <SettingsField label="Email Notifications" hint="Receive updates via email">
                <Toggle checked={emailNotif()} onChange={() => setEmailNotif(v => !v)} />
              </SettingsField>
              <SettingsField label="New Orders" hint="Notify on every new order">
                <Toggle checked={orderNotif()} onChange={() => setOrderNotif(v => !v)} />
              </SettingsField>
              <SettingsField label="Low Stock Alerts" hint="Alert when stock falls below 10">
                <Toggle checked={lowStockNotif()} onChange={() => setLowStockNotif(v => !v)} />
              </SettingsField>
            </SettingsSection>

          </div>

          {/* Right column — quick links & danger zone */}
          <div class="space-y-6">

            {/* Appearance */}
            <SettingsSection icon={Palette} title="Appearance" description="Customize the look of your CMS">
              <div class="space-y-2">
                {["light", "dark", "system"].map((mode) => (
                  <button 
                    onClick={() => updateAppearance(mode)}
                    class={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      appearanceMode() === mode 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "text-ink-light hover:bg-sand border border-transparent"
                    }`}
                  >
                    <span class="capitalize">{mode} Mode</span>
                    {appearanceMode() === mode && <span class="text-xs font-bold text-green-500">Active</span>}
                  </button>
                ))}
              </div>
            </SettingsSection>

            {/* Security */}
            <SettingsSection icon={Lock} title="Security" description="Password and access control">
              {[
                { label: "Change Password", hint: "Last changed 30 days ago", action: () => toast.info("Password change modal coming soon") },
                { label: "Two-Factor Auth", hint: "Not enabled", action: () => toast.info("2FA configuration coming soon") },
                { label: "Active Sessions", hint: "1 active session", action: () => toast.info("Session management coming soon") },
              ].map((item) => (
                <button 
                  onClick={item.action}
                  class="w-full flex items-center justify-between py-2 group"
                >
                  <div class="text-left">
                    <p class="text-sm font-semibold text-ink group-hover:text-green-600 transition-colors">{item.label}</p>
                    <p class="text-xs text-muted">{item.hint}</p>
                  </div>
                  <ChevronRight size={16} class="text-muted group-hover:text-green-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </SettingsSection>

            {/* Danger Zone */}
            <div class="bg-red-50 border border-red-100 rounded-2xl p-5">
              <p class="font-bold text-red-600 text-sm mb-1">Danger Zone</p>
              <p class="text-xs text-red-400 mb-4">Irreversible actions. Proceed with caution.</p>
              <button 
                onClick={() => setIsDangerConfirmOpen(true)}
                class="w-full px-4 py-2.5 bg-white border border-red-200 text-red-500 text-sm font-bold rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
              >
                Delete Store Data
              </button>
            </div>

          </div>
        </div>
      </Show>

      <ConfirmModal 
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
        title="Update Settings"
        message="Are you sure you want to save these changes to your store settings?"
        confirmText="Save Changes"
      />

      <ConfirmModal 
        isOpen={isDangerConfirmOpen()}
        onClose={() => setIsDangerConfirmOpen(false)}
        onConfirm={handleDeleteData}
        title="Delete Store Data"
        message="This action is irreversible. Are you absolutely sure you want to delete all store data? This will remove all products, orders, and customer records."
        confirmText="Delete Everything"
        isDanger={true}
      />
    </Layout>
  );
}
