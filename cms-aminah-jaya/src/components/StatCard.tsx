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
    <div class="bg-white p-6 rounded-3xl border border-border/40 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start mb-4">
        <div class={`p-3 rounded-2xl ${props.bg} ${props.color}`}>
          <props.icon size={24} />
        </div>
        {props.change && (
          <span class={`text-xs font-bold px-2 py-1 rounded-lg ${
            isPositive() ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
          }`}>
            {props.change}
          </span>
        )}
        {props.suffix}
      </div>
      <p class="text-muted text-sm font-semibold uppercase tracking-wider">{props.label}</p>
      <h3 class="text-2xl font-bold text-ink mt-1">{props.value}</h3>
    </div>
  );
}
