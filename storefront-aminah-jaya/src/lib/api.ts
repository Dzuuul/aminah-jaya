const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8001/api";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category_name: string;
  price: number;
  thumbnail_url: string | null;
  subtitle: string | null;
  status: string;
  is_featured?: boolean;
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

export const getProducts = () => fetchApi<Product[]>("/products");

// --- Customer Auth ---
export const loginCustomer = (payload: any) => fetchApi<any>("/customer/login", { method: "POST", body: JSON.stringify(payload) });
export const registerCustomer = (payload: any) => fetchApi<any>("/customer/register", { method: "POST", body: JSON.stringify(payload) });
export const googleLogin = (id_token: string) => fetchApi<any>("/customer/auth/google", { method: "POST", body: JSON.stringify({ id_token }) });
export const getMeCustomer = () => fetchApi<any>("/customer/me");
export const updateCustomerProfile = (payload: any) => fetchApi<any>("/customer/profile", { method: "PATCH", body: JSON.stringify(payload) });
export const getCustomerOrders = () => fetchApi<any>("/customer/orders");
export const createOrder = (payload: {
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_cost: number;
  payment_method: string;
  notes?: string;
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
