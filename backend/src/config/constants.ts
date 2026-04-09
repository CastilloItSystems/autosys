// backend/src/config/constants.ts

export const APP_CONFIG = {
  NAME: 'Taller Inventory System',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema de inventario para taller mecánico - Venezuela',
  API_PREFIX: '/api',
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
}

export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
}

export const REGEX_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_VE: /^(0414|0424|0412|0416|0426)\d{7}$/,
  RIF: /^[VEJPG]-\d{8}-\d$/,
  CEDULA: /^[VE]-\d{7,8}$/,
  SKU: /^[A-Z0-9-]+$/,
  LOCATION: /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/i, // Acepta B02-06-J05, M1-R01-D03, etc.
}

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  UPLOAD_PATH: './public/uploads',
}

export const CLOUDFLARE_R2 = {
  ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  BUCKET_NAME: process.env.R2_BUCKET_NAME || '',
  PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
  ENDPOINT: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
}

export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ALGORITHM: 'HS256' as const,
}

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  MAX_REQUESTS: 100,
}

export const CURRENCY = {
  CODE: 'VES', // Bolívares venezolanos
  SYMBOL: 'Bs.',
  DECIMALS: 2,
}
