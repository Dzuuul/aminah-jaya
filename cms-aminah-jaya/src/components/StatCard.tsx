import { JSX } from "solid-js";

export interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  icon: any;
  color: string;  // e.g. "text-green-500"
  bg: string;     // e.g. "bg-green-50"
  suffix?: JSX.Element;
}

export default function StatCard(props: StatCardProps) {
  const isPositive = () => props.change?.startsWith("+");
  
  return (
    <div class="stat-card-custom">
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-start", "margin-bottom": "1rem" }}>
        <div style={{ padding: "0.75rem", "border-radius": "1rem", "background-color": props.bg, color: props.color }}>
          <props.icon size={24} />
        </div>
        {props.change && (
          <span style={{ 
            "font-size": "0.75rem", 
            "font-weight": "700", 
            padding: "0.25rem 0.5rem", 
            "border-radius": "0.5rem",
            color: isPositive() ? "#16a34a" : "#dc2626",
            "background-color": isPositive() ? "#f0fdf4" : "#fef2f2"
          }}>
            {props.change}
          </span>
        )}
        {props.suffix}
      </div>
      <p style={{ color: "var(--color-muted)", "font-size": "0.875rem", "font-weight": "600", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>{props.label}</p>
      <h3 style={{ "font-size": "1.5rem", "font-weight": "700", color: "var(--color-ink)", "margin-top": "0.25rem" }}>{props.value}</h3>
    </div>
  );
}
