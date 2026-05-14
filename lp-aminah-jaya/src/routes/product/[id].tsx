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
  image: string;
};

type Review = {
  name: string;
  text: string;
};

type Product = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  category: "wellness" | "fashion";
  images: string[];
  desc: string;
  purityInfo?: { 
    ingredients: string; 
    certification: string; 
    testing: string;
    dosage?: string;
    benefit?: string;
    storage?: string;
    culinary?: string;
    videoThumb?: string;
  };
  eleganceInfo?: { 
    feel: string; 
    parallaxImg: string;
    features: { title: string; desc: string; icon: string }[];
  };
  technical: TechnicalDetail[];
  expert: Expert;
  reviews: Review[];
  waText: string;
};

// --- Mock Data ---
const products: Product[] = [
  {
    id: "breathable-silk-abaya",
    name: "Breathable Silk Abaya",
    price: "Rp 1.450.000",
    category: "fashion",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAhxsVZu2AW9IGXAWkbX1RYO6ZChAeSm8T1vPERcKSk4AQ4bS4wLfJl9jk3pMVu8pV00QIQF7EUvvPB3_eYo459oF_eSpDxGYT5k8Z8sW1nEEP2mvWzNGvoc5oOuFzMNKAeks9sPILpTE1CJKXJ6XmFizXaOJ2z_-zragqeq25NfmJrXJV6yoTnhvNaeZ4VlFTiH1oxCV3zT4UfBYIouy-e64ygozxz8gVn347AlX4AJJrYszNr_UDzZwvLn_xk0_6N75FliIzyCE_E",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdonYoYhZhY_c2pUZ_BT17x9J2-6CkZAAWcj5uZxuHy9vsHBjj2qvXVMcAPe7uH1Hg6pcWMO9QA3u6kvkG_8JqynwFn68xUZ9Qb8CSzznzClfWbqD8KpS2FdMf034IYUJNdBZh8LENvJBSjmkfRE-hfnniIaZ5VARbQ1jWWnQcVWYSKc-yleUg9NXCf-ZsW649-ILXG3T8ifv7aGj_hKkLcXe5xOolYj2fJt4yiOlj6goREyqHGf8vRwnZe9920OOQJkCdH6B0JE4L",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCTGP6NP3GNzS-xS3OtemglDwWcDW3VTzmeFQx_7NnDScXQ8o-jX3phAODN15NOrQouuv-HLmcdeWSXZ_yEXNjk60IEd_YkpAkICveNqiTsAUvuKzhSeOp1Nd21M3uhdE0wPGW_76aLY00QUOWs0gpJNeawoSFnZqyb4ABNvZ4giWL1Uxguu2ypL9R-5Aj-FodNt9ct-bR1CWA4Tt8D8q_T7-cV30FndkI9WmzAOna6d8SRsngUmEK__1PoKxKb4CwWdhErMJ5EAny_"
    ],
    desc: "Designed for the modern woman who seeks tranquility in her daily worship. Our signature breathable silk offers a weightless feel with a sophisticated matte finish, ensuring modesty without compromise.",
    eleganceInfo: {
      feel: "Breathable Silk for Daily Worship. Experience the intersection of traditional values and modern luxury.",
      parallaxImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQzJ9Nq5v0xcaanyJlmD3n5hnlWMMoIbQ-4kSjuda7xXWltmGAjiIrJcWxahG6VrGsyK_HZHhdizXBbzppY3EjdHUZrUjuveVJYO0rbHrw-gKGkrc225zGiAyM9qnSm9ej-J5hYqVk3qZBzZ29MlnpAmrDL4QWdLvuGMHjMGD3Lr-fbVavWsqXXXA2KMjbZSzjmEk6QvSH_RmPKorU5xEfcRJoeAmMvSyJxo9VLEXgscm0-Wck26sSBOFM-aIRJv_Ozzm08tfT3H6D",
      features: [
        { title: "Wudhu-friendly", desc: "Discreet zipper closures on the sleeves for ease and convenience during ablution.", icon: "water_drop" },
        { title: "Lightweight", desc: "The 14-momme silk provides a weightless experience, ideal for tropical climates.", icon: "air" },
        { title: "Opaque", desc: "A tight weave ensures full coverage and modesty, even under bright lighting.", icon: "visibility_off" }
      ]
    },
    technical: [
      { label: "Wudhu Friendly", value: "Invisible Elastic Sleeves", icon: "water_drop" },
      { label: "Material", value: "100% Mulberry Silk", icon: "eco" },
      { label: "Transparency", value: "Fully Opaque Lining", icon: "visibility_off" },
    ],
    expert: {
      name: "Amina Al-Fayed",
      role: "Senior Stylist, Modest Fashion Week",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvZLFUvZEn_v3rrR8IrDKqKTw3QEJ29Lm-rkUFhp8Yvp5kFH-UM8LJ9vqaDM9qZYUoFrrauoHpF2u5-_HgNH8S6bBK-PEAtWByrpEPvL1GEBH0nq92ZJrfZq8EsTIcQhHNUpsmIELDWwGIw-reh6VzEangc02IUu3A2KfVk6zI-jx0TNSG9CX9e9O_jKknPXc7e0JvKwh4jk_6zX4idRMbgygGU1xTuc6lz_uuhojytZ3gEidJhzldHzu50p8WI0nUFnRtAJ1XefKB",
      quote: "Finding a garment that balances high-fashion aesthetics with the strict requirements of modesty is rare. Nur & Nature has perfected the silhouette for the modern worshipper.",
    },
    reviews: [
      { name: "Sarah K.", text: "The most comfortable abaya I've ever owned. The silk is so soft against the skin." },
      { name: "Maryam J.", text: "Beautiful drape and very practical for daily wear. Truly modest and elegant." }
    ],
    waText: "Hello, I would like to order the Breathable Silk Abaya.",
  },
  {
    id: "pure-yemeni-sidr-honey",
    name: "Pure Yemeni Sidr Honey",
    price: "Rp 485.000",
    originalPrice: "Rp 550.000",
    category: "wellness",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCROwfD-a15c10wpRmJoNsh-qKZMpmMkYWfffQ6JJiJLrjgsMjOd5dEUJcg_1vTkFSkzG51EoyIwkM-ZU24J4zeI3996LNcB4wpWYKo9HnwFmiJiPPqKpiXWvYRJ9YWBFuqfHEIzLKzAYz0sxMAc_Hc6d4l4cSowLj3NLoU0sHgxMDvDY1KqX3pOBrXE9HHwU1r1pBGKs0LjFRuB788bYrbYkvJVuzA7JopZhPWxPEEU-QB8ECiNYYt4sCqsSNlaTR--zOKCgyLYyd1"],
    desc: "Sourced from the sacred Sidr trees of Yemen, our honey is unfiltered, cold-pressed, and maintains its potent medicinal properties. A rare nectar known for its exceptional healing and immunity-boosting capabilities.",
    purityInfo: {
      ingredients: "100% Raw, unheated, and unfiltered honey. No additives, syrups, or preservatives ever added.",
      certification: "Strictly sourced according to ethical Halal standards, ensuring integrity from hive to home.",
      testing: "Each batch undergoes rigorous independent lab testing for pollen count and antioxidant levels.",
      dosage: "1-2 spoons daily, preferably on an empty stomach.",
      benefit: "Powerful immune system support & natural energy.",
      storage: "Store in a cool, dry place away from direct sunlight.",
      culinary: "Best enjoyed raw or mixed into warm (not hot) water.",
      videoThumb: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmLtX6RRlKonZAipd5FY69vR4R5zKpiHN4jRggzs4q6RfA6t3kWK_1iFBKX3HpikHWQzlHCkpluxvby9sLst7FLeMEAGPpjS2fk5CxgbNXiDUxJwHFcAoxlHvnNqWgJxi7BgT0oIfvbMePpP1Aaj-PVMhxZ0_j7-nLb4RfLBZy0jtQ6077881IHR567IhVb8Jg_thWKMrTA-Ur57FWf-zMKn_ubHZ58N03oLSNqp2B9Jvfi9KwR_ayvggA6c_JWXrFXq8H10nHbySm"
    },
    technical: [
      { label: "Dosage", value: "1-2 spoons daily", icon: "medication" },
      { label: "Benefits", value: "Immune Support", icon: "health_and_safety" },
      { label: "Storage", value: "Cool & Dry Place", icon: "inventory_2" },
      { label: "Culinary Use", value: "Best enjoyed raw", icon: "restaurant" },
    ],
    expert: {
      name: "Dr. Sarah Mansour",
      role: "Clinical Nutritionist",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD65gplpbd0aKXySZfNIxUNVSkCgjzYXHgwhGQYZAcxBTp4j8pNnZjy65lpLSfPx8glXiKUmq2zzCcuTabKksbSvvgUrmdkV88nt9hSz4VnOg6A6p8gbiIxDRKBiXd06TLUUlMFAku2HzttPO8l2-8T7OA7AefliXLNZKhtczqFnFqzFdnH5LQGcx4S3KiA-7ryCfjDvheHPPPQPELwH93Ly0vd8iQ96GJL54mOiWzn_0aewHUhyo15UcIX6pcJUigdWZxK1aTemHq2",
      quote: "The purity of this Sidr honey is unparalleled. Its high enzyme content and antimicrobial properties make it a staple recommendation for my patients seeking natural immune support.",
    },
    reviews: [
      { name: "Ahmed Rizwan", text: "I have tried many brands, but the taste and texture of Nur & Nature's honey are truly authentic." },
      { name: "Layla Hasan", text: "Remarkable quality! I use it daily in my morning tea. I've noticed a significant improvement in my digestive health." }
    ],
    waText: "Hello, I would like to order the Pure Yemeni Sidr Honey.",
  },
];

