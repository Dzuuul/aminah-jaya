import { createSignal, For, createMemo } from "solid-js";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

const initialCartItems = [
  {
    id: 1,
    name: "REDMI Note 15 Black 8 GB + 128 GB",
    price: 2999000,
    quantity: 1,
    selected: true,
    image: "📱",
  },
];

const recommendedProducts = [
  {
    badge: "Baru",
    category: "Gadget",
    name: "REDMI A7 Pro 4 GB + 128 GB Sunset Orange",
    price: "Rp 1.799.000",
    imgLabel: "Redmi A7 Pro",
  },
  {
    badge: "Baru",
    category: "Aksesoris",
    name: "Xiaomi 67W Power Bank 10000mAh",
    price: "Rp 478.000",
    imgLabel: "Power Bank",
  },
  {
    category: "Gadget",
    name: "REDMI Note 15 Black 8 GB + 128 GB",
    price: "Rp 2.999.000",
    imgLabel: "Redmi Note 15",
  },
  {
    badge: "Baru",
    category: "Aksesoris",
    name: "Xiaomi Magnetic Power Bank 10000 with Built-in Cable",
    price: "Rp 598.000",
    imgLabel: "Magnetic PB",
  },
];

export default function CartPage() {
  const [items, setItems] = createSignal(initialCartItems);

  const subtotal = createMemo(() =>
    items()
      .filter(item => item.selected)
      .reduce((acc, item) => acc + item.price * item.quantity, 0)
  );

  const isAllSelected = createMemo(() =>
    items().length > 0 && items().every(item => item.selected)
  );

  const updateQuantity = (id: number, delta: number) => {
    setItems(items().map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setItems(items().filter(item => item.id !== id));
  };

  const toggleSelect = (id: number) => {
    setItems(items().map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleSelectAll = () => {
    const allSelected = isAllSelected();
    setItems(items().map(item => ({ ...item, selected: !allSelected })));
  };

  const removeSelected = () => {
    setItems(items().filter(item => !item.selected));
  };

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
            <div class="step active">
              <span class="step-num">1</span>
              <span>Keranjang belanja</span>
            </div>
            <div class="step-line"></div>
            <div class="step">
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
              <div class="cart-card">
                <div class="cart-header">
                  <div class="cart-header-left">
                    <input
                      type="checkbox"
                      class="cart-item-checkbox"
                      checked={isAllSelected()}
                      onChange={toggleSelectAll}
                    />
                    <span>Semua ({items().length})</span>
                  </div>
                  <div class="cart-header-right" onClick={removeSelected}>Hapus</div>
                </div>

                <div class="cart-items-list">
                  <For each={items()} fallback={<div style={{ "padding": "40px", "text-align": "center", "color": "var(--muted)" }}>Keranjang Anda kosong</div>}>
                    {(item) => (
                      <div class="cart-item">
                        <input
                          type="checkbox"
                          class="cart-item-checkbox"
                          checked={item.selected}
                          onChange={() => toggleSelect(item.id)}
                        />
                        <div class="cart-item-img">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12" y2="18"></line>
                          </svg>
                        </div>
                        <div class="cart-item-info">
                          <h3>{item.name}</h3>
                          <div class="cart-item-price">{formatPrice(item.price)}</div>
                        </div>
                        <div class="cart-item-actions">
                          <div class="quantity-selector">
                            <button class="quantity-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                            <input type="text" class="quantity-input" value={item.quantity} readonly />
                            <button class="quantity-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                          </div>
                          <div class="delete-btn" onClick={() => removeItem(item.id)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              {/* Recommendations Section */}
              <div class="recommendations">
                <div class="recommendations-header">
                  <span>Anda mungkin juga suka</span>
                </div>
                <div class="prod-grid">
                  <For each={recommendedProducts}>
                    {(prod) => (
                      <div class="prod-card">
                        <div class="prod-img">
                          {prod.badge && <span class="prod-badge">{prod.badge}</span>}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p>{prod.imgLabel}</p>
                        </div>
                        <div class="prod-body">
                          <div class="prod-cat">{prod.category}</div>
                          <div class="prod-name" style={{ "font-size": "0.9rem", "height": "2.4em", "overflow": "hidden" }}>{prod.name}</div>
                          <div class="prod-footer" style={{ "margin-top": "15px" }}>
                            <span class="prod-price">{prod.price}</span>
                            <button class="btn btn-primary btn-sm" style={{ "padding": "8px", "border-radius": "8px", "box-shadow": "none" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>

            {/* Right Summary Sidebar */}
            <div class="cart-summary">
              <div class="summary-card">
                <h2 class="summary-title">Total</h2>
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal())}</span>
                </div>
                <div class="summary-row">
                  <span>Biaya pengiriman <span style={{ "cursor": "help", "color": "#ccc" }}>ⓘ</span></span>
                  <span style={{ "color": "var(--green-500)", "font-weight": "600" }}>Gratis</span>
                </div>

                <div class="coupon-box">
                  <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" stroke-width="2">
                      <path d="M15 5l-1.761 1.761c-.494.494-1.165.739-1.839.739h-.3c-.674 0-1.345-.245-1.839-.739L7.5 5"></path>
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                      <path d="M2 12h20"></path>
                      <path d="M12 22V12"></path>
                      <path d="M12 7V3"></path>
                    </svg>
                    Kupon
                  </span>
                  <span>Masuk untuk melihat &gt;</span>
                </div>

                <div class="summary-total">
                  <span>Total</span>
                  <span class="price" style={{ "color": "var(--ink)" }}>{formatPrice(subtotal())}</span>
                </div>

                <a href="/checkout" style={{ "text-decoration": "none", "display": "block", "margin-top": "20px" }}>
                  <button class="checkout-btn" disabled={items().length === 0 || subtotal() === 0}>
                    Checkout ({items().filter(i => i.selected).length})
                  </button>
                </a>
              </div>

              <div class="benefits-card">
                <div class="benefits-header">
                  <h4>Manfaat belanja di aminahjaya.com</h4>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 15l-6-6-6 6"></path>
                  </svg>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                  </div>
                  <div class="benefit-info">
                    <h5>Metode pengiriman</h5>
                    <p>Estimasi pengiriman area Jawa 2-5 hari kerja, area Sumatera 4-9 hari kerja.</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7c.3 0 .6 0 .9.1"></path>
                      <polyline points="23 1 23 9 15 9"></polyline>
                    </svg>
                  </div>
                  <div class="benefit-info">
                    <h5>Layanan purnajual</h5>
                    <p>Jika ada kendala dengan pengiriman atau ketidaksesuaian pesanan, tim kami akan membantu mencari solusi terbaik bersama Anda</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                  </div>
                  <div class="benefit-info">
                    <h5>Metode pembayaran</h5>
                    <p>Check out mudah dan aman. Cepat dan praktis.</p>
                    <div class="payment-methods flex flex-wrap gap-2 mt-2">
                      <img src="https://gopay.co.id/media-kit" alt="GoPay" class="h-4 w-auto" />
                      <img src="https://midtrans.com/assets/img/icons/payment/qris.svg" alt="QRIS" class="h-4 w-auto" />
                      <img src="https://midtrans.com/assets/img/icons/payment/shopeepay.svg" alt="ShopeePay" class="h-4 w-auto" />
                      <img src="https://midtrans.com/assets/img/icons/payment/bca.svg" alt="BCA" class="h-4 w-auto" />
                      <img src="https://midtrans.com/assets/img/icons/payment/mandiri.svg" alt="Mandiri" class="h-4 w-auto" />
                    </div>
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
