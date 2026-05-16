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
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