// ─── Shared Styles ───────────────────────────────────────────────
const COLORS = {
  primary: "#4a654f",
  secondary: "#924b25",
  onSurface: "#1b1c1c",
  onSurfaceVariant: "#424842",
};

// ─── Components ──────────────────────────────────────────────────

const HeroSection = (props: { product: Product; onBuy: () => void }) => (
  <section class="bg-white">
    <div class="container py-12 lg:py-24">
      <Switch>
        {/* Fashion Hero Layout */}
        <Match when={props.product.category === "fashion"}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
            <div class="grid grid-cols-2 gap-2">
              <div class="col-span-2 aspect-[4/5] bg-[#f0eded] overflow-hidden rounded-2xl shadow-sm">
                <img src={props.product.images[0]} alt={props.product.name} class="w-full h-full object-cover" />
              </div>
              <For each={props.product.images.slice(1, 3)}>
                {(img) => (
                  <div class="aspect-square bg-[#f0eded] overflow-hidden rounded-xl shadow-sm">
                    <img src={img} alt="Product Detail" class="w-full h-full object-cover" />
                  </div>
                )}
              </For>
            </div>
            <div class="flex flex-col justify-center space-y-8">
              <div class="space-y-4">
                <span class="text-xs font-bold uppercase tracking-[0.2em] text-[#4a654f]">Ethical Collection</span>
                <h1 class="font-serif text-4xl lg:text-6xl font-medium text-[#1b1c1c] leading-tight">{props.product.name}</h1>
                <p class="text-3xl font-semibold text-[#924b25]">{props.product.price}</p>
              </div>
              <p class="text-lg text-[#424842] leading-relaxed">{props.product.desc}</p>
              
              <div class="space-y-4">
                <div class="flex items-center space-x-3">
                  <span class="w-8 h-8 rounded-full bg-[#4a654f] border-2 border-[#e4e2e1]"></span>
                  <span class="w-8 h-8 rounded-full bg-[#D4C5B9] border-2 border-transparent"></span>
                  <span class="w-8 h-8 rounded-full bg-[#303030] border-2 border-transparent"></span>
                  <span class="text-sm font-medium text-[#424842] ml-2">Sage Green</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <For each={["S", "M", "L", "XL"]}>
                    {(size) => (
                      <button class={`px-6 py-2 border rounded-lg text-sm font-semibold transition-colors ${size === "M" ? "border-2 border-[#4a654f] text-[#4a654f]" : "border-[#737972] hover:border-[#4a654f]"}`}>
                        {size}
                      </button>
                    )}
                  </For>
                </div>
              </div>

              <div class="space-y-4 pt-4">
                <button onClick={props.onBuy} class="w-full bg-[#4a654f] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-3">
                  <span class="material-symbols-outlined">shopping_bag</span>
                  Add to Cart
                </button>
                <a href={`https://wa.me/6281234567890?text=${encodeURIComponent(props.product.waText)}`} target="_blank" class="w-full border-2 border-[#25D366] text-[#25D366] font-bold py-4 rounded-xl hover:bg-[#25D366]/5 transition-all flex items-center justify-center gap-3">
                  <span class="material-symbols-outlined">chat</span>
                  Pesan via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Match>

        {/* Wellness Hero Layout */}
        <Match when={props.product.category === "wellness"}>
          <div class="flex flex-col md:flex-row items-stretch gap-12 lg:gap-24">
            <div class="md:w-1/2 bg-white flex items-center justify-center relative overflow-hidden rounded-2xl shadow-lg border border-[#f0eded]">
              <div class="absolute inset-0 bg-[#4a654f]/5"></div>
              <img src={props.product.images[0]} alt={props.product.name} class="w-full h-full object-cover relative z-10" />
            </div>
            <div class="md:w-1/2 flex flex-col justify-center">
              <nav class="flex gap-2 mb-4 text-[#737972] text-xs font-bold uppercase tracking-widest">
                <span>Wellness</span> / <span>Premium Honey</span>
              </nav>
              <h1 class="font-serif text-4xl lg:text-6xl text-[#4a654f] mb-4 leading-tight">{props.product.name}</h1>
              <div class="flex items-center gap-2 mb-6">
                <div class="flex text-[#924b25]">
                  <For each={[1, 2, 3, 4, 5]}>
                    {() => <span class="material-symbols-outlined text-[18px]">star</span>}
                  </For>
                </div>
                <span class="text-[#424842] text-xs font-medium">(48 Reviews)</span>
              </div>
              <p class="text-lg text-[#424842] mb-8 leading-relaxed">{props.product.desc}</p>
              <div class="mb-10">
                <span class="text-3xl font-bold text-[#4a654f]">{props.product.price}</span>
                <Show when={props.product.originalPrice}>
                  <span class="ml-3 text-[#737972] text-lg line-through">{props.product.originalPrice}</span>
                </Show>
                <div class="mt-3 bg-[#4a654f]/10 text-[#4a654f] px-4 py-1 rounded-full inline-block text-xs font-bold">
                  Halal Certified Quality
                </div>
              </div>
              <div class="flex flex-col sm:flex-row gap-4">
                <a href={`https://wa.me/6281234567890?text=${encodeURIComponent(props.product.waText)}`} target="_blank" class="flex-1 bg-[#924b25] text-white px-8 py-4 rounded-full font-bold text-center hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined">chat</span>
                  WhatsApp
                </a>
                <button onClick={props.onBuy} class="flex-1 border-2 border-[#4a654f] text-[#4a654f] px-8 py-4 rounded-full font-bold hover:bg-[#4a654f]/5 transition-all">
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </Match>
      </Switch>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────

const PurityBlock = (props: { info: NonNullable<Product["purityInfo"]> }) => {
  const items = [
    { icon: "eco", title: "Natural Ingredients", body: props.info.ingredients },
    { icon: "verified_user", title: "Halal Certified", body: props.info.certification },
    { icon: "biotech", title: "Lab Tested", body: props.info.testing },
  ];

  return (
    <section class="bg-white py-20 lg:py-32">
      <div class="container">
        <div class="text-center mb-16">
          <h2 class="font-serif text-3xl lg:text-4xl text-[#4a654f] mb-4">Our Purity Promise</h2>
          <div class="w-16 h-1 bg-[#924b25] mx-auto rounded-full"></div>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <For each={items}>
            {(item) => (
              <div class="bg-[#4a654f]/5 p-10 lg:p-12 rounded-2xl border border-[#4a654f]/10 flex flex-col items-center text-center hover:shadow-xl transition-all">
                <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <span class="material-symbols-outlined text-[#4a654f] text-3xl">{item.icon}</span>
                </div>
                <h3 class="font-serif text-xl font-semibold text-[#4a654f] mb-4">{item.title}</h3>
                <p class="text-[#424842] leading-relaxed">{item.body}</p>
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
  <section class="relative h-[600px] flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0 bg-fixed bg-center bg-cover" style={{ "background-image": `url(${props.info.parallaxImg})` }}></div>
    <div class="absolute inset-0 bg-black/25"></div>
    <div class="relative z-10 text-center px-4 max-w-2xl">
      <h2 class="font-serif text-4xl lg:text-6xl text-white mb-6">Modesty in Motion</h2>
      <p class="text-lg lg:text-xl text-white/90 leading-relaxed font-light">{props.info.feel}</p>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────

const TechnicalDetailGrid = (props: { product: Product }) => {
  const isWellness = props.product.category === "wellness";
  
  return (
    <section class="bg-[#f6f3f2] py-20 lg:py-32">
      <div class="container">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 class="font-serif text-3xl lg:text-4xl text-[#4a654f] mb-10">{isWellness ? "Wellness Specifications" : "Technical Artistry"}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <For each={props.product.technical}>
                {(detail) => (
                  <div class="flex gap-4">
                    <div class="bg-[#4a654f]/10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-[#4a654f]">{detail.icon}</span>
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-[#1b1c1c] mb-1">{detail.label}</h4>
                      <p class="text-sm text-[#424842] leading-relaxed">{detail.value}</p>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
          <div class="relative rounded-2xl overflow-hidden aspect-video shadow-2xl">
             <img src={isWellness ? props.product.purityInfo?.videoThumb : props.product.eleganceInfo?.parallaxImg} class="w-full h-full object-cover" alt="Detail Image" />
             <div class="absolute inset-0 bg-black/10 flex items-center justify-center">
                <button class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                   <span class="material-symbols-outlined text-[#4a654f] text-4xl translate-x-0.5">play_arrow</span>
                </button>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────

const TrustBlock = (props: { product: Product }) => (
  <section class="py-20 lg:py-32">
    <div class="container">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-8">
          <span class="text-xs font-bold text-[#924b25] uppercase tracking-widest">Voices of Excellence</span>
          <h2 class="font-serif text-3xl lg:text-4xl text-[#1b1c1c]">Curated by Experts, Loved by the Community</h2>
          
          <div class="bg-[#f0eded] p-8 lg:p-10 rounded-2xl border-l-4 border-[#4a654f] space-y-6">
            <p class="font-serif text-xl lg:text-2xl italic text-[#1b1c1c] leading-relaxed">"{props.product.expert.quote}"</p>
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full overflow-hidden shadow-sm">
                <img src={props.product.expert.image} class="w-full h-full object-cover" alt={props.product.expert.name} />
              </div>
              <div>
                <p class="text-sm font-bold text-[#1b1c1c]">{props.product.expert.name}</p>
                <p class="text-xs text-[#424842]">{props.product.expert.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-6">
          <For each={props.product.reviews}>
            {(review) => (
              <div class="bg-white p-8 rounded-2xl shadow-sm border border-[#737972]/10 space-y-4">
                <div class="flex text-[#924b25]">
                  <For each={[1, 2, 3, 4, 5]}>
                    {() => <span class="material-symbols-outlined text-[18px]">star</span>}
                  </For>
                </div>
                <p class="text-[#424842] italic">"{review.text}"</p>
                <p class="text-sm font-bold text-[#1b1c1c]">— {review.name}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────

const CheckoutModal = (props: { product: Product; onClose: () => void }) => (
  <div class="fixed inset-0 z-[300] flex items-center justify-center p-6">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={props.onClose}></div>
    <div class="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-10 border border-[#f0eded]">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-xl font-bold text-[#1b1c1c]">Opsi Pembelian</h3>
        <button onClick={props.onClose} class="text-[#737972] hover:text-[#1b1c1c]">✕</button>
      </div>

      <div class="space-y-4">
        <a href="/cart" class="flex items-center p-6 rounded-xl border border-[#f0eded] hover:bg-[#f6f3f2] transition-all group gap-4">
          <div class="w-12 h-12 bg-[#4a654f] text-white rounded-xl flex items-center justify-center text-xl shadow-md">🛍️</div>
          <div>
            <p class="font-bold text-[#1b1c1c]">Order via Website</p>
            <p class="text-xs text-[#737972]">Cepat, aman & otomatis</p>
          </div>
          <span class="ml-auto text-[#f0eded] group-hover:text-[#4a654f] transition-all">→</span>
        </a>

        <a href={`https://wa.me/6281234567890?text=${encodeURIComponent(props.product.waText)}`} target="_blank" class="flex items-center p-6 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-all group gap-4">
          <div class="w-12 h-12 bg-[#25D366] text-white rounded-xl flex items-center justify-center text-xl shadow-md">💬</div>
          <div>
            <p class="font-bold text-[#25D366]">Order via WhatsApp</p>
            <p class="text-xs text-[#25D366]/70">Bantuan personal & konsultasi</p>
          </div>
          <span class="ml-auto text-[#25D366]/30 group-hover:text-[#25D366] transition-all">→</span>
        </a>
      </div>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────

export default function ProductDetail() {
  const params = useParams();
  const product = products.find((p) => p.id === params.id) || products[0];
  const [showModal, setShowModal] = createSignal(false);

  return (
    <div class="min-h-screen bg-white">
      <Navbar />

      <main class={product.category === "wellness" ? "pattern-bg" : ""}>
        <HeroSection product={product} onBuy={() => setShowModal(true)} />

        <Switch>
          <Match when={product.category === "wellness" && product.purityInfo}>
            <PurityBlock info={product.purityInfo!} />
          </Match>
          <Match when={product.category === "fashion" && product.eleganceInfo}>
            <ParallaxShowcase info={product.eleganceInfo!} />
          </Match>
        </Switch>

        <TechnicalDetailGrid product={product} />
        <TrustBlock product={product} />
      </main>

      <Footer />

      <Show when={showModal()}>
        <CheckoutModal product={product} onClose={() => setShowModal(false)} />
      </Show>
    </div>
  );
}