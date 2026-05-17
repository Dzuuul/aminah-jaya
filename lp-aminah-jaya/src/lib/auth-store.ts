import { createSignal } from "solid-js";

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

const [showLoginModal, setShowLoginModal] = createSignal(false);
const [customerProfile, setCustomerProfile] = createSignal<CustomerProfile | null>(null);

export { showLoginModal, setShowLoginModal, customerProfile, setCustomerProfile };
