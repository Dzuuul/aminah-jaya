import { createSignal, onMount, For, Show } from "solid-js";
import type { JSX } from "solid-js";
import { Title, Link, Meta } from "@solidjs/meta";
import "./milkmee.css";

const WA_NUMBER = "6285163616363"; // GANTI dengan nomor WhatsApp asli, format 62xxxxxxxxxx
const WA_MESSAGE =
  "Halo, saya lihat iklan Laili Milkmee. Boleh minta info harga & pengirimannya?";
const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

const PRODUCT_PRICE = 175000;
const PRODUCT_OLD_PRICE = 200000;
const PRODUCT_NAME = "Laili Milkmee — Susu Kambing Kolostrum 600gr";

/* ---- Meta Pixel ----
   Isi PIXEL_ID dengan ID pixel dari Meta Events Manager (contoh: "1234567890").
   Selama kosong, tidak ada script yang dimuat. */
const PIXEL_ID = "";

type FbqFn = (...args: unknown[]) => void;

const fbTrack = (event: string, params?: Record<string, unknown>): void => {
  const fbq = (window as unknown as { fbq?: FbqFn }).fbq;
  if (fbq) fbq("track", event, params);
};

interface FbqStub {
  (...args: unknown[]): void;
  callMethod?: FbqFn;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: unknown;
}

const loadPixel = (): void => {
  if (!PIXEL_ID) return;
  const w = window as unknown as Record<string, unknown>;
  if (w.fbq) return;

  /* Padanan snippet resmi Meta Pixel: antrean sementara sampai fbevents.js siap */
  const stub = ((...args: unknown[]): void => {
    if (stub.callMethod) stub.callMethod(...args);
    else stub.queue.push(args);
  }) as FbqStub;
  stub.queue = [];
  stub.loaded = true;
  stub.version = "2.0";
  stub.push = stub;

  w.fbq = stub;
  w._fbq = stub;

  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);

  stub("init", PIXEL_ID);
  stub("track", "PageView");
};

/* ---- Types ---- */
interface FormData {
  name: string;
  phone: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  address: string;
  landmark: string;
  quantity: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  provinceId?: string;
  cityId?: string;
  address?: string;
  quantity?: string;
}

interface WilayahOption {
  code: string;
  name: string;
}

interface FaqItem {
  q: string;
  a: string;
}

const emptyForm = (): FormData => ({
  name: "",
  phone: "",
  provinceId: "",
  provinceName: "",
  cityId: "",
  cityName: "",
  address: "",
  landmark: "",
  quantity: "1",
  notes: "",
});

const parseQty = (value: string): number => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
};

/* ---- Generate WA message dari form order ---- */
const generateOrderMessage = (formData: FormData): string => {
  const {
    name,
    phone,
    provinceName,
    cityName,
    address,
    landmark,
    quantity,
    notes,
  } = formData;
  const qty = parseQty(quantity);
  const total = PRODUCT_PRICE * qty;

  const alamatBlok = address
    ? `\n*Alamat Pengiriman:*\n${address}${landmark ? `\nPatokan: ${landmark}` : ""}${cityName ? `\nKota/Kabupaten: ${cityName}` : ""}${provinceName ? `\nProvinsi: ${provinceName}` : ""}\n`
    : "\n_(Alamat pengiriman menyusul via chat)_\n";

  return `Halo, saya mau pesan Laili Milkmee.

*Data Pemesan:*
Nama: ${name}
No. WhatsApp: ${phone}
${alamatBlok}
*Detail Pesanan:*
Produk: ${PRODUCT_NAME}
Jumlah: ${qty} box
Harga satuan: Rp ${PRODUCT_PRICE.toLocaleString("id-ID")}
Total: Rp ${total.toLocaleString("id-ID")}
${notes ? `\n*Catatan:* ${notes}\n` : ""}
Mohon konfirmasi stok & ongkos kirimnya ya. Terima kasih!`;
};

/* ---- Icon helpers ---- */
const IconCheck = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
    <path d="M5 12l4 4L19 6" />
  </svg>
);
const IconX = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const IconPlus = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconWA = (): JSX.Element => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    class="bi bi-whatsapp"
    viewBox="0 0 16 16"
  >
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
  </svg>
);
const IconSun = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </svg>
);
const IconMoon = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
  </svg>
);
const IconHeart = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
  </svg>
);
const IconUsers = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
    <circle cx="17.5" cy="9" r="2.4" />
    <path d="M15 14.3c2.6.5 4.5 2.4 5.5 5.7" />
  </svg>
);
const IconShield = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 3 4 6.5v5c0 5 3.4 8.9 8 10.5 4.6-1.6 8-5.5 8-10.5v-5L12 3Z" />
    <path d="M9 12.2l2 2 4-4.4" />
  </svg>
);
const IconCapsule = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect
      x="2.5"
      y="8"
      width="19"
      height="8"
      rx="4"
      transform="rotate(-30 12 12)"
    />
    <path d="M11 7.6 13 16.4" />
  </svg>
);
const IconBox = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </svg>
);
const IconTruck = (): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
    <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);
const IconChat = (): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z" />
  </svg>
);

/* ---- Konten data ---- */
const painPoints: string[] = [
  "Jadwal padat, makan sering asal kenyang",
  "Anak susah makan sayur & buah",
  "Musim pancaroba, satu rumah gantian kurang fit",
  "Orang tua butuh nutrisi yang lembut di perut",
];

interface Ingredient {
  name: string;
  desc: string;
}

