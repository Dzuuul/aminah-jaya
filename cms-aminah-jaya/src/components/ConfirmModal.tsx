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
      <div class="p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            props.isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <p class="text-ink-light leading-relaxed">
            {props.message}
          </p>
        </div>

        <div class="flex gap-3">
          <button
            onClick={props.onClose}
            disabled={isLoading()}
            class="flex-1 py-3 px-4 bg-cream text-ink font-bold rounded-2xl hover:bg-border transition-all disabled:opacity-50"
          >
            {props.cancelText || "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading()}
            class={`flex-1 py-3 px-4 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
              props.isDanger 
                ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' 
                : 'bg-green-500 shadow-green-500/20 hover:bg-green-600'
            }`}
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
