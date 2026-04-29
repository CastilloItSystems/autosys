export const FINANCING_STATUS_OPTIONS = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Enviada", value: "SUBMITTED" },
  { label: "En revisión", value: "UNDER_REVIEW" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Cancelada", value: "CANCELLED" },
  { label: "Desembolsada", value: "DISBURSED" },
];

export const FINANCING_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...FINANCING_STATUS_OPTIONS,
];

export const FINANCING_CURRENCY_OPTIONS = [
  { label: "USD – Dólar", value: "USD" },
  { label: "VES – Bolívar", value: "VES" },
  { label: "EUR – Euro", value: "EUR" },
];

export const FINANCING_FX_SOURCE_OPTIONS = [
  { label: "BCV Auto", value: "BCV_AUTO" },
  { label: "Manual", value: "MANUAL" },
];

export const FINANCING_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
  }
> = {
  DRAFT: { label: "Borrador", severity: "warning" },
  SUBMITTED: { label: "Enviada", severity: "info" },
  UNDER_REVIEW: { label: "En revisión", severity: "info" },
  APPROVED: { label: "Aprobada", severity: "success" },
  REJECTED: { label: "Rechazada", severity: "danger" },
  CANCELLED: { label: "Cancelada", severity: "danger" },
  DISBURSED: { label: "Desembolsada", severity: "success" },
};

export const FINANCING_CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  VES: "Bs.",
};

export const FINANCING_CURRENCY_SEVERITY: Record<
  string,
  "success" | "warning" | "info" | "secondary"
> = {
  USD: "info",
  VES: "warning",
  EUR: "success",
};

export function formatFinancingAmount(
  value: number | string | null | undefined,
  currency: string,
): string {
  if (value == null) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  const sym = FINANCING_CURRENCY_SYMBOLS[currency] || currency;
  return `${sym} ${num.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatFinancingCrossRef(
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

export function formatFormCrossRef(
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
