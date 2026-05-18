import { onMount } from "solid-js";
import { Title, Link, Meta } from "@solidjs/meta";
import "./waiteu.css";

export default function WaiteuLandingPage() {
    onMount(() => {
        // Scroll reveal
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('visible'), i * 80);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        reveals.forEach(el => observer.observe(el));

        // Stagger children of grids
        document.querySelectorAll('.pain-grid, .benefits-grid, .awards-grid, .reasons-list').forEach(grid => {
            Array.from(grid.children).forEach((child, i) => {
                (child as HTMLElement).style.transitionDelay = `${i * 0.08}s`;
                child.classList.add('reveal');
                observer.observe(child);
            });
        });
    });

    return (
        <>
            <Title>Laili WAITEU – Whitening Injection in One Drink | Kulit Putih, Glowing & Kenyal Tanpa Suntik</Title>

            {/* SEO & Standard Meta Tags */}
            <Meta name="description" content="Dapatkan kulit putih, glowing, kenyal, dan sehat secara alami dengan Laili WAITEU. Setara 3x whitening injection di klinik, 100% original, BPOM, Halal MUI, dan bersertifikasi ISO 22000. Hubungi reseller resmi kami sekarang!" />
            <Meta name="keywords" content="laili waiteu, waiteu collagen, collagen drink, minuman kolagen, pemutih kulit alami, suntik putih klinik, suplemen pemutih BPOM, waiteu original, reseller waiteu" />
            <Meta name="author" content="Aminah Jaya - Reseller Resmi Laili WAITEU" />
            <Meta name="theme-color" content="#C9A96E" />

            {/* Open Graph (Facebook / WA / Telegram) */}
            <Meta property="og:title" content="Laili WAITEU – Kulit Putih, Glowing & Kenyal Tanpa Suntik" />
            <Meta property="og:description" content="Minuman kolagen premium setara 3x whitening injection di klinik kecantikan. Praktis, terjangkau, BPOM, dan Halal MUI. Dapatkan dari reseller resmi sekarang!" />
            <Meta property="og:image" content="/whaiteu_colagen1.png" />
            <Meta property="og:type" content="website" />
            <Meta property="og:url" content="https://promo.aminahjaya.com/waiteu" />
            <Meta property="og:site_name" content="Aminah Jaya Laili WAITEU" />

            {/* Twitter Card */}
            <Meta name="twitter:card" content="summary_large_image" />
            <Meta name="twitter:title" content="Laili WAITEU – Kulit Putih, Glowing & Kenyal Tanpa Suntik" />
            <Meta name="twitter:description" content="Dapatkan kulit putih setara 3x whitening injection secara alami & praktis dengan Laili WAITEU. 100% BPOM & Halal." />
            <Meta name="twitter:image" content="/whaiteu_colagen1.png" />

            <Link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap"
                rel="stylesheet"
            />

            {/* TOP BAR */}
            <div class="topbar">
                ✨ Reseller Resmi Laili WAITEU — <span>Bisa Beli Per 1 Box!</span>{" | "} Produk Original BPOM & Halal MUI
            </div>

            {/* HERO */}
            <section class="hero">
                <div class="hero-grain"></div>
                <div class="hero-inner">
                    <div class="hero-content">
                        <div class="hero-badge">✦ Whitening Injection in One Drink</div>
                        <h1 class="hero-title">
                            Kulit Putih,<br />
                            <span class="accent">Glowing & Kenyal</span><br />
                            Tanpa Suntik
                        </h1>
                        <p class="hero-subtitle">Setara 3x Injeksi Pencerah di Klinik</p>
                        <p class="hero-desc">
                            Laili WAITEU menghadirkan teknologi whitening injection dalam satu gelas minuman kolagen premium —
                            lebih praktis, lebih terjangkau, dan tanpa efek ketergantungan.
                        </p>
                        <div class="hero-cta">
                            <a href="https://api.whatsapp.com/send?phone=62895634039130&text=Halo Kak, Saya dapat info dari Landing Page, saya mau order Laili Waiteu agar kulit saya licin, kinclong and sehat. Tolong segera balas chat ini ya Kak 🙏😊"
                                class="btn-primary" target="_blank">
                                <span class="btn-wa-icon"><img src="/icons8-whatsapp-96.png" alt="WhatsApp" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;" /></span>
                                ORDER SEKARANG
                            </a>
                            <span class="hero-note">✓ BPOM Terdaftar (Brand) · ✓ Halal MUI (Brand) · ✓
                                Reseller Resmi · <span style="color:var(--gold);">✓ Bisa Beli Per 1
                                    Box</span></span>
                        </div>
                    </div>
                    <div class="hero-visual">
                        <div class="hero-img-wrap">
                            <img src="https://waiteu.lailibrand.id/assets/images/laili-waiteu-2000x695.png"
                                alt="Laili WAITEU Product" style="border-radius:14px;" />
                        </div>
                        <div class="hero-stats">
                            <div class="stat-card">
                                <span class="stat-num">30 Jt</span>
                                <span class="stat-label">Box Terjual (Brand)</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-num">13 Jt</span>
                                <span class="stat-label">Pengguna (Brand)</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-num">48</span>
                                <span class="stat-label">Minggu (Brand)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PAIN POINTS */}
            <section class="pain">
                <div class="section-eyebrow">Kenali Masalah Kulitmu</div>
                <h2 class="section-title">Apakah Kamu Sedang<br />Mengalami Ini?</h2>
                <p class="section-sub">Masalah kulit bukan hanya soal penampilan — ini soal kepercayaan dirimu setiap hari.
                    Sudah saatnya bertindak.</p>

                <div class="pain-grid reveal">
                    <div class="pain-card">
                        <img src="https://waiteu.lailibrand.id/assets/images/mbr-561x374.jpg" alt="Jerawat" />
                        <div class="pain-card-body">
                            <div class="pain-card-title">😣 Jerawat Membandel</div>
                            <div class="pain-card-desc">Sudah coba banyak produk tapi jerawat terus muncul kembali?</div>
                        </div>
                    </div>
                    <div class="pain-card">
                        <img src="https://waiteu.lailibrand.id/assets/images/everything-you-need-to-know-about-hyperpigmentation-vs-melasma-506x506.png"
                            alt="Flek Hitam" />
                        <div class="pain-card-body">
                            <div class="pain-card-title">🌑 Flek & Hiperpigmentasi</div>
                            <div class="pain-card-desc">Bekas jerawat dan flek hitam yang susah hilang bikin nggak percaya diri?
                            </div>
                        </div>
                    </div>
                    <div class="pain-card">
                        <img src="https://waiteu.lailibrand.id/assets/images/sensitive-skin-what-it-looks-like-what-can-cause-it-and-what-you-can-do-to-make-it-stop-506x759.jpeg"
                            alt="Kulit Sensitif" />
                        <div class="pain-card-body">
                            <div class="pain-card-title">🌅 Kulit Sensitif & Merah</div>
                            <div class="pain-card-desc">Kulit mudah merah dan terbakar saat terkena sinar matahari?</div>
                        </div>
                    </div>
                    <div class="pain-card">
                        <img src="https://waiteu.lailibrand.id/assets/images/skin-cancer-on-the-lip-is-especially-dangerous-506x314.jpg"
                            alt="Kanker Kulit" />
                        <div class="pain-card-body">
                            <div class="pain-card-title">⚠️ Risiko Kanker Kulit</div>
                            <div class="pain-card-desc">Paparan radikal bebas yang tidak dilawan bisa berujung serius.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SOLUTION */}
            <section class="solution">
                <div class="section-eyebrow">Solusi Terbukti</div>
                <h2 class="section-title" style="color:white;">Laili WAITEU Jawabannya</h2>
                <div class="gold-divider"><span class="gold-divider-icon">✦</span></div>
                <p class="solution-highlight">
                    "Minuman Kolagen Premium dengan kandungan setara<br />3 kali suntik putih di klinik kecantikan"
                </p>
                <div class="product-showcase reveal">
                    <img src="https://waiteu.lailibrand.id/assets/images/produk-2-backup-597x1223.png" alt="Produk Laili WAITEU"
                        style="max-width:320px;margin:0 auto;display:block;" />
                </div>
                <a href="https://api.whatsapp.com/send?phone=62895634039130&text=Halo Kak, Saya dapat info dari Landing Page, saya mau order Laili Waiteu agar kulit saya licin, kinclong and sehat. Tolong segera balas chat ini ya Kak 🙏😊"
                    class="btn-primary" target="_blank" style="margin:0 auto;display:inline-flex;align-items:center;gap:8px;">
                    <img src="/icons8-whatsapp-96.png" alt="WhatsApp" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;" /> ORDER SEKARANG
                </a>
            </section>

            {/* COMPARISON */}
            <section class="compare">
                <div class="compare-inner">
                    <div style="text-align:center;">
                        <div class="section-eyebrow">Perbandingan Nyata</div>
                        <h2 class="section-title">Lebih Hemat, Lebih Efektif</h2>
                        <p class="section-sub" style="max-width:560px;margin:0 auto 0;">Lihat sendiri perbandingan antara
                            injeksi di klinik vs Laili WAITEU yang bisa kamu minum di rumah.</p>
                    </div>

                    <div class="compare-wrap reveal">
                        {/* INJEKSI */}
                        <div class="compare-col">
                            <div class="compare-header injeksi">
                                <h3>💉 Injeksi Pencerah</h3>
                                <p>Di Klinik Kecantikan</p>
                            </div>
                            <div class="compare-body">
                                <div class="compare-row">
                                    <span class="label">Per Injeksi</span>
                                    <span class="value">1 Glutation + 1000mg Vit C + 1000mg Kolagen</span>
                                </div>
                                <div class="compare-row">
                                    <span class="label">Fase 1</span>
                                    <span class="value">12× suntik (3 bulan)</span>
                                </div>
                                <div class="compare-row">
                                    <span class="label">Fase 2</span>
                                    <span class="value">6× suntik (3–6 bulan)</span>
                                </div>
                                <div class="compare-row">
                                    <span class="label">Fase 3</span>
                                    <span class="value">6–12× suntik (6–12 bulan)</span>
                                </div>
                                <div class="compare-row">
                                    <span class="label">Total</span>
                                    <span class="value">24–30 kali kunjungan klinik</span>
                                </div>
                            </div>
                        </div>

                        {/* WAITEU */}
                        <div class="compare-col">
                            <div class="compare-header waiteu">
                                <h3>✨ Laili WAITEU</h3>
                                <p>1 Box = 150gr | Setara 3 Injeksi</p>
                            </div>
                            <div class="compare-body">
                                <div class="compare-row">
                                    <span class="label">Per Box</span>
                                    <span class="value gold">3 Glutation + 30.000mg Kolagen + 3000mg Vit C</span>
                                </div>
                                <div class="compare-row">
                                    <span class="label">Fase 1</span>
                                    <span class="value gold">Cukup 4 Box 🎉</span>
                                </div>
                                <div class="compare-row">
                                    <span class="label">Fase 2</span>
                                    <span class="value gold">Cukup 2 Box 🎉</span>
                                </div>
                                <div class="compare-row">
                                    <span class="label">Fase 3</span>
                                    <span class="value gold">Cukup 2–4 Box 🎉</span>
                                </div>
                                <div class="compare-row" style="flex-direction:column;gap:6px;">
                                    <span class="label">Keuntungan</span>
                                    <span class="compare-badge">3× LEBIH TERJANGKAU</span>
                                    <span class="compare-badge"
                                        style="background:linear-gradient(135deg,#E8B4A0,#C47A65);">MINUM DI RUMAH</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BENEFITS / DOSING */}
            <section class="benefits">
                <div class="section-eyebrow">Disesuaikan Untuk Kamu</div>
                <h2 class="section-title">Pilih Sesuai<br />Masalah Kulitmu</h2>

                <div class="benefits-grid reveal">
                    <div class="benefit-card">
                        <div class="benefit-icon">🤍</div>
                        <div class="benefit-label">Memelihara</div>
                        <div class="benefit-title">Kulit Putih</div>
                        <div class="benefit-dose">8g / seduh · 2×/hari<br />1 box = 9 hari</div>
                    </div>
                    <div class="benefit-card">
                        <div class="benefit-icon">✨</div>
                        <div class="benefit-label">Mencerahkan</div>
                        <div class="benefit-title">Kulit Kusam</div>
                        <div class="benefit-dose">10g / seduh · 2×/hari<br />1 box = 7 hari</div>
                    </div>
                    <div class="benefit-card">
                        <div class="benefit-icon">🌟</div>
                        <div class="benefit-label">Mencerahkan</div>
                        <div class="benefit-title">Kulit Gelap</div>
                        <div class="benefit-dose">15g / seduh · 2×/hari<br />1 box = 5 hari</div>
                    </div>
                    <div class="benefit-card">
                        <div class="benefit-icon">💆</div>
                        <div class="benefit-label">Mengatasi</div>
                        <div class="benefit-title">Kulit Berjerawat</div>
                        <div class="benefit-dose">15g / seduh · 3×/hari<br />1 box = 3 hari</div>
                    </div>
                    <div class="benefit-card">
                        <div class="benefit-icon">🛡️</div>
                        <div class="benefit-label">Perlindungan</div>
                        <div class="benefit-title">Lawan Radikal Bebas</div>
                        <div class="benefit-dose">Antioksidan tinggi untuk proteksi kulit dari dalam</div>
                    </div>
                </div>
            </section>

            {/* AWARDS */}
            <section class="awards">
                <div class="section-eyebrow">Pengakuan Resmi</div>
                <h2 class="section-title">Penghargaan Nasional<br />& Internasional</h2>

                <div class="awards-grid reveal">
                    <div class="award-item">
                        <div class="award-icon">🏆</div>
                        <div class="award-name">Best Selling Product</div>
                        <div class="award-year">2020</div>
                    </div>
                    <div class="award-item">
                        <div class="award-icon">👑</div>
                        <div class="award-name">Best High Collagen Drink Indonesia</div>
                        <div class="award-year">2020</div>
                    </div>
                    <div class="award-item">
                        <div class="award-icon">🎖️</div>
                        <div class="award-name">Beauty & Healthy Award Winner</div>
                        <div class="award-year">2020</div>
                    </div>
                    <div class="award-item">
                        <div class="award-icon">🥇</div>
                        <div class="award-name">No. 1 Products & Brand Winner</div>
                        <div class="award-year">2020</div>
                    </div>
                    <div class="award-item">
                        <div class="award-icon">✅</div>
                        <div class="award-name">Merk Bisnis Terpercaya</div>
                        <div class="award-year">2020</div>
                    </div>
                    <div class="award-item">
                        <div class="award-icon">🔬</div>
                        <div class="award-name">ISO 22000 Certified</div>
                        <div class="award-year">International</div>
                    </div>
                </div>
            </section>

            {/* SAFETY */}
            <section class="safety">
                <div class="safety-inner">
                    <div class="section-eyebrow">Aman & Terpercaya</div>
                    <h2 class="section-title">100% Aman untuk<br />Semua Kalangan</h2>

                    <div class="safety-cards reveal">
                        <div class="safety-card">
                            <div class="safety-icon">👶</div>
                            <div class="safety-title">Segala Usia</div>
                            <div class="safety-desc">Aman untuk wanita dan pria mulai usia 17 tahun ke atas.</div>
                        </div>
                        <div class="safety-card">
                            <div class="safety-icon">🤰</div>
                            <div class="safety-title">Ibu Hamil & Menyusui</div>
                            <div class="safety-desc">Dapat dikonsumsi ibu hamil dan menyusui dengan konsultasi dokter.*</div>
                        </div>
                        <div class="safety-card">
                            <div class="safety-icon">💉</div>
                            <div class="safety-title">Penderita Diabetes</div>
                            <div class="safety-desc">Formula aman untuk penderita diabetes mellitus.</div>
                        </div>
                    </div>

                    <div class="cert-strip reveal">
                        <div class="cert-badge">
                            <div class="cert-label">Terdaftar</div>
                            <div class="cert-name">BPOM RI</div>
                        </div>
                        <div class="cert-badge">
                            <div class="cert-label">Tersertifikasi</div>
                            <div class="cert-name">HALAL MUI</div>
                        </div>
                        <div class="cert-badge">
                            <div class="cert-label">Standar</div>
                            <div class="cert-name">ISO 22000</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 10 REASONS */}
            <section class="reasons">
                <div class="reasons-inner">
                    <div class="section-eyebrow">Masih Ragu?</div>
                    <h2 class="section-title">10 Alasan Kamu<br />Harus Pilih Laili WAITEU</h2>
                    <p class="section-sub" style="margin-bottom:0;">Plus <strong style="color:var(--gold-dark)">1 keunggulan
                        eksklusif</strong> kalau beli lewat kami 👇</p>

                    <div class="reasons-list reveal">
                        <div class="reason-item">
                            <span class="reason-num">01</span>
                            <span class="reason-text">Kandungan <strong>100% PREMIUM</strong> — Glutation, Kolagen Peptida Ikan,
                                Vitamin C dosis tinggi.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">02</span>
                            <span class="reason-text"><strong>3× LEBIH TERJANGKAU</strong> dibanding suntik putih di klinik
                                kecantikan manapun.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">03</span>
                            <span class="reason-text">Brand Laili WAITEU telah dibuktikan oleh <strong>13 JUTA WANITA</strong>
                                dari seluruh penjuru Indonesia — data resmi dari pihak brand.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">04</span>
                            <span class="reason-text"><strong>SATU-SATUNYA</strong> minuman kolagen setara dengan 3× injeksi
                                pencerah dalam satu box.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">05</span>
                            <span class="reason-text">Cocok untuk yang <strong>serius</strong> ingin kulit lebih cerah, glowing,
                                dan kenyal.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">06</span>
                            <span class="reason-text"><strong>Menangkal radikal bebas</strong> dan melindungi kulit dari ancaman
                                kanker kulit.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">07</span>
                            <span class="reason-text">Membantu mengurangi <strong>kolesterol, asam urat, dan nyeri
                                sendi</strong> sekaligus.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">08</span>
                            <span class="reason-text">Membantu membangun <strong>kadar kolagen tubuh</strong> secara alami dari
                                dalam.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">09</span>
                            <span class="reason-text"><strong>Menguatkan tulang</strong> dengan kandungan Kolagen Peptide Ikan
                                berkualitas tinggi.</span>
                        </div>
                        <div class="reason-item">
                            <span class="reason-num">10</span>
                            <span class="reason-text"><strong>TANPA KETERGANTUNGAN</strong> — hasil permanen, bukan
                                sementara.</span>
                        </div>
                        <div class="reason-item"
                            style="grid-column:1/-1;border:2px solid var(--gold);background:linear-gradient(135deg,#FEF8EE,#FAF0DC);">
                            <span class="reason-num" style="color:var(--rose-deep);">✦</span>
                            <span class="reason-text">
                                <strong style="color:var(--gold-dark);font-size:15px;">EKSKLUSIF BELI LEWAT KAMI — Bisa Per 1
                                    Box!</strong><br />
                                <span style="color:var(--text-muted);font-size:13px;">Website resmi hanya menjual paket 10 box.
                                    Di sini kamu bisa mulai dari <strong>1 box saja</strong> — cocok untuk yang ingin coba dulu
                                    sebelum lanjut. Lebih fleksibel, lebih ringan di kantong!</span>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROMO CTA */}
            <section class="promo">
                <div class="promo-inner">
                    <div class="promo-label">✨ KEUNGGULAN BELI LEWAT RESELLER KAMI</div>
                    <h2 class="promo-title">
                        Mulai dari<br />
                        <span class="gold">1 Box Saja!</span><br />
                        Tanpa Harus Beli 10 Box
                    </h2>

                    <div class="promo-price">
                        <div class="price-original">Website resmi hanya jual paket 10 box sekaligus</div>
                        <div class="price-new" style="font-size:clamp(28px,4vw,48px);margin-bottom:12px;">Beli Sesuai
                            Kebutuhanmu</div>
                        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px;">
                            <span class="price-savings" style="background:var(--gold-dark);">✓ Mulai 1 Box</span>
                            <span class="price-savings" style="background:var(--rose-deep);">✓ Harga Bersaing</span>
                            <span class="price-savings" style="background:#5A8A6A;">✓ Produk Original</span>
                        </div>
                    </div>

                    <p class="promo-desc">
                        Mau coba dulu 1 box sebelum lanjut? Boleh banget! Kami adalah reseller resmi Laili WAITEU yang melayani
                        pembelian mulai dari 1 box. Hubungi kami untuk info harga terkini dan ketersediaan stok.
                    </p>

                    <a href="https://api.whatsapp.com/send?phone=62895634039130&text=Halo Kak, Saya dapat info dari Landing Page, saya mau order Laili Waiteu agar kulit saya licin, kinclong and sehat. Tolong segera balas chat ini ya Kak 🙏😊"
                        class="btn-wa" target="_blank">
                        <span><img src="/icons8-whatsapp-96.png" alt="WhatsApp" style="width: 32px; height: 32px; display: inline-block; vertical-align: middle;" /></span>
                        <div class="btn-wa-text">
                            ORDER VIA WHATSAPP
                            <small>Reseller Resmi · Produk Original Brand</small>
                        </div>
                    </a>

                    <div class="promo-guarantee">
                        <span>🔒</span> Produk original dari Reseller Resmi Laili WAITEU
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer class="footer">
                <div class="footer-logo">Laili WAITEU</div>
                <div class="footer-tagline">Beauty Orangnya, Milyaran Penghasilannya, Berkah Rezekinya</div>

                <div class="footer-social">
                    <a href="https://www.instagram.com/lailibrand/" target="_blank">📸 Instagram</a>
                    <a href="https://www.facebook.com/laili.purnama.7" target="_blank">👍 Facebook</a>
                    <a href="https://www.tiktok.com/@laili_purnama" target="_blank">🎵 TikTok</a>
                    <a href="https://www.youtube.com/@lailipur" target="_blank">▶️ YouTube</a>
                </div>

                <div class="footer-bottom">
                    © 2026 Laili WAITEU · Halaman ini dikelola oleh <strong style="color:rgba(250,246,239,0.4)">Reseller Resmi
                        Laili WAITEU</strong> — bukan website resmi brand.<br />
                    Sertifikasi BPOM, Halal MUI, ISO 22000, penghargaan, dan data penjualan adalah milik PT/Brand Laili WAITEU
                    resmi.<br />
                    Data statistik (30 juta box, 13 juta pengguna) bersumber dari materi resmi brand Laili WAITEU.
                    <br />
                    <a target="_blank" href="https://icons8.com/icon/QkXeKixybttw/whatsapp">WhatsApp</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
                </div>
            </footer>

            {/* FLOATING CTA */}
            <div class="floating-cta">
                <a href="https://api.whatsapp.com/send?phone=62895634039130&text=Halo Kak, Saya dapat info dari Landing Page, saya mau order Laili Waiteu agar kulit saya licin, kinclong and sehat. Tolong segera balas chat ini ya Kak 🙏😊"
                    class="floating-btn" target="_blank">
                    <div class="floating-dot"></div>
                    <span class="text">ORDER SEKARANG</span>
                    <span><img src="/icons8-whatsapp-96.png" alt="WhatsApp" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle;" /></span>
                </a>
            </div>
        </>
    );
}
