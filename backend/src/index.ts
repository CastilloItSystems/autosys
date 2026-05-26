// backend/src/index.ts
import { createServer } from 'http'
import app from './app.js'
import prisma from './services/prisma.service.js'
import { logger } from './shared/utils/logger.js'
import { setupGracefulShutdown } from './shared/utils/shutdown.js'
import { initSocket } from './socket/index.js'
import {
  ensurePermissionCatalog,
  seedDefaultRolesForEmpresa,
  seedDefaultNotificationPoliciesForEmpresa,
  seedDefaultBankAccountForEmpresa,
} from './services/empresa-setup.service.js'
import SocketService from './features/inventory/shared/events/socket.service.js'
import { registerInventoryRealtimeBridge } from './features/inventory/shared/events/realtime.bridge.js'
import { registerNotificationsBridge } from './features/notifications/notifications.bridge.js'
import { startCrmAutomationScheduler } from './features/crm/automations/crm-automations.service.js'
import { initBcvFetchJob } from './features/exchangeRates/bcv/bcvFetch.job.js'
import { initNotificationsCleanupJob } from './features/notifications/notifications.cleanup.job.js'
import { initRecurringExpensesJob } from './features/finance/expenses/recurringExpenses.job.js'
import { initDatabaseBackupJobs } from './features/system/backups/backups.job.js'

const port = Number(process.env.PORT) || 4000

// Create HTTP server
const server = createServer(app)

// Initialize Socket.IO
const io = initSocket(server)

// Initialize Inventory SocketService
SocketService.getInstance().initialize(io)
registerNotificationsBridge()
registerInventoryRealtimeBridge()

/**
 * Inicia el servidor HTTP y espera hasta que esté escuchando.
 */
const listenServer = (port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => {
      server.off('error', reject)
      resolve()
    })
  })

// ============================================
// SERVER STARTUP
// ============================================
export const startServer = async (): Promise<void> => {
  try {
    // Conectar a la base de datos
    await prisma.$connect()
    logger.info('✅ Conexión con la base de datos exitosa')

    // Verificar conexión
    await prisma.$queryRaw`SELECT 1`
    logger.info('✅ Base de datos respondiendo correctamente')

    // Sincronizar catálogo global de permisos
    await ensurePermissionCatalog()
    logger.info('✅ Catálogo de permisos sincronizado')

    // Sincronizar roles de todas las empresas activas
    const empresas = await prisma.empresa.findMany({
      where: { eliminado: false },
      select: { id_empresa: true },
    })
    for (const empresa of empresas) {
      await seedDefaultRolesForEmpresa(empresa.id_empresa)
      await seedDefaultNotificationPoliciesForEmpresa(empresa.id_empresa)
      await seedDefaultBankAccountForEmpresa(empresa.id_empresa)
    }
    logger.info(`✅ Roles, políticas y cuentas bancarias sincronizados para ${empresas.length} empresa(s)`)

    // Iniciar servidor HTTP
    await listenServer(port)

    logger.info(`🚀 Servidor corriendo en puerto ${port}`)
    logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`📚 API disponible en: http://localhost:${port}/api`)
    logger.info(`📖 Swagger Docs: http://localhost:${port}/api/docs`)
    logger.info(`🏥 Health check en: http://localhost:${port}/health`)
    logger.info(`🔌 WebSockets habilitados en puerto ${port}`)
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Automatizaciones CRM (reglas fijas v1)
    startCrmAutomationScheduler(prisma)

    // BCV fetch automático (L-V 17:15 UTC + retry 18:00 UTC)
    initBcvFetchJob(prisma)
    logger.info('📈 BCV fetch job inicializado')

    // Gastos recurrentes (diario 02:00 UTC)
    initRecurringExpensesJob(prisma)
    logger.info('💰 Recurring expenses job inicializado')

    initNotificationsCleanupJob()

    initDatabaseBackupJobs()
    logger.info('💾 Database backup jobs inicializados')

    logger.info('📦 Módulos disponibles:')
    logger.info('   • Inventory: /api/inventory')
    logger.info('   • Sales: /api/sales')
    logger.info('   • Auth: /api/auth')
    logger.info('   • Users: /api/users')
    logger.info('   • Empresas: /api/empresas')
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Setup Graceful Shutdown
    setupGracefulShutdown(server, prisma, io)

    // Errores en runtime del servidor (después de escuchar)
    server.on('error', (error: NodeJS.ErrnoException) => {
      logger.error('❌ Error en servidor HTTP', {
        code: error.code,
        message: error.message,
      })
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))

    logger.error('❌ Error al iniciar el servidor', {
      message: err.message,
      stack: err.stack,
    })

    process.exit(1)
  }
}

// ============================================
// EXPORTS
// ============================================
// Export io para compatibilidad temporal si hay módulos que lo esperan
export { io }

// Export app para testing
export default app

// Iniciar servidor (solo si no es testing)
if (process.env.NODE_ENV !== 'test') {
  void startServer()
}
