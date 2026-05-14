import { createSignal } from "solid-js";

// Base API URL from environment variables
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8001/api";

// Reactive token state
export const [authToken, setAuthToken] = createSignal<string | null>(
  typeof window !== 'undefined' ? localStorage.getItem("token") : null
);

// Helper to update token both in reactive state and localStorage
export const updateToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }
  setAuthToken(token);
};

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
  const token = authToken();

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
    // If unauthorized, clear token to trigger logout/redirect
    if (response.status === 401) {
      updateToken(null);
    }

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

export const login = async (email: string, password: string) => {
  const result = await fetchApi<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  
  if (result.token) {
    updateToken(result.token);
  }
  
  return result;
};

export const getUserProfile = () => fetchApi<UserProfile>("/auth/me");

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

export interface PerformanceStats {
  sales_growth: number;
  top_selling_product: string;
  conversion_rate: number;
}

export const getDashboardStats = () => fetchApi<DashboardStats>("/dashboard/stats");
export const getRecentOrders = () => fetchApi<RecentOrder[]>("/dashboard/recent-orders");
export const getPerformanceStats = () => fetchApi<PerformanceStats>("/dashboard/performance");

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
  slug: string;
  image_url: string | null;
  description: string | null;
  sort_order: number;
}

export interface CreateCategoryPayload {
  name: string;
  image_url?: string | null;
  description?: string | null;
  sort_order?: number;
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

export const createCategory = (payload: CreateCategoryPayload) => 
  fetchApi<{ slug: string }>("/categories", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateCategory = (id: string, payload: Partial<CreateCategoryPayload>) => 
  fetchApi<void>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const deleteCategory = (id: string) => 
  fetchApi<void>(`/categories/${id}`, {
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

// ── Flash Sales ────────────────────────────────────────────────────────────

export interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  start_at: string;
  end_at: string;
  is_active: boolean;
  created_at: string;
}

export interface FlashSaleItem {
  id: string;
  flash_sale_id: string;
  product_id: string;
  sale_price: number;
  stock_limit: number;
  sold_count: number;
  product_name: string;
  product_thumbnail: string | null;
  original_price: number;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url?: string;
  cta_product_id?: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  cta_product_name?: string;
}

export interface CreateBlogPayload {
  title: string;
  excerpt?: string;
  content: string;
  image_url?: string;
  cta_product_id?: string | null;
  is_published: boolean;
}

export interface CreateFlashSalePayload {
  name: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  items: {
    product_id: string;
    sale_price: number;
    stock_limit: number;
  }[];
}

export const getFlashSales = () => fetchApi<FlashSale[]>("/flash-sales");
export const createFlashSale = (payload: CreateFlashSalePayload) => 
  fetchApi<FlashSale>("/flash-sales", {
    method: "POST",
    body: JSON.stringify(payload)
  });
export const deleteFlashSale = (id: string) => 
  fetchApi<void>(`/flash-sales/${id}`, {
    method: "DELETE"
  });
export const getFlashSaleDetails = (id: string) => 
  fetchApi<{ sale: FlashSale, items: FlashSaleItem[] }>(`/flash-sales/${id}`);

// Blogs
export const getBlogs = () => fetchApi<Blog[]>("/blogs");
export const createBlog = (payload: CreateBlogPayload) =>
  fetchApi<Blog>("/blogs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
export const deleteBlog = (id: string) =>
  fetchApi<void>(`/blogs/${id}`, {
    method: "DELETE"
  });

// Banners
export interface Banner {
  id: string;
  image_url: string;
  link_url?: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}

export interface CreateBannerPayload {
  image_url: string;
  link_url?: string | null;
  sort_order?: number;
  starts_at?: string | null;
  ends_at?: string | null;
}

export const getBanners = (all = false) => fetchApi<Banner[]>(all ? "/banners/all" : "/banners");
export const createBanner = (payload: CreateBannerPayload) =>
  fetchApi<{ id: string }>("/banners", {
    method: "POST",
    body: JSON.stringify(payload)
  });
export const updateBanner = (id: string, payload: Partial<CreateBannerPayload> & { is_active?: boolean }) =>
  fetchApi<void>(`/banners/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
export const deleteBanner = (id: string) =>
  fetchApi<void>(`/banners/${id}`, {
    method: "DELETE"
  });

// Settings
export interface Settings {
  store_name: string;
  store_email: string;
  phone_number: string;
  store_description: string | null;
  currency: string;
  language: string;
  email_notifications: boolean;
  order_notifications: boolean;
  low_stock_notifications: boolean;
  appearance_mode: string;
}

export const getSettings = () => fetchApi<Settings>("/settings");
export const updateSettings = (payload: Partial<Settings>) =>
  fetchApi<void>("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

// ── Coupons ────────────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  start_at: string;
  end_at: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponPayload {
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  start_at: string;
  end_at: string;
  usage_limit?: number;
  is_active?: boolean;
}

export const getCoupons = () => fetchApi<Coupon[]>("/coupons");
export const createCoupon = (payload: CreateCouponPayload) =>
  fetchApi<Coupon>("/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateCoupon = (id: string, payload: Partial<CreateCouponPayload>) =>
  fetchApi<Coupon>(`/coupons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const deleteCoupon = (id: string) =>
  fetchApi<void>(`/coupons/${id}`, {
    method: "DELETE",
  });
