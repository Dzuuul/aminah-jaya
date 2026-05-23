import {
  createSignal,
  createResource,
  For,
  Show,
  Suspense,
  onMount,
} from "solid-js";
import { A } from "@solidjs/router";
import {
  getCart,
  getMeCustomer,
  getCustomerAddresses,
  createOrder,
  formatCurrency,
  updateCustomerProfile,
  type CustomerAddress,
} from "~/lib/api";
import { refetchCartCount } from "~/lib/cart-store";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";
import "~/styles/checkout.css";
import { ChevronRight } from "lucide-solid";

const shippingMethods = [
  { id: "std", name: "Standar", desc: "Estimasi 2-5 hari kerja", price: 0 },
  { id: "exp", name: "Ekspres", desc: "Estimasi 1-2 hari kerja", price: 25000 },
];

const paymentMethods = [
  {
    id: "bca",
    name: "BCA Virtual Account",
    dbMethod: "transfer",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
  },
  {
    id: "mandiri",
    name: "Mandiri Virtual Account",
    dbMethod: "transfer",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
  },
  {
    id: "gopay",
    name: "GoPay / QRIS",
    dbMethod: "qris",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg",
  },
  {
    id: "cod",
    name: "Bayar di Tempat (COD)",
    dbMethod: "cod",
    logo: "https://cdn-icons-png.flaticon.com/512/6491/6491509.png",
  },
];

