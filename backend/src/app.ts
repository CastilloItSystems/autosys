import 'dotenv/config'
import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
// Config
import { corsConfig } from './config/cors.config.js'
import { APP_CONFIG } from './config/constants.js'
// Docs
import { setupSwagger } from './docs/swagger.js'
// Middleware
import {
  errorHandler,
  notFoundHandler,
} from './shared/middleware/errorHandler.middleware.js'
import { requestLogger } from './shared/middleware/requestLogger.middleware.js'
import { generalLimiter } from './shared/middleware/rateLimiter.middleware.js'
// Utils
import { logger } from './shared/utils/logger.js'
// Routes - All centralized
import apiRoutes from './routes/api.routes.js'
// ============================================
// APP SETUP
// ============================================
const app: Application = express()
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
    database: 'connected', // Check database se maneja globalmente
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
app.use('/api', apiRoutes)
// ============================================
// ERROR HANDLERS
// ============================================
// 404 Not Found (debe ir antes del error handler global)
app.use(notFoundHandler)
// Error Handler Global (debe ser el último middleware)
app.use(errorHandler)
export default app
