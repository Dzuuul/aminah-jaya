import { createSignal, Switch, Match, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

// --- Types ---
type TechnicalDetail = {
  label: string;
  value: string;
  icon: string;
};

type Expert = {
  name: string;
  role: string;
  quote: string;
};

type Product = {
  id: string;
  name: string;
  price: string;
  category: "wellness" | "fashion";
  image: string;
  desc: string;
  purityInfo?: { ingredients: string; certification: string; testing: string };
  eleganceInfo?: { feel: string; parallaxImg: string };
  technical: TechnicalDetail[];
  expert: Expert;
  waText: string;
};

// --- Mock Data ---
const products: Product[] = [
  {
    id: "whey-protein",
    name: "Whey Protein Premium",
    price: "Rp 350.000",
    category: "wellness",
    image: "/...", // Placeholder
    desc: "Premium plant-based protein with optimal amino acid profile for muscle recovery and metabolic health.",
    purityInfo: {
      ingredients: "Pure Whey Isolate, Stevia Leaf Extract, Natural Cocoa",
      certification: "ISO 22000, Halal & BPOM Certified",
      testing: "Third-party Lab Tested for Heavy Metals & Purity",
    },
    technical: [
      { label: "Dosage", value: "30g Protein / Serving", icon: "⚖️" },
      { label: "Benefits", value: "Lean Muscle & Recovery", icon: "🌱" },
      { label: "Storage", value: "Shelf-stable, Cool & Dry", icon: "🛡️" },
    ],
    expert: {
      name: "Dr. Sarah Hanum",
      role: "Senior Clinical Nutritionist",
      quote: "This formulation represents the gold standard in bioavailable protein supplementation.",
    },
    waText: "Hello, I would like to order the Whey Protein Premium.",
  },
  {
    id: "gamis-muslimah",
    name: "Silk Modesty Abaya",
    price: "Rp 1.850.000",
    category: "fashion",
    image: "/...",
    desc: "A masterpiece of modest elegance, crafted from premium Mulberry silk for a weightless, divine drape.",
    eleganceInfo: {
      feel: "Breathable Silk for Daily Worship",
      parallaxImg: "/...",
    },
    technical: [
      { label: "Wudhu Friendly", value: "Invisible Elastic Sleeves", icon: "✨" },
      { label: "Material", value: "100% Mulberry Silk", icon: "🧵" },
      { label: "Transparency", value: "Fully Opaque Lining", icon: "👗" },
    ],
    expert: {
      name: "Aisyah Putri",
      role: "Lead Modest Stylist",
      quote: "The way the fabric captures light while maintaining absolute modesty is truly exceptional.",
    },
    waText: "Hello, I would like to order the Silk Modesty Abaya.",
  },
];

// ─── Shared Styles ───────────────────────────────────────────────
const SECTION_STYLE = { padding: "120px 0" };

// ─── Components ──────────────────────────────────────────────────

const HeroSection = (props: { product: Product; onBuy: () => void }) => (
  <section 
    class="border-b border-[var(--border)] relative bg-white"
    style={SECTION_STYLE}
  >
    <div class="container">
      <div class="grid lg:grid-cols-2 gap-24 items-center">

        {/* Gambar produk */}
        <div class="relative overflow-hidden rounded-[var(--radius)] bg-[var(--green-50)] aspect-[4/5] flex items-center justify-center border border-[var(--border)]">
          <Show when={props.product.image !== "/..."} fallback={
             <div class="text-[var(--green-500)] opacity-20 flex flex-col items-center gap-6">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span class="text-base font-medium tracking-widest uppercase">Aminah Jaya</span>
             </div>
          }>
            <img
              src={props.product.image}
              alt={props.product.name}
              class="absolute inset-0 w-full h-full object-cover"
            />
          </Show>
        </div>

        {/* Info produk */}
        <div class="flex flex-col" style={{ gap: "60px" }}>
          <div class="flex flex-col" style={{ gap: "24px" }}>
            <span class="section-label w-fit">
              {props.product.category}
            </span>
            <h1 class="section-title !text-4xl lg:!text-5xl !leading-tight !mb-0">
              {props.product.name}
            </h1>
            <p class="section-sub !max-w-none text-lg lg:text-xl !leading-relaxed text-[var(--ink-light)]">
              {props.product.desc}
            </p>
          </div>

          <div class="h-px bg-[var(--border)] w-full opacity-30" />

          {/* Harga & CTA Block */}
          <div class="flex flex-col" style={{ gap: "40px" }}>
            <div class="flex flex-col" style={{ gap: "8px" }}>
              <p class="text-xs uppercase tracking-widest text-[var(--muted)] font-bold opacity-60">Investment Value</p>
              <p class="text-4xl lg:text-5xl font-bold text-[var(--ink)] tracking-tight leading-none">
                {props.product.price}
              </p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-6 pt-10 border-t border-[var(--border)]">
              <button
                onClick={props.onBuy}
                class="btn btn-primary flex-1 justify-center py-5 text-lg shadow-xl"
              >
                Beli Sekarang
              </button>
              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(props.product.waText)}`}
                target="_blank"
                class="btn btn-wa flex-1 justify-center py-5 text-lg shadow-xl"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" class="mr-2">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────

const PurityBlock = (props: { info: NonNullable<Product["purityInfo"]> }) => {
  const items = [
    { icon: "🧪", title: "Premium Ingredients", body: props.info.ingredients },
    { icon: "🛡️", title: "Certified Quality", body: props.info.certification },
    { icon: "🔬", title: "Rigorously Tested", body: props.info.testing },
  ];

  return (
    <section 
      class="bg-[var(--green-50)] relative z-10"
      style={SECTION_STYLE}
    >
      <div class="container">
        <div class="grid sm:grid-cols-3 gap-16">
          <For each={items}>
            {(item) => (
              <div 
                class="bg-white rounded-[var(--radius)] border border-[var(--border)] shadow-xl p-12 text-center"
              >
                <span class="text-5xl block mb-10" aria-hidden="true">{item.icon}</span>
                <h3 class="text-2xl font-bold text-[var(--ink)] mb-4">{item.title}</h3>
                <p class="text-lg text-[var(--ink-light)] leading-relaxed">{item.body}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────

const ParallaxShowcase = (props: { info: NonNullable<Product["eleganceInfo"]> }) => (
  <section
    class="relative w-full h-[70vh] flex items-center justify-center overflow-hidden"
    aria-label="Product showcase"
  >
    <div
      class="absolute inset-0 bg-cover bg-center bg-fixed"
      style={{ "background-image": `url(${props.info.parallaxImg})` }}
      aria-hidden="true"
    />
    <div class="absolute inset-0 bg-black/50" aria-hidden="true" />
    <div class="relative z-10 text-center text-white px-8 max-w-4xl flex flex-col gap-8">
      <h2 class="text-5xl lg:text-7xl font-serif italic font-light leading-tight">Divine Elegance</h2>
      <p class="text-lg uppercase tracking-[0.4em] opacity-90 font-medium">{props.info.feel}</p>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────

const SpecificationsGrid = (props: { details: TechnicalDetail[] }) => (
  <section 
    class="border-y border-[var(--border)] bg-white relative z-20"
    style={SECTION_STYLE}
  >
    <div class="container">
      <div class="text-center flex flex-col items-center" style={{ "margin-bottom": "80px", gap: "24px" }}>
        <p class="section-label mx-auto block w-fit">
          Technical Specifications
        </p>
        <h2 class="section-title !text-4xl lg:!text-5xl">Detail Teknis Produk</h2>
      </div>
      <div class="grid sm:grid-cols-3 gap-24">
        <For each={props.details}>
          {(detail) => (
            <div class="flex flex-col items-center text-center gap-6">
              <div 
                class="shrink-0 bg-[var(--green-50)] rounded-[var(--radius)] flex items-center justify-center text-4xl border border-[var(--border)] shadow-md"
                style={{ width: "80px", height: "80px" }}
              >
                {detail.icon}
              </div>
              <div class="flex flex-col gap-2">
                <p class="text-xs uppercase tracking-widest text-[var(--muted)] font-black opacity-60">
                  {detail.label}
                </p>
                <p class="text-xl font-bold text-[var(--ink)] leading-snug">{detail.value}</p>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────

const EndorsementBlock = (props: { expert: Expert }) => (
  <section 
    class="bg-[var(--green-900)] text-white relative z-10"
    style={SECTION_STYLE}
  >
    <div class="container max-w-5xl flex flex-col items-center text-center gap-16">
      <div 
        class="bg-[var(--green-400)] rounded-full opacity-30" 
        style={{ width: "80px", height: "4px" }}
      />
      <blockquote class="text-3xl lg:text-4xl font-serif italic leading-[1.4] opacity-95 px-8">
        "{props.expert.quote}"
      </blockquote>
      <div class="flex flex-col gap-3">
        <p class="text-xl font-bold tracking-widest uppercase">{props.expert.name}</p>
        <p class="text-xs text-[var(--green-400)] tracking-[0.3em] uppercase font-black">{props.expert.role}</p>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────

const CheckoutModal = (props: { product: Product; onClose: () => void }) => (
  <div
    class="fixed inset-0 z-[300] flex items-center justify-center p-6"
    role="dialog"
    aria-modal="true"
    aria-label="Checkout options"
  >
    {/* Backdrop */}
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-2xl"
      onClick={props.onClose}
      aria-hidden="true"
    />

    {/* Panel */}
    <div class="relative z-10 w-full max-w-xl bg-white rounded-[var(--radius)] shadow-2xl border border-[var(--border)] p-12">
      <div class="flex items-center justify-between mb-10">
        <h3 class="text-2xl font-bold text-[var(--ink)]">Opsi Pembelian</h3>
        <button
          onClick={props.onClose}
          class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[var(--green-50)] text-[var(--muted)] hover:text-[var(--ink)] transition-all"
        >
          ✕
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <a
          href="/cart"
          class="flex items-center p-8 rounded-2xl border border-[var(--border)] hover:border-[var(--green-400)] hover:bg-[var(--green-50)] transition-all group gap-6"
        >
          <div class="w-16 h-16 bg-[var(--green-900)] text-white rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg">
            🛍️
          </div>
          <div>
            <p class="text-lg font-bold text-[var(--ink)]">Order via Website</p>
            <p class="text-sm text-[var(--muted)] mt-1">Cepat, aman & otomatis</p>
          </div>
          <span class="ml-auto text-3xl text-[var(--border)] group-hover:text-[var(--green-500)] transition-transform group-hover:translate-x-2">→</span>
        </a>

        <a
          href={`https://wa.me/6281234567890?text=${encodeURIComponent(props.product.waText)}`}
          target="_blank"
          class="flex items-center p-8 rounded-2xl border border-[var(--green-100)] bg-[var(--green-50)]/50 hover:bg-[var(--green-50)] transition-all group gap-6"
        >
          <div class="w-16 h-16 bg-[#25D366] text-white rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg">
            💬
          </div>
          <div>
            <p class="text-lg font-bold text-[var(--green-900)]">Order via WhatsApp</p>
            <p class="text-sm text-[var(--green-700)]/70 mt-1">Bantuan personal & konsultasi</p>
          </div>
          <span class="ml-auto text-3xl text-[var(--green-400)] group-hover:text-[#25D366] transition-transform group-hover:translate-x-2">→</span>
        </a>
      </div>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────

export default function ProductDetail() {
  const params = useParams();
  const product = products.find((p) => p.id === params.id) ?? products[0];
  const [showModal, setShowModal] = createSignal(false);

  return (
    <div class="min-h-screen text-[var(--ink)] selection:bg-[var(--green-100)] bg-white">
      <Navbar />

      <main class="flex flex-col">
        <HeroSection product={product} onBuy={() => setShowModal(true)} />

        <div class="flex flex-col">
          <Switch>
            <Match when={product.category === "wellness" && product.purityInfo}>
              <PurityBlock info={product.purityInfo!} />
            </Match>
            <Match when={product.category === "fashion" && product.eleganceInfo}>
              <ParallaxShowcase info={product.eleganceInfo!} />
            </Match>
          </Switch>

          <SpecificationsGrid details={product.technical} />
          <EndorsementBlock expert={product.expert} />
        </div>
      </main>

      <Footer />

      <Show when={showModal()}>
        <CheckoutModal product={product} onClose={() => setShowModal(false)} />
      </Show>
    </div>
  );
}