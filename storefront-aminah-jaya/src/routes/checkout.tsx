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
import { A, useBeforeLeave, useNavigate } from "@solidjs/router";
import {
  getCart,
  getMeCustomer,
  getCustomerAddresses,
  createOrder,
  formatCurrency,
  updateCustomerProfile,
  getAvailableCoupons,
  getShippingRates,
  updateCartItem,
  removeFromCart,
  type CustomerAddress,
  type CustomerCoupon,
  type ShippingRateOption,
  type CartItem,
} from "~/lib/api";
import {
  createDuitkuPayment,
  type DuitkuPaymentResponse,
} from "~/lib/integrasi-api";
import { refetchCartCount } from "~/lib/cart-store";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";
import { ChevronRight, ChevronDown, X } from "lucide-solid";
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

/* ─── Types ─── */
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  shipping_address?: string;
}



/* ─── Sub-components ─── */
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

/* ─── Helpers ─── */
const normalizeLocationPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

const paymentMethods = [
  // ── Dompet Digital ─────────────────────────────────────────────────────
  { id: "qris", name: "QRIS", dbMethod: "qris", duitkuCode: "SP", category: "Dompet Digital", logo: "/payments/QRIS.png" },
  { id: "shopeepay", name: "ShopeePay", dbMethod: "ewallet", duitkuCode: "SA", category: "Dompet Digital", logo: "/payments/SHOPEEPAY.png" },
  { id: "ovo", name: "OVO", dbMethod: "ewallet", duitkuCode: "OV", category: "Dompet Digital", logo: "/payments/OVO.png" },
  { id: "dana", name: "DANA", dbMethod: "ewallet", duitkuCode: "DA", category: "Dompet Digital", logo: "/payments/DANA.png" },
  { id: "linkaja", name: "LinkAja", dbMethod: "ewallet", duitkuCode: "LA", category: "Dompet Digital", logo: "/payments/LINKAJA.png" },

  // ── Virtual Account ──────────────────────────────────────────────────────
  { id: "bca_va", name: "BCA Virtual Account", dbMethod: "transfer", duitkuCode: "BC", category: "Virtual Account", logo: "/payments/BCA.SVG" },
  { id: "mandiri_va", name: "Mandiri Virtual Account", dbMethod: "transfer", duitkuCode: "M2", category: "Virtual Account", logo: "/payments/MANDIRI.png" },
  { id: "bni_va", name: "BNI Virtual Account", dbMethod: "transfer", duitkuCode: "I1", category: "Virtual Account", logo: "/payments/BNI.png" },
  { id: "bri_va", name: "BRI Virtual Account", dbMethod: "transfer", duitkuCode: "BR", category: "Virtual Account", logo: "/payments/BRIVA.png" },
  { id: "permata_va", name: "Permata Virtual Account", dbMethod: "transfer", duitkuCode: "BT", category: "Virtual Account", logo: "/payments/PERMATA.png" },
  { id: "cimb_va", name: "CIMB Niaga Virtual Account", dbMethod: "transfer", duitkuCode: "B1", category: "Virtual Account", logo: "/payments/CIMB.png" },
  { id: "bsi_va", name: "BSI Virtual Account", dbMethod: "transfer", duitkuCode: "BSI1", category: "Virtual Account", logo: "/payments/BSI.webp" },
  { id: "atm_bersama", name: "ATM Bersama", dbMethod: "transfer", duitkuCode: "A1", category: "Virtual Account", logo: "/payments/ATMBERSAMA.png" },

  // ── Pembayaran Instan ────────────────────────────────────────────────────
  { id: "jenius", name: "Jenius Pay", dbMethod: "ewallet", duitkuCode: "B1", category: "Pembayaran Instan", logo: "/payments/JENIUS.webp" },
  { id: "klik_bca", name: "KlikBCA", dbMethod: "transfer", duitkuCode: "B1", category: "Pembayaran Instan", logo: "/payments/BCA.SVG" },

  // ── Retail / Gerai ───────────────────────────────────────────────────────
  { id: "alfamart", name: "Alfamart / Alfamidi / Lawson / Dan+Dan", dbMethod: "retail", duitkuCode: "FT", category: "Retail / Gerai", logo: "/payments/RETAIL.png" },
  { id: "indomaret", name: "Indomaret", dbMethod: "retail", duitkuCode: "IR", category: "Retail / Gerai", logo: "/payments/INDOMARET.png" },
  
  // ── Lainnya ──────────────────────────────────────────────────────────────
  { id: "cod", name: "Bayar di Tempat (COD)", dbMethod: "cod", duitkuCode: null as null | string, category: "Lainnya", logo: "https://cdn-icons-png.flaticon.com/512/6491/6491509.png" },
] as const;

