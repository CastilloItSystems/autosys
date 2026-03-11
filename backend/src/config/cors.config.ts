import { CorsOptions } from 'cors'
import { logger } from '../shared/utils/logger'

// Pre-calcular orígenes permitidos usando Set para lookup O(1)
const staticOrigins = new Set([
  'http://localhost:3000', // Frontend development
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://autosys.vercel.app', // Production frontend
])

// Evaluar variables de entorno una sola vez al inicio (sanitizadas)
if (process.env.FRONTEND_URL) {
  staticOrigins.add(process.env.FRONTEND_URL.trim())
}

if (process.env.ADDITIONAL_CORS_ORIGINS) {
  process.env.ADDITIONAL_CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .forEach((o) => staticOrigins.add(o))
}

// Soporte para regex (Ej. cualquier preview deployment de Vercel de este repo)
const regexOrigins = [/^https:\/\/autosys-[^.]+-alfredocastillo\.vercel\.app$/]

// Flag seguro para "allow all en dev"
const allowAllInDev =
  process.env.NODE_ENV === 'development' &&
  process.env.CORS_ALLOW_ALL_DEV === 'true'

export const corsConfig: CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    const normalizedOrigin = origin?.trim()

    // En desarrollo, permitir todos los orígenes solo si el flag está activo explícitamente
    if (allowAllInDev) {
      return callback(null, true)
    }

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!normalizedOrigin) return callback(null, true)

    // Validar orígenes estáticos en O(1)
    if (staticOrigins.has(normalizedOrigin)) {
      return callback(null, true)
    }

    // Validar orígenes dinámicos (Regex)
    if (regexOrigins.some((regex) => regex.test(normalizedOrigin))) {
      return callback(null, true)
    }

    // Log menos verboso para no saturar
    logger.warn(
      `🚫 CORS blocked origin: ${normalizedOrigin}. (ENV: ${process.env.NODE_ENV}, allowAllInDev: ${allowAllInDev}, Allowed static origins count: ${staticOrigins.size})`
    )

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token',
    'X-Token',
    'X-New-Token',
    'X-Refresh-Token',
    'X-Empresa-Id',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-New-Token'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}
