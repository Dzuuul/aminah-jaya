/** Logo kurir — fallback jika URL Biteship/CDN gagal dimuat. */
const COURIER_LOGO_FALLBACKS: Record<string, string> = {
  jne: "/couriers/jne-logo.svg",
  sicepat:
    "/couriers/sicepat-logo.svg",
  jnt: "/couriers/j&t-express-logo.svg",
  tiki: "/couriers/tiki-logo.svg",
  anteraja: "/couriers/anteraja-logo.svg",
  ninja: "/couriers/ninja-xpress-logo.svg",
  paxel: "/couriers/paxel-logo.svg",
  grab: "/couriers/grabexpress-logo.svg",
  gojek: "/couriers/gosend-logo.svg",
  idexpress: "/couriers/id-express-logo.svg",
};

export type ShippingSpeedGroup = "next_day" | "reguler";

export const SHIPPING_SPEED_GROUPS: {
  id: ShippingSpeedGroup;
  label: string;
  hint: string;
}[] = [
  { id: "next_day", label: "Next Day", hint: "Estimasi 0–1 hari" },
  { id: "reguler", label: "Reguler", hint: "Estimasi 2+ hari" },
];

export function courierLogoUrl(
  courierCode: string,
  apiLogo?: string | null,
): string {
  if (apiLogo?.trim()) return apiLogo.trim();
  const code = courierCode.toLowerCase();
  return (
    COURIER_LOGO_FALLBACKS[code] ??
    `https://assets.biteship.com/icons/courier-${code}.png`
  );
}

export function formatShipmentDuration(
  range?: string,
  unit?: string,
  fallback?: string,
): string {
  if (range?.trim() && unit?.trim()) {
    const unitLabel =
      unit.toLowerCase() === "days" || unit.toLowerCase() === "day"
        ? "hari"
        : unit.toLowerCase() === "hours" || unit.toLowerCase() === "hour"
          ? "jam"
          : unit;
    return `${range.trim()} ${unitLabel}`;
  }
  return fallback?.trim() || "";
}

export function resolveSpeedGroup(
  speedGroup?: string | null,
  range?: string,
  unit?: string,
): ShippingSpeedGroup {
  if (speedGroup === "next_day" || speedGroup === "reguler") {
    return speedGroup;
  }

  const unitNorm = (unit || "").trim().toLowerCase();
  const segment = (range || "").trim().split("-").pop()?.trim() || "";
  const maxVal = parseFloat(segment.replace(/[^\d.]/g, "")) || Number.POSITIVE_INFINITY;

  if (!unitNorm || unitNorm === "day" || unitNorm === "days") {
    return maxVal <= 1 ? "next_day" : "reguler";
  }
  if (unitNorm === "hour" || unitNorm === "hours") {
    return maxVal <= 24 ? "next_day" : "reguler";
  }
  return "reguler";
}
