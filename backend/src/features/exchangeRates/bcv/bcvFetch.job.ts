// backend/src/features/exchangeRates/bcv/bcvFetch.job.ts
//
// Cron job para fetch automático de tasas BCV.
// BCV publica tasas ~1:00 PM VET (Venezuela Time = UTC-4) = 17:00 UTC.
// Ejecuta L-V a las 17:15 UTC (1:15 PM VET) con retry a las 18:00 UTC (2:00 PM VET).

import cron from 'node-cron'
import { PrismaClient } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { bcvFetchService } from './bcvFetch.service.js'

export function initBcvFetchJob(prisma: PrismaClient): void {
  // Fetch principal: 17:15 UTC = 1:15 PM VET, L-V
  cron.schedule('15 17 * * 1-5', async () => {
    logger.info('[BCV Cron] Iniciando fetch diario de tasas BCV')
    try {
      await bcvFetchService.fetchAndSaveForAllEmpresas(prisma)
      logger.info('[BCV Cron] Fetch diario completado')
    } catch (error) {
      logger.error('[BCV Cron] Error en fetch diario', { error })
    }
  })

  // Retry: 18:00 UTC = 2:00 PM VET, L-V
  // saveBcvRates usa skipDuplicates → seguro repetir
  cron.schedule('0 18 * * 1-5', async () => {
    logger.info('[BCV Cron] Retry fetch de tasas BCV')
    try {
      await bcvFetchService.fetchAndSaveForAllEmpresas(prisma)
    } catch (error) {
      logger.error('[BCV Cron] Error en retry', { error })
    }
  })

  logger.info('[BCV Cron] Jobs programados: 17:15 UTC principal + 18:00 UTC retry (L-V)')
}
