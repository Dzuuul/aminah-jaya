import { fetchIntegrasiApi } from "./integrasi-api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8001/api";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category_name: string;
  price: number;
  price_compare?: number;  // harga coret
  thumbnail_url: string | null;
  subtitle: string | null;
  status: string;
  is_featured?: boolean;
  average_rating?: number;  // rata-rata rating (0-5)
  total_reviews?: number;   // jumlah review
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("customer_token") : null;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  let json: any;
  try {
    json = await response.json();
  } catch (e) {
    json = null;
  }

  if (!response.ok) {
    if (json && json.message) {
      throw new Error(json.message);
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  if (!json || !json.success) {
    throw new Error((json && json.message) || "API request failed");
  }

  return json.data as T;
}

export const getProducts = () => fetchApi<Product[]>("/products?include=rating");

// --- Customer Auth ---
export const loginCustomer = (payload: any) => fetchApi<any>("/customer/login", { method: "POST", body: JSON.stringify(payload) });
export const registerCustomer = (payload: any) => fetchApi<any>("/customer/register", { method: "POST", body: JSON.stringify(payload) });
export const googleLogin = (id_token: string) => fetchApi<any>("/customer/auth/google", { method: "POST", body: JSON.stringify({ id_token }) });
export const getMeCustomer = () => fetchApi<any>("/customer/me");
export const updateCustomerProfile = (payload: any) => fetchApi<any>("/customer/profile", { method: "PATCH", body: JSON.stringify(payload) });
export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string | null;
  recipient_name: string;
  recipient_phone: string;
  address: string;
  province: string | null;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  created_at: string;
}

export interface CreateCustomerAddressPayload {
  label?: string | null;
  recipient_name: string;
  recipient_phone: string;
  address: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  postal_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
}

export type UpdateCustomerAddressPayload = Omit<
  CreateCustomerAddressPayload,
  "is_default"
>;

export const getCustomerAddresses = () =>
  fetchApi<CustomerAddress[]>("/customer/addresses");
export const createCustomerAddress = (payload: CreateCustomerAddressPayload) =>
  fetchApi<CustomerAddress>("/customer/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateCustomerAddress = (
  id: string,
  payload: UpdateCustomerAddressPayload,
) =>
  fetchApi<CustomerAddress>(`/customer/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const deleteCustomerAddress = (id: string) =>
  fetchApi<string>(`/customer/addresses/${id}`, { method: "DELETE" });
export const setDefaultAddress = (id: string) =>
  fetchApi<string>(`/customer/addresses/${id}/default`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
export const getCustomerOrders = () => fetchApi<any>("/customer/orders");
export const getOrderByNumber = (orderNumber: string) => fetchApi<any>(`/customer/orders/number/${orderNumber}`);
export interface CustomerCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  start_at: string;
  end_at: string;
  can_use: boolean;
  disabled_reason: string | null;
  estimated_discount: number | null;
}

export const getAvailableCoupons = (subtotal?: number, shippingCost?: number) => {
  const params = new URLSearchParams();
  if (subtotal !== undefined) params.set("subtotal", String(subtotal));
  if (shippingCost !== undefined) params.set("shipping_cost", String(shippingCost));
  const query = params.toString();
  return fetchApi<CustomerCoupon[]>(
    `/customer/coupons${query ? `?${query}` : ""}`,
  );
};

export const validateCustomerCoupon = (
  code: string,
  subtotal: number,
  shippingCost: number,
) =>
  fetchApi<CustomerCoupon>(
    `/customer/coupons/validate/${encodeURIComponent(code)}?subtotal=${subtotal}&shipping_cost=${shippingCost}`,
  );

export interface ShippingRateOption {
  id: string;
  courier_company: string;
  courier_type: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  shipment_duration_range?: string;
  shipment_duration_unit?: string;
  speed_group?: "next_day" | "reguler";
  courier_logo?: string;
  available_collection_method?: string[];
  available_for_cash_on_delivery?: boolean;
}

export interface ShippingRateCartItem {
  quantity: number;
  product_weight_gram?: number;
  product_price?: number;
  product_name?: string;
}

export const getShippingCouriers = () =>
  fetchIntegrasiApi<any[]>("/shipping/couriers");

export const searchShippingAreas = (input: string) =>
  fetchIntegrasiApi<any[]>(
    `/shipping/maps/areas?input=${encodeURIComponent(input)}`,
  );

export const getShippingRates = (payload: {
  destination_lat?: number;
  destination_lng?: number;
  destination_postal_code?: string;
  destination_area_id?: string;
  destination_city?: string;
  destination_province?: string;
  couriers?: string;
  cart_items: ShippingRateCartItem[];
}) =>
  fetchIntegrasiApi<{
    rates: ShippingRateOption[];
    cached?: boolean;
    cache_key?: string;
    weight_kg?: number;
  }>("/shipping/rates", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createShippingDraftOrder = (payload: Record<string, unknown>) =>
  fetchIntegrasiApi<any>("/shipping/draft-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getShippingDraftRates = (draftId: string) =>
  fetchIntegrasiApi<{ rates: ShippingRateOption[] }>(
    `/shipping/draft-orders/${draftId}/rates`,
  );

export const getOrderTracking = (orderId: string) =>
  fetchApi<any>(`/customer/orders/${orderId}/tracking`);

export const createOrder = (payload: {
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_cost: number;
  payment_method: string;
  notes?: string;
  coupon_code?: string;
  courier_company?: string;
  courier_type?: string;
  destination_lat?: number;
  destination_lng?: number;
  destination_postal_code?: string;
  destination_area_id?: string;
  destination_contact_name?: string;
  destination_contact_phone?: string;
  biteship_draft_order_id?: string;
}) => fetchApi<any>("/customer/orders", { method: "POST", body: JSON.stringify(payload) });

// --- Favorites ---
export interface CustomerFavorite {
  id: string;
  customer_id: string;
  product_id: string;
  folder_name: string;
  created_at: string;
  product_name?: string;
  product_price?: number;
  product_thumbnail?: string | null;
  product_slug?: string;
}

export const getFavorites = () => fetchApi<CustomerFavorite[]>("/customer/favorites");
export const addFavorite = (productId: string, folderName?: string) => fetchApi<any>("/customer/favorites", { method: "POST", body: JSON.stringify({ product_id: productId, folder_name: folderName }) });
export const removeFavorite = (id: string) => fetchApi<any>(`/customer/favorites/${id}`, { method: "DELETE" });
export const removeFavoriteByProduct = (productId: string, folderName?: string) => {
  const query = folderName ? `?folder_name=${encodeURIComponent(folderName)}` : "";
  return fetchApi<any>(`/customer/favorites/product/${productId}${query}`, { method: "DELETE" });
};
export const getFavoriteFolders = () => fetchApi<string[]>("/customer/favorites/folders");


// --- Cart ---
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product_name: string;
  product_price: number;
  product_thumbnail: string | null;
  product_slug: string;
  product_weight_gram?: number;
}

export const getCart = () => fetchApi<CartItem[]>("/cart");
export const addToCart = (productId: string, quantity: number) => fetchApi<any>("/cart", { method: "POST", body: JSON.stringify({ product_id: productId, quantity }) });
export const updateCartItem = (id: string, quantity: number) => fetchApi<any>(`/cart/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
export const removeFromCart = (id: string) => fetchApi<any>(`/cart/${id}`, { method: "DELETE" });
export const clearCart = () => fetchApi<any>("/cart", { method: "DELETE" });

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
