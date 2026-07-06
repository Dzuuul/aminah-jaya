import { createSignal, onMount, For } from "solid-js";
import type { JSX } from "solid-js";
import { Title, Link, Meta } from "@solidjs/meta";
import "./milkmee.css";

const WA_NUMBER = "6285163616363"; // GANTI dengan nomor WhatsApp asli, format 62xxxxxxxxxx
const WA_MESSAGE =
    "Halo, saya tertarik dengan Laili Milkmee - Susu Kambing Kolostrum 600gr. Boleh minta info lebih lanjut?";
const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

const PRODUCT_PRICE = 175000;
const PRODUCT_OLD_PRICE = 200000;

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

/* ---- Generate WA message dari form order ---- */
const generateOrderMessage = (formData: FormData): string => {
    const { name, phone, provinceName, cityName, address, landmark, quantity, notes } = formData;
    const pricePerUnit = PRODUCT_PRICE;
    const total = pricePerUnit * parseInt(quantity);

    return `Halo, saya ingin memesan Laili Milkmee

*Data Pemesan:*
Nama: ${name}
No. HP: ${phone}

*Alamat Pengiriman:*
${address}
${landmark ? `Patokan: ${landmark}\n` : ''}Kota/Kabupaten: ${cityName}
Provinsi: ${provinceName}

*Detail Pesanan:*
Produk: Laili Milkmee - Susu Kambing Kolostrum 600gr
Jumlah: ${quantity} box
Harga per unit: Rp ${pricePerUnit.toLocaleString('id-ID')}
Total: Rp ${total.toLocaleString('id-ID')}

${notes ? `*Catatan: ${notes}` : ''}

Mohon konfirmasi ketersediaan & rincian pengiriman. Terima kasih!`;
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
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.6 6.3A8.9 8.9 0 0 0 12 4a8.9 8.9 0 0 0-7.7 13.4L3 21l3.7-1.3A8.9 8.9 0 0 0 12 21a8.9 8.9 0 0 0 5.6-15.7ZM12 19.3a7.3 7.3 0 0 1-3.7-1l-.3-.2-2.7 1 .9-2.6-.2-.3A7.4 7.4 0 1 1 19.4 12 7.4 7.4 0 0 1 12 19.3Zm4-5.5c-.2-.1-1.3-.6-1.5-.7s-.4-.1-.5.1-.6.7-.7.9-.3.2-.5.1a6 6 0 0 1-1.8-1.1 6.7 6.7 0 0 1-1.2-1.5c-.1-.2 0-.4.1-.5l.4-.4a1.6 1.6 0 0 0 .2-.4.4.4 0 0 0 0-.4c-.1-.1-.5-1.2-.7-1.7s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2 4.6 4.6 0 0 0 1 2.5 10.6 10.6 0 0 0 4.1 3.6c.6.2 1 .4 1.4.5a3.3 3.3 0 0 0 1.5.1 2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c-.1-.1-.2-.2-.5-.3Z" />
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
        <rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-30 12 12)" />
        <path d="M11 7.6 13 16.4" />
    </svg>
);

