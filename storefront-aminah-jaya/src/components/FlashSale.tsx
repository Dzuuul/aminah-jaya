import { For, createResource, Show, createSignal, onCleanup } from "solid-js";

interface FlashSaleItem {
  product_name: string;
  sale_price: number;
  original_price: number;
  stock_limit: number;
  sold_count: number;
  product_thumbnail: string;
}

interface FlashSaleData {
  sale: {
    id: string;
    name: string;
    end_at: string;
  };
  items: FlashSaleItem[];
}

const fetchActiveFlashSale = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
  try {
    const res = await fetch(`${apiUrl}/api/flash-sales/active`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (e) {
    console.error("Failed to fetch flash sale", e);
    return null;
  }
};

export default function FlashSale() {
  const [data] = createResource<FlashSaleData | null>(fetchActiveFlashSale);
  const [timeLeft, setTimeLeft] = createSignal({ d: 0, h: 0, m: 0, s: 0 });
  let scrollContainer: HTMLDivElement | undefined;

  // Countdown timer logic
  const timer = setInterval(() => {
    const sale = data()?.sale;
    if (!sale) return;

    const end = new Date(sale.end_at).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) {
      setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      return;
    }

    setTimeLeft({
      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
      h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      s: Math.floor((diff % (1000 * 60)) / 1000),
    });
  }, 1000);

  onCleanup(() => clearInterval(timer));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainer) {
      const scrollAmount = 300;
      scrollContainer.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <Show when={data()}>
      <section class="flash-sale-section" style={{ padding: "40px 0" }}>
        <div class="container">
          <div class="flash-sale-box">
            <div class="flash-sale-header">
              <div class="flash-sale-left">
                <div class="flash-sale-title-new">FLASH SALE</div>
                <div class="flash-sale-timer-new">
                  <span class="timer-box">{String(timeLeft().d).padStart(2, '0')}d</span> :
                  <span class="timer-box">{String(timeLeft().h).padStart(2, '0')}h</span> :
                  <span class="timer-box">{String(timeLeft().m).padStart(2, '0')}m</span> :
                  <span class="timer-box">{String(timeLeft().s).padStart(2, '0')}s</span>
                </div>
              </div>
              <a href="#produk" class="flash-sale-more">Lihat Semua</a>
            </div>

            <div class="flash-products-wrapper">
              <button class="flash-arrow prev" onClick={() => scroll("left")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              
              <div class="flash-products-container" ref={scrollContainer}>
                <div class="flash-products-grid">
                  <For each={data()?.items}>
                    {(prod) => (
                      <div class="flash-prod-card">
                        <div class="flash-prod-img">
                          <img src={prod.product_thumbnail || "https://placehold.co/200x200/white/black?text=No+Image"} alt={prod.product_name} />
                          <div class="flash-prod-discount">
                            DISKON {Math.round((1 - prod.sale_price / prod.original_price) * 100)}%
                          </div>
                        </div>
                        <div class="flash-prod-info">
                          <div class="flash-prod-name">{prod.product_name}</div>
                          <div class="flash-prod-price">{formatCurrency(prod.sale_price)}</div>
                          <div class="flash-prod-old">{formatCurrency(prod.original_price)}</div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <button class="flash-arrow next" onClick={() => scroll("right")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </Show>
  );
}
