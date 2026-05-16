import { createSignal } from "solid-js";

const [showLoginModal, setShowLoginModal] = createSignal(false);

export { showLoginModal, setShowLoginModal };
