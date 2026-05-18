import { createSignal, createResource, For, Show, Suspense, onMount } from "solid-js";
import { getCart, getMeCustomer, createOrder, formatCurrency, updateCustomerProfile } from "~/lib/api";
import { refetchCartCount } from "~/lib/cart-store";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";

const shippingMethods = [
  { id: "std", name: "Standar", desc: "Estimasi 2-5 hari kerja", price: 0 },
  { id: "exp", name: "Ekspres", desc: "Estimasi 1-2 hari kerja", price: 25000 },
];

const paymentMethods = [
  { id: "bca", name: "BCA Virtual Account", dbMethod: "transfer", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
  { id: "mandiri", name: "Mandiri Virtual Account", dbMethod: "transfer", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
  { id: "gopay", name: "GoPay / QRIS", dbMethod: "qris", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" },
  { id: "cod", name: "Bayar di Tempat (COD)", dbMethod: "cod", logo: "https://cdn-icons-png.flaticon.com/512/6491/6491509.png" },
];

export default function CheckoutPage() {
  const [cartItems] = createResource(
    () => typeof window !== "undefined",
    async (isClient) => {
      if (!isClient) return [];
      return await getCart();
    }
  );
  
  const [customer, setCustomer] = createSignal<any>(null);
  const [selectedShipping, setSelectedShipping] = createSignal("std");
  const [selectedPayment, setSelectedPayment] = createSignal("bca");
  
  // Form fields
  const [receiverName, setReceiverName] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [province, setProvince] = createSignal("");
  const [city, setCity] = createSignal("");
  const [address, setAddress] = createSignal("");
  const [notes, setNotes] = createSignal("");
  
  const [isEditingAddress, setIsEditingAddress] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  onMount(async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      window.location.href = "/login?redirect=/checkout";
      return;
    }
    try {
      const data = await getMeCustomer();
      setCustomer(data);
      setReceiverName(data.name || "");
      setPhone(data.phone || "");
      
      if (data.shipping_address) {
        setAddress(data.shipping_address);
        setIsEditingAddress(false);
      } else {
        setIsEditingAddress(true);
      }
    } catch (e) {
      console.error(e);
      window.location.href = "/login?redirect=/checkout";
    }
  });

  const subtotal = () => cartItems()?.reduce((acc, item) => acc + item.product_price * item.quantity, 0) || 0;
  
  const shippingPrice = () => 
    shippingMethods.find(m => m.id === selectedShipping())?.price || 0;

  const total = () => subtotal() + shippingPrice();

  const handleCheckout = async (e: Event) => {
    e.preventDefault();
    if (!address() || !city() || !province() || !receiverName() || !phone()) {
      setErrorMessage("Mohon lengkapi semua kolom alamat pengiriman");
      return;
    }
    
    setSubmitting(true);
    setErrorMessage(null);
    
    try {
      const dbMethod = paymentMethods.find(p => p.id === selectedPayment())?.dbMethod || "transfer";
      
      if (customer()) {
        await updateCustomerProfile({
          name: receiverName(),
          phone: phone(),
          email: customer().email,
          shipping_address: address(),
        });
      }
      
      const res = await createOrder({
        shipping_address: `${receiverName()} | ${phone()} | ${address()}`,
        shipping_city: city(),
        shipping_province: province(),
        shipping_cost: shippingPrice(),
        payment_method: dbMethod,
        notes: notes() || undefined,
      });

      await refetchCartCount();
      
      window.location.href = `/success?order_number=${res.order_number}&amount=${res.grand_total}&payment_method=${dbMethod}&shipping=${selectedShipping()}`;
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memproses pesanan, silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main class="cart-page-container">
        <div class="cart-content">
          {/* Progress Steps */}
          <div class="cart-steps" style={{ "margin-bottom": "30px" }}>
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
              <span>Selesai</span>
            </div>
          </div>

          <Suspense fallback={<div class="py-20"><Loading message="Memuat informasi checkout..." /></div>}>
            <Show when={cartItems() && cartItems()!.length > 0} fallback={
              <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2>Keranjang Anda Kosong</h2>
                <p>Tambahkan beberapa produk terlebih dahulu sebelum melakukan checkout.</p>
                <a href="/shop" class="btn-shop-now">Mulai Belanja</a>
              </div>
            }>
              <form onSubmit={handleCheckout} class="cart-grid">
                {/* Left Content */}
                <div class="cart-main-content">
                  <Show when={errorMessage()}>
                    <div style={{
                      "background": "#fef2f2",
                      "color": "#dc2626",
                      "padding": "16px",
                      "border-radius": "12px",
                      "margin-bottom": "24px",
                      "font-size": "0.9rem",
                      "font-weight": "600",
                      "border": "1px solid #fee2e2"
                    }}>
                      {errorMessage()}
                    </div>
                  </Show>

                  {/* Alamat Pengiriman */}
                  <div class="checkout-section">
                    <div class="checkout-section-title">
                      <span>Alamat Pengiriman</span>
                      <Show when={customer()?.shipping_address && !isEditingAddress()}>
                        <span class="edit" onClick={() => setIsEditingAddress(true)}>Ubah</span>
                      </Show>
                    </div>

                    <Show when={!isEditingAddress()} fallback={
                      <div style={{ "display": "grid", "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))", "gap": "16px" }}>
                        <div class="profile-form-group">
                          <label>Nama Penerima</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Nama Lengkap" 
                            class="profile-input"
                            value={receiverName()}
                            onInput={(e) => setReceiverName(e.currentTarget.value)}
                          />
                        </div>
                        <div class="profile-form-group">
                          <label>Nomor HP</label>
                          <input 
                            type="tel" 
                            required 
                            placeholder="Contoh: 081234567890" 
                            class="profile-input"
                            value={phone()}
                            onInput={(e) => setPhone(e.currentTarget.value)}
                          />
                        </div>
                        <div class="profile-form-group">
                          <label>Provinsi</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Provinsi" 
                            class="profile-input"
                            value={province()}
                            onInput={(e) => setProvince(e.currentTarget.value)}
                          />
                        </div>
                        <div class="profile-form-group">
                          <label>Kota / Kabupaten</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Kota atau Kabupaten" 
                            class="profile-input"
                            value={city()}
                            onInput={(e) => setCity(e.currentTarget.value)}
                          />
                        </div>
                        <div class="profile-form-group" style={{ "grid-column": "1 / -1" }}>
                          <label>Alamat Lengkap</label>
                          <textarea 
                            required 
                            rows="3" 
                            placeholder="Nama jalan, nomor rumah, RT/RW, Kecamatan" 
                            class="profile-textarea"
                            value={address()}
                            onInput={(e) => setAddress(e.currentTarget.value)}
                          />
                        </div>
                        <Show when={customer()?.shipping_address}>
                          <div style={{ "grid-column": "1 / -1", "display": "flex", "justify-content": "flex-end" }}>
                            <button 
                              type="button"
                              class="btn-edit-profile"
                              style={{ "padding": "10px 20px", "border-radius": "10px", "font-weight": "600", "font-size": "0.85rem" }}
                              onClick={() => {
                                setReceiverName(customer().name || "");
                                setPhone(customer().phone || "");
                                setAddress(customer().shipping_address || "");
                                setIsEditingAddress(false);
                              }}
                            >
                              Batal
                            </button>
                          </div>
                        </Show>
                      </div>
                    }>
                      <div class="address-box">
                        <div class="address-icon" style={{ "color": "var(--green-600)" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                        </div>
                        <div class="address-info">
                          <h4>{receiverName()}</h4>
                          <p>{phone()}</p>
                          <p style={{ "margin-top": "6px" }}>{address()}</p>
                        </div>
                      </div>
                    </Show>
                  </div>

                  {/* Metode Pengiriman */}
                  <div class="checkout-section">
                    <div class="checkout-section-title">Metode Pengiriman</div>
                    <div class="checkout-option-list">
                      <For each={shippingMethods}>
                        {(method) => (
                          <div 
                            class="checkout-option"
                            classList={{ active: selectedShipping() === method.id }}
                            onClick={() => setSelectedShipping(method.id)}
                          >
                            <div class="cart-item-checkbox" style={{ 
                              "border-radius": "50%", 
                              "border": "2px solid", 
                              "border-color": selectedShipping() === method.id ? "var(--green-600)" : "#ccc",
                              "display": "flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "width": "20px",
                              "height": "20px"
                            }}>
                              {selectedShipping() === method.id && <div style={{ "width": "10px", "height": "10px", "background": "var(--green-600)", "border-radius": "50%" }}></div>}
                            </div>
                            <div class="checkout-option-info">
                              <div class="checkout-option-name">{method.name}</div>
                              <div class="checkout-option-desc">{method.desc}</div>
                            </div>
                            <div class="checkout-option-price">{method.price === 0 ? "Gratis" : formatCurrency(method.price)}</div>
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
                            class="payment-method-card"
                            classList={{ active: selectedPayment() === method.id }}
                            onClick={() => setSelectedPayment(method.id)}
                          >
                            <img src={method.logo} alt={method.name} />
                            <span>{method.name}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  {/* Catatan Pesanan */}
                  <div class="checkout-section">
                    <div class="checkout-section-title">Catatan Pesanan</div>
                    <textarea 
                      rows="2" 
                      placeholder="Tambahkan catatan khusus untuk penjual (opsional)" 
                      class="profile-textarea"
                      style={{ "background": "#fff" }}
                      value={notes()}
                      onInput={(e) => setNotes(e.currentTarget.value)}
                    />
                  </div>

                  {/* Review Pesanan */}
                  <div class="checkout-section">
                    <div class="checkout-section-title">Review Pesanan</div>
                    <div class="checkout-items-list">
                      <For each={cartItems()}>
                        {(item) => (
                          <div class="checkout-item-small">
                            <img src={item.product_thumbnail || "/placeholder.jpg"} alt={item.product_name} />
                            <div class="checkout-item-small-info">
                              <div class="checkout-item-small-name">{item.product_name}</div>
                              <div class="checkout-item-small-price">{formatCurrency(item.product_price)}</div>
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
                      <span>{formatCurrency(subtotal())}</span>
                    </div>
                    <div class="summary-row">
                      <span>Biaya Pengiriman</span>
                      <span style={{ "color": "var(--green-600)" }}>
                        {shippingPrice() === 0 ? "Gratis" : formatCurrency(shippingPrice())}
                      </span>
                    </div>
                    
                    <div class="summary-divider"></div>
                    
                    <div class="summary-total">
                      <span>Total Bayar</span>
                      <span class="price" style={{ "color": "var(--green-600)" }}>{formatCurrency(total())}</span>
                    </div>

                    <button 
                      type="submit" 
                      class="checkout-btn"
                      style={{ "width": "100%", "display": "flex", "align-items": "center", "justify-content": "center", "gap": "10px" }}
                      disabled={submitting()}
                    >
                      <Show when={submitting()} fallback={
                        <>
                          <span>Bayar Sekarang</span>
                          <span class="material-symbols-outlined" style={{ "font-size": "1.2rem" }}>arrow_forward</span>
                        </>
                      }>
                        <span>Memproses Pesanan...</span>
                      </Show>
                    </button>
                  </div>

                  <div class="benefits-card" style={{
                    "background": "var(--green-50)",
                    "border": "1px solid var(--green-100)",
                    "border-radius": "var(--radius)",
                    "padding": "20px",
                    "margin-top": "20px"
                  }}>
                    <div style={{ "display": "flex", "gap": "15px" }}>
                      <div style={{ "color": "var(--green-600)", "margin-top": "2px" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style={{ "width": "24px", "height": "24px" }}>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                      </div>
                      <div>
                        <h5 style={{ "font-weight": "700", "color": "var(--green-800)", "font-size": "0.9rem", "margin-bottom": "4px" }}>Pembayaran Aman</h5>
                        <p style={{ "color": "var(--green-700)", "font-size": "0.8rem", "line-height": "1.4" }}>Enkripsi SSL menjamin semua keamanan transaksi belanja Anda.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </Show>
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
