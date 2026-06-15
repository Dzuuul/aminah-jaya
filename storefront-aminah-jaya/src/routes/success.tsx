import { For, Show, createResource, createSignal } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { formatCurrency, getOrderByNumber } from "~/lib/api";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  
  const getParam = (key: string): string => {
    const val = searchParams[key];
    if (!val) return "";
    return Array.isArray(val) ? val[0] : val;
  };
  
  const orderNumber = () => {
    const on = getParam("order_number");
    return on || false;
  };

  const [order, { refetch }] = createResource<any, string>(
    orderNumber, 
    getOrderByNumber
  );

  const [isRefreshing, setIsRefreshing] = createSignal(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const paymentMethodName = () => {
    const pm = order()?.payment_method || getParam("payment_method");
    if (pm === "cod") return "Cash on Delivery (COD)";
    if (pm === "qris") return "QRIS / E-Wallet";
    if (pm === "transfer") return "Bank Transfer";
    return "Metode Pembayaran";
  };
  
  const grandTotal = () => {
    if (order()) return formatCurrency(order().grand_total);
    return formatCurrency(Number(getParam("amount") || 0));
  };
  
  const shippingType = () => getParam("shipping") === "exp" ? "1-2 Hari Kerja (Ekspres)" : "2-5 Hari Kerja (Standar)";
  
  const isPaidOrCod = () => {
    if (!order()) return true; // Fallback jika tidak ada data order
    const pm = order()?.payment_method || getParam("payment_method");
    if (pm === "cod") return true;
    return order()?.payment_status === "paid" || order()?.payment_status === "success";
  };

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
              <span>Selesai</span>
            </div>
          </div>

          <Show
            when={!order.loading}
            fallback={
              <div class="success-card" style={{ padding: "100px 0", "text-align": "center" }}>
                <div class="loader" style={{ margin: "0 auto 20px", width: "40px", height: "40px", "border-radius": "50%", border: "4px solid #f3f3f3", "border-top": "4px solid #10b981", animation: "spin 1s linear infinite" }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <p>Memeriksa status pembayaran...</p>
              </div>
            }
          >
            <Show
              when={isPaidOrCod()}
              fallback={
                <div class="success-card pending-card">
                  <div class="success-icon-wrapper" style={{ "background": "#fef3c7", "color": "#d97706" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <h1 class="success-title">Menunggu Pembayaran</h1>
                  <p class="success-subtitle">Pembayaran Anda untuk pesanan <strong>{orderNumber()}</strong> belum kami terima atau masih diproses.</p>
                  
                  <div class="order-details-card" style={{ "margin-top": "20px" }}>
                    <div class="order-details-row">
                      <span class="order-details-label">Total Tagihan</span>
                      <span class="order-details-value">{grandTotal()}</span>
                    </div>
                  </div>

                  <div class="success-actions" style={{ "margin-top": "30px", "display": "flex", "gap": "1rem", "justify-content": "center", "flex-wrap": "wrap" }}>
                    <button class="btn btn-outline" onClick={handleRefresh} disabled={isRefreshing()}>
                      {isRefreshing() ? "Mengecek..." : "Cek Status Terkini"}
                    </button>
                    <a href="/profile/orders" class="btn btn-primary">
                      Ke Daftar Pesanan (Bayar Ulang)
                    </a>
                  </div>
                </div>
              }
            >
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
                    <span class="order-details-label">Nomor Pesanan</span>
                    <span class="order-details-value">{orderNumber() || "AJ-ORDER"}</span>
                  </div>
                  <div class="order-details-row">
                    <span class="order-details-label">Metode Pembayaran</span>
                    <span class="order-details-value">{paymentMethodName()}</span>
                  </div>
                  <div class="order-details-row">
                    <span class="order-details-label">Total Pembayaran</span>
                    <span class="order-details-value">{grandTotal()}</span>
                  </div>
                  <div class="order-details-row">
                    <span class="order-details-label">Estimasi Pengiriman</span>
                    <span class="order-details-value">{shippingType()}</span>
                  </div>
                </div>

                <div class="success-actions">
                  <a href="/" class="btn btn-primary">
                    Beranda
                  </a>
                  <a href="/shop" class="btn btn-outline">
                    Lihat Produk Lain
                  </a>
                </div>
              </div>
            </Show>
          </Show>
        </div>
      </main>
      <Footer />
    </>
  );
}
