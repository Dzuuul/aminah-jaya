import { Show, JSX, onMount, onCleanup } from "solid-js";
import { X } from "lucide-solid";
import { Portal } from "solid-js/web";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  maxWidth?: string;
}

export default function Modal(props: ModalProps) {
  // Close on Escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.isOpen) {
      props.onClose();
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <Portal>
      <Show when={props.isOpen}>
        <div 
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && props.onClose()}
        >
          <div 
            class={`bg-white w-full ${props.maxWidth || 'max-w-lg'} rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
          >
            {/* Header */}
            <div class="p-6 border-b border-border flex justify-between items-center bg-cream/30">
              <h2 class="text-xl font-bold text-ink">{props.title}</h2>
              <button 
                onClick={props.onClose}
                class="p-2 hover:bg-cream rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div class="max-h-[80vh] overflow-y-auto">
              {props.children}
            </div>
          </div>
        </div>
      </Show>
    </Portal>
  );
}
