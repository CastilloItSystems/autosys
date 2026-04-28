// backend/src/features/finance/expenses/recurringExpenses.job.ts
// Cron diario 02:00 UTC — genera gastos recurrentes para todas las empresas activas.

import cron from 'node-cron'
import { PrismaClient } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import ExpenseService from './expenses.service.js'

export function initRecurringExpensesJob(prisma: PrismaClient): void {
  cron.schedule('0 2 * * *', async () => {
    logger.info('[RecurringExpenses] Iniciando generación de gastos recurrentes')
    try {
      const empresas = await prisma.empresa.findMany({
        where: { eliminado: false },
        select: { id_empresa: true },
      })

      let total = 0
      const svc = new ExpenseService(prisma)
      for (const empresa of empresas) {
        const count = await svc.generateRecurring(empresa.id_empresa)
        total += count
      }

      logger.info(`[RecurringExpenses] ${total} gasto(s) generado(s) para ${empresas.length} empresa(s)`)
    } catch (error) {
      logger.error('[RecurringExpenses] Error generando gastos recurrentes', { error })
    }
  })
}
