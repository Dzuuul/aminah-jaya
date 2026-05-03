import { createSignal } from "solid-js";
import { User, Bell, Lock, Globe, Palette, Save, ChevronRight } from "lucide-solid";
import Layout from "../components/Layout";

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
  const [storeName, setStoreName] = createSignal("Aminah Jaya");
  const [storeEmail, setStoreEmail] = createSignal("admin@aminahjaya.com");
  const [phone, setPhone] = createSignal("0812-3456-7890");
  const [currency, setCurrency] = createSignal("IDR");
  const [language, setLanguage] = createSignal("id");
  const [emailNotif, setEmailNotif] = createSignal(true);
  const [orderNotif, setOrderNotif] = createSignal(true);
  const [lowStockNotif, setLowStockNotif] = createSignal(false);

  const fieldClass = "filter-input";

  return (
    <Layout title="Settings">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-ink">Settings</h1>
          <p class="text-ink-light mt-1">Manage your store preferences and account.</p>
        </div>
        <button class="btn-primary flex items-center gap-2">
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
              {["Light", "Dark", "System"].map((mode) => (
                <button class={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  mode === "Light" ? "bg-green-50 text-green-700 border border-green-200" : "text-ink-light hover:bg-sand"
                }`}>
                  <span>{mode} Mode</span>
                  {mode === "Light" && <span class="text-xs font-bold text-green-500">Active</span>}
                </button>
              ))}
            </div>
          </SettingsSection>

          {/* Security */}
          <SettingsSection icon={Lock} title="Security" description="Password and access control">
            {[
              { label: "Change Password", hint: "Last changed 30 days ago" },
              { label: "Two-Factor Auth", hint: "Not enabled" },
              { label: "Active Sessions", hint: "1 active session" },
            ].map((item) => (
              <button class="w-full flex items-center justify-between py-2 group">
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
            <button class="w-full px-4 py-2.5 bg-white border border-red-200 text-red-500 text-sm font-bold rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
              Delete Store Data
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
