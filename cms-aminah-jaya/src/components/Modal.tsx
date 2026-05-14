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
          class="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && props.onClose()}
        >
          <div 
            class="modal-container"
            style={{ "max-width": props.maxWidth === 'max-w-md' ? '28rem' : props.maxWidth === 'max-w-2xl' ? '42rem' : props.maxWidth === 'max-w-3xl' ? '48rem' : '32rem' }}
          >
            {/* Header */}
            <div class="modal-header">
              <h2 class="modal-title">{props.title}</h2>
              <button 
                onClick={props.onClose}
                class="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div class="modal-body">
              {props.children}
            </div>
          </div>
        </div>
      </Show>
    </Portal>
  );
}
