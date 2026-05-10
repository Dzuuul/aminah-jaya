import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-solid";
import { toasts, toast } from "../lib/toast";

export default function ToastContainer() {
  const icons = {
    success: <CheckCircle class="text-green-500" size={20} />,
    error: <AlertCircle class="text-red-500" size={20} />,
    info: <Info class="text-blue-500" size={20} />,
    warning: <AlertTriangle class="text-orange-500" size={20} />,
  };

  const colors = {
    success: "border-green-100 bg-white shadow-green-500/10",
    error: "border-red-100 bg-white shadow-red-500/10",
    info: "border-blue-100 bg-white shadow-blue-500/10",
    warning: "border-orange-100 bg-white shadow-orange-500/10",
  };

  return (
    <Portal>
      <div class="fixed bottom-6 right-6 z-[110] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        <For each={toasts()}>
          {(t) => (
            <div 
              class={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl animate-in slide-in-from-right-full duration-300 ${colors[t.type]}`}
            >
              <div class="mt-0.5 flex-shrink-0">
                {icons[t.type]}
              </div>
              <div class="flex-1 text-sm font-semibold text-ink leading-relaxed">
                {t.message}
              </div>
              <button 
                onClick={() => toast.dismiss(t.id)}
                class="text-muted hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </For>
      </div>
    </Portal>
  );
}
