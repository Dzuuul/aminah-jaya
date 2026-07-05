import { createSignal, onMount, For } from "solid-js";
import { Title, Link, Meta } from "@solidjs/meta";
import "./milkmee.css";

const WA_NUMBER = "6281234567890"; // GANTI dengan nomor WhatsApp asli, format 62xxxxxxxxxx
const WA_MESSAGE =
    "Halo, saya tertarik dengan promo Laili Milkmee Susu Kolostrum 600gr. Boleh minta info lebih lanjut?";
const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

/* ---- Icon helpers ---- */
const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
        <path d="M5 12l4 4L19 6" />
    </svg>
);
const IconX = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 18 18 6M6 6l12 12" />
    </svg>
);
const IconPlus = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
        <path d="M12 5v14M5 12h14" />
    </svg>
);
const IconWA = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.6 6.3A8.9 8.9 0 0 0 12 4a8.9 8.9 0 0 0-7.7 13.4L3 21l3.7-1.3A8.9 8.9 0 0 0 12 21a8.9 8.9 0 0 0 5.6-15.7ZM12 19.3a7.3 7.3 0 0 1-3.7-1l-.3-.2-2.7 1 .9-2.6-.2-.3A7.4 7.4 0 1 1 19.4 12 7.4 7.4 0 0 1 12 19.3Zm4-5.5c-.2-.1-1.3-.6-1.5-.7s-.4-.1-.5.1-.6.7-.7.9-.3.2-.5.1a6 6 0 0 1-1.8-1.1 6.7 6.7 0 0 1-1.2-1.5c-.1-.2 0-.4.1-.5l.4-.4a1.6 1.6 0 0 0 .2-.4.4.4 0 0 0 0-.4c-.1-.1-.5-1.2-.7-1.7s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2 4.6 4.6 0 0 0 1 2.5 10.6 10.6 0 0 0 4.1 3.6c.6.2 1 .4 1.4.5a3.3 3.3 0 0 0 1.5.1 2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c-.1-.1-.2-.2-.5-.3Z" />
    </svg>
);

/* ---- FAQ data ---- */
const faqData = [
    {
        q: "Apakah Laili Milkmee aman untuk anak-anak?",
        a: "Produk ditujukan untuk konsumsi umum sesuai anjuran pada kemasan. Untuk kondisi kesehatan tertentu, konsultasikan dengan dokter atau tenaga kesehatan sebelum konsumsi rutin.",
    },
    {
        q: "Berapa lama pengiriman?",
        a: "Estimasi pengiriman menyesuaikan lokasi dan jasa ekspedisi yang dipilih saat checkout di Shopee atau via WhatsApp.",
    },
    {
        q: "Bagaimana cara memesan?",
        a: 'Klik tombol "Pesan via WhatsApp" di halaman ini, lalu tim kami akan membantu proses pemesanan dan pembayaran.',
    },
    {
        q: "Apakah ada garansi produk asli?",
        a: "Ya, produk dijamin 100% original langsung dari distributor resmi Laili Milkmee.",
    },
];

/* ---- FAQ Item Component ---- */
function FaqItem(props: { q: string; a: string }) {
    const [open, setOpen] = createSignal(false);

    const toggle = () => setOpen((v) => !v);

    return (
        <div class="mm-faq-item" classList={{ open: open() }}>
            <button class="mm-faq-q" onClick={toggle} aria-expanded={open()}>
                {props.q}
                <IconPlus />
            </button>
            <div
                class="mm-faq-a"
                style={{ "max-height": open() ? "200px" : "0" }}
            >
                <p>{props.a}</p>
            </div>
        </div>
    );
}