export default function CheckoutPage() {
  const [cartItems] = createResource(
    () => typeof window !== "undefined",
    async (isClient) => {
      if (!isClient) return [];
      return await getCart();
    },
  );

  const [ready, setReady] = createSignal(false);
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
  const [savedAddresses, setSavedAddresses] = createSignal<CustomerAddress[]>(
    [],
  );
  const [selectedAddressId, setSelectedAddressId] = createSignal<string | null>(
    null,
  );
  const [submitting, setSubmitting] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const normalizeAddresses = (items: CustomerAddress[]) =>
    items.map((addr) => ({
      ...addr,
      is_default: Boolean(addr.is_default),
    }));

  const applySavedAddress = (addr: CustomerAddress) => {
    setReceiverName(addr.recipient_name);
    setPhone(addr.recipient_phone);
    setAddress(addr.address);
    setProvince(addr.province || "");
    setCity(addr.city || "");
  };

  const selectSavedAddress = (addressId: string) => {
    const addr = savedAddresses().find((item) => item.id === addressId);
    if (!addr) return;

    setSelectedAddressId(addressId);
    applySavedAddress(addr);

    if (!addr.province || !addr.city) {
      setIsEditingAddress(true);
    } else {
      setIsEditingAddress(false);
    }
  };

  const cancelAddressEdit = () => {
    const selectedId = selectedAddressId();
    if (selectedId) {
      selectSavedAddress(selectedId);
      return;
    }

    const data = customer();
    setReceiverName(data?.name || "");
    setPhone(data?.phone || "");
    setAddress(data?.shipping_address || "");
    setProvince("");
    setCity("");
    setIsEditingAddress(!data?.shipping_address);
  };

  const hasSavedAddresses = () => savedAddresses().length > 0;

  const showAddressSummary = () =>
    !isEditingAddress() &&
    !!receiverName().trim() &&
    !!address().trim();

  // Voucher + extra fees (UI-only preview)
  const vouchers = [
    { id: "none", label: "Pilih Voucher" },
    { id: "PROMO10", label: "PROMO10 — Diskon 10%" },
  ];
  const [selectedVoucher, setSelectedVoucher] = createSignal<string>("none");
  const insuranceFee = () => 700; // preview only
  const otherFees = () => ({ service: 1000, app: 1000 }); // preview only
  const discount = () =>
    selectedVoucher() === "PROMO10"
      ? Math.round(
          (subtotal() +
            shippingPrice() +
            insuranceFee() +
            otherFees().service +
            otherFees().app) *
            0.1,
        )
      : 0;
  const displayedTotal = () =>
    subtotal() +
    shippingPrice() +
    insuranceFee() +
    otherFees().service +
    otherFees().app -
    discount();

  onMount(async () => {
    try {
      const token = localStorage.getItem("customer_token");

      if (!token) {
        window.location.href = "/login?redirect=/checkout";
        return;
      }

      const data = await getMeCustomer();
      setCustomer(data);

      let addresses: CustomerAddress[] = [];
      try {
        addresses = normalizeAddresses(await getCustomerAddresses());
      } catch (addressErr) {
        console.error(addressErr);
      }

      setSavedAddresses(addresses);

      if (addresses.length > 0) {
        const defaultAddress =
          addresses.find((item) => item.is_default) || addresses[0];
        setSelectedAddressId(defaultAddress.id);
        applySavedAddress(defaultAddress);
        setIsEditingAddress(
          !defaultAddress.province || !defaultAddress.city,
        );
      } else {
        setReceiverName(data.name || "");
        setPhone(data.phone || "");
        setAddress(data.shipping_address || "");
        setProvince("");
        setCity("");
        setIsEditingAddress(true);
      }
    } catch (e) {
      console.error(e);
      window.location.href = "/login?redirect=/checkout";
    } finally {
      setReady(true);
    }
  });

  const subtotal = () =>
    cartItems()?.reduce(
      (acc, item) => acc + item.product_price * item.quantity,
      0,
    ) || 0;

  const shippingPrice = () =>
    shippingMethods.find((m) => m.id === selectedShipping())?.price || 0;

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
      const dbMethod =
        paymentMethods.find((p) => p.id === selectedPayment())?.dbMethod ||
        "transfer";

      if (customer()) {
        await updateCustomerProfile({
          name: receiverName(),
          phone: phone(),
          email: customer().email,
        });
      }

      const res = await createOrder({
        shipping_address: `${receiverName()} | ${phone()} | ${address()}`,
        shipping_city: city(),
        shipping_province: province(),
        shipping_cost: shippingPrice(),
        payment_method: dbMethod,
        notes: notes() || undefined,
        coupon_code:
          selectedVoucher() !== "none" ? selectedVoucher() : undefined,
      });

      await refetchCartCount();

      window.location.href = `/success?order_number=${res.order_number}&amount=${res.grand_total}&payment_method=${dbMethod}&shipping=${selectedShipping()}`;
    } catch (err: any) {
      setErrorMessage(
        err.message || "Gagal memproses pesanan, silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Show
        when={ready()}
        fallback={
          <div class="py-20">
            <Loading message="Memuat checkout..." />
          </div>
        }
      >
        <Navbar />
        <main class="cart-page-container">
          <div class="cart-content">
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
                <span>Selesai</span>
              </div>
            </div>

            <Suspense
              fallback={
                <div class="py-20">
                  <Loading message="Memuat informasi checkout..." />
                </div>
              }
            >
              <Show
                when={cartItems() && cartItems()!.length > 0}
                fallback={
                  <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <h2>Keranjang Anda Kosong</h2>
                    <p>
                      Tambahkan beberapa produk terlebih dahulu sebelum
                      melakukan checkout.
                    </p>
                    <a href="/shop" class="btn-shop-now">
                      Mulai Belanja
                    </a>
                  </div>
                }
              >
                <form onSubmit={handleCheckout} class="cart-grid">
                  {/* Left Content */}
                  <div class="cart-main-content">
                    <Show when={errorMessage()}>
                      <div class="error-message">{errorMessage()}</div>
                    </Show>

                    {/* Alamat Pengiriman */}
                    <div class="checkout-section">
                      <div class="checkout-section-title">
                        <span>Alamat Pengiriman</span>
                        <Show when={showAddressSummary()}>
                          <span
                            class="edit"
                            onClick={() => setIsEditingAddress(true)}
                          >
                            Ubah
                          </span>
                        </Show>
                      </div>

                      <Show when={hasSavedAddresses()}>
                        <p class="checkout-address-hint">
                          Pilih alamat yang sudah disimpan di profil, atau ubah
                          manual untuk pesanan ini.
                        </p>
                        <div class="checkout-saved-address-list">
                          <For each={savedAddresses()}>
                            {(addr) => (
                              <label
                                class="checkout-address-option"
                                classList={{
                                  active:
                                    selectedAddressId() === addr.id,
                                }}
                              >
                                <input
                                  type="radio"
                                  name="checkout-saved-address"
                                  checked={selectedAddressId() === addr.id}
                                  onChange={() =>
                                    selectSavedAddress(addr.id)
                                  }
                                />
                                <div class="checkout-address-option-body">
                                  <div class="checkout-address-option-head">
                                    <strong>
                                      {addr.label || "Alamat"}
                                    </strong>
                                    <Show when={addr.is_default}>
                                      <span class="checkout-address-default-badge">
                                        Utama
                                      </span>
                                    </Show>
                                  </div>
                                  <p>
                                    {addr.recipient_name} ·{" "}
                                    {addr.recipient_phone}
                                  </p>
                                  <Show
                                    when={addr.city || addr.province}
                                  >
                                    <p class="checkout-address-option-region">
                                      {[addr.city, addr.province]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>
                                  </Show>
                                  <p class="checkout-address-option-text">
                                    {addr.address}
                                  </p>
                                </div>
                              </label>
                            )}
                          </For>
                        </div>
                        <A
                          href="/profile?tab=shipping"
                          class="checkout-manage-address-link"
                        >
                          Kelola alamat di profil
                        </A>
                      </Show>

                      <Show
                        when={!hasSavedAddresses()}
                      >
                        <p class="checkout-address-hint">
                          Belum ada alamat tersimpan.{" "}
                          <A href="/profile?tab=shipping">
                            Tambah alamat di profil
                          </A>{" "}
                          atau isi manual di bawah.
                        </p>
                      </Show>

                      <Show
                        when={showAddressSummary()}
                        fallback={
                          <div class="address-form-grid">
                            <div class="profile-form-group">
                              <label>Nama Penerima</label>
                              <input
                                type="text"
                                required
                                placeholder="Nama Lengkap"
                                class="profile-input"
                                value={receiverName()}
                                onInput={(e) =>
                                  setReceiverName(e.currentTarget.value)
                                }
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
                                onInput={(e) =>
                                  setProvince(e.currentTarget.value)
                                }
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
                            <div class="profile-form-group full-width">
                              <label>Alamat Lengkap</label>
                              <textarea
                                required
                                rows="3"
                                placeholder="Nama jalan, nomor rumah, RT/RW, Kecamatan"
                                class="profile-textarea"
                                value={address()}
                                onInput={(e) =>
                                  setAddress(e.currentTarget.value)
                                }
                              />
                            </div>
                            <Show
                              when={
                                hasSavedAddresses() || customer()?.shipping_address
                              }
                            >
                              <div class="full-width actions-right">
                                <button
                                  type="button"
                                  class="btn-edit-profile"
                                  onClick={cancelAddressEdit}
                                >
                                  Batal
                                </button>
                              </div>
                            </Show>
                          </div>
                        }
                      >
                        <div class="address-box">
                          <div class="address-icon">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                          </div>
                          <div class="address-info">
                            <h4>{receiverName()}</h4>
                            <p class="muted">{phone()}</p>
                            <Show
                              when={province() && city()}
                            >
                              <p class="muted">
                                {city()}, {province()}
                              </p>
                            </Show>
                            <p class="address-text">{address()}</p>
                          </div>
                        </div>
                      </Show>
                    </div>

                    {/* Metode Pengiriman */}
                    <div class="checkout-section">
                      <div class="checkout-section-title">
                        Metode Pengiriman
                      </div>
                      <div class="checkout-option-list">
                        <For each={shippingMethods}>
                          {(method) => (
                            <div
                              class="checkout-option"
                              classList={{
                                active: selectedShipping() === method.id,
                              }}
                              onClick={() => setSelectedShipping(method.id)}
                            >
                              <div class="cart-item-checkbox">
                                <Show when={selectedShipping() === method.id}>
                                  <div class="cart-item-checkbox-inner" />
                                </Show>
                              </div>
                              <div class="checkout-option-info">
                                <div class="checkout-option-name">
                                  {method.name}
                                </div>
                                <div class="checkout-option-desc">
                                  {method.desc}
                                </div>
                              </div>
                              <div class="checkout-option-price">
                                {method.price === 0
                                  ? "Gratis"
                                  : formatCurrency(method.price)}
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>

                    {/* Metode Pembayaran */}
                    <div class="checkout-section">
                      <div class="checkout-section-title">
                        Metode Pembayaran
                      </div>
                      <div class="payment-method-grid">
                        <For each={paymentMethods}>
                          {(method) => (
                            <div
                              class="payment-method-card"
                              classList={{
                                active: selectedPayment() === method.id,
                              }}
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
                        class="profile-textarea notes-textarea"
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
                              <img
                                src={
                                  item.product_thumbnail || "/placeholder.jpg"
                                }
                                alt={item.product_name}
                              />
                              <div class="checkout-item-small-info">
                                <div class="checkout-item-small-name">
                                  {item.product_name}
                                </div>
                                <div class="checkout-item-small-price">
                                  {formatCurrency(item.product_price)}
                                </div>
                              </div>
                              <div class="checkout-item-small-qty">
                                x{item.quantity}
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
                      <h2 class="summary-title">Ringkasan Pesanan</h2>

                      {/* Promo / voucher banner */}
                      <div class="promo-banner">
                        <div class="promo-content">
                          <div class="promo-icon">🏷️</div>
                          <div>
                            <div class="promo-title">
                              Pakai promo biar makin hemat!
                            </div>
                            <div class="promo-sub">
                              Pilih voucher yang tersedia untuk mendapatkan
                              diskon.
                            </div>
                          </div>
                        </div>
                        <div class="promo-action">
                          {/* <select class="profile-input promo-select" value={selectedVoucher()} onChange={(e) => setSelectedVoucher((e.target as HTMLSelectElement).value)}>
                          <For each={vouchers}>{(v) => <option value={v.id}>{v.label}</option>}</For>
                        </select> */}
                          <ChevronRight size={20} color="#6b7280" />
                        </div>
                      </div>

                      <div class="summary-details">
                        <div class="summary-row">
                          <span>
                            Total Harga ({cartItems()?.length || 0} Barang)
                          </span>
                          <span>{formatCurrency(subtotal())}</span>
                        </div>
                        <div class="summary-row">
                          <span>Total Ongkos Kirim</span>
                          <span class="highlight">
                            {shippingPrice() === 0
                              ? "Gratis"
                              : formatCurrency(shippingPrice())}
                          </span>
                        </div>
                        <div class="summary-row">
                          <span>Total Asuransi Pengiriman</span>
                          <span>{formatCurrency(insuranceFee())}</span>
                        </div>

                        <div class="summary-others">
                          <div class="summary-others-title">Total Lainnya</div>
                          <div class="summary-others-values">
                            <div>
                              Biaya Layanan ·{" "}
                              {formatCurrency(otherFees().service)}
                            </div>
                            <div>
                              Biaya Jasa Aplikasi ·{" "}
                              {formatCurrency(otherFees().app)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="summary-divider"></div>

                      <div class="summary-total">
                        <div class="summary-total-row">
                          <span class="summary-total-label">Total Tagihan</span>
                          <span class="price summary-total-amount">
                            {formatCurrency(displayedTotal())}
                          </span>
                        </div>
                        <button
                          type="submit"
                          class="checkout-btn primary"
                          disabled={submitting()}
                        >
                          <Show
                            when={submitting()}
                            fallback={<span>Bayar Sekarang</span>}
                          >
                            <span>Memproses Pesanan...</span>
                          </Show>
                        </button>
                        <div class="mini-note">
                          Dengan melanjutkan pembayaran, kamu menyetujui S&K
                        </div>
                      </div>
                    </div>

                    <div class="benefits-card">
                      <div class="benefits-inner">
                        <div class="benefits-icon">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="benefits-svg"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                        </div>
                        <div>
                          <h5 class="benefits-title">Pembayaran Aman</h5>
                          <p class="mini-note">
                            Enkripsi SSL menjamin semua keamanan transaksi
                            belanja Anda.
                          </p>
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
      </Show>
    </>
  );
}
