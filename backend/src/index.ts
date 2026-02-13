// backend/src/index.ts

import 'dotenv/config'
import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import helmet from 'helmet'
import compression from 'compression'

// Config
import { corsConfig } from './config/cors.config'
import { APP_CONFIG } from './config/constants'

// Services
import prisma from './services/prisma.service'

// Docs
import { setupSwagger } from './docs/swagger'

// Middleware
import {
  errorHandler,
  notFoundHandler,
} from './shared/middleware/errorHandler.middleware'
import { requestLogger } from './shared/middleware/requestLogger.middleware'
import { generalLimiter } from './shared/middleware/rateLimiter.middleware'

// Utils
import { logger } from './shared/utils/logger'

// Routes - Existing
import apiRoutes from './routes/api.routes'

// Routes - New Modules
import inventoryRoutes from './features/inventory/index'
import salesRoutes from './features/sales/index'

// ============================================
// APP SETUP
// ============================================

const app: Application = express()
const port = process.env.PORT || 4000

// Create HTTP server
const server = createServer(app)

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: corsConfig.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// Seguridad (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Ajustar según necesites
  })
)

// Compresión
app.use(compression())

// CORS
app.use(cors(corsConfig))

// CORS error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    logger.error('CORS Error', {
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
    })
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin,
    })
  }
  next(err)
})

// Body Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request Logger (Morgan + Winston)
app.use(requestLogger)

// Rate Limiting
app.use(generalLimiter)

// ============================================
// SWAGGER DOCUMENTATION
// ============================================
setupSwagger(app)

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: APP_CONFIG.VERSION || '1.0.0',
    database: 'connected',
    uptime: process.uptime(),
  })
})

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    version: APP_CONFIG.VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API is running!',
    version: APP_CONFIG.VERSION || '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      inventory: '/api/inventory',
      sales: '/api/sales',
      docs: '/api/docs', // Si implementas Swagger
    },
  })
})

// ============================================
// API ROUTES
// ============================================

// Rutas existentes (auth, users, empresas, etc.)
app.use('/api', apiRoutes)

// Nuevo: Módulo de Inventario
// Base: /api/inventory
app.use('/api/inventory', inventoryRoutes)

// Nuevo: Módulo de Ventas
// Base: /api/sales
app.use('/api/sales', salesRoutes)

// ============================================
// ERROR HANDLERS
// ============================================

// 404 Not Found (debe ir antes del error handler global)
app.use(notFoundHandler)

// Error Handler Global (debe ser el último middleware)
app.use(errorHandler)

// ============================================
// SOCKET.IO SETUP
// ============================================

io.on('connection', (socket) => {
  logger.info('Socket.IO: Usuario conectado', { socketId: socket.id })

  // Join room
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId)
    logger.info('Socket.IO: Usuario se unió a sala', {
      socketId: socket.id,
      roomId,
    })

    // Notificar a otros en la sala
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    })
  })

  // Leave room
  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId)
    logger.info('Socket.IO: Usuario salió de sala', {
      socketId: socket.id,
      roomId,
    })

    // Notificar a otros en la sala
    socket.to(roomId).emit('user-left', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    })
  })

  // Eventos de inventario en tiempo real
  socket.on('inventory:stock-update', (data) => {
    logger.info('Socket.IO: Actualización de stock', data)
    io.emit('inventory:stock-updated', data)
  })

  socket.on('inventory:low-stock-alert', (data) => {
    logger.warn('Socket.IO: Alerta de stock bajo', data)
    io.emit('inventory:alert', {
      type: 'LOW_STOCK',
      ...data,
      timestamp: new Date().toISOString(),
    })
  })

  // Eventos de ventas en tiempo real
  socket.on('sales:new-order', (data) => {
    logger.info('Socket.IO: Nueva orden de venta', data)
    io.emit('sales:order-created', data)
  })

  socket.on('sales:payment-received', (data) => {
    logger.info('Socket.IO: Pago recibido', data)
    io.emit('sales:payment-processed', data)
  })

  // Eventos de notificaciones
  socket.on('notification:send', (data) => {
    const { userId, notification } = data
    io.to(`user-${userId}`).emit('notification:received', notification)
  })

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info('Socket.IO: Usuario desconectado', {
      socketId: socket.id,
      reason,
    })
  })

  // Handle errors
  socket.on('error', (error) => {
    logger.error('Socket.IO: Error', {
      socketId: socket.id,
      error: error.message,
    })
  })
})

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
  try {
    // Conectar a la base de datos
    await prisma.$connect()
    logger.info('✅ Conexión con la base de datos exitosa')

    // Verificar conexión
    await prisma.$queryRaw`SELECT 1`
    logger.info('✅ Base de datos respondiendo correctamente')

    // Iniciar servidor
    server.listen(port, () => {
      logger.info(`🚀 Servidor corriendo en puerto ${port}`)
      logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`📚 API disponible en: http://localhost:${port}/api`)
      logger.info(`📖 Swagger Docs: http://localhost:${port}/api/docs`)
      logger.info(`🏥 Health check en: http://localhost:${port}/health`)
      logger.info(`🔌 WebSockets habilitados en puerto ${port}`)
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      logger.info('📦 Módulos disponibles:')
      logger.info('   • Inventory: /api/inventory')
      logger.info('   • Sales: /api/sales')
      logger.info('   • Auth: /api/auth')
      logger.info('   • Users: /api/users')
      logger.info('   • Empresas: /api/empresas')
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })
  } catch (error: any) {
    logger.error('❌ Error al iniciar el servidor', {
      error: error.message,
      stack: error.stack,
    })
    console.error('❌ No se pudo conectar a la base de datos')
    console.error(error)
    process.exit(1)
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} recibido. Cerrando servidor...`)

  // Cerrar servidor HTTP
  server.close(async () => {
    logger.info('✅ Servidor HTTP cerrado')

    try {
      // Desconectar Prisma
      await prisma.$disconnect()
      logger.info('✅ Conexión a base de datos cerrada')

      // Cerrar Socket.IO
      io.close(() => {
        logger.info('✅ Socket.IO cerrado')
      })

      logger.info('✅ Cierre limpio completado')
      process.exit(0)
    } catch (error) {
      logger.error('❌ Error durante el cierre', { error })
      process.exit(1)
    }
  })

  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    logger.error('❌ No se pudo cerrar limpiamente, forzando cierre')
    process.exit(1)
  }, 10000)
}

// Manejar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  })
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection', {
    reason,
    promise,
  })
  gracefulShutdown('unhandledRejection')
})

// ============================================
// EXPORTS
// ============================================

// Export io para uso en otros módulos
export { io }

// Export app para testing
export default app

// Iniciar servidor (solo si no es testing)
if (process.env.NODE_ENV !== 'test') {
  startServer()
}
