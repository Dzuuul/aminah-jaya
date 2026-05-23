import { createSignal, createResource, For, Show, Suspense } from "solid-js";
import { A } from "@solidjs/router";
import { getCart, updateCartItem, removeFromCart, formatCurrency, CartItem } from "~/lib/api";
import { refetchCartCount } from "~/lib/cart-store";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";

export default function Cart() {
  const [cartItems, { mutate, refetch }] = createResource(
    () => typeof window !== "undefined",
    async (isClient) => {
      if (!isClient) return [];
      return await getCart();
    }
  );
  const [updating, setUpdating] = createSignal<string | null>(null);

  const subtotal = () => cartItems()?.reduce((acc, item) => acc + (item.product_price * item.quantity), 0) || 0;

  const handleUpdateQty = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdating(id);
    try {
      await updateCartItem(id, newQty);
      await refetchCartCount();
      mutate(prev => prev?.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    } catch (e) {
      console.error("Failed to update quantity", e);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Hapus item ini dari keranjang?")) return;
    setUpdating(id);
    try {
      await removeFromCart(id);
      await refetchCartCount();
      mutate(prev => prev?.filter(item => item.id !== id));
    } catch (e) {
      console.error("Failed to remove item", e);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div class="min-h-screen bg-[#fcfcfc]">
      <Navbar />
      <main class="cart-page-container">
        <div class="cart-content">
          <div class="cart-header-main">
            <h1 class="cart-title-main">Keranjang Belanja</h1>
            <p class="cart-subtitle-main">Kelola produk pilihan Anda sebelum melakukan pembayaran</p>
          </div>

          <Suspense fallback={<div class="py-20"><Loading message="Memuat keranjang..." /></div>}>
            <Show when={cartItems() && cartItems()!.length > 0} fallback={
              <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2>Keranjang Anda Kosong</h2>
                <p>Sepertinya Anda belum menambahkan produk apapun ke keranjang.</p>
                <A href="/shop" class="btn-shop-now">Mulai Belanja</A>
              </div>
            }>
              <div class="cart-grid-main">
                <div class="cart-items-list">
                  <For each={cartItems()}>
                    {(item) => (
                      <div class="cart-item-card">
                        <div class="cart-item-img">
                          <img src={item.product_thumbnail || "/placeholder.jpg"} alt={item.product_name} />
                        </div>
                        <div class="cart-item-details">
                          <A href={`/product/${item.product_slug}`} class="cart-item-name">{item.product_name}</A>
                          <div class="cart-item-price">{formatCurrency(item.product_price)}</div>
                          <div class="cart-item-actions-row">
                            <div class="cart-qty-ctrl">
                              <button 
                                class="qty-btn-sm" 
                                onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                                disabled={updating() === item.id || item.quantity <= 1}
                              >−</button>
                              <span class="qty-val">{item.quantity}</span>
                              <button 
                                class="qty-btn-sm" 
                                onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                disabled={updating() === item.id}
                              >+</button>
                            </div>
                            <button 
                              class="btn-remove-item" 
                              onClick={() => handleRemove(item.id)}
                              disabled={updating() === item.id}
                            >
                              <span class="material-symbols-outlined">delete</span>
                              Hapus
                            </button>
                          </div>
                        </div>
                        <div class="cart-item-total">
                          {formatCurrency(item.product_price * item.quantity)}
                        </div>
                      </div>
                    )}
                  </For>
                </div>

                <div class="cart-summary-sidebar">
                  <div class="summary-card">
                    <h3 class="summary-title">Ringkasan Belanja</h3>
                    <div class="summary-row">
                      <span>Total Harga ({cartItems()?.length} barang)</span>
                      <span>{formatCurrency(subtotal())}</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-row total">
                      <span>Total Tagihan</span>
                      <span class="total-price">{formatCurrency(subtotal())}</span>
                    </div>
                    <A href="/checkout" class="btn-checkout-main" style={{ "text-decoration": "none", "display": "flex", "align-items": "center", "justify-content": "center", "gap": "8px", "color": "white" }}>
                      Lanjut ke Pembayaran
                      <span class="material-symbols-outlined">arrow_forward</span>
                    </A>
                    <p class="checkout-note">Aman & Terenkripsi</p>
                  </div>
                </div>
              </div>
            </Show>
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
