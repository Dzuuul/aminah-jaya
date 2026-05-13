import { For } from "solid-js";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

export default function SuccessPage() {
  const orderId = "AJ-" + Math.floor(Math.random() * 900000 + 100000);
  
  return (
    <>
      <Navbar />
      <main class="cart-page">
        <div class="container">
          {/* Progress Steps */}
          <div class="cart-steps">
            <div class="step">
              <span class="step-num">1</span>
              <span>Keranjang belanja</span>
            </div>
            <div class="step-line"></div>
            <div class="step">
              <span class="step-num">2</span>
              <span>Checkout</span>
            </div>
            <div class="step-line"></div>
            <div class="step active">
              <span class="step-num">3</span>
              <span>Ulasan</span>
            </div>
          </div>

          <div class="success-card">
            <div class="success-icon-wrapper">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 class="success-title">Pesanan Berhasil!</h1>
            <p class="success-subtitle">Terima kasih telah berbelanja di Aminah Jaya. Pesanan Anda sedang kami proses.</p>

            <div style={{ "margin-bottom": "40px" }}>
              <p style={{ "font-size": "0.9rem", "font-weight": "600", "margin-bottom": "10px" }}>Berikan ulasan pengalaman belanja Anda:</p>
              <div style={{ "display": "flex", "gap": "8px", "justify-content": "center", "color": "#fbbf24" }}>
                <For each={[1, 2, 3, 4, 5]}>
                  {() => (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                  )}
                </For>
              </div>
            </div>

            <div class="order-details-card">
              <div class="order-details-row">
                <span class="order-details-label">ID Pesanan</span>
                <span class="order-details-value">{orderId}</span>
              </div>
              <div class="order-details-row">
                <span class="order-details-label">Metode Pembayaran</span>
                <span class="order-details-value">BCA Virtual Account</span>
              </div>
              <div class="order-details-row">
                <span class="order-details-label">Total Pembayaran</span>
                <span class="order-details-value">Rp 2.999.000</span>
              </div>
              <div class="order-details-row">
                <span class="order-details-label">Estimasi Pengiriman</span>
                <span class="order-details-value">2-5 Hari Kerja</span>
              </div>
            </div>

            <div class="success-actions">
              <a href="/" class="btn btn-primary">
                Beranda
              </a>
              <a href="#produk" class="btn btn-outline">
                Lihat Produk Lain
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