const ingredients: Ingredient[] = [
  {
    name: "Kolostrum",
    desc: "Susu pertama yang dikenal sebagai sumber alami imunoglobulin (IgG) dan growth factor.",
  },
  {
    name: "Susu kambing",
    desc: "Sumber protein dan kalsium dengan butiran lemak lebih kecil, umumnya terasa lebih ringan di perut.",
  },
  {
    name: "Madu murni",
    desc: "Pemanis alami, jadi tidak perlu tambahan gula pasir di dalam formulanya.",
  },
  {
    name: "Daun kelor",
    desc: "Superfood lokal yang dikenal kaya vitamin, mineral, dan antioksidan alami.",
  },
];

const faqData: FaqItem[] = [
  {
    q: "Harganya berapa dan sudah termasuk ongkir?",
    a: `Rp ${PRODUCT_PRICE.toLocaleString("id-ID")} per box isi 600gr (harga promo dari Rp ${PRODUCT_OLD_PRICE.toLocaleString("id-ID")}). Ongkir dihitung terpisah sesuai alamat dan ekspedisi pilihan Anda — admin akan info totalnya saat konfirmasi di WhatsApp.`,
  },
  {
    q: "Bisa bayar di tempat (COD)?",
    a: "Bisa transfer bank/e-wallet, dan COD tersedia untuk sebagian wilayah. Sampaikan preferensi Anda ke admin saat konfirmasi pesanan.",
  },
  {
    q: "Berapa lama pengirimannya?",
    a: "Pesanan yang dikonfirmasi sebelum jam 15.00 dikirim di hari yang sama. Estimasi tiba 1–4 hari kerja tergantung lokasi dan ekspedisi. Nomor resi dikirim ke WhatsApp Anda.",
  },
  {
    q: "Rasanya seperti apa? Apa amis khas susu kambing?",
    a: "Rasanya susu gurih dengan manis alami dari madu, dan tidak bergula pasir. Aroma khas susu kambing sudah jauh berkurang, jadi umumnya tetap enak diminum anak-anak.",
  },
  {
    q: "Umur berapa saja yang boleh minum?",
    a: "Ramah dikonsumsi mulai usia 2 tahun sampai lansia. Untuk kondisi kesehatan tertentu, kehamilan, atau menyusui, konsultasikan dulu dengan dokter atau tenaga kesehatan.",
  },
  {
    q: "Boleh diminum bersama obat?",
    a: "Sebaiknya beri jeda 1–2 jam antara Laili Milkmee dan obat, agar penyerapan nutrisi maupun obat berjalan optimal. Untuk pengobatan rutin, tanyakan dulu ke dokter Anda.",
  },
  {
    q: "1 box cukup untuk berapa lama?",
    a: "Dengan takaran 2–3 sendok makan per gelas dan konsumsi 2x sehari, satu box 600gr umumnya cukup untuk sekitar 2 minggu pemakaian satu orang.",
  },
  {
    q: "Dijamin asli?",
    a: "Ya. Kami reseller resmi dan produk dikirim dalam kemasan bersegel. Kalau segel rusak atau produk tidak sesuai saat diterima, laporkan dengan video unboxing dan akan kami ganti.",
  },
];

/* ---- FAQ Item Component ---- */
interface FaqItemProps {
  q: string;
  a: string;
}

function FaqItem(props: FaqItemProps): JSX.Element {
  const [open, setOpen] = createSignal<boolean>(false);

  const toggle = (): void => {
    setOpen((v) => !v);
  };

  return (
    <div class="mm-faq-item" classList={{ open: open() }}>
      <button class="mm-faq-q" onClick={toggle} aria-expanded={open()}>
        {props.q}
        <IconPlus />
      </button>
      <div class="mm-faq-a" style={{ "max-height": open() ? "320px" : "0" }}>
        <p>{props.a}</p>
      </div>
    </div>
  );
}

/* ---- Countdown Component ----
   Dihitung sampai jam 00.00 hari ini, jadi angkanya konsisten
   untuk semua pengunjung (bukan timer palsu yang reset tiap reload). */
