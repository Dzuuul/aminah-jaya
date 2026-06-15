const INTEGRASI_API_BASE =
  import.meta.env.VITE_INTEGRASI_API_BASE || "http://localhost:8002/api";

const BACKEND_URL = INTEGRASI_API_BASE.replace(/\/api\/?$/, "");

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

// ─── Duitku ───────────────────────────────────────────────────────────────────

export interface DuitkuPaymentRequest {
  /** Order number dari sistem internal (jadi merchantOrderId ke Duitku) */
  merchantOrderId: string;
  /** Total pembayaran dalam Rupiah (integer, tanpa desimal) */
  paymentAmount: number;
  /** Kode metode pembayaran Duitku: "BC", "M2", "BT", "I1", "BR", "GP", "SP", dll */
  paymentMethod: string;
  /** Keterangan produk, tampil di halaman Duitku */
  productDetails: string;
  email: string;
  phoneNumber: string;
  customerVaName: string;
  /** URL storefront untuk redirect setelah pembayaran selesai/batal */
  returnUrl?: string;
  /** Masa berlaku transaksi dalam menit (default ditentukan config backend) */
  expiryPeriod?: number;
  additionalParam?: string;
}

export interface DuitkuPaymentResponse {
  merchantCode?: string;
  reference?: string;
  /** URL halaman pembayaran Duitku — redirect kesini jika tersedia */
  paymentUrl?: string;
  /** Nomor Virtual Account (untuk pembayaran VA) */
  vaNumber?: string;
  /** QR string untuk generate gambar QR (QRIS) */
  qrString?: string;
  amount?: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * Buat transaksi pembayaran via Duitku melalui backend `api-integrasi`.
 * Response langsung dari Duitku (tidak dibungkus { success, data }).
 */
export async function createDuitkuPayment(
  payload: DuitkuPaymentRequest,
): Promise<DuitkuPaymentResponse> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("customer_token")
      : null;

  const response = await fetch(`${BACKEND_URL}/payments/duitku`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  let json: any;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    // Network/server error — backend gagal total
    const msg =
      json?.error || json?.statusMessage || json?.message ||
      `Gagal membuat transaksi Duitku (HTTP ${response.status})`;
    throw new Error(msg);
  }

  // Backend selalu return HTTP 200.
  // Periksa statusCode dari Duitku — "00" = berhasil, selain itu = ditolak.
  if (json && json.statusCode && json.statusCode !== "00") {
    const msg =
      json.statusMessage ||
      `Pembayaran ditolak (kode: ${json.statusCode})`;
    throw new Error(msg);
  }

  return json as DuitkuPaymentResponse;
}
