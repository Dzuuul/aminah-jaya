import { createSignal, createRoot } from "solid-js";

export interface LegalData {
  title_id: string;
  content_id: string;
  title_en: string;
  content_en: string;
  updated_at: string;
}

const fetchLegal = async (key: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
  try {
    const res = await fetch(`${baseUrl}/api/legal/${key}`);
    const json = await res.json();
    return json.data as LegalData;
  } catch (e) {
    console.error(`Error loading legal ${key}:`, e);
    return null;
  }
};

export const legalStore = createRoot(() => {
  const [terms, setTerms] = createSignal<LegalData | null>(null);
  const [privacy, setPrivacy] = createSignal<LegalData | null>(null);
  const [refund, setRefund] = createSignal<LegalData | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  const initLegalData = async () => {
    setIsLoading(true);
    const [t, p, r] = await Promise.all([
      fetchLegal("terms"),
      fetchLegal("privacy"),
      fetchLegal("refund")
    ]);
    setTerms(t);
    setPrivacy(p);
    setRefund(r);
    setIsLoading(false);
  };

  return { terms, privacy, refund, isLoading, initLegalData };
});