/* ---- Countdown Component ---- */
function Countdown() {
    const [h, setH] = createSignal("00");
    const [m, setM] = createSignal("00");
    const [s, setS] = createSignal("00");

    onMount(() => {
        const HOURS = 24;
        const end = new Date(new Date().getTime() + HOURS * 60 * 60 * 1000);

        const tick = () => {
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

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */
export default function MilkmeeLandingPage() {
    return (
        <>
            <Title>Laili Milkmee — Susu Kolostrum Pertama Buatan Indonesia</Title>
            <Meta name="description" content="Laili Milkmee menghadirkan susu kolostrum bubuk 600gr dengan kandungan alami untuk mendukung daya tahan tubuh keluarga — diproses dan diproduksi langsung di Indonesia." />
            <Meta name="keywords" content="laili milkmee, susu kolostrum, kolostrum indonesia, susu bubuk kolostrum, daya tahan tubuh, produk lokal" />
            <Meta name="author" content="Laili Milkmee" />

            <Link rel="preconnect" href="https://fonts.googleapis.com" />
            <Link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
            <Link
                href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap"
                rel="stylesheet"
            />

            <div class="mm-page">

                {/* ================= NAV ================= */}
                <header class="mm-nav">
                    <div class="mm-nav-inner">
                        <div class="mm-logo">
                            <span class="mm-drop" />
                            Laili Milkmee
                        </div>
                        <a href={waUrl} class="mm-nav-cta" target="_blank" rel="noopener">
                            Pesan Sekarang
                        </a>
                    </div>
                </header>

                {/* ================= HERO ================= */}
                <section class="mm-hero">
                    <div class="mm-container mm-hero-grid">
                        <div>
                            <span class="mm-badge-origin">🇮🇩 Susu Kolostrum Pertama Buatan Indonesia</span>
                            <h1>
                                Kebaikan tetes emas pertama,<br />
                                <span>sekarang buatan Indonesia.</span>
                            </h1>
                            <p class="mm-lead">
                                Laili Milkmee menghadirkan susu kolostrum bubuk 600gr dengan kandungan alami untuk
                                mendukung daya tahan tubuh keluarga — diproses dan diproduksi langsung di Indonesia.
                            </p>

                            <ul class="mm-trust-row">
                                <li><IconCheck /> Terdaftar BPOM*</li>
                                <li><IconCheck /> Halal MUI*</li>
                                <li><IconCheck /> 100% Original</li>
                            </ul>

                            <div class="mm-price-card">
                                <div>
                                    <div class="mm-price-old">Rp 250.000</div>
                                    <div class="mm-price-new">Rp 179.000</div>
                                </div>
                                <span class="mm-price-tag">Hemat 28%</span>
                            </div>
                            <p class="mm-hero-note">
                                *Harga &amp; sertifikasi contoh — sesuaikan dengan data resmi produk sebelum publikasi.
                                Netto 600gr / kaleng.
                            </p>

                            <div class="mm-cta-row">
                                <a href={waUrl} class="mm-btn-primary" target="_blank" rel="noopener">
                                    <IconWA />
                                    Pesan via WhatsApp
                                </a>
                                <a href="#manfaat" class="mm-btn-ghost">Lihat manfaat ↓</a>
                            </div>
                        </div>

                        <div class="mm-hero-visual">
                            <div class="mm-halo" />
                            <div class="mm-falling-drop" />
                            <div class="mm-ripple" />
                            <div class="mm-can-wrap">
                                <svg width="220" height="280" viewBox="0 0 220 280" fill="none">
                                    <ellipse cx="110" cy="258" rx="76" ry="14" fill="#3B090C" opacity="0.12" />
                                    <path d="M40 60h140v168a20 20 0 0 1-20 20H60a20 20 0 0 1-20-20V60Z" fill="#6B1015" />
                                    <path d="M40 60h140v22H40Z" fill="#DCA312" />
                                    <ellipse cx="110" cy="60" rx="70" ry="14" fill="#8A151B" />
                                    <ellipse cx="110" cy="48" rx="70" ry="14" fill="#A81A21" />
                                    <rect x="52" y="108" width="116" height="92" rx="10" fill="#FFFDF8" />
                                    <text x="110" y="140" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="800" font-size="19" fill="#6B1015">LAILI</text>
                                    <text x="110" y="162" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="700" font-size="12" fill="#B4850B" letter-spacing="2">MILKMEE</text>
                                    <text x="110" y="186" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="600" font-size="10" fill="#6B494B">SUSU KOLOSTRUM · 600gr</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= STRIP ================= */}
                <div class="mm-strip">
                    <div class="mm-container mm-strip-inner">
                        <div class="mm-strip-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4Z" />
                            </svg>
                            Produk asli &amp; bergaransi
                        </div>
                        <div class="mm-strip-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 3" />
                            </svg>
                            Diproses higienis
                        </div>
                        <div class="mm-strip-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            </svg>
                            Netto 600gr / kaleng
                        </div>
                        <div class="mm-strip-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m3 11 18-5v12L3 14v-3Z" />
                            </svg>
                            Dikirim ke seluruh Indonesia
                        </div>
                    </div>
                </div>

                {/* ================= MANFAAT ================= */}
                <section class="mm-section" id="manfaat">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"><span class="mm-drop" /> Kenapa kolostrum</span>
                            <h2>Satu tetes pertama, sejuta manfaat</h2>
                            <p>Kolostrum dikenal sebagai "cairan emas" karena kepadatan nutrisinya. Berikut manfaat yang biasa dicari dari susu kolostrum untuk keluarga.</p>
                        </div>

                        <div class="mm-benefit-grid">
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
                                    </svg>
                                </div>
                                <h3>Mendukung daya tahan tubuh</h3>
                                <p>Mengandung imunoglobulin alami yang berperan mendukung sistem imun sehari-hari.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2v20M2 12h20" />
                                    </svg>
                                </div>
                                <h3>Bantu pertumbuhan sel</h3>
                                <p>Growth factor alami dapat mendukung regenerasi dan pertumbuhan jaringan tubuh.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M8 13c1 1.5 2.5 2 4 2s3-.5 4-2" />
                                    </svg>
                                </div>
                                <h3>Menjaga kesehatan pencernaan</h3>
                                <p>Membantu menjaga keseimbangan sistem pencernaan agar tetap nyaman.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M4 21V9l8-6 8 6v12M9 21v-6h6v6" />
                                    </svg>
                                </div>
                                <h3>Sumber protein &amp; kalsium</h3>
                                <p>Membantu memenuhi kebutuhan nutrisi harian untuk anak hingga dewasa.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 3v4M5 7l2.5 2.5M19 7l-2.5 2.5M3 14h4M17 14h4M7.5 19 5 21.5M16.5 19l2.5 2.5M12 21v-4" />
                                    </svg>
                                </div>
                                <h3>Praktis diseduh kapan saja</h3>
                                <p>Bubuk mudah larut, cukup diseduh air hangat sesuai takaran anjuran.</p>
                            </div>
                            <div class="mm-benefit-card">
                                <div class="mm-benefit-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2 3 7v6c0 5 3.8 8.7 9 9 5.2-.3 9-4 9-9V7l-9-5Z" />
                                    </svg>
                                </div>
                                <h3>Bangga buatan Indonesia</h3>
                                <p>Diproduksi di dalam negeri sebagai bagian dari kemandirian nutrisi bangsa.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= KENAPA BERBEDA ================= */}
                <section class="mm-section-alt">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"><span class="mm-drop" /> Perbandingan</span>
                            <h2>Laili Milkmee vs. susu bubuk biasa</h2>
                        </div>
                        <div class="mm-compare">
                            <div class="mm-compare-card no">
                                <h3>Susu bubuk biasa</h3>
                                <ul class="mm-compare-list">
                                    <li><IconX /> Tanpa kandungan kolostrum</li>
                                    <li><IconX /> Umumnya produk impor</li>
                                    <li><IconX /> Formulasi generik</li>
                                </ul>
                            </div>
                            <div class="mm-compare-card yes">
                                <h3>Laili Milkmee</h3>
                                <ul class="mm-compare-list">
                                    <li><IconCheck /> Diperkaya kolostrum alami</li>
                                    <li><IconCheck /> Diproduksi langsung di Indonesia</li>
                                    <li><IconCheck /> Kemasan 600gr, hemat untuk sebulan</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= CARA SAJI ================= */}
                <section class="mm-section">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"><span class="mm-drop" /> Cara penyajian</span>
                            <h2>Siap diminum dalam 3 langkah</h2>
                        </div>
                        <div class="mm-steps">
                            <div class="mm-step">
                                <h3>Siapkan air hangat</h3>
                                <p>Tuang ±150ml air hangat (bukan mendidih) ke dalam gelas bersih.</p>
                            </div>
                            <div class="mm-step">
                                <h3>Takar &amp; seduh</h3>
                                <p>Masukkan bubuk sesuai takaran saji yang tertera pada kemasan.</p>
                            </div>
                            <div class="mm-step">
                                <h3>Aduk rata &amp; sajikan</h3>
                                <p>Aduk hingga larut sempurna, dan susu siap dinikmati keluarga.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= TESTIMONI ================= */}
                <section class="mm-section-alt">
                    <div class="mm-container">
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"><span class="mm-drop" /> Kata pelanggan</span>
                            <h2>Contoh testimoni</h2>
                        </div>
                        <div class="mm-testi-grid">
                            <div class="mm-testi-card">
                                <div class="mm-stars">★★★★★</div>
                                <p class="mm-quote">"Rasanya enak dan mudah larut, jadi rutinitas pagi keluarga saya."</p>
                                <div class="mm-testi-who">
                                    <div class="mm-avatar">R</div>
                                    <span>Ratna, Surabaya</span>
                                </div>
                            </div>
                            <div class="mm-testi-card">
                                <div class="mm-stars">★★★★★</div>
                                <p class="mm-quote">"Senang ada produk lokal dengan kualitas yang meyakinkan."</p>
                                <div class="mm-testi-who">
                                    <div class="mm-avatar">D</div>
                                    <span>Dimas, Malang</span>
                                </div>
                            </div>
                            <div class="mm-testi-card">
                                <div class="mm-stars">★★★★★</div>
                                <p class="mm-quote">"Pengiriman cepat dan kemasan rapi, akan repeat order."</p>
                                <div class="mm-testi-who">
                                    <div class="mm-avatar">S</div>
                                    <span>Sinta, Sidoarjo</span>
                                </div>
                            </div>
                        </div>
                        <p class="mm-testi-note">
                            Testimoni di atas contoh tampilan — ganti dengan ulasan asli dari pembeli Shopee sebelum publikasi.
                        </p>
                    </div>
                </section>

                {/* ================= PROMO / CTA ================= */}
                <section class="mm-section">
                    <div class="mm-container">
                        <div class="mm-promo-wrap">
                            <span class="mm-eyebrow" style={{ color: "var(--gold-300)" }}>
                                <span class="mm-drop" /> Promo terbatas
                            </span>
                            <h2>Klaim harga promo sebelum waktu habis</h2>
                            <p class="mm-promo-sub">Stok dan harga promo berlaku selama periode berikut.</p>

                            <Countdown />

                            <div class="mm-promo-price">
                                <span class="mm-promo-old">Rp 250.000</span>
                                <span class="mm-promo-new">Rp 179.000</span>
                            </div>

                            <a href={waUrl} class="mm-btn-primary mm-promo-btn" target="_blank" rel="noopener">
                                <IconWA />
                                Chat &amp; Pesan via WhatsApp
                            </a>
                        </div>
                    </div>
                </section>

                {/* ================= FAQ ================= */}
                <section class="mm-section">
                    <div class="mm-container" style={{ "max-width": "760px" }}>
                        <div class="mm-section-head">
                            <span class="mm-eyebrow"><span class="mm-drop" /> FAQ</span>
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
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.6 6.3A8.9 8.9 0 0 0 12 4a8.9 8.9 0 0 0-7.7 13.4L3 21l3.7-1.3A8.9 8.9 0 0 0 12 21a8.9 8.9 0 0 0 5.6-15.7ZM12 19.3a7.3 7.3 0 0 1-3.7-1l-.3-.2-2.7 1 .9-2.6-.2-.3A7.4 7.4 0 1 1 19.4 12 7.4 7.4 0 0 1 12 19.3Z" />
                    </svg>
                </a>

                {/* ================= FOOTER ================= */}
                <footer class="mm-footer">
                    <div class="mm-container">
                        <div class="mm-footer-top">
                            <div>
                                <div class="mm-footer-logo">
                                    <span class="mm-drop" /> Laili Milkmee
                                </div>
                                <p class="mm-footer-note">
                                    Susu kolostrum bubuk 600gr, diproduksi di Indonesia. Halaman ini adalah materi promosi
                                    dan bukan pengganti anjuran tenaga medis.
                                </p>
                            </div>
                            <div>
                                <p class="mm-footer-contact-title">Hubungi kami</p>
                                <a href={waUrl} target="_blank" rel="noopener" class="mm-footer-wa-link">
                                    Chat via WhatsApp →
                                </a>
                            </div>
                        </div>
                        <div class="mm-footer-bottom">
                            <span>© 2026 Laili Milkmee. Konten &amp; harga contoh, sesuaikan sebelum digunakan.</span>
                            <span>Dibuat untuk keperluan promosi produk.</span>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}