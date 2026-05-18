import { createSignal } from "solid-js";
import { getCart, CartItem } from "./api";

const [cartCount, setCartCount] = createSignal(0);
const [cartItems, setCartItems] = createSignal<CartItem[]>([]);
const [cartLoading, setCartLoading] = createSignal(false);

export const refetchCartCount = async () => {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("customer_token");
  if (!token) {
    setCartCount(0);
    setCartItems([]);
    return;
  }
  setCartLoading(true);
  try {
    const items = await getCart();
    setCartCount(items.length);
    setCartItems(items);
  } catch (e) {
    setCartCount(0);
    setCartItems([]);
  } finally {
    setCartLoading(false);
  }
};

export { cartCount, setCartCount, cartItems, setCartItems, cartLoading };
