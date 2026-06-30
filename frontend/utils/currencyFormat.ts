/**
 * Helpers de formato multi-moneda.
 * Convención: `exchangeRate` = unidades de currency por 1 USD.
 *   USD_equivalente = amount / rate.
 */

export type CurrencyAmount = Record<string, number>;

/**
 * Símbolos de moneda compartidos. Antes estaba duplicado en 18+ componentes;
 * usar esta constante / `currencySymbol()` en su lugar.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  VES: "Bs.",
};

/** Símbolo de la moneda; si no se conoce, devuelve el propio código. */
export const currencySymbol = (currency = "USD") =>
  CURRENCY_SYMBOLS[currency] ?? currency;

export const formatAmount = (value: number) =>
  new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatCurrency = (value: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${formatAmount(value)}`;
  }
};

/**
 * Devuelve entradas no-cero ordenadas desc.
 */
export const breakdownEntries = (m: CurrencyAmount | undefined | null) =>
  m
    ? Object.entries(m)
        .filter(([, v]) => v != null && v !== 0)
        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    : [];

/**
 * Texto de una sola línea con todas las monedas (para tooltips o exports).
 */
export const formatBreakdownLine = (m: CurrencyAmount | undefined | null) => {
  const entries = breakdownEntries(m);
  if (entries.length === 0) return "—";
  return entries.map(([c, v]) => formatCurrency(v, c)).join(" · ");
};
