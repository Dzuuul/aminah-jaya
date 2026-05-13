import { createSignal, For, createMemo } from "solid-js";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

const checkoutItems = [
  {
    id: 1,
    name: "REDMI Note 15 Black 8 GB + 128 GB",
    price: 2999000,
    quantity: 1,
    image: "📱",
  },
];

const shippingMethods = [
  { id: "std", name: "Standar", desc: "Estimasi 2-5 hari kerja", price: 0 },
  { id: "exp", name: "Ekspres", desc: "Estimasi 1-2 hari kerja", price: 25000 },
];

const paymentMethods = [
  { id: "bca", name: "BCA Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
  { id: "mandiri", name: "Mandiri Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
  { id: "gopay", name: "GoPay", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" },
  { id: "visa", name: "Kartu Kredit/Debit", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
];

export default function CheckoutPage() {
  const [items] = createSignal(checkoutItems);
  const [selectedShipping, setSelectedShipping] = createSignal("std");
  const [selectedPayment, setSelectedPayment] = createSignal("bca");

  const subtotal = createMemo(() => 
    items().reduce((acc, item) => acc + item.price * item.quantity, 0)
  );
  
  const shippingPrice = createMemo(() => 
    shippingMethods.find(m => m.id === selectedShipping())?.price || 0
  );

  const total = createMemo(() => subtotal() + shippingPrice());

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
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
            <div class="step active">
              <span class="step-num">2</span>
              <span>Checkout</span>
            </div>
            <div class="step-line"></div>
            <div class="step">
              <span class="step-num">3</span>
              <span>Ulasan</span>
            </div>
          </div>

          <div class="cart-grid">
            {/* Left Content */}
            <div class="cart-main-content">
              {/* Alamat Pengiriman */}
              <div class="checkout-section">
                <div class="checkout-section-title">
                  Alamat Pengiriman
                  <span class="edit">Ubah</span>
                </div>
                <div class="address-box">
                  <div class="address-icon" style={{ color: "var(--green-500)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div class="address-info">
                    <h4>Budi Santoso</h4>
                    <p>(+62) 812-3456-7890</p>
                    <p>Jl. Melati No. 123, Komplek Indah, Kebon Jeruk, Jakarta Barat, DKI Jakarta, 11530</p>
                  </div>
                </div>
              </div>

              {/* Metode Pengiriman */}
              <div class="checkout-section">
                <div class="checkout-section-title">Metode Pengiriman</div>
                <div class="checkout-option-list">
                  <For each={shippingMethods}>
                    {(method) => (
                      <div 
                        class={`checkout-option ${selectedShipping() === method.id ? 'active' : ''}`}
                        onClick={() => setSelectedShipping(method.id)}
                      >
                        <div class="cart-item-checkbox" style={{ 
                          "border-radius": "50%", 
                          "border": "2px solid", 
                          "border-color": selectedShipping() === method.id ? "var(--green-500)" : "#ccc",
                          "display": "flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "width": "20px",
                          "height": "20px"
                        }}>
                          {selectedShipping() === method.id && <div style={{ "width": "10px", "height": "10px", "background": "var(--green-500)", "border-radius": "50%" }}></div>}
                        </div>
                        <div class="checkout-option-info">
                          <div class="checkout-option-name">{method.name}</div>
                          <div class="checkout-option-desc">{method.desc}</div>
                        </div>
                        <div class="checkout-option-price">{method.price === 0 ? "Gratis" : formatPrice(method.price)}</div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div class="checkout-section">
                <div class="checkout-section-title">Metode Pembayaran</div>
                <div class="payment-method-grid">
                  <For each={paymentMethods}>
                    {(method) => (
                      <div 
                        class={`payment-method-card ${selectedPayment() === method.id ? 'active' : ''}`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <img src={method.logo} alt={method.name} />
                        <span>{method.name}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              {/* Review Pesanan */}
              <div class="checkout-section">
                <div class="checkout-section-title">Review Pesanan</div>
                <div class="checkout-items-list">
                  <For each={items()}>
                    {(item) => (
                      <div class="checkout-item-small">
                        <div class="checkout-item-small-img">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" stroke-width="1.5" style={{ background: "var(--green-50)", padding: "5px", "border-radius": "4px" }}>
                             <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                          </svg>
                        </div>
                        <div class="checkout-item-small-info">
                          <div class="checkout-item-small-name">{item.name}</div>
                          <div class="checkout-item-small-price">{formatPrice(item.price)}</div>
                        </div>
                        <div class="checkout-item-small-qty">x{item.quantity}</div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>

            {/* Right Summary Sidebar */}
            <div class="cart-summary">
              <div class="summary-card">
                <h2 class="summary-title">Ringkasan Pesanan</h2>
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal())}</span>
                </div>
                <div class="summary-row">
                  <span>Biaya Pengiriman</span>
                  <span style={{ "color": shippingPrice() === 0 ? "var(--green-500)" : "var(--ink)", "font-weight": "600" }}>
                    {shippingPrice() === 0 ? "Gratis" : formatPrice(shippingPrice())}
                  </span>
                </div>
                
                <div class="summary-total" style={{ "margin-top": "30px" }}>
                  <span>Total Bayar</span>
                  <span class="price" style={{ "color": "var(--green-500)" }}>{formatPrice(total())}</span>
                </div>

                <a href="/success" style={{ "text-decoration": "none", "display": "block", "margin-top": "30px" }}>
                  <button class="checkout-btn">
                    Bayar Sekarang
                  </button>
                </a>
              </div>

              <div class="benefits-card" style={{ background: "var(--green-50)", border: "1px solid var(--green-100)" }}>
                <div class="benefit-item">
                  <div class="benefit-icon" style={{ color: "var(--green-500)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div class="benefit-info">
                    <h5 style={{ color: "var(--green-700)" }}>Pembayaran Aman</h5>
                    <p>Enkripsi SSL menjamin keamanan transaksi Anda.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
