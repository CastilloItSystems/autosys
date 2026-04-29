export const RESERVATION_STATUS_OPTIONS = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Confirmada", value: "CONFIRMED" },
  { label: "Expirada", value: "EXPIRED" },
  { label: "Cancelada", value: "CANCELLED" },
  { label: "Convertida", value: "CONVERTED" },
];

export const RESERVATION_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...RESERVATION_STATUS_OPTIONS,
];

export const RESERVATION_CURRENCY_OPTIONS = [
  { label: "USD – Dólar", value: "USD" },
  { label: "VES – Bolívar", value: "VES" },
  { label: "EUR – Euro", value: "EUR" },
];

export const RESERVATION_FX_SOURCE_OPTIONS = [
  { label: "BCV Auto", value: "BCV_AUTO" },
  { label: "Manual", value: "MANUAL" },
];

export const RESERVATION_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
  }
> = {
  PENDING: { label: "Pendiente", severity: "warning" },
  CONFIRMED: { label: "Confirmada", severity: "info" },
  EXPIRED: { label: "Expirada", severity: "danger" },
  CANCELLED: { label: "Cancelada", severity: "danger" },
  CONVERTED: { label: "Convertida", severity: "success" },
};

export const RESERVATION_CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  VES: "Bs.",
};

export const RESERVATION_CURRENCY_SEVERITY: Record<
  string,
  "success" | "warning" | "info" | "secondary"
> = {
  USD: "info",
  VES: "warning",
  EUR: "success",
};

export function formatReservationAmount(
  value: number | string | null | undefined,
  currency: string,
): string {
  if (value == null) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  const sym = RESERVATION_CURRENCY_SYMBOLS[currency] || currency;
  return `${sym} ${num.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatReservationCrossRef(
  amount: number | string | null | undefined,
  currency: string,
  rate: number | string | null | undefined,
): string | null {
  if (amount == null || rate == null) return null;
  const num = Number(amount);
  const r = Number(rate);
  if (!num || !r || r <= 0) return null;
  if (currency === "VES") {
    return `≈ $ ${(num / r).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }
  return `≈ Bs. ${(num * r).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatFormReservationCrossRef(
  amount: number,
  currency: string,
  rate: number | null | undefined,
): string | null {
  if (!rate || rate <= 0 || !amount) return null;
  if (currency === "VES") {
    const usd = amount / rate;
    return `≈ $ ${usd.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }
  const ves = amount * rate;
  return `≈ Bs. ${ves.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
