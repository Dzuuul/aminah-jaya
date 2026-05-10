import { createSignal } from "solid-js";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const [toasts, setToasts] = createSignal<Toast[]>([]);
let nextId = 0;

export const toast = {
  show: (message: string, type: ToastType = "info", duration = 3000) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  success: (message: string, duration = 3000) => toast.show(message, "success", duration),
  error: (message: string, duration = 5000) => toast.show(message, "error", duration),
  info: (message: string, duration = 3000) => toast.show(message, "info", duration),
  warning: (message: string, duration = 4000) => toast.show(message, "warning", duration),
  dismiss: (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  },
};

export { toasts };
