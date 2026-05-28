import {
  createSignal,
  createResource,
  For,
  Show,
  Suspense,
  onMount,
  onCleanup,
  createEffect,
  createMemo,
  type Component,
} from "solid-js";
import { A } from "@solidjs/router";
import {
  getCart,
  getMeCustomer,
  getCustomerAddresses,
  createOrder,
  formatCurrency,
  updateCustomerProfile,
  getAvailableCoupons,
  getShippingRates,
  type CustomerAddress,
  type CustomerCoupon,
  type ShippingRateOption,
} from "~/lib/api";
import { refetchCartCount } from "~/lib/cart-store";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";
import "~/styles/checkout.css";
import { ChevronRight, X } from "lucide-solid";
import {
  SHIPPING_SPEED_GROUPS,
  courierLogoUrl,
  formatShipmentDuration,
  resolveSpeedGroup,
  type ShippingSpeedGroup,
} from "~/lib/shipping-couriers";

const SHIPPING_RATES_CACHE_PREFIX = "aminah_shipping_rates:";
const SHIPPING_RATES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SHIPPING_RATES_DEBOUNCE_MS = 600;
const DEFAULT_ITEM_WEIGHT_GRAM = 500;

const CourierLogo: Component<{
  code: string;
  name: string;
  logoUrl?: string | null;
}> = (props) => {
  const [imgSrc, setImgSrc] = createSignal(
    courierLogoUrl(props.code, props.logoUrl),
  );
  const [failed, setFailed] = createSignal(false);

  const handleError = () => {
    if (failed()) return;
    const fallback = courierLogoUrl(props.code, null);
    if (imgSrc() !== fallback) {
      setImgSrc(fallback);
      return;
    }
    setFailed(true);
  };

  return (
    <Show
      when={!failed()}
      fallback={
        <div class="checkout-courier-logo checkout-courier-logo--fallback">
          {props.code.slice(0, 2).toUpperCase()}
        </div>
      }
    >
      <img
        class="checkout-courier-logo"
        src={imgSrc()}
        alt={props.name}
        loading="lazy"
        onError={handleError}
      />
    </Show>
  );
};

const normalizeLocationPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

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
  const [selectedPayment, setSelectedPayment] = createSignal("bca");
  const [shippingRates, setShippingRates] = createSignal<ShippingRateOption[]>(
    [],
  );
  const [selectedShippingRate, setSelectedShippingRate] =
    createSignal<ShippingRateOption | null>(null);
  const [loadingShippingRates, setLoadingShippingRates] = createSignal(false);
  const [shippingRatesError, setShippingRatesError] = createSignal<string | null>(
    null,
  );
  const [destinationLat, setDestinationLat] = createSignal<number | null>(null);
  const [destinationLng, setDestinationLng] = createSignal<number | null>(null);
  const [destinationPostalCode, setDestinationPostalCode] = createSignal<
    string | null
  >(null);
  const [destinationAreaId, setDestinationAreaId] = createSignal<string | null>(
    null,
  );

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
    setDestinationLat(addr.lat ?? null);
    setDestinationLng(addr.lng ?? null);
    setDestinationPostalCode(addr.postal_code ?? null);
    setDestinationAreaId(null);
    setSelectedShippingRate(null);
  };

  const canFetchShippingRates = () => {
    const hasCoords = destinationLat() != null && destinationLng() != null;
    const hasPostal = !!destinationPostalCode()?.trim();
    const hasArea = !!destinationAreaId()?.trim();
    return hasCoords || hasPostal || hasArea;
  };

  const cartTotalWeightGram = createMemo(() => {
    const items = cartItems() || [];
    return items.reduce((sum, item) => {
      const unit =
        item.product_weight_gram && item.product_weight_gram > 0
          ? item.product_weight_gram
          : DEFAULT_ITEM_WEIGHT_GRAM;
      return sum + unit * item.quantity;
    }, 0);
  });

  const cartWeightKg = createMemo(() =>
    Math.max(1, Math.ceil(Math.max(1, cartTotalWeightGram()) / 1000)),
  );

  const shippingFetchKey = createMemo(() => {
    if (!canFetchShippingRates()) return null;

    const weightKg = cartWeightKg();
    const area = destinationAreaId()?.trim();
    if (area) return `area:${area}|${weightKg}kg`;

    const postal = destinationPostalCode()?.trim();
    const cityNorm = normalizeLocationPart(city());
    const provinceNorm = normalizeLocationPart(province());
    if (postal) {
      return cityNorm
        ? `postal:${postal}|${cityNorm}|${provinceNorm}|${weightKg}kg`
        : `postal:${postal}|${weightKg}kg`;
    }

    const lat = destinationLat();
    const lng = destinationLng();
    if (lat != null && lng != null) {
      return `coord:${lat.toFixed(3)},${lng.toFixed(3)}|${weightKg}kg`;
    }

    return null;
  });

  let shippingFetchGeneration = 0;
  let shippingDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  const readSessionShippingCache = (key: string) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(SHIPPING_RATES_CACHE_PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        expires: number;
        rates: ShippingRateOption[];
      };
      if (!parsed.expires || parsed.expires <= Date.now()) {
        sessionStorage.removeItem(SHIPPING_RATES_CACHE_PREFIX + key);
        return null;
      }
      return parsed.rates;
    } catch {
      return null;
    }
  };

  const writeSessionShippingCache = (
    key: string,
    rates: ShippingRateOption[],
  ) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        SHIPPING_RATES_CACHE_PREFIX + key,
        JSON.stringify({
          expires: Date.now() + SHIPPING_RATES_CACHE_TTL_MS,
          rates,
        }),
      );
    } catch {
      // quota / private mode — abaikan
    }
  };

  const sortRatesByPrice = (rates: ShippingRateOption[]) =>
    [...rates].sort((a, b) => a.price - b.price);

  const groupedShippingRates = createMemo(() => {
    const buckets: Record<ShippingSpeedGroup, ShippingRateOption[]> = {
      next_day: [],
      reguler: [],
    };

    for (const rate of shippingRates()) {
      const group = resolveSpeedGroup(
        rate.speed_group,
        rate.shipment_duration_range,
        rate.shipment_duration_unit,
      );
      buckets[group].push(rate);
    }

    return SHIPPING_SPEED_GROUPS.map((meta) => ({
      ...meta,
      rates: sortRatesByPrice(buckets[meta.id]),
    })).filter((group) => group.rates.length > 0);
  });

  const applyShippingRates = (rates: ShippingRateOption[]) => {
    const sorted = sortRatesByPrice(rates);
    setShippingRates(sorted);
    if (sorted.length > 0) {
      const current = selectedShippingRate();
      const stillValid =
        current && sorted.some((rate) => rate.id === current.id);
      if (!stillValid) {
        const nextDay = sorted.filter(
          (r) =>
            resolveSpeedGroup(
              r.speed_group,
              r.shipment_duration_range,
              r.shipment_duration_unit,
            ) === "next_day",
        );
        setSelectedShippingRate(
          nextDay.length > 0 ? nextDay[0] : sorted[0],
        );
      }
      setShippingRatesError(null);
    } else {
      setSelectedShippingRate(null);
      setShippingRatesError("Tidak ada kurir tersedia untuk alamat ini.");
    }
  };

  const fetchShippingRates = async (
    fetchKey: string,
    options?: { skipSessionCache?: boolean },
  ) => {
    const generation = ++shippingFetchGeneration;

    if (!canFetchShippingRates()) {
      setShippingRates([]);
      setSelectedShippingRate(null);
      setShippingRatesError(
        "Lengkapi lokasi pengiriman (koordinat dari peta di profil atau kode pos) untuk menghitung ongkir.",
      );
      return;
    }

    const items = cartItems();
    if (!items || items.length === 0) {
      return;
    }

    if (!options?.skipSessionCache) {
      const cached = readSessionShippingCache(fetchKey);
      if (cached) {
        applyShippingRates(cached);
        setLoadingShippingRates(false);
        return;
      }
    }

    setLoadingShippingRates(true);
    setShippingRatesError(null);

    try {
      const res = await getShippingRates({
        destination_lat: destinationLat() ?? undefined,
        destination_lng: destinationLng() ?? undefined,
        destination_postal_code: destinationPostalCode() ?? undefined,
        destination_area_id: destinationAreaId() ?? undefined,
        destination_city: city() || undefined,
        destination_province: province() || undefined,
        cart_items: items!.map((item) => ({
          quantity: item.quantity,
          product_weight_gram: item.product_weight_gram,
          product_price: item.product_price,
          product_name: item.product_name,
        })),
      });

      if (generation !== shippingFetchGeneration) return;

      const rates = res.rates || [];
      applyShippingRates(rates);
      if (rates.length > 0) {
        writeSessionShippingCache(fetchKey, rates);
      }
    } catch (err: any) {
      if (generation !== shippingFetchGeneration) return;
      setShippingRates([]);
      setSelectedShippingRate(null);
      setShippingRatesError(
        err.message || "Gagal memuat tarif pengiriman Biteship",
      );
    } finally {
      if (generation === shippingFetchGeneration) {
        setLoadingShippingRates(false);
      }
    }
  };

  const scheduleShippingRatesFetch = (delayMs = SHIPPING_RATES_DEBOUNCE_MS) => {
    const key = shippingFetchKey();
    if (!key) {
      setShippingRates([]);
      setSelectedShippingRate(null);
      if (ready()) {
        setShippingRatesError(
          "Lengkapi lokasi pengiriman (koordinat dari peta di profil atau kode pos) untuk menghitung ongkir.",
        );
      }
      return;
    }

    if (delayMs <= 0) {
      clearTimeout(shippingDebounceTimer);
      void fetchShippingRates(key);
      return;
    }

    clearTimeout(shippingDebounceTimer);
    shippingDebounceTimer = setTimeout(() => {
      void fetchShippingRates(key);
    }, delayMs);
  };

  createEffect(() => {
    if (!ready()) return;
    const key = shippingFetchKey();
    if (!key) {
      setShippingRates([]);
      setSelectedShippingRate(null);
      return;
    }
    scheduleShippingRatesFetch();
  });

  onCleanup(() => {
    clearTimeout(shippingDebounceTimer);
    shippingFetchGeneration += 1;
  });

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
    !isEditingAddress() && !!receiverName().trim() && !!address().trim();

  const [showVoucherModal, setShowVoucherModal] = createSignal(false);
  const [availableCoupons, setAvailableCoupons] = createSignal<CustomerCoupon[]>(
    [],
  );
  const [selectedCoupon, setSelectedCoupon] =
    createSignal<CustomerCoupon | null>(null);
  const [loadingCoupons, setLoadingCoupons] = createSignal(false);
  const [voucherError, setVoucherError] = createSignal<string | null>(null);

  const otherFees = () => ({ service: 1000, app: 1000 });

  const computeDiscount = (coupon: CustomerCoupon) => {
    const base = subtotal() + shippingPrice();
    let amount = 0;
    if (coupon.discount_type.toLowerCase() === "percentage") {
      amount = base * (coupon.discount_value / 100);
      if (coupon.max_discount != null && amount > coupon.max_discount) {
        amount = coupon.max_discount;
      }
    } else {
      amount = coupon.discount_value;
    }
    if (amount > base) amount = base;
    return Math.round(amount);
  };

  const discount = () => {
    const coupon = selectedCoupon();
    if (!coupon || !coupon.can_use) return 0;
    if (subtotal() < coupon.min_purchase) return 0;
    return computeDiscount(coupon);
  };

  const displayedTotal = () =>
    subtotal() + shippingPrice() - discount();

  const formatCouponLabel = (coupon: CustomerCoupon) => {
    if (coupon.discount_type.toLowerCase() === "percentage") {
      const max =
        coupon.max_discount != null
          ? ` (maks. ${formatCurrency(coupon.max_discount)})`
          : "";
      return `Diskon ${coupon.discount_value}%${max}`;
    }
    return `Potongan ${formatCurrency(coupon.discount_value)}`;
  };

  const formatCouponExpiry = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openVoucherModal = async () => {
    setShowVoucherModal(true);
    setVoucherError(null);
    setLoadingCoupons(true);
    try {
      const coupons = await getAvailableCoupons(
        subtotal(),
        shippingPrice(),
      );
      setAvailableCoupons(coupons);
    } catch (err: any) {
      setVoucherError(err.message || "Gagal memuat voucher");
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const applyVoucher = (coupon: CustomerCoupon) => {
    if (!coupon.can_use) return;
    setSelectedCoupon(coupon);
    setShowVoucherModal(false);
    setVoucherError(null);
  };

  const removeVoucher = () => {
    setSelectedCoupon(null);
  };

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
        setIsEditingAddress(!defaultAddress.province || !defaultAddress.city);
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

  const shippingPrice = () => selectedShippingRate()?.price || 0;

  const total = () => subtotal() + shippingPrice();

  const isAddressComplete = () =>
    !!receiverName().trim() &&
    !!phone().trim() &&
    !!address().trim() &&
    !!city().trim() &&
    !!province().trim();

  const isPaymentSelected = () =>
    !!selectedPayment() &&
    paymentMethods.some((method) => method.id === selectedPayment());

  const isShippingSelected = () => selectedShippingRate() != null;

  const canSubmitCheckout = () =>
    isAddressComplete() && isShippingSelected() && isPaymentSelected();

  const checkoutDisabledHint = () => {
    if (!isAddressComplete()) {
      return "Lengkapi alamat pengiriman terlebih dahulu";
    }
    if (!isShippingSelected()) {
      return "Pilih metode pengiriman terlebih dahulu";
    }
    if (!isPaymentSelected()) {
      return "Pilih metode pembayaran terlebih dahulu";
    }
    return "";
  };

  const handleCheckout = async (e: Event) => {
    e.preventDefault();
    if (!address() || !city() || !province() || !receiverName() || !phone()) {
      setErrorMessage("Mohon lengkapi semua kolom alamat pengiriman");
      return;
    }

    const rate = selectedShippingRate();
    if (!rate) {
      setErrorMessage("Pilih metode pengiriman terlebih dahulu");
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
        coupon_code: selectedCoupon()?.code,
        courier_company: rate.courier_company,
        courier_type: rate.courier_type,
        destination_lat: destinationLat() ?? undefined,
        destination_lng: destinationLng() ?? undefined,
        destination_postal_code: destinationPostalCode() ?? undefined,
        destination_area_id: destinationAreaId() ?? undefined,
        destination_contact_name: receiverName(),
        destination_contact_phone: phone(),
      });

      await refetchCartCount();

      window.location.href = `/success?order_number=${res.order_number}&amount=${res.grand_total}&payment_method=${dbMethod}&shipping=${encodeURIComponent(rate.name)}`;
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
                                  active: selectedAddressId() === addr.id,
                                }}
                              >
                                <input
                                  type="radio"
                                  name="checkout-saved-address"
                                  checked={selectedAddressId() === addr.id}
                                  onChange={() => selectSavedAddress(addr.id)}
                                />
                                <div class="checkout-address-option-body">
                                  <div class="checkout-address-option-head">
                                    <strong>{addr.label || "Alamat"}</strong>
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
                                  <Show when={addr.city || addr.province}>
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

                      <Show when={!hasSavedAddresses()}>
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
                            <div class="profile-form-group">
                              <label>Kode Pos</label>
                              <input
                                type="text"
                                placeholder="Contoh: 40132"
                                class="profile-input"
                                value={destinationPostalCode() || ""}
                                onInput={(e) => {
                                  setDestinationPostalCode(
                                    e.currentTarget.value || null,
                                  );
                                  setSelectedShippingRate(null);
                                }}
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
                                hasSavedAddresses() ||
                                customer()?.shipping_address
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
                            <Show when={province() && city()}>
                              <p class="muted">
                                {city()}, {province()}
                              </p>
                            </Show>
                            <p class="address-text">{address()}</p>
                          </div>
                        </div>
                      </Show>
                    </div>

                    {/* Metode Pengiriman — Biteship */}
                    <div class="checkout-section">
                      <div class="checkout-section-title">
                        <span>Metode Pengiriman</span>
                        <Show when={canFetchShippingRates()}>
                          <button
                            type="button"
                            class="edit"
                            onClick={() => {
                              const key = shippingFetchKey();
                              if (key) {
                                void fetchShippingRates(key, {
                                  skipSessionCache: true,
                                });
                              }
                            }}
                            disabled={loadingShippingRates()}
                          >
                            {loadingShippingRates() ? "Memuat..." : "Refresh"}
                          </button>
                        </Show>
                      </div>
                      <p class="checkout-address-hint">
                        Ongkir dihitung otomatis via Biteship. Pastikan alamat
                        memiliki koordinat (pilih di peta saat simpan alamat di
                        profil) atau kode pos.
                      </p>
                      <Show when={loadingShippingRates()}>
                        <Loading message="Menghitung ongkir..." />
                      </Show>
                      <Show when={!loadingShippingRates() && shippingRatesError()}>
                        <div class="error-message">{shippingRatesError()}</div>
                      </Show>
                      <Show
                        when={
                          !loadingShippingRates() &&
                          !shippingRatesError() &&
                          shippingRates().length > 0
                        }
                      >
                        <div class="checkout-shipping-groups">
                          <For each={groupedShippingRates()}>
                            {(group) => (
                              <div class="checkout-shipping-group">
                                <div class="checkout-shipping-group-header">
                                  <span class="checkout-shipping-group-title">
                                    {group.label}
                                  </span>
                                  <span class="checkout-shipping-group-hint">
                                    {group.hint}
                                  </span>
                                </div>
                                <div class="checkout-option-list">
                                  <For each={group.rates}>
                                    {(method) => (
                                      <div
                                        class="checkout-option checkout-shipping-option"
                                        classList={{
                                          active:
                                            selectedShippingRate()?.id ===
                                            method.id,
                                        }}
                                        onClick={() =>
                                          setSelectedShippingRate(method)
                                        }
                                      >
                                        <CourierLogo
                                          code={method.courier_company}
                                          name={method.name}
                                          logoUrl={method.courier_logo}
                                        />
                                        <div class="cart-item-checkbox">
                                          <Show
                                            when={
                                              selectedShippingRate()?.id ===
                                              method.id
                                            }
                                          >
                                            <div class="cart-item-checkbox-inner" />
                                          </Show>
                                        </div>
                                        <div class="checkout-option-info">
                                          <div class="checkout-option-name">
                                            {method.name}
                                          </div>
                                          <div class="checkout-option-desc">
                                            <span class="checkout-courier-badge">
                                              {method.courier_company.toUpperCase()}
                                            </span>
                                            <Show when={method.description}>
                                              <span> · {method.description}</span>
                                            </Show>
                                            <Show
                                              when={formatShipmentDuration(
                                                method.shipment_duration_range,
                                                method.shipment_duration_unit,
                                                method.duration,
                                              )}
                                            >
                                              <span>
                                                {" "}
                                                · Estimasi{" "}
                                                {formatShipmentDuration(
                                                  method.shipment_duration_range,
                                                  method.shipment_duration_unit,
                                                  method.duration,
                                                )}
                                              </span>
                                            </Show>
                                          </div>
                                        </div>
                                        <div class="checkout-option-price">
                                          {formatCurrency(method.price)}
                                        </div>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
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
                      <div
                        class="promo-banner"
                        classList={{ applied: !!selectedCoupon() }}
                        onClick={openVoucherModal}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openVoucherModal();
                          }
                        }}
                      >
                        <div class="promo-content">
                          <div class="promo-icon">🏷️</div>
                          <div>
                            <Show
                              when={selectedCoupon()}
                              fallback={
                                <>
                                  <div class="promo-title">
                                    Pakai promo biar makin hemat!
                                  </div>
                                  <div class="promo-sub">
                                    Pilih voucher yang tersedia untuk
                                    mendapatkan diskon.
                                  </div>
                                </>
                              }
                            >
                              {(coupon) => (
                                <>
                                  <div class="promo-title">{coupon().code}</div>
                                  <div class="promo-sub">
                                    {formatCouponLabel(coupon())}
                                  </div>
                                  <div class="promo-applied-badge">
                                    Hemat {formatCurrency(discount())}
                                  </div>
                                </>
                              )}
                            </Show>
                          </div>
                        </div>
                        <div class="promo-action">
                          <Show
                            when={selectedCoupon()}
                            fallback={<ChevronRight size={20} color="#6b7280" />}
                          >
                            <button
                              type="button"
                              class="voucher-remove-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeVoucher();
                              }}
                            >
                              Hapus
                            </button>
                          </Show>
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
                        <Show when={selectedCoupon() && discount() > 0}>
                          <div class="summary-row discount">
                            <span>
                              Diskon ({selectedCoupon()!.code})
                            </span>
                            <span>-{formatCurrency(discount())}</span>
                          </div>
                        </Show>
                        <div class="summary-others">
                          <div class="summary-others-title">Total Lainnya</div>
                          <div class="summary-others-values">
                            <div
                              style={{
                                display: "flex",
                                "justify-content": "space-between",
                                "align-items": "center",
                              }}
                            >
                              <span>Biaya Layanan</span>
                              <span>
                                <s
                                  style={{
                                    color: "#aaa",
                                    "margin-right": "4px",
                                  }}
                                >
                                  {formatCurrency(otherFees().service)}
                                </s>
                                <span
                                  style={{
                                    color: "#16a34a",
                                    "font-weight": "600",
                                  }}
                                >
                                  Gratis
                                </span>
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                "justify-content": "space-between",
                                "align-items": "center",
                              }}
                            >
                              <span>Biaya Jasa Aplikasi</span>
                              <span>
                                <s
                                  style={{
                                    color: "#aaa",
                                    "margin-right": "4px",
                                  }}
                                >
                                  {formatCurrency(otherFees().app)}
                                </s>
                                <span
                                  style={{
                                    color: "#16a34a",
                                    "font-weight": "600",
                                  }}
                                >
                                  Gratis
                                </span>
                              </span>
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
                          disabled={submitting() || !canSubmitCheckout()}
                          title={checkoutDisabledHint() || undefined}
                          aria-disabled={submitting() || !canSubmitCheckout()}
                        >
                          <Show
                            when={submitting()}
                            fallback={<span>Bayar Sekarang</span>}
                          >
                            <span>Memproses Pesanan...</span>
                          </Show>
                        </button>
                        <Show when={!canSubmitCheckout() && !submitting()}>
                          <p class="checkout-submit-hint">{checkoutDisabledHint()}</p>
                        </Show>
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

        {/* Voucher picker modal */}
        <Show when={showVoucherModal()}>
          <div
            class="voucher-modal-overlay"
            onClick={() => setShowVoucherModal(false)}
          >
            <div
              class="voucher-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div class="voucher-modal-header">
                <h3>Pilih Voucher</h3>
                <button
                  type="button"
                  class="voucher-modal-close"
                  onClick={() => setShowVoucherModal(false)}
                  aria-label="Tutup"
                >
                  <X size={20} />
                </button>
              </div>
              <div class="voucher-modal-body">
                <Show when={loadingCoupons()}>
                  <Loading message="Memuat voucher..." />
                </Show>
                <Show when={!loadingCoupons() && voucherError()}>
                  <div class="error-message">{voucherError()}</div>
                </Show>
                <Show
                  when={
                    !loadingCoupons() &&
                    !voucherError() &&
                    availableCoupons().length === 0
                  }
                >
                  <div class="voucher-empty">
                    <div class="voucher-empty-icon">🎟️</div>
                    <p>Belum ada voucher tersedia untuk akun Anda.</p>
                  </div>
                </Show>
                <Show
                  when={
                    !loadingCoupons() &&
                    !voucherError() &&
                    availableCoupons().length > 0
                  }
                >
                  <div class="voucher-list">
                    <For each={availableCoupons()}>
                      {(coupon) => (
                        <div
                          class="voucher-item"
                          classList={{
                            active: selectedCoupon()?.id === coupon.id,
                            disabled: !coupon.can_use,
                          }}
                        >
                          <div class="voucher-item-main">
                            <div class="voucher-code">{coupon.code}</div>
                            <div class="voucher-desc">
                              {formatCouponLabel(coupon)}
                            </div>
                            <div class="voucher-meta">
                              Min. belanja{" "}
                              {formatCurrency(coupon.min_purchase)} · Berlaku
                              s/d {formatCouponExpiry(coupon.end_at)}
                            </div>
                            <Show when={coupon.disabled_reason}>
                              <div
                                class="voucher-meta"
                                style={{ color: "#dc2626" }}
                              >
                                {coupon.disabled_reason}
                              </div>
                            </Show>
                          </div>
                          <div class="voucher-item-action">
                            <Show
                              when={selectedCoupon()?.id === coupon.id}
                              fallback={
                                <button
                                  type="button"
                                  class="voucher-use-btn"
                                  disabled={!coupon.can_use}
                                  onClick={() => applyVoucher(coupon)}
                                >
                                  Pakai
                                </button>
                              }
                            >
                              <button
                                type="button"
                                class="voucher-remove-btn"
                                onClick={removeVoucher}
                              >
                                Hapus
                              </button>
                            </Show>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </>
  );
}
