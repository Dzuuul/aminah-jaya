import { For, createResource, createSignal, onMount, onCleanup, Show } from "solid-js";

const fetchBanners = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/banners`);
  const json = await response.json();
  return json.data || [];
};

export default function Hero() {
  const [banners] = createResource(fetchBanners);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  let interval: any;

  onMount(() => {
    interval = setInterval(() => {
      if (banners() && banners()!.length > 1) {
        nextSlide();
      }
    }, 5000);
  });

  onCleanup(() => clearInterval(interval));

  const nextSlide = () => {
    if (banners()) {
      setCurrentIndex((prev) => (prev + 1) % banners()!.length);
    }
  };

  const prevSlide = () => {
    if (banners()) {
      setCurrentIndex((prev) => (prev - 1 + banners()!.length) % banners()!.length);
    }
  };

  return (
    <section class="hero-slider" id="beranda">
      <div class="container">
        <Show when={!banners.loading} fallback={
          <div class="w-full aspect-[21/9] bg-cream animate-pulse rounded-2xl flex items-center justify-center text-muted">
            Loading banners...
          </div>
        }>
          <div class="hero-slide">
            <div class="hero-banner-contained" style={{ position: "relative", overflow: "hidden" }}>
              <div
                class="flex transition-transform duration-500 ease-out"
                style={{
                  display: "flex",
                  "flex-wrap": "nowrap",
                  transform: `translateX(-${currentIndex() * 100}%)`,
                  transition: "transform 0.5s ease-out"
                }}
              >
                <For each={banners()}>
                  {(banner) => (
                    <div class="min-w-full relative" style={{ flex: "0 0 100%", "min-width": "100%" }}>
                      <a href={banner.link_url || "#"} class="block" style={{ display: "block" }}>
                        <img
                          src={banner.image_url}
                          alt="Banner"
                          class="w-full h-auto block"
                          style={{ width: "100%", height: "auto", display: "block" }}
                        />
                      </a>
                    </div>
                  )}
                </For>
              </div>

              {/* Slider Arrows */}
              <Show when={banners() && banners()!.length > 1}>
                <button
                  class="slider-arrow prev"
                  onClick={(e) => { e.preventDefault(); prevSlide(); }}
                  aria-label="Previous slide"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  class="slider-arrow next"
                  onClick={(e) => { e.preventDefault(); nextSlide(); }}
                  aria-label="Next slide"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Show>

              {/* Slide Dots */}
              <Show when={banners() && banners()!.length > 1}>
                <div class="hero-dots">
                  <For each={banners()}>
                    {(_, i) => (
                      <span
                        class={`hero-dot ${currentIndex() === i() ? "active" : ""}`}
                        onClick={() => setCurrentIndex(i())}
                      ></span>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </section>
  );
}
