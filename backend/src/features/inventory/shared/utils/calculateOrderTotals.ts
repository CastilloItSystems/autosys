// backend/src/features/inventory/purchaseOrders/calculateOrderTotals.ts

/**
 * Pure function that calculates all fiscal totals for a purchase order.
 * Used by the service to recalculate from scratch (never trusts frontend values).
 *
 * Flow (SENIAT-compliant):
 *  1. Per-line: subtotal = qty × unitCost
 *  2. Per-line: discount = subtotal × (discountPercent / 100)
 *  3. Per-line: net = subtotal - discount
 *  4. subtotalBruto = Σ nets
 *  5. Global discount distributed proportionally across gravadas/exentas
 *  6. baseImponible = sumGravadas - proporcional gravado
 *  7. baseExenta = sumExentas - proporcional exento
 *  8. taxAmount = baseImponible × (taxRate / 100)
 *  9. igtfAmount = (baseImponible + baseExenta + taxAmount) × (igtfRate / 100)  [if applies]
 * 10. total = baseImponible + baseExenta + taxAmount + igtfAmount
 */

export interface CalcItemInput {
  quantityOrdered: number
  unitCost: number
  discountPercent?: number
  taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
}

export interface CalcItemResult {
  subtotal: number
  discountAmount: number
  net: number
  taxType: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate: number
  taxAmount: number
  totalLine: number
}

export interface CalcOrderResult {
  discountAmount: number
  subtotalBruto: number
  baseImponible: number
  baseExenta: number
  taxAmount: number
  igtfAmount: number
  total: number
  items: CalcItemResult[]
}

const TAX_RATES: Record<string, number> = {
  IVA: 16,
  EXEMPT: 0,
  REDUCED: 8,
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calculateOrderTotals(
  items: CalcItemInput[],
  globalDiscountAmount: number = 0,
  igtfApplies: boolean = false,
  _taxRate: number = 16, // kept for signature compat, actual rate comes from taxType
  igtfRate: number = 3
): CalcOrderResult {
  // Step 1-3: Calculate per-line values
  const itemResults: CalcItemResult[] = items.map((item) => {
    const taxType = item.taxType || 'IVA'
    const taxRate = TAX_RATES[taxType] ?? 16
    const subtotal = round2(item.quantityOrdered * item.unitCost)
    const discountAmount = round2(subtotal * ((item.discountPercent || 0) / 100))
    const net = round2(subtotal - discountAmount)

    return {
      subtotal,
      discountAmount,
      net,
      taxType,
      taxRate,
      taxAmount: 0,   // calculated after global discount distribution
      totalLine: 0,    // calculated at the end
    }
  })

  // Step 4: Subtotal bruto
  const subtotalBruto = round2(itemResults.reduce((sum, i) => sum + i.net, 0))

  // Step 5: Distribute global discount proportionally
  const clampedDiscount = round2(Math.min(globalDiscountAmount, subtotalBruto))

  const sumGravadas = round2(
    itemResults
      .filter((i) => i.taxType !== 'EXEMPT')
      .reduce((sum, i) => sum + i.net, 0)
  )
  const sumExentas = round2(
    itemResults
      .filter((i) => i.taxType === 'EXEMPT')
      .reduce((sum, i) => sum + i.net, 0)
  )

  let descGravado = 0
  let descExento = 0
  if (subtotalBruto > 0) {
    descGravado = round2(clampedDiscount * (sumGravadas / subtotalBruto))
    descExento = round2(clampedDiscount - descGravado) // remainder to avoid rounding loss
  }

  // Step 6-7: Bases after global discount
  const baseImponible = round2(Math.max(0, sumGravadas - descGravado))
  const baseExenta = round2(Math.max(0, sumExentas - descExento))

  // Step 8: IVA on baseImponible
  // We need to calculate per-line tax proportionally
  // Distribute baseImponible tax across gravada items proportionally
  let totalTaxAmount = 0

  for (const item of itemResults) {
    if (item.taxType === 'EXEMPT') {
      item.taxAmount = 0
    } else {
      // Proportional share of the base after global discount
      const itemShare = sumGravadas > 0
        ? round2((item.net / sumGravadas) * baseImponible)
        : 0
      item.taxAmount = round2(itemShare * (item.taxRate / 100))
    }
    totalTaxAmount = round2(totalTaxAmount + item.taxAmount)
  }

  // Step 9: IGTF
  const igtfAmount = igtfApplies
    ? round2((baseImponible + baseExenta + totalTaxAmount) * (igtfRate / 100))
    : 0

  // Step 10: Total
  const total = round2(baseImponible + baseExenta + totalTaxAmount + igtfAmount)

  // Calculate totalLine for each item
  for (const item of itemResults) {
    item.totalLine = round2(item.net + item.taxAmount)
  }

  return {
    discountAmount: clampedDiscount,
    subtotalBruto,
    baseImponible,
    baseExenta,
    taxAmount: totalTaxAmount,
    igtfAmount,
    total,
    items: itemResults,
  }
}
