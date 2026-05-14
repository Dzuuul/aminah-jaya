import { Show, createSignal } from "solid-js";
import Modal from "./Modal";
import { AlertTriangle, Loader2 } from "lucide-solid";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal(props: ConfirmModalProps) {
  const [isLoading, setIsLoading] = createSignal(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await props.onConfirm();
      props.onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.title}
      maxWidth="max-w-md"
    >
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", "align-items": "center", gap: "1rem", "margin-bottom": "1.5rem" }}>
          <div style={{ 
            width: "3rem", 
            height: "3rem", 
            "border-radius": "1rem", 
            display: "flex", 
            "align-items": "center", 
            "justify-content": "center", 
            "flex-shrink": 0,
            "background-color": props.isDanger ? "#fef2f2" : "#eff6ff",
            color: props.isDanger ? "#ef4444" : "#3b82f6"
          }}>
            <AlertTriangle size={24} />
          </div>
          <p style={{ color: "var(--color-ink-light)", "line-height": 1.625 }}>
            {props.message}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={props.onClose}
            disabled={isLoading()}
            style={{ 
              flex: 1, 
              padding: "0.75rem 1rem", 
              "background-color": "var(--color-cream)", 
              color: "var(--color-ink)", 
              "font-weight": "700", 
              "border-radius": "1rem", 
              border: "none", 
              cursor: isLoading() ? "not-allowed" : "pointer", 
              transition: "all 0.2s",
              opacity: isLoading() ? 0.5 : 1
            }}
          >
            {props.cancelText || "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading()}
            style={{ 
              flex: 1, 
              padding: "0.75rem 1rem", 
              color: "white", 
              "font-weight": "700", 
              "border-radius": "1rem", 
              border: "none", 
              cursor: isLoading() ? "not-allowed" : "pointer", 
              transition: "all 0.2s",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              gap: "0.5rem",
              "background-color": props.isDanger ? "#ef4444" : "var(--color-green-500)",
              "box-shadow": props.isDanger ? "0 10px 15px -3px rgba(239, 68, 68, 0.2)" : "0 10px 15px -3px rgba(42, 138, 96, 0.2)",
              opacity: isLoading() ? 0.5 : 1
            }}
          >
            <Show when={isLoading()}>
              <Loader2 size={18} class="animate-spin" />
            </Show>
            {isLoading() ? "Processing..." : (props.confirmText || "Confirm")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
