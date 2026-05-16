import { createSignal } from "solid-js";

const [isFolded, setIsFolded] = createSignal(false);

// Initialize from localStorage if available
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("sidebar-folded");
  if (stored === "true") setIsFolded(true);
}

export const sidebarFolded = isFolded;
export const setSidebarFolded = (val: boolean) => {
  setIsFolded(val);
  if (typeof window !== "undefined") {
    localStorage.setItem("sidebar-folded", String(val));
  }
};

export const toggleSidebarFolded = () => setSidebarFolded(!isFolded());
