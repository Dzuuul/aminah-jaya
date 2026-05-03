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
  const [bio, setBio]         = createSignal("Store administrator for Aminah Jaya — managing products, orders, and customers with care.");

  const stats = [
    { label: "Products",  value: "48",  Icon: ShoppingBag, bg: "#eff6ff", color: "#2563eb" },
    { label: "Orders",    value: "156", Icon: Package,     bg: "#fff7ed", color: "#ea580c" },
    { label: "Rating",    value: "4.9", Icon: Star,        bg: "#fefce8", color: "#ca8a04" },
  ];

  const activity = [
    { action: "Processed order",       detail: "#ORD-7238 – Rudi Hermawan",    time: "2 min ago"   },
    { action: "Added product",         detail: "Sajadah Premium 120×70cm",      time: "1 hour ago"  },
    { action: "Updated stock",         detail: "Minyak Zaitun 250ml → 45 pcs",  time: "3 hours ago" },
    { action: "Responded to customer", detail: "Dewi Lestari – order inquiry",   time: "5 hours ago" },
    { action: "Processed order",       detail: "#ORD-7234 – Ahmad Fauzi",       time: "Yesterday"   },
  ];

  return (
    <Layout title="Profile">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div class="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden mb-6">

        {/* Cover */}
        <div
          style="height: 120px; background: linear-gradient(135deg, #0f3d2e 0%, #2a8a60 55%, #3aac78 100%); position: relative;"
        >
          <div
            class="absolute inset-0 opacity-[0.07]"
            style="background-image: radial-gradient(circle, white 1.5px, transparent 1.5px); background-size: 24px 24px;"
          />
        </div>

        {/* Content below cover — avatar floats up via absolute */}
        <div class="relative px-6 sm:px-8 pb-8" style="padding-top: 56px;">
          {/* Avatar — absolutely positioned to overlap cover */}
          <div class="absolute" style="top: -44px; left: 32px;">
            <div
              class="w-[88px] h-[88px] rounded-2xl border-4 border-white shadow-xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-3xl select-none"
            >
              AD
            </div>
            <button
              class="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 hover:bg-green-700 rounded-lg flex items-center justify-center text-white shadow-md transition-colors"
            >
              <Camera size={13} />
            </button>
          </div>

          {/* Name + actions row */}
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-xl font-bold text-ink">{name()}</h2>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Active</span>
              </div>
              <p class="text-sm text-muted mt-0.5">Super Admin</p>
            </div>

            {/* Actions */}
            <div class="flex items-center gap-2 flex-shrink-0">
              <Show
                when={editing()}
                fallback={
                  <button onClick={() => setEditing(true)}
                    class="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-sand text-ink text-sm font-semibold hover:bg-cream transition-colors">
                    <Edit size={15} /> Edit Profile
                  </button>
                }
              >
                <button onClick={() => setEditing(false)}
                  class="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-sand text-ink-light text-sm font-semibold hover:bg-cream transition-colors">
                  <X size={15} /> Cancel
                </button>
                <button onClick={() => setEditing(false)}
                  class="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-700 text-white text-sm font-semibold shadow-lg shadow-green-500/20 transition-all">
                  <Save size={15} /> Save
                </button>
              </Show>
            </div>
          </div>

          {/* Bio */}
          <p class="text-sm text-ink-light leading-relaxed mt-3 max-w-2xl">{bio()}</p>

          {/* Stat chips */}
          <div class="flex flex-wrap gap-2 mt-4">
            {stats.map((s) => (
              <div
                class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                style={`background: ${s.bg}; color: ${s.color};`}
              >
                <s.Icon size={14} />
                <span style="color: #6b7280; font-weight: 500;">{s.label}</span>
                <span>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column content ───────────────────────────────── */}
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left 2/5 */}
        <div class="lg:col-span-2 space-y-6">
          <PageCard title="Contact Details">
            <InfoRow label="Email"   value={email()}   icon={Mail}     editing={editing()} onInput={setEmail}   type="email" />
            <InfoRow label="Phone"   value={phone()}   icon={Phone}    editing={editing()} onInput={setPhone}   type="tel"   />
            <InfoRow label="Address" value={address()}  icon={MapPin}   editing={editing()} onInput={setAddress} />
            <InfoRow label="Joined"  value="January 2023" icon={Calendar} />
          </PageCard>

          <PageCard title="About Me">
            <Show
              when={editing()}
              fallback={<p class="text-sm text-ink-light leading-relaxed">{bio()}</p>}
            >
              <textarea rows={5} value={bio()} onInput={(e) => setBio(e.currentTarget.value)} class="filter-input resize-none" />
            </Show>
          </PageCard>
        </div>

        {/* Right 3/5 */}
        <div class="lg:col-span-3 space-y-6">
          <PageCard title="Personal Information" subtitle="Details used across the CMS">
            <InfoRow label="Full Name"     value={name()}    editing={editing()} onInput={setName}    />
            <InfoRow label="Email Address" value={email()}   editing={editing()} onInput={setEmail}   type="email" />
            <InfoRow label="Phone Number"  value={phone()}   editing={editing()} onInput={setPhone}   type="tel"   />
            <InfoRow label="Address"       value={address()}  editing={editing()} onInput={setAddress} />
          </PageCard>

          <PageCard title="Recent Activity" subtitle="Your latest actions in the system">
            {activity.map((a) => (
              <ActivityItem action={a.action} detail={a.detail} time={a.time} />
            ))}
          </PageCard>
        </div>

      </div>
    </Layout>
  );
}
