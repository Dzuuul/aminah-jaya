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

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || "API request failed");
  }

  return json.data as T;
}

export const getProducts = () => fetchApi<Product[]>("/products");

// --- Customer Auth ---
export const loginCustomer = (payload: any) => fetchApi<any>("/customer/login", { method: "POST", body: JSON.stringify(payload) });
export const registerCustomer = (payload: any) => fetchApi<any>("/customer/register", { method: "POST", body: JSON.stringify(payload) });
export const googleLogin = (id_token: string) => fetchApi<any>("/customer/auth/google", { method: "POST", body: JSON.stringify({ id_token }) });
export const getMeCustomer = () => fetchApi<any>("/customer/me");

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
