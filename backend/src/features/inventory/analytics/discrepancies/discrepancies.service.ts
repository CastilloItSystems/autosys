import prisma from '../../../../services/prisma.service'
import { startOfMonth, subMonths } from 'date-fns'

export class DiscrepancyAnalyticsService {
  async getTopDiscrepancies(limit: number = 5) {
    // Últimos 30 días
    const startDate = subMonths(new Date(), 1)

    // Buscar movimientos con varianza != 0 (y no nulos)
    // Como Prisma no tiene un "groupBy" con SUM de valor absoluto directo fácil,
    // haremos una query raw o findMany y procesaremos (si el volumen no es masivo).
    // Para escalabilidad, raw query es mejor.

    // Raw query para Postgres
    const result = await prisma.$queryRaw`
      SELECT 
        m."itemId",
        i.name as "itemName",
        i.sku as "itemSku",
        COUNT(m.id) as "occurrenceCount",
        SUM(ABS(COALESCE(m.variance, 0))) as "totalVarianceAbs",
        SUM(COALESCE(m.variance, 0)) as "netVariance"
      FROM movements m
      JOIN items i ON m."itemId" = i.id
      WHERE m."variance" IS NOT NULL 
        AND m."variance" != 0
        AND m."createdAt" >= ${startDate}
      GROUP BY m."itemId", i.name, i.sku
      ORDER BY "totalVarianceAbs" DESC
      LIMIT ${limit}
    `

    // Convert BigInt to Number (Prisma returns BigInt for sums)
    return (result as any[]).map((r) => ({
      itemId: r.itemId,
      itemName: r.itemName,
      itemSku: r.itemSku,
      occurrenceCount: Number(r.occurrenceCount),
      totalVarianceAbs: Number(r.totalVarianceAbs),
      netVariance: Number(r.netVariance),
    }))
  }
}
