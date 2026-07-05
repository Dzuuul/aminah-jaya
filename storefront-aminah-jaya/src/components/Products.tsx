import { For, createResource, Show } from "solid-js";
import { JSX } from "solid-js";
import { A } from "@solidjs/router";
import TransitionLink from "~/components/TransitionLink";
import { getProducts, formatCurrency } from "../lib/api";

const WaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.55 4.093 1.513 5.815L.057 23.028a.75.75 0 00.915.915l5.213-1.456A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.087-1.386l-.362-.214-3.757 1.05 1.05-3.757-.214-.362A9.95 9.95 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z" />
  </svg>
);

const DefaultProductIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style={{ width: "3rem", height: "3rem", color: "var(--color-green-500)" }}>
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#fbbf24" }}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const calculateDiscount = (price: number, priceCompare?: number) => {
  if (!priceCompare || priceCompare <= price) return null;
  return Math.round(((priceCompare - price) / priceCompare) * 100);
};

const renderStars = (rating?: number, count?: number) => {
  if (!rating || rating === 0) return null;
  return (
    <div style={{ "display": "flex", "align-items": "center", "gap": "6px", "font-size": "0.75rem", "color": "var(--muted)" }}>
      <div style={{ "display": "flex", "gap": "2px" }}>
        <For each={Array(5).fill(0)}>
          {(_, i) => (
            <div style={{ "opacity": i() < Math.round(rating) ? "1" : "0.3" }}>
              <StarIcon />
            </div>
          )}
        </For>
      </div>
      <span>{rating.toFixed(1)} {count && `(${count})`}</span>
    </div>
  );
};

export default function Products() {
  const [products] = createResource(getProducts);

  return (
    <section class="products" id="produk">
      <div class="container">
        <div class="products-header-row">
          <div>
            <span class="section-label">Produk Unggulan</span>
            <h2 class="section-title">Rekomendasi Minggu Ini</h2>
            <p class="section-sub">Koleksi khusus pilihan kami, kurasi terbaik untuk memulai perjalanan Anda</p>
          </div>
          <A
            href="/shop"
            class="btn btn-outline btn-sm"
            style={{ "white-space": "nowrap", "flex-shrink": "0" }}
          >
            Katalog Lengkap →
          </A>
        </div>

        <div class="prod-grid">
          <Show
            when={!products.loading}
            fallback={
              <For each={[1, 2, 3, 4, 5, 6]}>
                {() => (
                  <div class="prod-card skeleton" style={{ height: "400px", "background-color": "var(--color-sand)", "border-radius": "1.5rem" }}></div>
                )}
              </For>
            }
          >
            <For each={products()?.filter((p: any) => p.is_featured).slice(0, 6)}>
              {(product) => {
                const discount = calculateDiscount(product.price, product.price_compare);
                return (
                  <TransitionLink href={`/product/${product.slug}`} state={{ fallbackImg: product.thumbnail_url, fallbackId: product.id }} class="prod-card" style={{ "text-decoration": "none", "color": "inherit", "display": "block" }}>
                    <div class="prod-img" style={{ "view-transition-name": `product-img-${product.id}` }}>
                      <Show
                        when={product.thumbnail_url}
                        fallback={<DefaultProductIcon />}
                      >
                        <img
                          src={product.thumbnail_url!}
                          alt={product.name}
                          style={{ width: "100%", height: "100%", "object-fit": "cover" }}
                        />
                      </Show>
                      <Show when={discount}>
                        <div class="prod-badge" style={{ background: "var(--red-sale)" }}>
                          -{discount}%
                        </div>
                      </Show>
                    </div>
                    <div class="prod-body">
                      <div class="prod-cat">{product.category_name}</div>
                      <div class="prod-name">{product.name}</div>
                      <p class="prod-desc">{product.subtitle || "Produk berkualitas dari Aminah Jaya."}</p>

                      <Show when={product.average_rating && product.average_rating > 0}>
                        <div style={{ "margin-bottom": "12px" }}>
                          {renderStars(product.average_rating, product.total_reviews)}
                        </div>
                      </Show>

                      <div class="prod-footer">
                        <div>
                          <span class="prod-price">{formatCurrency(product.price)}</span>
                          <Show when={product.price_compare != null && product.price_compare > product.price}>
                            <div style={{ "font-size": "0.75rem", "color": "var(--muted)", "text-decoration": "line-through" }}>
                              {formatCurrency(product.price_compare!)}
                            </div>
                          </Show>
                        </div>
                        <div class="btn btn-wa btn-sm">
                          <WaIcon />
                          Detail
                        </div>
                      </div>
                    </div>
                  </TransitionLink>
                );
              }}
            </For>
          </Show>
        </div>
      </div>
    </section>
  );
}