type PaymentMethodId = (typeof paymentMethods)[number]["id"];


export const ssr = false;

/* ─── Main Component ─── */
export default function CheckoutPage() {
  const navigate = useNavigate();

  /* ── Cart ── */
  const [cartItems, { refetch: refetchCart }] = createResource(
    () => true, // ssr = false, selalu client
    async () => {
      return await getCart();
    },
  );

  const safeCartItems = () => cartItems() ?? [];

  const [updatingCart, setUpdatingCart] = createSignal(false);

  const handleUpdateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty < 1) {
      await handleRemoveItem(item);
      return;
    }
    if (updatingCart()) return;
    setUpdatingCart(true);
    try {
      await updateCartItem(item.id, newQty);
      await refetchCart();
      await refetchCartCount();
      const key = shippingFetchKey();
      if (key) {
        void fetchShippingRates(key, { skipSessionCache: true });
      }
    } catch (e: any) {
      alert(e.message || "Gagal mengubah jumlah barang");
    } finally {
      setUpdatingCart(false);
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    if (updatingCart()) return;
    setUpdatingCart(true);
    try {
      await removeFromCart(item.id);
      await refetchCart();
      await refetchCartCount();
      const key = shippingFetchKey();
      if (key) {
        void fetchShippingRates(key, { skipSessionCache: true });
      }
    } catch (e: any) {
      alert(e.message || "Gagal menghapus barang");
    } finally {
      setUpdatingCart(false);
    }
  };

  /* ── Navigation guard ── */
  const [showLeaveModal, setShowLeaveModal] = createSignal(false);
  const [pendingPath, setPendingPath] = createSignal<string | null>(null);
  const [checkoutCompleted, setCheckoutCompleted] = createSignal(false);

  const [isConfirmingLeave, setIsConfirmingLeave] = createSignal(false);

  /* ── Payment ── */
  const [selectedPayment, setSelectedPayment] = createSignal<PaymentMethodId>("bca_va");

  /* ── Payment Methods Modal ── */
  const [showPaymentModal, setShowPaymentModal] = createSignal(false);
  const [expandedPaymentCategory, setExpandedPaymentCategory] = createSignal<string | null>("Virtual Account");

  const paymentCategories = createMemo(() => {
    // Tentukan urutan kategori
    const order = [
      "Dompet Digital",
      "Kartu Kredit / Debit / Cicilan",
      "PayLater",
      "Virtual Account",
      "Debit Instan",
      "Pembayaran Instan",
      "Retail / Gerai",
      "Lainnya"
    ];
    const groups = new Map<string, typeof paymentMethods[number][]>();
    order.forEach(o => groups.set(o, []));
    
    for (const method of paymentMethods) {
      if (groups.has(method.category)) {
        groups.get(method.category)!.push(method);
      } else {
        if (!groups.has("Lainnya")) groups.set("Lainnya", []);
        groups.get("Lainnya")!.push(method);
      }
    }
    
    return Array.from(groups.entries())
      .filter(([_, methods]) => methods.length > 0)
      .map(([name, methods]) => ({ name, methods }));
  });

  const togglePaymentCategory = (cat: string) => {
    setExpandedPaymentCategory(prev => prev === cat ? null : cat);
  };

  const displayedPaymentMethods = createMemo(() => {
    // 4 metode bayar pilihan awal
    const defaultIds = ["bca_va", "qris", "shopeepay", "alfamart"];
    const defaults = paymentMethods.filter(p => defaultIds.includes(p.id));
    
    // Jika user memilih metode lain, sertakan di list mengganti salah satu
    const selectedId = selectedPayment();
    if (selectedId && !defaultIds.includes(selectedId)) {
      const selected = paymentMethods.find(p => p.id === selectedId);
      if (selected) {
        return [selected, ...defaults.slice(0, 3)];
      }
    }
    return defaults.slice(0, 4);
  });

  const shouldBlockLeaving = () => {
    if (checkoutCompleted()) return false;
    return !!receiverName().trim() || !!phone().trim() || !!address().trim();
  };

  useBeforeLeave((event) => {
    if (isConfirmingLeave()) return; // skip guard when confirming leave
    if (!shouldBlockLeaving()) return;
    event.preventDefault();
    setPendingPath((event.to as string) ?? "/");
    setShowLeaveModal(true);
  });

  onMount(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlockLeaving()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });

  const confirmLeavePage = () => {
    const target = pendingPath();
    setShowLeaveModal(false);
    setPendingPath(null);
    if (target) {
      setIsConfirmingLeave(true);
      navigate(target);
    }
  };

  const cancelLeavePage = () => {
    setShowLeaveModal(false);
    setPendingPath(null);
    setIsConfirmingLeave(false);
  };

  /* ── Customer & Address ── */
  const [ready, setReady] = createSignal(false);
  const [customer, setCustomer] = createSignal<Customer | null>(null);

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

  /* ── Shipping ── */
  const [shippingRates, setShippingRates] = createSignal<ShippingRateOption[]>(
    [],
  );
  const [selectedShippingRate, setSelectedShippingRate] =
    createSignal<ShippingRateOption | null>(null);
  // Label grup yang sedang aktif di tab horizontal
  const [selectedGroup, setSelectedGroup] = createSignal<string | null>(null);
  const [loadingShippingRates, setLoadingShippingRates] = createSignal(false);
  const [shippingRatesError, setShippingRatesError] = createSignal<
    string | null
  >(null);
  const [destinationLat, setDestinationLat] = createSignal<number | null>(null);
  const [destinationLng, setDestinationLng] = createSignal<number | null>(null);
  const [destinationPostalCode, setDestinationPostalCode] = createSignal<
    string | null
  >(null);
  const [destinationAreaId, setDestinationAreaId] = createSignal<string | null>(
    null,
  );

  const canFetchShippingRates = () => {
    const hasCoords = destinationLat() != null && destinationLng() != null;
    const hasPostal = !!destinationPostalCode()?.trim();
    const hasArea = !!destinationAreaId()?.trim();
    return hasCoords || hasPostal || hasArea;
  };

  const cartTotalWeightGram = createMemo(() => {
    const items = safeCartItems();
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
        // Pilih harga termurah dari semua rates
        const cheapest = sorted[0];
        setSelectedShippingRate(cheapest);
        // Set tab aktif ke grup yang mengandung harga termurah
        const cheapestGroup = resolveSpeedGroup(
          cheapest.speed_group,
          cheapest.shipment_duration_range,
          cheapest.shipment_duration_unit,
        );
        const groupMeta = SHIPPING_SPEED_GROUPS.find(
          (g) => g.id === cheapestGroup,
        );
        setSelectedGroup(groupMeta?.label ?? null);
      }
      setShippingRatesError(null);
    } else {
      setSelectedShippingRate(null);
      setSelectedGroup(null);
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

    const items = safeCartItems();
    if (items.length === 0) {
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
        cart_items: items.map((item) => ({
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
    shippingFetchGeneration = Number.MAX_SAFE_INTEGER;
  });

  /* ── Voucher ── */
  const [showVoucherModal, setShowVoucherModal] = createSignal(false);
  const [availableCoupons, setAvailableCoupons] = createSignal<
    CustomerCoupon[]
  >([]);
  const [selectedCoupon, setSelectedCoupon] =
    createSignal<CustomerCoupon | null>(null);
  const [loadingCoupons, setLoadingCoupons] = createSignal(false);
  const [voucherError, setVoucherError] = createSignal<string | null>(null);

  const otherFees = () => ({ service: 1000, app: 1000 });

  const subtotal = () =>
    safeCartItems().reduce(
      (acc, item) => acc + item.product_price * item.quantity,
      0,
    );

  const shippingPrice = () => selectedShippingRate()?.price || 0;

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

  const displayedTotal = () => subtotal() + shippingPrice() - discount();

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
      const coupons = await getAvailableCoupons(subtotal(), shippingPrice());
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

  /* ── Form validation ── */
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

  /* ── Submit ── */
  const [submitting, setSubmitting] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const handleCheckout = async (e: Event) => {
    e.preventDefault();

    // Guard: prevent double submit or invalid state
    if (submitting() || !canSubmitCheckout()) return;

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
      const selectedMethod = paymentMethods.find((p) => p.id === selectedPayment());
      const dbMethod = selectedMethod?.dbMethod || "transfer";
      const duitkuCode = selectedMethod?.duitkuCode ?? null;
      const isCod = selectedMethod?.dbMethod === "cod";

      // Single read to avoid race condition
      const currentCustomer = customer();
      if (currentCustomer) {
        await updateCustomerProfile({
          name: receiverName(),
          phone: phone(),
          email: currentCustomer.email,
        });
      }

      const res = await createOrder({
        shipping_address: `${receiverName()} | ${phone()} | ${address()}`,
        shipping_city: city(),
        shipping_province: province(),
        shipping_cost: shippingPrice(),
        payment_method: dbMethod,
        notes: notes().trim() || undefined,
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
      setCheckoutCompleted(true);

      if (isCod || !duitkuCode) {
        // COD: langsung ke halaman sukses
        window.location.href = `/success?order_number=${res.order_number}&amount=${res.grand_total}&payment_method=${dbMethod}&shipping=${encodeURIComponent(rate.name)}`;
        return;
      }

      // Metode Duitku: buat transaksi pembayaran
      const returnUrl = `${window.location.origin}/profile?tab=orders`;

      const productSummary = safeCartItems()
        .slice(0, 2)
        .map((i) => i.product_name)
        .join(", ");

      const duitkuRes = await createDuitkuPayment({
        merchantOrderId: res.order_number,
        paymentAmount: res.grand_total,
        paymentMethod: duitkuCode,
        productDetails: `Pesanan Aminah Jaya: ${productSummary || res.order_number}`,
        email: currentCustomer?.email || "",
        phoneNumber: phone(),
        customerVaName: receiverName().slice(0, 20),
        returnUrl,
        expiryPeriod: 60,
      });

      // Simpan instruksi pembayaran ke localStorage agar bisa diakses dari halaman profil
      try {
        const paymentCache = {
          vaNumber: duitkuRes.vaNumber,
          qrString: duitkuRes.qrString,
          paymentUrl: duitkuRes.paymentUrl,
          reference: duitkuRes.reference,
          amount: duitkuRes.amount || String(res.grand_total),
          methodName: selectedMethod?.name || "",
          savedAt: Date.now(),
        };
        localStorage.setItem(
          `duitku_payment_${res.order_number}`,
          JSON.stringify(paymentCache),
        );
      } catch {
        // quota / private mode — abaikan
      }

      if (duitkuRes.paymentUrl) {
        window.location.href = duitkuRes.paymentUrl;
        return;
      }

      // Fallback jika tidak ada URL dari Duitku
      window.location.href = "/profile?tab=orders";
    } catch (err: any) {
      setErrorMessage(
        err.message || "Gagal memproses pesanan, silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Init ── */
  onMount(async () => {
    try {
      if (typeof performance !== "undefined") {
        const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
        if (navEntries.length > 0 && navEntries[0].type === "reload") {
          window.location.href = "/";
          return;
        } else if (performance.navigation && performance.navigation.type === 1) {
          window.location.href = "/";
          return;
        }
      }

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

  /* ── Render ── */
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
                    <A href="/shop" class="btn-shop-now">
                      Mulai Belanja
                    </A>
                  </div>
                }
              >
                <form onSubmit={handleCheckout} class="cart-grid">
                  {/* Left Content */}
                  <div class="cart-main-content">
                    <Show when={errorMessage()}>
                      <div class="error-message">{errorMessage()}</div>
                    </Show>

                    {/* Review Pesanan */}
                    <div class="checkout-section">
                      <div class="checkout-section-title">Review Pesanan</div>
                      <div class="checkout-items-list">
                        <For each={safeCartItems()}>
                          {(item) => (
                            <div class="checkout-item-small" classList={{ "opacity-50": updatingCart() }}>
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
                              <div class="checkout-item-small-actions" style={{ display: "flex", "align-items": "center", gap: "12px" }}>
                                <div class="cart-qty-ctrl" style={{ padding: "2px" }}>
                                  <button
                                    type="button"
                                    class="qty-btn-sm"
                                    style={{ width: "24px", height: "24px", "font-size": "0.8rem" }}
                                    onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                    disabled={updatingCart()}
                                  >
                                    -
                                  </button>
                                  <span class="qty-val" style={{ width: "24px", "font-size": "0.8rem" }}>{item.quantity}</span>
                                  <button
                                    type="button"
                                    class="qty-btn-sm"
                                    style={{ width: "24px", height: "24px", "font-size": "0.8rem" }}
                                    onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                                    disabled={updatingCart()}
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  class="btn-remove-item"
                                  onClick={() => handleRemoveItem(item)}
                                  disabled={updatingCart()}
                                  title="Hapus barang"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>

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
                      <Show
                        when={!loadingShippingRates() && shippingRatesError()}
                      >
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
                          {/* Horizontal tab navigation */}
                          <div class="shipping-tabs">
                            <For each={groupedShippingRates()}>
                              {(group) => (
                                <button
                                  type="button"
                                  class="shipping-tab"
                                  classList={{
                                    active: selectedGroup() === group.label,
                                  }}
                                  onClick={() => setSelectedGroup(group.label)}
                                >
                                  <span class="shipping-tab-label">
                                    {group.label}
                                  </span>
                                  <span class="shipping-tab-hint">
                                    {group.hint}
                                  </span>
                                </button>
                              )}
                            </For>
                          </div>

                          {/* Rate list untuk grup yang sedang aktif */}
                          <For each={groupedShippingRates()}>
                            {(group) => (
                              <div
                                class="checkout-shipping-group"
                                classList={{
                                  active: selectedGroup() === group.label,
                                }}
                              >
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
                                        <div class="cart-item-checkbox"></div>
                                        <div class="checkout-option-info">
                                          <div class="checkout-option-name">
                                            {method.name}
                                          </div>
                                          <div class="checkout-option-desc">
                                            <span class="checkout-courier-badge">
                                              {method.courier_company.toUpperCase()}
                                            </span>
                                            <Show when={method.description}>
                                              <span>
                                                {" "}
                                                · {method.description}
                                              </span>
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
                      <div class="checkout-section-title" style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                        <span>Metode Pembayaran</span>
                        <span style={{ "font-size": "0.9rem", color: "var(--green-600)", cursor: "pointer", "font-weight": "600" }} onClick={() => setShowPaymentModal(true)}>Lihat Semua</span>
                      </div>
                      <div class="checkout-payment-list">
                        <For each={displayedPaymentMethods()}>
                          {(method) => (
                            <label class="checkout-payment-item" classList={{ active: selectedPayment() === method.id }}>
                              <div class="payment-item-left">
                                <img src={method.logo} alt={method.name} />
                                <span class="payment-name">{method.name}</span>
                              </div>
                              <div class="payment-radio">
                                <input
                                  type="radio"
                                  name="payment_method"
                                  checked={selectedPayment() === method.id}
                                  onChange={() => setSelectedPayment(method.id)}
                                />
                                <div class="radio-indicator"></div>
                              </div>
                            </label>
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
                            fallback={
                              <ChevronRight size={20} color="#6b7280" />
                            }
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
                            Total Harga ({safeCartItems().length || 0} Barang)
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
                            <span>Diskon ({selectedCoupon()!.code})</span>
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
                          <p class="checkout-submit-hint">
                            {checkoutDisabledHint()}
                          </p>
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
            <div class="voucher-modal" onClick={(e) => e.stopPropagation()}>
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
                              Min. belanja {formatCurrency(coupon.min_purchase)}{" "}
                              · Berlaku s/d {formatCouponExpiry(coupon.end_at)}
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

        {/* Modal Semua Metode Pembayaran */}
        <Show when={showPaymentModal()}>
          <div class="voucher-modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div class="voucher-modal payment-modal" onClick={(e) => e.stopPropagation()}>
              <div class="voucher-modal-header" style={{ "border-bottom": "none", "padding-bottom": "0" }}>
                <h3>Metode Pembayaran</h3>
                <button
                  type="button"
                  class="voucher-modal-close"
                  onClick={() => setShowPaymentModal(false)}
                  aria-label="Tutup"
                >
                  <X size={20} />
                </button>
              </div>
              <div class="voucher-modal-body" style={{ padding: "0 0 16px 0" }}>
                <div class="payment-accordion-container">
                  <For each={paymentCategories()}>
                    {(cat) => (
                      <div class="payment-accordion">
                        <div
                          class="payment-accordion-header"
                          onClick={() => togglePaymentCategory(cat.name)}
                        >
                          <span>{cat.name}</span>
                          <ChevronDown
                            size={18}
                            class="accordion-icon"
                            classList={{ rotated: expandedPaymentCategory() === cat.name }}
                          />
                        </div>
                        <Show when={expandedPaymentCategory() === cat.name}>
                          <div class="payment-accordion-body">
                            <For each={cat.methods}>
                              {(method) => (
                                <label class="payment-accordion-item">
                                  <div class="payment-item-left">
                                    <img src={method.logo} alt={method.name} />
                                    <span>{method.name}</span>
                                  </div>
                                  <div class="payment-radio">
                                    <input
                                      type="radio"
                                      name="modal_payment_method"
                                      checked={selectedPayment() === method.id}
                                      onChange={() => {
                                        setSelectedPayment(method.id);
                                        setShowPaymentModal(false);
                                      }}
                                    />
                                    <div class="radio-indicator"></div>
                                  </div>
                                </label>
                              )}
                            </For>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>
        </Show>


        {/* Leave confirmation modal */}
        <Show when={showLeaveModal()}>
          <div class="modal-overlay" onClick={cancelLeavePage}>
            <div class="modal-content" onClick={(e) => e.stopPropagation()}>
              <button type="button" class="modal-close" aria-label="Close" onClick={cancelLeavePage}>×</button>
              <h3>Tinggalkan Checkout?</h3>
              <p>
                Data checkout yang sedang Anda isi belum selesai. Jika keluar
                dari halaman ini, Anda harus mengulang proses checkout.
              </p>
              <div class="modal-actions">
                <button type="button" onClick={cancelLeavePage}>
                  Tetap di Halaman
                </button>
                <button type="button" class="danger" onClick={confirmLeavePage}>
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </>
  );
}