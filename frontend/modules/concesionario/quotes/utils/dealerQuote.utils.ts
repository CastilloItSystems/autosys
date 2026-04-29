export const QUOTE_STATUS_OPTIONS = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Enviada", value: "SENT" },
  { label: "Negociación", value: "NEGOTIATING" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Expirada", value: "EXPIRED" },
  { label: "Convertida", value: "CONVERTED" },
];

export const QUOTE_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estatus", value: "" },
  ...QUOTE_STATUS_OPTIONS,
];

export const QUOTE_YES_NO_OPTIONS = [
  { label: "Sí", value: true },
  { label: "No", value: false },
];

export const QUOTE_CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD" },
  { label: "VES (Bs.)", value: "VES" },
  { label: "EUR (€)", value: "EUR" },
];

export const QUOTE_FX_SOURCE_OPTIONS = [
  { label: "BCV automático", value: "BCV_AUTO" },
  { label: "Manual", value: "MANUAL" },
];

export const QUOTE_CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  VES: "Bs.",
};

export const QUOTE_CURRENCY_SEVERITY: Record<
  string,
  "success" | "warning" | "info" | "secondary"
> = {
  USD: "info",
  VES: "warning",
  EUR: "success",
};

export const QUOTE_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
  }
> = {
  DRAFT: { label: "Borrador", severity: "warning" },
  SENT: { label: "Enviada", severity: "info" },
  NEGOTIATING: { label: "Negociación", severity: "info" },
  APPROVED: { label: "Aprobada", severity: "success" },
  REJECTED: { label: "Rechazada", severity: "danger" },
  EXPIRED: { label: "Expirada", severity: "danger" },
  CONVERTED: { label: "Convertida", severity: "success" },
};

export const QUOTE_FISCAL_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "warning" | "danger" | "info" | "secondary";
  }
> = {
  NOT_REQUESTED: { label: "No Solicitado", severity: "secondary" },
  ORDER_DRAFT: { label: "Orden Borrador", severity: "warning" },
  ORDER_APPROVED: { label: "Orden Aprobada", severity: "info" },
  PREINVOICE_READY: { label: "Pre-Factura Lista", severity: "success" },
  PAID: { label: "Pagada", severity: "success" },
  INVOICED: { label: "Facturada", severity: "success" },
  ERROR: { label: "Error", severity: "danger" },
};

export function formatQuoteAmount(
  value: number | string | null | undefined,
  currency: string,
): string {
  if (value == null) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  const sym = QUOTE_CURRENCY_SYMBOLS[currency] || currency;
  return `${sym} ${num.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQuoteCrossRef(
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

export function formatFormQuoteCrossRef(
  total: number,
  currency: string,
  exchangeRate?: number | null,
): string | null {
  const rate = Number(exchangeRate);
  if (!rate || rate <= 0) return null;
  if (currency === "VES")
    return `≈ $ ${(total / rate).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  return `≈ Bs. ${(total * rate).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
