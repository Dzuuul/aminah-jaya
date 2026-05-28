const INTEGRASI_API_BASE =
  import.meta.env.VITE_INTEGRASI_API_BASE || "http://localhost:8002/api";

export async function fetchIntegrasiApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("customer_token")
      : null;

  const response = await fetch(`${INTEGRASI_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  let json: any;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    if (json && json.message) {
      throw new Error(json.message);
    }
    throw new Error(`Integration API Error: ${response.status} ${response.statusText}`);
  }

  if (!json || !json.success) {
    throw new Error((json && json.message) || "Integration API request failed");
  }

  return json.data as T;
}

export const getIntegrasiApiBase = () => INTEGRASI_API_BASE;
