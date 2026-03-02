import { CorsOptions } from 'cors'

export const corsConfig: CorsOptions = {
  origin: function (origin: any, callback: any) {
    // En desarrollo, permitir todos los orígenes
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    const allowedOrigins = [
      'http://localhost:3000', // Frontend development
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://autosys.vercel.app', // Production frontend
      'https://autosys-git-main-alfredocastillo.vercel.app', // Preview deployments
      process.env.FRONTEND_URL, // Environment variable for custom frontend URL
      ...(process.env.ADDITIONAL_CORS_ORIGINS
        ? process.env.ADDITIONAL_CORS_ORIGINS.split(',')
        : []),
    ].filter(Boolean) // Remove undefined values

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`)
      console.warn(`✅ Allowed origins: ${allowedOrigins.join(', ')}`)
      callback(new Error('Not allowed by CORS'))
    }
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
    'x-token',
    'X-Token',
    'x-new-token',
    'X-New-Token',
    'x-refresh-token',
    'X-Refresh-Token',
    'X-Empresa-Id',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'x-new-token',
    'X-New-Token',
  ],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}
