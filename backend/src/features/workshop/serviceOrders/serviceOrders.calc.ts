// backend/src/features/workshop/serviceOrders/serviceOrders.calc.ts
//
// Helpers puros y de generación de números de la orden de servicio, extraídos
// de serviceOrders.service.ts para reducir su tamaño. SIN cambios de lógica.

import { PrismaClient } from '../../../generated/prisma/client.js'
import { Money } from '../../../shared/utils/money.js'
import { nextSequentialNumber } from '../../../shared/utils/sequenceGenerator.js'

// Tipo estructural: estas funciones solo necesitan $queryRaw. Acepta tanto
// PrismaClient como el TransactionClient (Omit<...>) que usa el servicio, sin
// acoplarse al alias concreto de cada módulo.
type PrismaClientType = Pick<PrismaClient, '$queryRaw'>

// Genera folio SO-XXXX por empresa usando SELECT FOR UPDATE para evitar duplicados
export async function generateFolio(
  prisma: PrismaClientType,
  empresaId: string
): Promise<string> {
  // Raw query con lock para evitar race condition en creaciones concurrentes
  const result = await (prisma as PrismaClient).$queryRaw<{ folio: string }[]>`
    SELECT folio FROM service_orders
    WHERE "empresaId" = ${empresaId}
    ORDER BY "createdAt" DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `
  const last = result[0]
  const lastNum = last ? parseInt(last.folio.replace('SO-', ''), 10) : 0
  const next = lastNum + 1
  return `SO-${String(next).padStart(4, '0')}`
}

export async function generateWorkshopQuotationNumber(
  prisma: PrismaClientType,
  empresaId: string
): Promise<string> {
  // MAX + FOR UPDATE en vez de COUNT(*) + 1 (que colisiona tras borrados).
  return nextSequentialNumber({
    db: prisma,
    table: 'workshop_quotations',
    column: 'quotationNumber',
    empresaId,
    prefix: 'COT-',
  })
}

export function calcTotals(
  items: {
    type: string
    quantity: number
    unitPrice: number
    discountPct?: number
    taxRate?: number
    taxType?: string
  }[]
) {
  // Acumulación con precisión decimal exacta (evita errores de punto flotante).
  let laborTotal = Money.zero()
  let partsTotal = Money.zero()
  let otherTotal = Money.zero()
  let subtotal = Money.zero()
  let discount = Money.zero()
  let taxAmt = Money.zero()

  for (const item of items) {
    const gross = Money.of(item.quantity).mul(item.unitPrice)
    const lineDiscount = gross.percent(item.discountPct ?? 0)
    const base = gross.sub(lineDiscount)
    const rate = item.taxType === 'EXEMPT' ? 0 : (item.taxRate ?? 0.16)
    const tax = base.mul(rate)

    subtotal = subtotal.add(base)
    discount = discount.add(lineDiscount)
    taxAmt = taxAmt.add(tax)

    if (item.type === 'LABOR') laborTotal = laborTotal.add(base)
    else if (item.type === 'PART') partsTotal = partsTotal.add(base)
    else otherTotal = otherTotal.add(base)
  }

  return {
    laborTotal: laborTotal.toNumber(),
    partsTotal: partsTotal.toNumber(),
    otherTotal: otherTotal.toNumber(),
    subtotal: subtotal.toNumber(),
    discount: discount.toNumber(),
    taxAmt: taxAmt.toNumber(),
    total: subtotal.add(taxAmt).toNumber(),
  }
}
