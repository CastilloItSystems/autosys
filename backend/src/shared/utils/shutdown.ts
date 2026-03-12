import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { PrismaClient } from '../../generated/prisma/client.js'
import { logger } from './logger.js'

export const setupGracefulShutdown = (
  server: HTTPServer,
  prisma: PrismaClient,
  io: SocketIOServer
) => {
  let isShuttingDown = false
  let forceShutdownTimer: NodeJS.Timeout | null = null

  const closeHttpServer = (): Promise<void> =>
    new Promise((resolve, reject) => {
      server.close((err?: Error) => {
        if (err) return reject(err)
        resolve()
      })
    })

  const closeSocketIO = (): Promise<void> =>
    new Promise((resolve) => {
      if (!io) return resolve()
      io.close(() => resolve())
    })

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn(`⚠️ Shutdown ya en progreso. Señal ignorada: ${signal}`)
      return
    }
    isShuttingDown = true

    logger.info(`📴 ${signal} recibido. Iniciando cierre limpio...`)

    // Forzar salida si algo se cuelga
    forceShutdownTimer = setTimeout(() => {
      logger.error('❌ Timeout de shutdown (10s). Forzando process.exit(1)')
      process.exit(1)
    }, 10_000)

    try {
      // 1) Dejar de aceptar nuevas conexiones HTTP
      await closeHttpServer()
      logger.info('✅ Servidor HTTP cerrado')

      // 2) Cerrar Socket.IO
      await closeSocketIO()
      logger.info('✅ Socket.IO cerrado')

      // 3) Cerrar Prisma
      await prisma.$disconnect()
      logger.info('✅ Conexión a base de datos cerrada')

      if (forceShutdownTimer) clearTimeout(forceShutdownTimer)

      logger.info('✅ Cierre limpio completado')
      process.exit(0)
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('❌ Error durante el cierre', {
        message: err.message,
        stack: err.stack,
      })

      if (forceShutdownTimer) clearTimeout(forceShutdownTimer)
      process.exit(1)
    }
  }

  // Señales del sistema
  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM')
  })

  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT')
  })

  // Errores globales
  process.on('uncaughtException', (error: Error) => {
    logger.error('❌ Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    })
    void gracefulShutdown('uncaughtException')
  })

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('❌ Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    })
    void gracefulShutdown('unhandledRejection')
  })
}
