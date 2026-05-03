// Base API URL, ideally from environment variables
const API_BASE = "http://localhost:8080/api";

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
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

export interface Product {
  id: string;
  name: string;
  category_name: string;
  price: number;
  stock: number;
  status: string;
  sku: string | null;
}

export const getProducts = () => fetchApi<Product[]>("/products");

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