/* ---- FAQ data ---- */
const faqData: FaqItem[] = [
    {
        q: "Apakah Laili Milkmee aman untuk anak-anak dan lansia?",
        a: "Ya, Laili Milkmee ramah dikonsumsi mulai usia 2 tahun hingga lansia. Untuk kondisi kesehatan tertentu, konsultasikan dengan dokter atau tenaga kesehatan sebelum konsumsi rutin.",
    },
    {
        q: "Apakah aman untuk ibu hamil dan menyusui?",
        a: "Laili Milkmee diformulasikan untuk turut mendukung kebutuhan nutrisi ibu hamil dan menyusui beserta buah hati. Tetap disarankan berkonsultasi dengan dokter kandungan untuk kebutuhan khusus.",
    },
    {
        q: "Apakah boleh dikonsumsi bersama obat-obatan?",
        a: "Boleh. Namun disarankan memberi jeda waktu 1-2 jam antara konsumsi Laili Milkmee dan obat, agar penyerapan nutrisi dan obat berjalan optimal.",
    },
    {
        q: "Apakah aman untuk penderita maag dan diabetes?",
        a: "Laili Milkmee diformulasikan dengan bahan pilihan tanpa gula tambahan, sehingga umumnya aman di lambung dan tidak memicu kenaikan gula darah drastis. Konsultasikan dengan dokter untuk kondisi khusus.",
    },
    {
        q: "Berapa lama pengiriman?",
        a: "Estimasi pengiriman menyesuaikan lokasi dan jasa ekspedisi yang dipilih saat checkout di Shopee atau via WhatsApp.",
    },
    {
        q: "Bagaimana cara memesan?",
        a: 'Klik tombol "Pesan via WhatsApp" atau gunakan form pesanan di halaman ini, lalu tim kami akan membantu proses pemesanan dan pembayaran.',
    },
    {
        q: "Apakah ada garansi produk asli?",
        a: "Ya, produk dijamin 100% original langsung dari distributor resmi Laili Milkmee.",
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
            <div
                class="mm-faq-a"
                style={{ "max-height": open() ? "220px" : "0" }}
            >
                <p>{props.a}</p>
            </div>
        </div>
    );
}

