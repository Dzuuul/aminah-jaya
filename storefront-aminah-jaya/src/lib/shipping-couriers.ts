/** Logo kurir — fallback jika URL Biteship/CDN gagal dimuat. */
const COURIER_LOGO_FALLBACKS: Record<string, string> = {
  jne: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/New_JNE_logo.svg/120px-New_JNE_logo.svg.png",
  sicepat:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/SiCepat_Ekspres_logo.svg/120px-SiCepat_Ekspres_logo.svg.png",
  jnt: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/J%26T_Express_logo.svg/120px-J%26T_Express_logo.svg.png",
  tiki: "https://upload.wikimedia.org/wikipedia/id/thumb/0/0e/Tiki_Logo.svg/120px-Tiki_Logo.svg.png",
  anteraja:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/AnterAja_logo.svg/120px-AnterAja_logo.svg.png",
  ninja:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Ninja_Xpress_logo.svg/120px-Ninja_Xpress_logo.svg.png",
  paxel:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Paxel_logo.svg/120px-Paxel_logo.svg.png",
  grab: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Grab_Logo.svg/120px-Grab_Logo.svg.png",
  gojek:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Gojek_logo_2019.svg/120px-Gojek_logo_2019.svg.png",
  idexpress:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ID_Express_logo.svg/120px-ID_Express_logo.svg.png",
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
