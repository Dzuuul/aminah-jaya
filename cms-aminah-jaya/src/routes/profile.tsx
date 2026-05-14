import { createSignal, Show } from "solid-js";
import {
  Mail, Phone, MapPin, Calendar,
  Edit, Camera, Save, X,
  ShoppingBag, Package, Star,
} from "lucide-solid";
import Layout from "../components/Layout";
import { PageCard, InfoRow, ActivityItem } from "../components/ProfileComponents";

export default function Profile() {
  const [editing, setEditing] = createSignal(false);
  const [name, setName]       = createSignal("Admin Aminah");
  const [email, setEmail]     = createSignal("admin@aminahjaya.com");
  const [phone, setPhone]     = createSignal("0812-3456-7890");
  const [address, setAddress] = createSignal("Jl. Raya Bogor No. 42, Jakarta Timur");
  const [bio, setBio]         = createSignal("Administrator toko Aminah Jaya — mengelola produk, pesanan, dan pelanggan dengan penuh dedikasi.");

  const stats = [
    { label: "Produk",  value: "48",  Icon: ShoppingBag, bg: "#eff6ff", color: "#2563eb" },
    { label: "Pesanan", value: "156", Icon: Package,     bg: "#fff7ed", color: "#ea580c" },
    { label: "Rating",  value: "4.9", Icon: Star,        bg: "#fefce8", color: "#ca8a04" },
  ];

  const activity = [
    { action: "Memproses pesanan",     detail: "#ORD-7238 – Rudi Hermawan",    time: "2 menit lalu"   },
    { action: "Menambahkan produk",   detail: "Sajadah Premium 120×70cm",      time: "1 jam lalu"  },
    { action: "Memperbarui stok",     detail: "Minyak Zaitun 250ml → 45 pcs",  time: "3 jam lalu" },
    { action: "Menanggapi pelanggan", detail: "Dewi Lestari – pertanyaan pesanan",   time: "5 jam lalu" },
    { action: "Memproses pesanan",     detail: "#ORD-7234 – Ahmad Fauzi",       time: "Kemarin"   },
  ];

  return (
    <Layout title="Profil">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ "background-color": "white", "border-radius": "1.5rem", border: "1px solid rgba(var(--color-border-rgb), 0.5)", "box-shadow": "0 1px 2px 0 rgba(0, 0, 0, 0.05)", overflow: "hidden", "margin-bottom": "1.5rem" }}>

        {/* Cover */}
        <div
          style={{ height: "120px", background: "linear-gradient(135deg, #0f3d2e 0%, #2a8a60 55%, #3aac78 100%)", position: "relative" }}
        >
          <div
            style={{ position: "absolute", inset: 0, opacity: 0.07, "background-image": "radial-gradient(circle, white 1.5px, transparent 1.5px)", "background-size": "24px 24px" }}
          />
        </div>

        {/* Content below cover — avatar floats up via absolute */}
        <div style={{ position: "relative", padding: "3.5rem 1.5rem 2rem 1.5rem" }}>
          {/* Avatar — absolutely positioned to overlap cover */}
          <div style={{ position: "absolute", top: "-44px", left: "2rem" }}>
            <div
              style={{ width: "88px", height: "88px", "border-radius": "1rem", border: "4px solid white", "box-shadow": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", "background-color": "#dcfce7", display: "flex", "align-items": "center", "justify-content": "center", color: "#15803d", "font-weight": "700", "font-size": "1.875rem", "user-select": "none" }}
            >
              AD
            </div>
            <button
              style={{ position: "absolute", bottom: "-0.25rem", right: "-0.25rem", width: "1.75rem", height: "1.75rem", "background-color": "var(--color-green-500)", "border-radius": "0.5rem", display: "flex", "align-items": "center", "justify-content": "center", color: "white", "box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", transition: "background-color 0.2s", border: "none", cursor: "pointer" }}
            >
              <Camera size={13} />
            </button>
          </div>

          {/* Name + actions row */}
          <div style={{ display: "flex", "flex-wrap": "wrap", "align-items": "flex-start", "justify-content": "space-between", gap: "0.75rem" }}>
            <div>
              <div style={{ display: "flex", "align-items": "center", gap: "0.5rem", "flex-wrap": "wrap" }}>
                <h2 style={{ "font-size": "1.25rem", "font-weight": "700", color: "var(--color-ink)" }}>{name()}</h2>
                <span class="badge badge-green">Aktif</span>
              </div>
              <p style={{ "font-size": "0.875rem", color: "var(--color-muted)", "margin-top": "0.125rem" }}>Admin Super</p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", "align-items": "center", gap: "0.5rem", "flex-shrink": 0 }}>
              <Show
                when={editing()}
                fallback={
                  <button onClick={() => setEditing(true)}
                    style={{ display: "flex", "align-items": "center", gap: "0.5rem", padding: "0.5rem 1rem", "border-radius": "0.75rem", border: "1px solid var(--color-border)", "background-color": "var(--color-sand)", color: "var(--color-ink)", "font-size": "0.875rem", "font-weight": "600", transition: "background-color 0.2s", cursor: "pointer" }}>
                    <Edit size={15} /> Edit Profil
                  </button>
                }
              >
                <button onClick={() => setEditing(false)}
                  style={{ display: "flex", "align-items": "center", gap: "0.5rem", padding: "0.5rem 1rem", "border-radius": "0.75rem", border: "1px solid var(--color-border)", "background-color": "var(--color-sand)", color: "var(--color-ink-light)", "font-size": "0.875rem", "font-weight": "600", transition: "background-color 0.2s", cursor: "pointer" }}>
                  <X size={15} /> Batal
                </button>
                <button onClick={() => setEditing(false)}
                  style={{ display: "flex", "align-items": "center", gap: "0.5rem", padding: "0.5rem 1rem", "border-radius": "0.75rem", "background-color": "var(--color-green-500)", color: "white", "font-size": "0.875rem", "font-weight": "600", "box-shadow": "0 10px 15px -3px rgba(var(--color-green-500-rgb), 0.2), 0 4px 6px -2px rgba(var(--color-green-500-rgb), 0.1)", transition: "all 0.2s", border: "none", cursor: "pointer" }}>
                  <Save size={15} /> Simpan
                </button>
              </Show>
            </div>
          </div>

          {/* Bio */}
          <p style={{ "font-size": "0.875rem", color: "var(--color-ink-light)", "line-height": 1.625, "margin-top": "0.75rem", "max-width": "42rem" }}>{bio()}</p>

          {/* Stat chips */}
          <div style={{ display: "flex", "flex-wrap": "wrap", gap: "0.5rem", "margin-top": "1rem" }}>
            {stats.map((s) => (
              <div
                style={{ display: "flex", "align-items": "center", gap: "0.5rem", padding: "0.5rem 0.75rem", "border-radius": "0.75rem", "font-size": "0.75rem", "font-weight": "700", background: s.bg, color: s.color }}
              >
                <s.Icon size={14} />
                <span style={{ color: "#6b7280", "font-weight": 500 }}>{s.label}</span>
                <span>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column content ───────────────────────────────── */}
      <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>

        {/* Left 2/5 */}
        <div style={{ display: "flex", "flex-direction": "column", gap: "1.5rem", "grid-column": "span 2" }}>
          <PageCard title="Detail Kontak">
            <InfoRow label="Email"   value={email()}   icon={Mail}     editing={editing()} onInput={setEmail}   type="email" />
            <InfoRow label="Telepon" value={phone()}   icon={Phone}    editing={editing()} onInput={setPhone}   type="tel"   />
            <InfoRow label="Alamat"  value={address()}  icon={MapPin}   editing={editing()} onInput={setAddress} />
            <InfoRow label="Bergabung" value="Januari 2023" icon={Calendar} />
          </PageCard>

          <PageCard title="Tentang Saya">
            <Show
              when={editing()}
              fallback={<p style={{ "font-size": "0.875rem", color: "var(--color-ink-light)", "line-height": 1.625 }}>{bio()}</p>}
            >
              <textarea rows={5} value={bio()} onInput={(e) => setBio(e.currentTarget.value)} class="login-input" style={{ resize: "none" }} />
            </Show>
          </PageCard>
        </div>

        {/* Right 3/5 */}
        <div style={{ display: "flex", "flex-direction": "column", gap: "1.5rem", "grid-column": "span 3" }}>
          <PageCard title="Informasi Pribadi" subtitle="Detail yang digunakan di seluruh CMS">
            <InfoRow label="Nama Lengkap"     value={name()}    editing={editing()} onInput={setName}    />
            <InfoRow label="Alamat Email"     value={email()}   editing={editing()} onInput={setEmail}   type="email" />
            <InfoRow label="Nomor Telepon"    value={phone()}   editing={editing()} onInput={setPhone}   type="tel"   />
            <InfoRow label="Alamat Lengkap"   value={address()}  editing={editing()} onInput={setAddress} />
          </PageCard>

          <PageCard title="Aktivitas Terbaru" subtitle="Tindakan terbaru Anda di sistem">
            {activity.map((a) => (
              <ActivityItem action={a.action} detail={a.detail} time={a.time} />
            ))}
          </PageCard>
        </div>

      </div>
    </Layout>
  );
}
