/**
 * Conversión de montos entre monedas usando tasas VES de referencia.
 *
 * Convención: las tasas son "VES por 1 unidad" (usdVesRate = bolívares por dólar).
 * Extraído de PurchaseOrderForm para reutilizarse en otros formularios con la
 * misma lógica (cotizaciones, gastos, etc.).
 */

/** Tasa VES de la moneda dada (VES=1). Devuelve null si no hay tasa válida. */
export function getCurrencyVesRate(
  currency: string,
  usdVesRate: number | null,
  eurVesRate: number | null,
): number | null {
  if (currency === "VES") return 1;
  if (currency === "USD")
    return usdVesRate && usdVesRate > 0 ? usdVesRate : null;
  if (currency === "EUR")
    return eurVesRate && eurVesRate > 0 ? eurVesRate : null;
  return null;
}

/** Convierte `amount` de una moneda a otra. null si falta alguna tasa. */
export function convertAmountBetweenCurrencies(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  usdVesRate: number | null,
  eurVesRate: number | null,
): number | null {
  if (!amount) return 0;

  const fromRate = getCurrencyVesRate(fromCurrency, usdVesRate, eurVesRate);
  const toRate = getCurrencyVesRate(toCurrency, usdVesRate, eurVesRate);
  if (!fromRate || !toRate) return null;

  return Math.round(((amount * fromRate) / toRate) * 100) / 100;
}

/** Convierte un costo en USD a la moneda destino; si no hay tasa, deja el USD. */
export function convertCostFromUsd(
  costUsd: number,
  currency: string,
  usdVesRate: number | null,
  eurVesRate: number | null,
): number {
  return (
    convertAmountBetweenCurrencies(
      costUsd,
      "USD",
      currency,
      usdVesRate,
      eurVesRate,
    ) ?? costUsd
  );
}