/* ---- Countdown Component ---- */
function Countdown(): JSX.Element {
    const [h, setH] = createSignal<string>("00");
    const [m, setM] = createSignal<string>("00");
    const [s, setS] = createSignal<string>("00");

    onMount((): (() => void) => {
        const HOURS = 24;
        const end = new Date(new Date().getTime() + HOURS * 60 * 60 * 1000);

        const tick = (): void => {
            const diff = Math.max(0, end.getTime() - new Date().getTime());
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
                <div class="mm-num" id="cd-h">{h()}</div>
                <div class="mm-lbl">Jam</div>
            </div>
            <div class="mm-cd-box">
                <div class="mm-num" id="cd-m">{m()}</div>
                <div class="mm-lbl">Menit</div>
            </div>
            <div class="mm-cd-box">
                <div class="mm-num" id="cd-s">{s()}</div>
                <div class="mm-lbl">Detik</div>
            </div>
        </div>
    );
}

/* ---- Order Form Component ---- */
function OrderForm(): JSX.Element {
    const [formData, setFormData] = createSignal<FormData>({
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
    const [errors, setErrors] = createSignal<FormErrors>({});
    const [submitted, setSubmitted] = createSignal<boolean>(false);

    const [provinces, setProvinces] = createSignal<WilayahOption[]>([]);
    const [cities, setCities] = createSignal<WilayahOption[]>([]);
    const [loadingProvinces, setLoadingProvinces] = createSignal<boolean>(true);
    const [loadingCities, setLoadingCities] = createSignal<boolean>(false);

    onMount(async () => {
        try {
            const res = await fetch("/api/wilayah/provinces");
            const json: { data: { code: string; name: string }[] } = await res.json();
            setProvinces(json.data.map((p) => ({ code: p.code, name: p.name })));
        } catch {
            setProvinces([]);
        } finally {
            setLoadingProvinces(false);
        }
    });

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
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        const data = formData();

        if (!data.name.trim()) {
            newErrors.name = "Nama harus diisi";
        }
        if (!data.phone.trim()) {
            newErrors.phone = "Nomor HP harus diisi";
        } else if (!/^(\+62|0)[0-9]{9,12}$/.test(data.phone.replace(/\D/g, '6' + data.phone))) {
            newErrors.phone = "Format nomor HP tidak valid";
        }
        if (!data.provinceId) {
            newErrors.provinceId = "Pilih provinsi";
        }
        if (!data.cityId) {
            newErrors.cityId = "Pilih kota/kabupaten";
        }
        if (!data.address.trim()) {
            newErrors.address = "Alamat lengkap harus diisi";
        }
        if (!data.quantity || parseInt(data.quantity) < 1) {
            newErrors.quantity = "Jumlah minimal 1 box";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: Event): void => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const { name, value } = target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors()[name as keyof FormErrors]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FormErrors];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: Event): void => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const orderMessage = generateOrderMessage(formData());
        const encodedMessage = encodeURIComponent(orderMessage);
        const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${encodedMessage}`;

        window.open(whatsappUrl, "_blank");
        setSubmitted(true);

        setTimeout(() => {
            setFormData({
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
            setCities([]);
            setSubmitted(false);
        }, 1500);
    };

    const pricePerUnit = PRODUCT_PRICE;
    const total = () => pricePerUnit * parseInt(formData().quantity || "0");

    return (
        <div class="mm-form-container">
            <div class="mm-form-card">
                <h3 class="mm-form-title">Pesan Sekarang</h3>
                <p class="mm-form-desc">Isi form di bawah dan langsung terhubung ke WhatsApp kami</p>

                <form onSubmit={handleSubmit} class="mm-form" style={{ "margin-top": "20px" }}>
                    {/* Nama */}
                    <div class="mm-form-group">
                        <label for="name" class="mm-form-label">Nama Lengkap *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData().name}
                            onInput={handleChange}
                            placeholder="Contoh: Budi Santoso"
                            class={`mm-form-input ${errors().name ? "error" : ""}`}
                        />
                        {errors().name && <span class="mm-form-error">{errors().name}</span>}
                    </div>

                    {/* Nomor HP */}
                    <div class="mm-form-group">
                        <label for="phone" class="mm-form-label">Nomor WhatsApp *</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData().phone}
                            onInput={handleChange}
                            placeholder="Contoh: 081234567890"
                            class={`mm-form-input ${errors().phone ? "error" : ""}`}
                        />
                        {errors().phone && <span class="mm-form-error">{errors().phone}</span>}
                        <span class="mm-form-hint">Format: 0812... atau +6281...</span>
                    </div>

                    {/* Provinsi */}
                    <div class="mm-form-group">
                        <label for="provinceId" class="mm-form-label">Provinsi *</label>
                        <select
                            id="provinceId"
                            name="provinceId"
                            value={formData().provinceId}
                            onChange={handleProvinceChange}
                            class={`mm-form-input ${errors().provinceId ? "error" : ""}`}
                            disabled={loadingProvinces()}
                        >
                            <option value="">
                                {loadingProvinces() ? "Memuat provinsi..." : "Pilih provinsi"}
                            </option>
                            <For each={provinces()}>
                                {(p) => <option value={p.code}>{p.name}</option>}
                            </For>
                        </select>
                        {errors().provinceId && <span class="mm-form-error">{errors().provinceId}</span>}
                    </div>

                    {/* Kota/Kabupaten */}
                    <div class="mm-form-group">
                        <label for="cityId" class="mm-form-label">Kota/Kabupaten *</label>
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
                        {errors().cityId && <span class="mm-form-error">{errors().cityId}</span>}
                    </div>

                    {/* Alamat Lengkap */}
                    <div class="mm-form-group">
                        <label for="address" class="mm-form-label">Alamat Lengkap *</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData().address}
                            onInput={handleChange}
                            placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, kode pos"
                            class={`mm-form-textarea ${errors().address ? "error" : ""}`}
                            rows="3"
                        />
                        {errors().address && <span class="mm-form-error">{errors().address}</span>}
                    </div>

                    {/* Patokan */}
                    <div class="mm-form-group">
                        <label for="landmark" class="mm-form-label">Patokan (Opsional)</label>
                        <input
                            type="text"
                            id="landmark"
                            name="landmark"
                            value={formData().landmark}
                            onInput={handleChange}
                            placeholder="Contoh: Sebelah Indomaret, pagar warna hijau"
                            class="mm-form-input"
                        />
                    </div>

                    {/* Jumlah */}
                    <div class="mm-form-group">
                        <label for="quantity" class="mm-form-label">Jumlah Box *</label>
                        <div class="mm-quantity-control">
                            <button
                                type="button"
                                class="mm-qty-btn"
                                onClick={() => {
                                    const qty = Math.max(1, parseInt(formData().quantity) - 1);
                                    setFormData(prev => ({ ...prev, quantity: String(qty) }));
                                }}
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
                                onClick={() => {
                                    const qty = Math.min(99, parseInt(formData().quantity) + 1);
                                    setFormData(prev => ({ ...prev, quantity: String(qty) }));
                                }}
                            >
                                +
                            </button>
                        </div>
                        {errors().quantity && <span class="mm-form-error">{errors().quantity}</span>}
                    </div>

                    {/* Catatan */}
                    <div class="mm-form-group">
                        <label for="notes" class="mm-form-label">Catatan (Opsional)</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData().notes}
                            onInput={handleChange}
                            placeholder="Contoh: hindari pengiriman malam hari"
                            class="mm-form-textarea"
                            rows="3"
                        />
                    </div>

                    {/* Price Summary */}
                    <div class="mm-form-summary">
                        <div class="mm-summary-row">
                            <span>Harga satuan:</span>
                            <span>Rp {pricePerUnit.toLocaleString('id-ID')}</span>
                        </div>
                        <div class="mm-summary-row">
                            <span>Kuantitas:</span>
                            <span>{formData().quantity} box</span>
                        </div>
                        <div class="mm-summary-divider"></div>
                        <div class="mm-summary-row mm-summary-total">
                            <span>Total:</span>
                            <span>Rp {total().toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Success Message */}
                    {submitted() && (
                        <div class="mm-success-message">
                            ✓ Pesanan Anda sedang dikirim ke WhatsApp. Jika tidak terbuka, klik tombol di bawah.
                        </div>
                    )}

                    {/* Submit Button */}
                    <button type="submit" class="mm-form-submit">
                        <IconWA />
                        Kirim Pesanan ke WhatsApp
                    </button>
                </form>

                <p class="mm-form-footer" style="margin-top: 20px;">
                    💬 Setelah submit, Anda akan dihubungkan langsung ke WhatsApp kami untuk konfirmasi pesanan, metode pembayaran, dan pengiriman.
                </p>
            </div>
        </div>
    );
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */
export default function MilkmeeLandingPage(): JSX.Element {
    return (
        <>
            <Title>Laili Milkmee — Susu Kambing Kolostrum untuk Imunitas Keluarga</Title>
            <Meta name="description" content="Laili Milkmee memadukan susu kambing, kolostrum, madu, dan daun kelor dalam bubuk 600gr — pendamping nutrisi harian untuk imunitas keluarga. Aman untuk bumil, busui, usia 2 tahun+, hingga penderita maag dan diabetes." />
            <Meta name="keywords" content="laili milkmee, susu kambing kolostrum, kolostrum indonesia, susu kambing bubuk, imun keluarga, aman ibu hamil, aman diabetes, produk lokal" />
            <Meta name="author" content="Laili Milkmee" />

            <Link rel="preconnect" href="https://fonts.googleapis.com" />
            <Link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
            <Link
                href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />

            <div class="mm-page">

                {/* ================= TOPBAR ================= */}
                <div class="mm-topbar">
                    ✨ Reseller Resmi Laili Milkmee — <span>Bisa Beli Per 1 Box!</span>{" | "} Susu Kambing Kolostrum Original BPOM &amp; Halal MUI
                </div>

                {/* ================= HERO ================= */}
                <section class="mm-hero">
                    <div class="mm-container mm-hero-grid">
                        <div>
                            <span class="mm-badge-origin">🇮🇩 Susu Kambing Kolostrum dengan Madu dan Daun Kelor</span>
                            <h1>
                                Nutrisi kolostrum premium,<br />
                                <span>untuk imunitas keluarga.</span>
                            </h1>
                            <p class="mm-lead">
                                Kesehatan keluarga adalah investasi terbaik. Laili Milkmee memadukan susu kambing,
                                kolostrum, madu, dan daun kelor dalam satu formula — pendamping nutrisi harian untuk
                                menjaga daya tahan tubuh setiap anggota keluarga, dari si kecil hingga orang tua.
                            </p>

                            <ul class="mm-trust-row">
                                <li><IconCheck /> Terdaftar BPOM*</li>
                                <li><IconCheck /> Halal MUI*</li>
                                <li><IconCheck /> 100% Original</li>
                            </ul>

                            {/* Mobile Visual */}
                            <div class="mm-hero-visual mm-mobile-visual">
                                <div class="mm-halo" />
                                <div class="mm-can-wrap">
                                    <img src="/milkmee.png" alt="Laili Milkmee - Susu Kambing Kolostrum" />
                                </div>
                            </div>

                            <div class="mm-price-card">
                                <div>
                                    <div class="mm-price-old">Rp {PRODUCT_OLD_PRICE.toLocaleString('id-ID')}</div>
                                    <div class="mm-price-new">Rp {PRODUCT_PRICE.toLocaleString('id-ID')}</div>
                                </div>
                                <span class="mm-price-tag">Hemat {Math.round(((PRODUCT_OLD_PRICE - PRODUCT_PRICE) / PRODUCT_OLD_PRICE) * 100)}%</span>
                            </div>
                            <p class="mm-hero-note">
                                *Netto 600gr / box.
                            </p>

                            <div class="mm-cta-row">
                                <a href="#order" class="mm-btn-primary">Lihat form pesanan ↓</a>
                            </div>
                        </div>

                        {/* Desktop Visual */}
                        <div class="mm-hero-visual mm-desktop-visual">
                            <div class="mm-halo" />
                            <div class="mm-can-wrap">
                                <img src="/milkmee.png" alt="Laili Milkmee - Susu Kambing Kolostrum" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= STRIP MARQUEE ================= */}
                <div class="mm-strip">
                    <div class="mm-strip-inner">
                        <div class="mm-strip-group">
                            <div class="mm-strip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                                100% Original &amp; bergaransi
                            </div>
                            <div class="mm-strip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Aman bumil, busui &amp; usia 2 th+
                            </div>
                            <div class="mm-strip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                                </svg>
                                0% Gula tambahan
                            </div>
                            <div class="mm-strip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
                                    <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
                                    <circle cx="7" cy="18" r="2" />
                                    <circle cx="17" cy="18" r="2" />
                                </svg>
                                Dikirim ke seluruh Indonesia
                            </div>
                        </div>

                        <div class="mm-strip-group" aria-hidden="true">
                            <div class="mm-strip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                                100% Original &amp; bergaransi
                            </div>
                            <div class="mm-strip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Aman bumil, busui &amp; usia 2 th+
                            </div>
                            <div class="mm-strip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                                </svg>
                                0% Gula tambahan
                            </div>
                            <div class="mm-strip-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
                                    <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
                                    <circle cx="7" cy="18" r="2" />
                                    <circle cx="17" cy="18" r="2" />
                                </svg>
                                Dikirim ke seluruh Indonesia
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= MANFAAT ================= */}
                <section class="mm-section" id="manfaat">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow">Kandungan &amp; manfaat</span>
                            <h2>Satu tetes pertama, sejuta manfaat</h2>
                            <p>Laili Milkmee memadukan kolostrum, susu kambing, madu, dan daun kelor dalam satu formula — booster imun harian untuk seluruh keluarga.</p>
                        </div>

                        <div class="mm-benefit-grid">
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
                                    </svg>
                                </div>
                                <h3>Kaya imunoglobulin (IgG)</h3>
                                <p>Kandungan antibodi alami dari kolostrum membantu melawan virus dan bakteri, memperkuat imunitas keluarga.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2v20M2 12h20" />
                                    </svg>
                                </div>
                                <h3>Pemulihan lebih cepat</h3>
                                <p>Growth factor alami dalam kolostrum membantu regenerasi sel tubuh saat kondisi sedang drop.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M8 13c1 1.5 2.5 2 4 2s3-.5 4-2" />
                                    </svg>
                                </div>
                                <h3>Kesehatan pencernaan</h3>
                                <p>70% sistem imun berpusat di saluran cerna — Milkmee membantu menjaga pencernaan tetap nyaman.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 3c4 5 7 8.5 7 12a7 7 0 1 1-14 0c0-3.5 3-7 7-12Z" />
                                    </svg>
                                </div>
                                <h3>Susu kambing, lembut di perut</h3>
                                <p>Bertekstur lebih lembut dan umumnya lebih mudah dicerna dibanding susu sapi biasa.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2 20 7v10l-8 5-8-5V7l8-5Z" />
                                    </svg>
                                </div>
                                <h3>Madu, energi alami</h3>
                                <p>Pemanis alami dari madu murni memberi energi tanpa tambahan gula berlebih — 0% gula tambahan.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M5 19c8 0 13-5 13-13 0 0-11-2-13 8-1 3 0 5 0 5Z" />
                                        <path d="M5 19c2-4 5-7 9-9" />
                                    </svg>
                                </div>
                                <h3>Daun kelor untuk stamina</h3>
                                <p>Nutrisi daun kelor mendukung kekuatan otot dan stamina 'sat-set' menjalani aktivitas harian.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= WAKTU TERBAIK ================= */}
                <section class="mm-section-alt">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow">Waktu terbaik minum</span>
                            <h2>Pagi booster energi, malam pemulihan tubuh</h2>
                            <p>Konsumsi Laili Milkmee di waktu yang tepat membantu tubuh mendapat manfaat maksimal sepanjang hari.</p>
                        </div>
                        <div class="mm-time-grid">
                            <div class="mm-time-card pagi">
                                <div class="mm-time-icon"><IconSun /></div>
                                <h3>Pagi hari: Booster energi</h3>
                                <p>Diminum di pagi hari membantu tubuh lebih siap dan berenergi menghadapi aktivitas harian.</p>
                            </div>
                            <div class="mm-time-card malam">
                                <div class="mm-time-icon"><IconMoon /></div>
                                <h3>Malam hari: Pemulihan tubuh</h3>
                                <p>Diminum sebelum tidur membantu tubuh beristirahat dan memulihkan diri secara optimal.</p>
                            </div>
                        </div>
                        <p class="mm-time-note">✨ Untuk hasil optimal, konsisten dikonsumsi 2x sehari — pagi &amp; malam.</p>
                    </div>
                </section>

                {/* ================= AMAN UNTUK SIAPA SAJA ================= */}
                <section class="mm-section">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow">Keamanan konsumsi</span>
                            <h2>Aman diminum seluruh keluarga</h2>
                            <p>Keamanan adalah prioritas utama. Laili Milkmee diformulasikan agar bisa dikonsumsi dengan tenang oleh berbagai kondisi.</p>
                        </div>
                        <div class="mm-safety-grid">
                            <div class="mm-safety-card">
                                <div class="mm-safety-icon"><IconHeart /></div>
                                <h3>Ibu hamil &amp; menyusui</h3>
                                <p>Mendukung kebutuhan nutrisi ibu dan buah hati di masa kehamilan maupun menyusui.</p>
                            </div>
                            <div class="mm-safety-card">
                                <div class="mm-safety-icon"><IconUsers /></div>
                                <h3>Segala usia, 2 tahun+</h3>
                                <p>Ramah dikonsumsi anak-anak mulai usia 2 tahun hingga lansia.</p>
                            </div>
                            <div class="mm-safety-card">
                                <div class="mm-safety-icon"><IconShield /></div>
                                <h3>Maag &amp; diabetes</h3>
                                <p>Bahan pilihan diformulasikan agar tidak memicu kenaikan gula darah drastis dan tetap aman di lambung.</p>
                            </div>
                            <div class="mm-safety-card">
                                <div class="mm-safety-icon"><IconCapsule /></div>
                                <h3>Bersama obat medis</h3>
                                <p>Aman dikonsumsi berdampingan dengan obat, beri jeda 1-2 jam agar penyerapan nutrisi &amp; obat optimal.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= KENAPA BERBEDA ================= */}
                <section class="mm-section-alt">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"> Perbandingan</span>
                            <h2>Laili Milkmee vs. susu kolostrum biasa</h2>
                        </div>
                        <div class="mm-compare">
                            <div class="mm-compare-card no">
                                <h3>Susu kolostrum biasa</h3>
                                <ul class="mm-compare-list">
                                    <li><IconX /> Umumnya fokus pada kolostrum saja</li>
                                    <li><IconX /> Rasa &amp; pemanis tergantung produk</li>
                                    <li><IconX /> Biasanya dikonsumsi sebagai produk kolostrum</li>
                                    <li><IconX /> Tidak selalu dikombinasikan dengan bahan lain</li>
                                </ul>
                            </div>
                            <div class="mm-compare-card yes">
                                <h3>Laili Milkmee</h3>
                                <ul class="mm-compare-list">
                                    <li><IconCheck /> Kombinasi susu kambing + kolostrum + herbal alami + madu</li>
                                    <li><IconCheck /> Tanpa pemanis tambahan, manis alami dari madu murni</li>
                                    <li><IconCheck /> Diracik sebagai pelengkap nutrisi harian keluarga</li>
                                    <li><IconCheck /> Formulasi dibuat untuk konsumsi rutin</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= COCOK UNTUK SEGALA USIA ================= */}
                <section class="mm-section">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"> Untuk semua generasi</span>
                            <h2>Cocok buat umur berapa aja?</h2>
                            <p>Formulasi Laili Milkmee dirancang mendukung kebutuhan tubuh yang berbeda di setiap tahap usia.</p>
                        </div>
                        <div class="mm-age-grid">
                            <div class="mm-age-card">
                                <h3>Anak-anak</h3>
                                <ul class="mm-age-list">
                                    <li><IconCheck /> Bantu daya tahan tubuh</li>
                                    <li><IconCheck /> Dukung tumbuh kembang</li>
                                    <li><IconCheck /> Nggak gampang sakit</li>
                                </ul>
                            </div>
                            <div class="mm-age-card">
                                <h3>Dewasa</h3>
                                <ul class="mm-age-list">
                                    <li><IconCheck /> Jaga imun harian</li>
                                    <li><IconCheck /> Bantu pemulihan tubuh</li>
                                    <li><IconCheck /> Tetap fit beraktivitas</li>
                                </ul>
                            </div>
                            <div class="mm-age-card">
                                <h3>Lansia</h3>
                                <ul class="mm-age-list">
                                    <li><IconCheck /> Dukung daya tahan tubuh</li>
                                    <li><IconCheck /> Bantu kesehatan pencernaan</li>
                                    <li><IconCheck /> Tubuh lebih kuat</li>
                                    <li><IconCheck /> Nggak gampang drop</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= CARA SAJI ================= */}
                <section class="mm-section-alt">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"> Cara penyajian</span>
                            <h2>Siap diminum dalam 4 langkah</h2>
                        </div>
                        <div class="mm-steps">
                            <div class="mm-step">
                                <h3>Tuang</h3>
                                <p>Tuang 2-3 sendok Laili Milkmee ke dalam gelas bersih.</p>
                            </div>
                            <div class="mm-step">
                                <h3>Seduh</h3>
                                <p>Seduh dengan ±150ml air hangat (bukan mendidih).</p>
                            </div>
                            <div class="mm-step">
                                <h3>Aduk</h3>
                                <p>Aduk hingga bubuk larut sempurna dan merata.</p>
                            </div>
                            <div class="mm-step">
                                <h3>Minum</h3>
                                <p>Laili Milkmee siap disajikan — lebih nikmat dalam keadaan hangat.</p>
                            </div>
                        </div>

                        <div class="mm-note-box">
                            <div class="mm-note-item gold">
                                <div class="mm-note-icon-wrap">💡</div>
                                <div>
                                    <h4>Nutrisi pendamping</h4>
                                    <p>Milkmee mengandung vitamin dan mineral yang membantu melengkapi kebutuhan gizi harian. Produk ini adalah nutrisi pelengkap, bukan pengganti makanan utama.</p>
                                </div>
                            </div>
                            <div class="mm-note-item ruby">
                                <div class="mm-note-icon-wrap">🔄</div>
                                <div>
                                    <h4>Konsumsi rutin</h4>
                                    <p>Untuk hasil maksimal, sangat disarankan dikonsumsi setiap hari secara rutin sebagai investasi kesehatan jangka panjang.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* ================= TESTIMONI ================= */}
                <section class="mm-section">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow">Kata pelanggan</span>
                            <h2>Testimoni</h2>
                        </div>
                        <div class="mm-testi-grid">
                            <div class="mm-testi-card">
                                <div class="mm-stars">★★★★★</div>
                                <p class="mm-quote">"Rasanya enak dan mudah larut, jadi rutinitas pagi dan malam keluarga saya."</p>
                                <div class="mm-testi-who">
                                    <div class="mm-avatar">F</div>
                                    <span>Fikri, Kediri</span>
                                </div>
                            </div>
                            <div class="mm-testi-card">
                                <div class="mm-stars">★★★★★</div>
                                <p class="mm-quote">"Anak sampai orang tua di rumah semua cocok minum ini."</p>
                                <div class="mm-testi-who">
                                    <div class="mm-avatar">A</div>
                                    <span>Akadiyati, Kediri</span>
                                </div>
                            </div>
                            <div class="mm-testi-card">
                                <div class="mm-stars">★★★★★</div>
                                <p class="mm-quote">"Punya riwayat maag jadi lebih tenang minum susu ini, pengiriman juga cepat."</p>
                                <div class="mm-testi-who">
                                    <div class="mm-avatar">R</div>
                                    <span>Ryan, Cirebon</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= PROMO & ORDER FORM ================= */}
                <section class="mm-section" id="order">
                    <div class="mm-container">
                        <div class="mm-promo-wrap">
                            <div class="mm-promo-form-grid">
                                <div>
                                    <span class="mm-eyebrow" style={{ color: "var(--gold-300)" }}>
                                        Promo terbatas
                                    </span>
                                    <h2>Klaim harga promo sebelum waktu habis</h2>
                                    <p class="mm-promo-sub">Stok dan harga promo berlaku selama periode berikut.</p>

                                    <Countdown />

                                    <div class="mm-promo-price">
                                        <span class="mm-promo-old">Rp {PRODUCT_OLD_PRICE.toLocaleString('id-ID')}</span>
                                        <span class="mm-promo-new">Rp {PRODUCT_PRICE.toLocaleString('id-ID')}</span>
                                    </div>

                                    <p class="mm-promo-sub" style={{ "margin-top": "24px" }}>
                                        *Isi form di bawah untuk klaim harga promo sekarang.
                                    </p>
                                </div>
                                <div>
                                    <OrderForm />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= FAQ ================= */}
                <section class="mm-section">
                    <div class="mm-container" style={{ "max-width": "760px" }}>
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"> FAQ</span>
                            <h2>Pertanyaan yang sering ditanyakan</h2>
                        </div>
                        <div id="faq">
                            <For each={faqData}>
                                {(item) => <FaqItem q={item.q} a={item.a} />}
                            </For>
                        </div>
                    </div>
                </section>

                {/* ================= FLOATING WA ================= */}
                <a href={waUrl} class="mm-float-wa" target="_blank" rel="noopener" aria-label="Chat WhatsApp">
                    <img src="/icons8-whatsapp-96.png" alt="WhatsApp" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;" />
                </a>

                {/* ================= FOOTER ================= */}
                <footer class="mm-footer">
                    <div class="mm-container">
                        <div class="mm-footer-top">
                            <div>
                                <div class="mm-footer-logo">
                                    Laili Milkmee
                                </div>
                                <p class="mm-footer-note">
                                    Susu kambing kolostrum bubuk 600gr, diperkaya madu dan daun kelor — diproduksi di
                                    Indonesia. Halaman ini adalah materi promosi dan bukan pengganti anjuran tenaga
                                    medis atau ahli gizi.
                                </p>
                            </div>
                        </div>
                        <div class="mm-footer-bottom">
                            <span>© 2026 Laili Milkmee.</span>
                            <span>Dibuat untuk keperluan promosi produk.</span>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}