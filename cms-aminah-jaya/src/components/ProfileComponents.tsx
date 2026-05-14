import { JSX, Show } from "solid-js";

/** Reusable card wrapper with a title header */
export function PageCard(props: {
  title: string;
  subtitle?: string;
  children: JSX.Element;
  action?: JSX.Element;
}) {
  return (
    <div style={{ "background-color": "white", "border-radius": "1rem", border: "1px solid rgba(var(--color-border-rgb), 0.5)", "box-shadow": "0 1px 2px 0 rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
      <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", padding: "1rem 1.5rem", "border-bottom": "1px solid rgba(var(--color-border-rgb), 0.4)" }}>
        <div>
          <h3 style={{ "font-size": "0.875rem", "font-weight": "700", color: "var(--color-ink)" }}>{props.title}</h3>
          {props.subtitle && <p style={{ "font-size": "0.75rem", color: "var(--color-muted)", "margin-top": "0.125rem" }}>{props.subtitle}</p>}
        </div>
        {props.action && <div>{props.action}</div>}
      </div>
      <div style={{ padding: "1.5rem" }}>{props.children}</div>
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
    <div style={{ display: "flex", "align-items": "flex-start", gap: "1rem", padding: "0.75rem 0", "border-bottom": "1px solid rgba(var(--color-border-rgb), 0.3)" }} class="last:border-0">
      {Icon && (
        <div style={{ width: "2rem", height: "2rem", "border-radius": "0.5rem", "background-color": "var(--color-sand)", display: "flex", "align-items": "center", "justify-content": "center", "flex-shrink": 0, "margin-top": "0.125rem" }}>
          <Icon size={15} style={{ color: "var(--color-muted)" }} />
        </div>
      )}
      <div style={{ flex: 1, "min-width": "0" }}>
        <p style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase", "letter-spacing": "0.05em", "margin-bottom": "0.25rem" }}>{props.label}</p>
        <Show
          when={props.editing}
          fallback={<p style={{ "font-size": "0.875rem", "font-weight": "600", color: "var(--color-ink)", "word-break": "break-word" }}>{props.value}</p>}
        >
          <input
            type={props.type || "text"}
            value={props.value}
            onInput={(e) => props.onInput?.(e.currentTarget.value)}
            class="login-input"
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
    <div style={{ display: "flex", "align-items": "flex-start", gap: "1rem", padding: "0.75rem 0", "border-bottom": "1px solid rgba(var(--color-border-rgb), 0.3)" }} class="last:border-0">
      <div style={{ display: "flex", "flex-direction": "column", "align-items": "center", gap: "0.25rem", "padding-top": "0.25rem" }}>
        <div style={{ width: "0.625rem", height: "0.625rem", "border-radius": "50%", "background-color": "#4ade80", "flex-shrink": 0 }} />
      </div>
      <div style={{ flex: 1, "min-width": "0" }}>
        <p style={{ "font-size": "0.875rem", "font-weight": "600", color: "var(--color-ink)" }}>{props.action}</p>
        <p style={{ "font-size": "0.75rem", color: "var(--color-muted)", "margin-top": "0.125rem", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>{props.detail}</p>
      </div>
      <span style={{ "font-size": "0.75rem", color: "rgba(var(--color-muted-rgb), 0.7)", "white-space": "nowrap", "flex-shrink": 0, "margin-top": "0.125rem" }}>{props.time}</span>
    </div>
  );
}