function Countdown(): JSX.Element {
  const [h, setH] = createSignal<string>("00");
  const [m, setM] = createSignal<string>("00");
  const [s, setS] = createSignal<string>("00");

  onMount((): (() => void) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const tick = (): void => {
      const diff = Math.max(0, end.getTime() - Date.now());
      setH(String(Math.floor(diff / 3600000)).padStart(2, "0"));
      setM(String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"));
      setS(String(Math.floor((diff % 60000) / 1000)).padStart(2, "0"));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  });

  return (
    <div class="mm-countdown">
      <div class="mm-cd-box">
        <div class="mm-num">{h()}</div>
        <div class="mm-lbl">Jam</div>
      </div>
      <div class="mm-cd-box">
        <div class="mm-num">{m()}</div>
        <div class="mm-lbl">Menit</div>
      </div>
      <div class="mm-cd-box">
        <div class="mm-num">{s()}</div>
        <div class="mm-lbl">Detik</div>
      </div>
    </div>
  );
}

/* ---- Order Form Component ---- */
function OrderForm(): JSX.Element {
  const [formData, setFormData] = createSignal<FormData>(emptyForm());
  const [errors, setErrors] = createSignal<FormErrors>({});
  const [submitted, setSubmitted] = createSignal<boolean>(false);
  const [showAddress, setShowAddress] = createSignal<boolean>(false);

  const [provinces, setProvinces] = createSignal<WilayahOption[]>([]);
  const [cities, setCities] = createSignal<WilayahOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = createSignal<boolean>(false);
  const [loadingCities, setLoadingCities] = createSignal<boolean>(false);

  /* Daftar provinsi baru diambil saat pengguna benar-benar membuka
       bagian alamat — halaman jadi lebih ringan untuk trafik iklan. */
  const ensureProvinces = async (): Promise<void> => {
    if (provinces().length > 0 || loadingProvinces()) return;
    setLoadingProvinces(true);
    try {
      const res = await fetch("/api/wilayah/provinces");
      const json: { data: { code: string; name: string }[] } = await res.json();
      setProvinces(json.data.map((p) => ({ code: p.code, name: p.name })));
    } catch {
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const toggleAddress = (): void => {
    const next = !showAddress();
    setShowAddress(next);
    if (next) void ensureProvinces();
  };

  const handleProvinceChange = async (e: Event): Promise<void> => {
    const target = e.target as HTMLSelectElement;
    const provinceId = target.value;
    const provinceName = target.options[target.selectedIndex]?.text ?? "";

    setFormData((prev) => ({
      ...prev,
      provinceId,
      provinceName,
      cityId: "",
      cityName: "",
    }));
    setCities([]);
    setErrors((prev) => ({ ...prev, provinceId: undefined }));

    if (!provinceId) return;

    setLoadingCities(true);
    try {
      const res = await fetch(`/api/wilayah/regencies/${provinceId}`);
      const json: { data: { code: string; name: string }[] } = await res.json();
      setCities(json.data.map((c) => ({ code: c.code, name: c.name.trim() })));
    } catch {
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCityChange = (e: Event): void => {
    const target = e.target as HTMLSelectElement;
    const cityId = target.value;
    const cityName = target.options[target.selectedIndex]?.text ?? "";
    setFormData((prev) => ({ ...prev, cityId, cityName }));
    setErrors((prev) => ({ ...prev, cityId: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const data = formData();
    const digits = data.phone.replace(/\D/g, "");

    if (!data.name.trim()) {
      newErrors.name = "Nama harus diisi";
    }
    if (!digits) {
      newErrors.phone = "Nomor WhatsApp harus diisi";
    } else if (!/^(0|62)[0-9]{8,13}$/.test(digits)) {
      newErrors.phone = "Format nomor tidak valid, contoh: 081234567890";
    }
    if (
      parseInt(data.quantity, 10) < 1 ||
      Number.isNaN(parseInt(data.quantity, 10))
    ) {
      newErrors.quantity = "Jumlah minimal 1 box";
    }

    /* Alamat hanya wajib kalau pengguna memilih mengisinya sekarang */
    if (showAddress()) {
      if (!data.provinceId) newErrors.provinceId = "Pilih provinsi";
      if (!data.cityId) newErrors.cityId = "Pilih kota/kabupaten";
      if (!data.address.trim())
        newErrors.address = "Alamat lengkap harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: Event): void => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value } = target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors()[name as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        return next;
      });
    }
  };

  const setQty = (delta: number): void => {
    setFormData((prev) => ({
      ...prev,
      quantity: String(
        Math.min(99, Math.max(1, parseQty(prev.quantity) + delta)),
      ),
    }));
  };

  const handleSubmit = (e: Event): void => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = formData();
    const qty = parseQty(data.quantity);

    fbTrack("Lead", {
      content_name: PRODUCT_NAME,
      content_type: "product",
      value: PRODUCT_PRICE * qty,
      currency: "IDR",
      num_items: qty,
    });

    const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(generateOrderMessage(data))}`;
    window.open(whatsappUrl, "_blank");
    setSubmitted(true);

    setTimeout(() => {
      setFormData(emptyForm());
      setCities([]);
      setShowAddress(false);
      setSubmitted(false);
    }, 4000);
  };

  const total = (): number => PRODUCT_PRICE * parseQty(formData().quantity);

  return (
    <div class="mm-form-container">
      <div class="mm-form-card">
        <h3 class="mm-form-title">Form pesanan — 30 detik selesai</h3>
        <p class="mm-form-desc">
          Cukup isi nama, nomor WhatsApp, dan jumlah box. Detail alamat serta
          ongkir bisa dibereskan langsung di chat bersama admin kami.
        </p>

        <form onSubmit={handleSubmit} class="mm-form">
          {/* Nama */}
          <div class="mm-form-group">
            <label for="name" class="mm-form-label">
              Nama Lengkap *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData().name}
              onInput={handleChange}
              placeholder="Contoh: Budi Santoso"
              class={`mm-form-input ${errors().name ? "error" : ""}`}
            />
            {errors().name && (
              <span class="mm-form-error">{errors().name}</span>
            )}
          </div>

          {/* Nomor HP */}
          <div class="mm-form-group">
            <label for="phone" class="mm-form-label">
              Nomor WhatsApp Aktif *
            </label>
            <input
              type="tel"
              inputmode="numeric"
              id="phone"
              name="phone"
              value={formData().phone}
              onInput={handleChange}
              placeholder="Contoh: 081234567890"
              class={`mm-form-input ${errors().phone ? "error" : ""}`}
            />
            {errors().phone && (
              <span class="mm-form-error">{errors().phone}</span>
            )}
            <span class="mm-form-hint">
              Dipakai admin untuk konfirmasi stok &amp; ongkir.
            </span>
          </div>

          {/* Jumlah */}
          <div class="mm-form-group">
            <label for="quantity" class="mm-form-label">
              Jumlah Box *
            </label>
            <div class="mm-quantity-control">
              <button
                type="button"
                class="mm-qty-btn"
                aria-label="Kurangi"
                onClick={() => setQty(-1)}
              >
                −
              </button>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData().quantity}
                onInput={handleChange}
                min="1"
                max="99"
                class={`mm-form-input mm-qty-input ${errors().quantity ? "error" : ""}`}
              />
              <button
                type="button"
                class="mm-qty-btn"
                aria-label="Tambah"
                onClick={() => setQty(1)}
              >
                +
              </button>
            </div>
            {errors().quantity && (
              <span class="mm-form-error">{errors().quantity}</span>
            )}
          </div>

          {/* Toggle alamat */}
          <button
            type="button"
            class="mm-form-toggle"
            onClick={toggleAddress}
            aria-expanded={showAddress()}
          >
            <span>
              {showAddress()
                ? "Sembunyikan alamat pengiriman"
                : "Isi alamat sekarang (opsional, proses lebih cepat)"}
            </span>
            <span class="mm-form-toggle-sign">{showAddress() ? "−" : "+"}</span>
          </button>

          <Show when={showAddress()}>
            <div class="mm-form-extra">
              {/* Provinsi */}
              <div class="mm-form-group">
                <label for="provinceId" class="mm-form-label">
                  Provinsi *
                </label>
                <select
                  id="provinceId"
                  name="provinceId"
                  value={formData().provinceId}
                  onChange={handleProvinceChange}
                  class={`mm-form-input ${errors().provinceId ? "error" : ""}`}
                  disabled={loadingProvinces()}
                >
                  <option value="">
                    {loadingProvinces()
                      ? "Memuat provinsi..."
                      : "Pilih provinsi"}
                  </option>
                  <For each={provinces()}>
                    {(p) => <option value={p.code}>{p.name}</option>}
                  </For>
                </select>
                {errors().provinceId && (
                  <span class="mm-form-error">{errors().provinceId}</span>
                )}
              </div>

              {/* Kota/Kabupaten */}
              <div class="mm-form-group">
                <label for="cityId" class="mm-form-label">
                  Kota/Kabupaten *
                </label>
                <select
                  id="cityId"
                  name="cityId"
                  value={formData().cityId}
                  onChange={handleCityChange}
                  class={`mm-form-input ${errors().cityId ? "error" : ""}`}
                  disabled={!formData().provinceId || loadingCities()}
                >
                  <option value="">
                    {loadingCities()
                      ? "Memuat kota/kabupaten..."
                      : formData().provinceId
                        ? "Pilih kota/kabupaten"
                        : "Pilih provinsi dulu"}
                  </option>
                  <For each={cities()}>
                    {(c) => <option value={c.code}>{c.name}</option>}
                  </For>
                </select>
                {errors().cityId && (
                  <span class="mm-form-error">{errors().cityId}</span>
                )}
              </div>

              {/* Alamat Lengkap */}
              <div class="mm-form-group">
                <label for="address" class="mm-form-label">
                  Alamat Lengkap *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData().address}
                  onInput={handleChange}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, kode pos"
                  class={`mm-form-textarea ${errors().address ? "error" : ""}`}
                  rows="3"
                />
                {errors().address && (
                  <span class="mm-form-error">{errors().address}</span>
                )}
              </div>

              {/* Patokan */}
              <div class="mm-form-group">
                <label for="landmark" class="mm-form-label">
                  Patokan (Opsional)
                </label>
                <input
                  type="text"
                  id="landmark"
                  name="landmark"
                  value={formData().landmark}
                  onInput={handleChange}
                  placeholder="Contoh: sebelah Indomaret, pagar hijau"
                  class="mm-form-input"
                />
              </div>

              {/* Catatan */}
              <div class="mm-form-group">
                <label for="notes" class="mm-form-label">
                  Catatan (Opsional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData().notes}
                  onInput={handleChange}
                  placeholder="Contoh: hindari pengiriman malam hari"
                  class="mm-form-textarea"
                  rows="2"
                />
              </div>
            </div>
          </Show>

          {/* Price Summary */}
          <div class="mm-form-summary">
            <div class="mm-summary-row">
              <span>Harga satuan</span>
              <span>Rp {PRODUCT_PRICE.toLocaleString("id-ID")}</span>
            </div>
            <div class="mm-summary-row">
              <span>Jumlah</span>
              <span>{parseQty(formData().quantity)} box</span>
            </div>
            <div class="mm-summary-row">
              <span>Ongkos kirim</span>
              <span>Dihitung di chat</span>
            </div>
            <div class="mm-summary-divider" />
            <div class="mm-summary-row mm-summary-total">
              <span>Total produk</span>
              <span>Rp {total().toLocaleString("id-ID")}</span>
            </div>
          </div>

          <Show when={submitted()}>
            <div class="mm-success-message">
              ✓ Pesanan Anda sedang dibuka di WhatsApp. Kalau tab-nya tidak
              muncul, klik tombol di bawah sekali lagi.
            </div>
          </Show>

          <button type="submit" class="mm-form-submit">
            <IconWA />
            Pesan Sekarang via WhatsApp
          </button>
        </form>

        <p class="mm-form-footer">
          🔒 Data Anda hanya dipakai untuk memproses pesanan ini. Tidak ada
          pembayaran di halaman ini — semua konfirmasi dilakukan lewat WhatsApp.
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */
export default function MilkmeeLandingPage(): JSX.Element {
  const discount = Math.round(
    ((PRODUCT_OLD_PRICE - PRODUCT_PRICE) / PRODUCT_OLD_PRICE) * 100,
  );

  onMount(() => {
    loadPixel();
    fbTrack("ViewContent", {
      content_name: PRODUCT_NAME,
      content_type: "product",
      value: PRODUCT_PRICE,
      currency: "IDR",
    });
  });

  const onWaClick = (): void => {
    fbTrack("Contact", { content_name: PRODUCT_NAME });
  };

  return (
    <>
      <Title>
        Laili Milkmee — Susu Kambing Kolostrum, Madu &amp; Daun Kelor 600gr
      </Title>
      <Meta
        name="description"
        content={`Susu kambing kolostrum dengan madu murni dan daun kelor, 600gr. Tanpa gula tambahan, bisa diminum satu keluarga dari usia 2 tahun. Harga promo Rp ${PRODUCT_PRICE.toLocaleString("id-ID")}, pesan lewat WhatsApp, dikirim ke seluruh Indonesia.`}
      />
      <Meta
        name="keywords"
        content="laili milkmee, susu kambing kolostrum, susu kolostrum, susu kambing bubuk, susu daun kelor, susu tanpa gula tambahan"
      />
      <Meta name="author" content="Laili Milkmee" />
      <Meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <Meta property="og:type" content="product" />
      <Meta
        property="og:title"
        content="Laili Milkmee — Susu Kambing Kolostrum 600gr"
      />
      <Meta
        property="og:description"
        content="Kolostrum, susu kambing, madu murni, dan daun kelor dalam satu gelas. Tanpa gula tambahan, ramah untuk satu keluarga."
      />
      <Meta property="og:image" content="/milkmee.png" />

      <Link rel="preconnect" href="https://fonts.googleapis.com" />
      <Link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
      <Link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div class="mm-page">
        {/* ================= TOPBAR ================= */}
        <div class="mm-topbar">
          🚚 Gratis konsultasi via WhatsApp —{" "}
          <span>dikirim ke seluruh Indonesia</span>
        </div>

        {/* ================= HERO ================= */}
        <section class="mm-hero">
          <div class="mm-container mm-hero-grid">
            <div class="mm-hero-copy">
              <span class="mm-badge-origin">
                🇮🇩 Kolostrum + Susu Kambing + Madu + Daun Kelor
              </span>

              <h1>
                Satu gelas tiap pagi &amp; malam,
                <br />
                <span>daya tahan tubuh keluarga terjaga.</span>
              </h1>

              <p class="mm-lead">
                Laili Milkmee menggabungkan kolostrum, susu kambing, madu murni,
                dan daun kelor dalam bubuk 600gr. Tanpa gula tambahan, terasa
                ringan di perut, dan bisa diminum satu rumah — dari si kecil
                usia 2 tahun sampai kakek nenek.
              </p>

              {/* Visual untuk mobile (muncul lebih awal) */}
              <div class="mm-hero-visual mm-mobile-visual">
                <div class="mm-halo" />
                <div class="mm-can-wrap">
                  <img
                    src="/milkmee.png"
                    alt="Laili Milkmee - Susu Kambing Kolostrum 600gr"
                    width="420"
                    height="420"
                    fetchpriority="high"
                  />
                </div>
              </div>

              <ul class="mm-trust-row">
                <li>
                  <IconCheck /> Tanpa gula tambahan
                </li>
                <li>
                  <IconCheck /> Netto 600gr
                </li>
                <li>
                  <IconCheck /> 100% original bersegel
                </li>
              </ul>

              <div class="mm-price-card">
                <div>
                  <div class="mm-price-old">
                    Rp {PRODUCT_OLD_PRICE.toLocaleString("id-ID")}
                  </div>
                  <div class="mm-price-new">
                    Rp {PRODUCT_PRICE.toLocaleString("id-ID")}
                  </div>
                </div>
                <span class="mm-price-tag">Hemat {discount}%</span>
              </div>

              <div class="mm-cta-row">
                <a href="#order" class="mm-btn-primary">
                  Pesan sekarang
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener"
                  class="mm-btn-secondary"
                  onClick={onWaClick}
                >
                  <IconWA /> Tanya dulu
                </a>
              </div>

              <p class="mm-hero-note">
                Tanpa bayar di muka. Konfirmasi stok &amp; ongkir dulu lewat
                WhatsApp.
              </p>
            </div>

            {/* Visual untuk desktop */}
            <div class="mm-hero-visual mm-desktop-visual">
              <div class="mm-halo" />
              <div class="mm-can-wrap">
                <img
                  src="/milkmee.png"
                  alt="Laili Milkmee - Susu Kambing Kolostrum 600gr"
                  width="420"
                  height="420"
                  fetchpriority="high"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= STRIP MARQUEE ================= */}
        <div class="mm-strip">
          <div class="mm-strip-inner">
            <For each={[1, 2]}>
              {(group) => (
                <div
                  class="mm-strip-group"
                  aria-hidden={group === 2 ? "true" : undefined}
                >
                  <div class="mm-strip-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    100% original bersegel
                  </div>
                  <div class="mm-strip-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Diminum satu keluarga, 2 tahun+
                  </div>
                  <div class="mm-strip-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                    </svg>
                    0% gula tambahan
                  </div>
                  <div class="mm-strip-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
                      <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
                      <circle cx="7" cy="18" r="2" />
                      <circle cx="17" cy="18" r="2" />
                    </svg>
                    Kirim ke seluruh Indonesia
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* ================= MASALAH / RELATE ================= */}
        <section class="mm-section">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Kenapa perlu</span>
              <h2>Nutrisi harian keluarga sering bolong tanpa disadari</h2>
              <p>
                Bukan karena tidak peduli — tapi karena hari-hari memang sepadat
                ini.
              </p>
            </div>

            <div class="mm-pain-grid">
              <For each={painPoints}>
                {(item) => (
                  <div class="mm-pain-card">
                    <span class="mm-pain-mark">
                      <IconX />
                    </span>
                    <p>{item}</p>
                  </div>
                )}
              </For>
            </div>

            <div class="mm-pain-bridge-wrap">
              <p class="mm-pain-bridge">
                Di titik itulah Laili Milkmee hadir: satu gelas praktis yang
                membantu melengkapi asupan harian seisi rumah — tanpa perlu ubah
                menu makan.
              </p>
            </div>
          </div>
        </section>

        {/* ================= KOMPOSISI ================= */}
        <section class="mm-section-alt" id="komposisi">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Isi di dalamnya</span>
              <h2>4 bahan utama dalam satu takaran</h2>
              <p>
                Diracik jadi satu bubuk supaya tidak perlu beli dan menakar
                empat produk terpisah.
              </p>
            </div>

            <div class="mm-ing-grid">
              <For each={ingredients}>
                {(item, i) => (
                  <div class="mm-ing-card">
                    <span class="mm-ing-num">
                      {String(i() + 1).padStart(2, "0")}
                    </span>
                    <h3>{item.name}</h3>
                    <p>{item.desc}</p>
                  </div>
                )}
              </For>
            </div>
          </div>
        </section>

        {/* ================= MANFAAT ================= */}
        <section class="mm-section" id="manfaat">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Manfaat harian</span>
              <h2>Yang keluarga rasakan saat rutin minum</h2>
              <p>
                Sebagai pelengkap nutrisi harian, bukan obat dan bukan pengganti
                makanan utama.
              </p>
            </div>

            <div class="mm-benefit-grid">
              <div class="mm-benefit-card">
                <div class="mm-benefit-icon">
                  <IconShield />
                </div>
                <h3>Bantu jaga daya tahan tubuh</h3>
                <p>
                  Kolostrum dikenal sebagai sumber alami imunoglobulin (IgG)
                  yang mendukung sistem imun.
                </p>
              </div>
              <div class="mm-benefit-card">
                <div class="mm-benefit-icon">
                  <IconHeart />
                </div>
                <h3>Dukungan saat tubuh butuh ekstra</h3>
                <p>
                  Kandungan protein dan growth factor alami kolostrum turut
                  mendukung proses regenerasi sel tubuh.
                </p>
              </div>
              <div class="mm-benefit-card">
                <div class="mm-benefit-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 13c1 1.5 2.5 2 4 2s3-.5 4-2" />
                  </svg>
                </div>
                <h3>Nyaman di pencernaan</h3>
                <p>
                  Butiran lemak susu kambing lebih kecil dari susu sapi,
                  sehingga umumnya terasa lebih ringan di perut.
                </p>
              </div>
              <div class="mm-benefit-card">
                <div class="mm-benefit-icon">
                  <IconSun />
                </div>
                <h3>Energi dari madu murni</h3>
                <p>
                  Rasa manisnya datang dari madu, bukan gula pasir tambahan —
                  jadi tetap enak tanpa berlebihan.
                </p>
              </div>
              <div class="mm-benefit-card">
                <div class="mm-benefit-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M5 19c8 0 13-5 13-13 0 0-11-2-13 8-1 3 0 5 0 5Z" />
                    <path d="M5 19c2-4 5-7 9-9" />
                  </svg>
                </div>
                <h3>Stamina untuk aktivitas</h3>
                <p>
                  Daun kelor melengkapi formula dengan vitamin dan mineral
                  pendukung stamina harian.
                </p>
              </div>
              <div class="mm-benefit-card">
                <div class="mm-benefit-icon">
                  <IconUsers />
                </div>
                <h3>Cukup satu produk se-rumah</h3>
                <p>
                  Tidak perlu susu berbeda untuk anak, dewasa, dan orang tua —
                  takarannya saja yang menyesuaikan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CTA BAND ================= */}
        <section class="mm-cta-band">
          <div class="mm-container mm-cta-band-inner">
            <div>
              <h3>Mau coba dulu 1 box?</h3>
              <p>
                Bisa beli satuan, tanpa minimal order. Harga promo Rp{" "}
                {PRODUCT_PRICE.toLocaleString("id-ID")}.
              </p>
            </div>
            <a href="#order" class="mm-btn-primary">
              Pesan sekarang
            </a>
          </div>
        </section>

        {/* ================= WAKTU TERBAIK ================= */}
        <section class="mm-section-alt">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Cara pakai</span>
              <h2>Pagi untuk energi, malam untuk pemulihan</h2>
              <p>Dua gelas sehari, di dua waktu yang paling terasa bedanya.</p>
            </div>
            <div class="mm-time-grid">
              <div class="mm-time-card pagi">
                <div class="mm-time-icon">
                  <IconSun />
                </div>
                <h3>Pagi hari</h3>
                <p>
                  Diminum sebelum beraktivitas, membantu tubuh memulai hari
                  dengan asupan nutrisi yang cukup.
                </p>
              </div>
              <div class="mm-time-card malam">
                <div class="mm-time-icon">
                  <IconMoon />
                </div>
                <h3>Malam hari</h3>
                <p>
                  Diminum sebelum tidur, saat tubuh melakukan proses istirahat
                  dan pemulihan alaminya.
                </p>
              </div>
            </div>
            <p class="mm-time-note">
              ✨ Kuncinya konsisten — 2x sehari, setiap hari.
            </p>
          </div>
        </section>

        {/* ================= AMAN UNTUK SIAPA SAJA ================= */}
        <section class="mm-section">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Cocok untuk siapa</span>
              <h2>Dibuat supaya bisa diminum satu keluarga</h2>
              <p>
                Untuk kondisi kesehatan khusus, kehamilan, atau pengobatan
                rutin, konsultasikan dulu dengan tenaga kesehatan.
              </p>
            </div>
            <div class="mm-safety-grid">
              <div class="mm-safety-card">
                <div class="mm-safety-icon">
                  <IconUsers />
                </div>
                <h3>Anak 2 tahun ke atas</h3>
                <p>
                  Rasa susu gurih manis alami, umumnya mudah diterima anak yang
                  susah minum susu.
                </p>
              </div>
              <div class="mm-safety-card">
                <div class="mm-safety-icon">
                  <IconHeart />
                </div>
                <h3>Dewasa aktif</h3>
                <p>
                  Praktis diseduh sebelum berangkat kerja atau sebagai pengganti
                  camilan manis.
                </p>
              </div>
              <div class="mm-safety-card">
                <div class="mm-safety-icon">
                  <IconShield />
                </div>
                <h3>Lansia</h3>
                <p>
                  Tanpa gula tambahan dan bertekstur lembut, jadi lebih nyaman
                  untuk konsumsi rutin.
                </p>
              </div>
              <div class="mm-safety-card">
                <div class="mm-safety-icon">
                  <IconCapsule />
                </div>
                <h3>Sedang minum obat</h3>
                <p>
                  Beri jeda 1–2 jam dengan obat, dan tanyakan ke dokter Anda
                  untuk pengobatan rutin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= KENAPA BERBEDA ================= */}
        <section class="mm-section-alt">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Perbandingan</span>
              <h2>Bedanya dengan susu kolostrum biasa</h2>
            </div>
            <div class="mm-compare">
              <div class="mm-compare-card no">
                <h3>Susu kolostrum biasa</h3>
                <ul class="mm-compare-list">
                  <li>
                    <IconX /> Umumnya fokus pada kolostrum saja
                  </li>
                  <li>
                    <IconX /> Rasa dan pemanis tergantung produk
                  </li>
                  <li>
                    <IconX /> Perlu produk lain untuk melengkapi nutrisi
                  </li>
                  <li>
                    <IconX /> Kemasan besar, harus beli banyak di awal
                  </li>
                </ul>
              </div>
              <div class="mm-compare-card yes">
                <h3>Laili Milkmee</h3>
                <ul class="mm-compare-list">
                  <li>
                    <IconCheck /> Kolostrum + susu kambing + madu + daun kelor
                    jadi satu
                  </li>
                  <li>
                    <IconCheck /> Manis alami dari madu, tanpa gula pasir
                    tambahan
                  </li>
                  <li>
                    <IconCheck /> Diracik sebagai pelengkap nutrisi harian
                    keluarga
                  </li>
                  <li>
                    <IconCheck /> Bisa mulai dari 1 box, tanpa minimal order
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CARA SAJI ================= */}
        <section class="mm-section">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Penyajian</span>
              <h2>Siap diminum dalam 4 langkah</h2>
            </div>
            <div class="mm-steps">
              <div class="mm-step">
                <h3>Tuang</h3>
                <p>2–3 sendok makan Laili Milkmee ke dalam gelas.</p>
              </div>
              <div class="mm-step">
                <h3>Seduh</h3>
                <p>Tambahkan ±150ml air hangat, bukan air mendidih.</p>
              </div>
              <div class="mm-step">
                <h3>Aduk</h3>
                <p>Aduk sampai bubuk larut sempurna dan merata.</p>
              </div>
              <div class="mm-step">
                <h3>Minum</h3>
                <p>Paling nikmat saat masih hangat, pagi dan malam.</p>
              </div>
            </div>

            <div class="mm-note-box">
              <div class="mm-note-item gold">
                <div class="mm-note-icon-wrap">💡</div>
                <div>
                  <h4>Nutrisi pendamping</h4>
                  <p>
                    Laili Milkmee adalah pelengkap gizi harian — bukan obat, dan
                    bukan pengganti makanan utama maupun ASI.
                  </p>
                </div>
              </div>
              <div class="mm-note-item ruby">
                <div class="mm-note-icon-wrap">🔄</div>
                <div>
                  <h4>Butuh konsistensi</h4>
                  <p>
                    Manfaat nutrisi terasa dari kebiasaan, bukan sekali minum.
                    Karena itu banyak pelanggan langsung ambil stok 2–3 box.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONI ================= */}
        <section class="mm-section-alt">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Kata pelanggan</span>
              <h2>Sudah jadi rutinitas di banyak rumah</h2>
            </div>
            <div class="mm-testi-grid">
              <div class="mm-testi-card">
                <div class="mm-stars">★★★★★</div>
                <p class="mm-quote">
                  "Rasanya enak dan gampang larut, nggak amis. Sekarang jadi
                  rutinitas pagi dan malam sekeluarga."
                </p>
                <div class="mm-testi-who">
                  <div class="mm-avatar">F</div>
                  <span>Fikri, Kediri</span>
                </div>
              </div>
              <div class="mm-testi-card">
                <div class="mm-stars">★★★★★</div>
                <p class="mm-quote">
                  "Beli 1 box buat coba, anak sampai orang tua di rumah semua
                  cocok. Sekarang langsung ambil 3."
                </p>
                <div class="mm-testi-who">
                  <div class="mm-avatar">A</div>
                  <span>Akadiyati, Kediri</span>
                </div>
              </div>
              <div class="mm-testi-card">
                <div class="mm-stars">★★★★★</div>
                <p class="mm-quote">
                  "Adminnya fast respon, pesan pagi sorenya sudah dapat resi.
                  Barang sampai dalam kondisi rapi."
                </p>
                <div class="mm-testi-who">
                  <div class="mm-avatar">R</div>
                  <span>Ryan, Cirebon</span>
                </div>
              </div>
            </div>
            <p class="mm-testi-note">
              Testimoni di atas masih contoh tampilan — ganti dengan ulasan asli
              pembeli sebelum iklan dijalankan. Hasil dan pengalaman tiap orang
              bisa berbeda.
            </p>
          </div>
        </section>

        {/* ================= PROMO & ORDER FORM ================= */}
        <section class="mm-section" id="order">
          <div class="mm-container">
            <div class="mm-promo-wrap">
              <div class="mm-promo-form-grid">
                <div class="mm-promo-copy">
                  <span class="mm-eyebrow mm-eyebrow-gold">Promo hari ini</span>
                  <h2>Ambil harga promo sebelum tengah malam</h2>
                  <p class="mm-promo-sub">
                    Harga promo berlaku sampai pukul 23.59 hari ini, selama stok
                    masih tersedia.
                  </p>

                  <Countdown />

                  <div class="mm-promo-price">
                    <span class="mm-promo-old">
                      Rp {PRODUCT_OLD_PRICE.toLocaleString("id-ID")}
                    </span>
                    <span class="mm-promo-new">
                      Rp {PRODUCT_PRICE.toLocaleString("id-ID")}
                    </span>
                    <span class="mm-price-tag">Hemat {discount}%</span>
                  </div>

                  <ul class="mm-promo-points">
                    <li>
                      <IconCheck /> Bisa beli 1 box, tanpa minimal order
                    </li>
                    <li>
                      <IconCheck /> Bayar setelah konfirmasi admin
                    </li>
                    <li>
                      <IconCheck /> Dikirim hari yang sama untuk order sebelum
                      jam 15.00
                    </li>
                  </ul>
                </div>
                <div>
                  <OrderForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= GARANSI ================= */}
        <section class="mm-section">
          <div class="mm-container">
            <div class="mm-section-head">
              <span class="mm-eyebrow">Belanja tenang</span>
              <h2>Risikonya kami yang tanggung</h2>
            </div>
            <div class="mm-guarantee-grid">
              <div class="mm-guar-card">
                <div class="mm-guar-icon">
                  <IconBox />
                </div>
                <h3>Garansi produk original</h3>
                <p>
                  Dikirim bersegel dari distributor resmi. Segel rusak atau
                  produk tidak sesuai, kami ganti — cukup kirim video unboxing.
                </p>
              </div>
              <div class="mm-guar-card">
                <div class="mm-guar-icon">
                  <IconTruck />
                </div>
                <h3>Aman sampai tujuan</h3>
                <p>
                  Dikemas berlapis dengan bubble wrap, dan nomor resi dikirim ke
                  WhatsApp Anda begitu paket berangkat.
                </p>
              </div>
              <div class="mm-guar-card">
                <div class="mm-guar-icon">
                  <IconChat />
                </div>
                <h3>Pendampingan gratis</h3>
                <p>
                  Bingung takaran atau waktu minum? Tanya admin kapan saja lewat
                  WhatsApp, tanpa biaya tambahan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section class="mm-section-alt">
          <div class="mm-container mm-container-narrow">
            <div class="mm-section-head">
              <span class="mm-eyebrow">FAQ</span>
              <h2>Pertanyaan sebelum pesan</h2>
            </div>
            <div id="faq">
              <For each={faqData}>
                {(item) => <FaqItem q={item.q} a={item.a} />}
              </For>
            </div>
          </div>
        </section>

        {/* ================= CLOSING CTA ================= */}
        <section class="mm-section mm-closing">
          <div class="mm-container mm-container-narrow mm-closing-inner">
            <h2>Mulai kebiasaan sehat keluarga hari ini</h2>
            <p>
              Satu box 600gr cukup untuk sekitar dua minggu. Pesan sekarang,
              admin kami balas di jam kerja dan bantu hitung ongkirnya.
            </p>
            <div class="mm-cta-row mm-cta-center">
              <a href="#order" class="mm-btn-primary">
                Isi form pesanan
              </a>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener"
                class="mm-btn-secondary"
                onClick={onWaClick}
              >
                <IconWA /> Chat admin
              </a>
            </div>
          </div>
        </section>

        {/* ================= FLOATING WA ================= */}
        <a
          href={waUrl}
          class="mm-float-wa"
          target="_blank"
          rel="noopener"
          aria-label="Chat WhatsApp"
          onClick={onWaClick}
        >
          <IconWA />
        </a>

        {/* ================= STICKY CTA (MOBILE) ================= */}
        <div class="mm-sticky-bar">
          <div class="mm-sticky-price">
            <span class="mm-sticky-old">
              Rp {PRODUCT_OLD_PRICE.toLocaleString("id-ID")}
            </span>
            <span class="mm-sticky-new">
              Rp {PRODUCT_PRICE.toLocaleString("id-ID")}
            </span>
          </div>
          <a href="#order" class="mm-sticky-btn">
            Pesan sekarang
          </a>
        </div>

        {/* ================= FOOTER ================= */}
        <footer class="mm-footer">
          <div class="mm-container">
            <div class="mm-footer-top">
              <div>
                <div class="mm-footer-logo">Laili Milkmee</div>
                <p class="mm-footer-note">
                  Susu kambing kolostrum bubuk 600gr dengan madu murni dan daun
                  kelor. Halaman ini adalah materi promosi dari reseller resmi.
                </p>
              </div>
              <div>
                <p class="mm-footer-contact-title">Hubungi kami</p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener"
                  class="mm-footer-wa-link"
                  onClick={onWaClick}
                >
                  Chat via WhatsApp →
                </a>
              </div>
            </div>

            <p class="mm-disclaimer">
              <strong>Disclaimer:</strong> Laili Milkmee adalah produk pangan
              pelengkap gizi, bukan obat dan tidak dimaksudkan untuk
              mendiagnosis, mengobati, menyembuhkan, atau mencegah penyakit apa
              pun. Informasi di halaman ini bukan pengganti saran tenaga medis
              atau ahli gizi. Hasil yang dirasakan tiap orang dapat berbeda.
              Halaman ini tidak berafiliasi dengan Meta Platforms, Inc.
            </p>

            <div class="mm-footer-bottom">
              <span>© 2026 Laili Milkmee.</span>
              <span>Materi promosi produk.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
