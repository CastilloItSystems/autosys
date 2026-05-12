/**
 * Currency conversion helpers.
 *
 * Convention: `exchangeRate` (en cualquier documento o tabla ExchangeRate
 * con fromCurrency=USD) representa **unidades de la moneda extranjera por
 * 1 USD** (ej: VES 36.5 / USD). Para convertir un monto a USD:
 *   USD = amount / rate
 */

export type FallbackRateMap = Record<string, number>

/**
 * Construye map `{[currency]: unidades por 1 USD}` desde la tabla
 * ExchangeRate (activos). Soporta filas en ambos sentidos:
 *   - fromCurrency=USD → toCurrency=X (rate = X por 1 USD) ⇒ rate directo
 *   - fromCurrency=X   → toCurrency=USD (rate = USD por 1 X) ⇒ guardamos 1/rate
 */
export async function buildFallbackRateMap(
  db: any,
  empresaId?: string,
): Promise<FallbackRateMap> {
  const where: any = { isActive: true }
  if (empresaId) where.empresaId = empresaId
  const rows = await db.exchangeRate.findMany({
    where: {
      ...where,
      OR: [{ toCurrency: 'USD' }, { fromCurrency: 'USD' }],
    },
    orderBy: { rateDate: 'desc' },
    select: { fromCurrency: true, toCurrency: true, rate: true },
  })
  const map: FallbackRateMap = {}
  for (const r of rows) {
    const rate = Number(r.rate)
    if (!rate) continue
    if (r.fromCurrency === 'USD' && r.toCurrency !== 'USD') {
      if (!map[r.toCurrency]) map[r.toCurrency] = rate
    }
    if (r.toCurrency === 'USD' && r.fromCurrency !== 'USD') {
      if (!map[r.fromCurrency] && rate !== 0) map[r.fromCurrency] = 1 / rate
    }
  }
  return map
}

/**
 * Convierte un monto a USD usando primero la tasa del documento, luego el
 * map fallback. Devuelve `null` si no hay tasa disponible para conversión.
 */
export function toUSD(
  amount: number,
  currency: string,
  docRate: number | null | undefined,
  fallback: FallbackRateMap,
): number | null {
  if (currency === 'USD') return amount
  const rate = docRate && docRate > 0 ? docRate : fallback[currency]
  if (!rate || rate <= 0) return null
  return amount / rate
}

/**
 * Acumula un monto en breakdown por moneda y suma equivalente USD.
 * Muta `acc` por eficiencia.
 */
export function accumulate(
  acc: { revenue: Record<string, number>; revenueUSD: number; unconverted: number },
  amount: number,
  currency: string,
  docRate: number | null | undefined,
  fallback: FallbackRateMap,
): void {
  acc.revenue[currency] = (acc.revenue[currency] ?? 0) + amount
  const usd = toUSD(amount, currency, docRate, fallback)
  if (usd == null) acc.unconverted += amount
  else acc.revenueUSD += usd
}

export const emptyBreakdown = () => ({
  revenue: {} as Record<string, number>,
  revenueUSD: 0,
  unconverted: 0,
})
