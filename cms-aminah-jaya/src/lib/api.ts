// Base API URL from environment variables
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8001/api";

// Format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Generic fetch function with basic error handling
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  const headers = new Headers({
    "Content-Type": "application/json",
    ...options?.headers,
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Attempt to parse error message from JSON
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    } catch (e: any) {
      if (e.message && e.message.startsWith("API Error")) throw e;
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || "API request failed");
  }

  return json.data as T;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export const login = (email: string, password: string) => 
  fetchApi<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  new_customers: number;
  stock_items: number;
  revenue_change: number;
  orders_change: number;
  customers_change: number;
  stock_change: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  grand_total: number;
  status: string;
  ordered_at: string;
}

export const getDashboardStats = () => fetchApi<DashboardStats>("/dashboard/stats");
export const getRecentOrders = () => fetchApi<RecentOrder[]>("/dashboard/recent-orders");

// ── Products ───────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string;
  price: number;
  stock: number;
  status: string;
  sku: string | null;
  thumbnail_url: string | null;
  images: ProductImage[];
}

export interface CreateProductPayload {
  name: string;
  category_id?: string | null;
  price: number;
  stock: number;
  sku?: string | null;
  image_urls: string[];
}

export interface Category {
  id: string;
  name: string;
}

export const getProducts = () => fetchApi<Product[]>("/products");

export const getCategories = () => fetchApi<Category[]>("/categories");

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || "Upload failed");
  }

  return json.data.url;
};

export const createProduct = (payload: CreateProductPayload) => 
  fetchApi<{ slug: string }>("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateProduct = (id: string, payload: Partial<CreateProductPayload>) => 
  fetchApi<void>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const deleteProduct = (id: string) => 
  fetchApi<void>(`/products/${id}`, {
    method: "DELETE"
  });

// ── Orders ─────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  grand_total: number;
  status: string;
  payment_status: string;
  ordered_at: string;
}

export const getOrders = () => fetchApi<Order[]>("/orders");

// ── Customers ──────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  total_orders: number;
  total_spent: number;
  is_blocked: boolean;
  first_seen_at: string;
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  total_revenue: number;
}

export const getCustomers = () => fetchApi<Customer[]>("/customers");
export const getCustomerStats = () => fetchApi<CustomerStats>("/customers/stats");
