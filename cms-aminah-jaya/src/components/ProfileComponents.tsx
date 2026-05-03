import { JSX, Show } from "solid-js";

/** Reusable card wrapper with a title header */
export function PageCard(props: {
  title: string;
  subtitle?: string;
  children: JSX.Element;
  action?: JSX.Element;
}) {
  return (
    <div class="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div>
          <h3 class="text-sm font-bold text-ink">{props.title}</h3>
          {props.subtitle && <p class="text-xs text-muted mt-0.5">{props.subtitle}</p>}
        </div>
        {props.action && <div>{props.action}</div>}
      </div>
      <div class="p-6">{props.children}</div>
    </div>
  );
}

/** A labelled info row — shows value as text, or slot when in edit mode */
export function InfoRow(props: {
  label: string;
  value: string;
  editing?: boolean;
  type?: string;
  onInput?: (val: string) => void;
  icon?: any;
}) {
  const Icon = props.icon;
  return (
    <div class="flex items-start gap-4 py-3 border-b border-border/30 last:border-0">
      {Icon && (
        <div class="w-8 h-8 rounded-lg bg-sand flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={15} class="text-muted" />
        </div>
      )}
      <div class="flex-1 min-w-0">
        <p class="text-xs font-bold text-muted uppercase tracking-wider mb-1">{props.label}</p>
        <Show
          when={props.editing}
          fallback={<p class="text-sm font-semibold text-ink break-words">{props.value}</p>}
        >
          <input
            type={props.type || "text"}
            value={props.value}
            onInput={(e) => props.onInput?.(e.currentTarget.value)}
            class="filter-input"
          />
        </Show>
      </div>
    </div>
  );
}

/** Single activity timeline item */
export function ActivityItem(props: {
  action: string;
  detail: string;
  time: string;
}) {
  return (
    <div class="flex items-start gap-4 py-3 border-b border-border/30 last:border-0">
      <div class="flex flex-col items-center gap-1 pt-1">
        <div class="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-ink">{props.action}</p>
        <p class="text-xs text-muted mt-0.5 truncate">{props.detail}</p>
      </div>
      <span class="text-xs text-muted/70 whitespace-nowrap flex-shrink-0 mt-0.5">{props.time}</span>
    </div>
  );
}
