// backend/src/shared/utils/logger.ts
import winston from 'winston'
import path from 'path'
import fs from 'fs'

const { combine, timestamp, printf, colorize, errors } = winston.format
const isProduction = process.env.NODE_ENV === 'production'

// Asegurar carpeta logs en desarrollo
const logsDir = path.join(process.cwd(), 'logs')
if (!isProduction && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Formato personalizado
const customFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`

  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`
  }

  if (stack) {
    log += `\n${stack}`
  }

  return log
})

// Console transport (siempre)
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    customFormat
  ),
})

// File transports (solo dev/local)
const fileTransports: winston.transport[] = !isProduction
  ? [
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          customFormat
        ),
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          customFormat
        ),
      }),
    ]
  : []

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    customFormat
  ),
  transports: [consoleTransport, ...fileTransports],
  exceptionHandlers: !isProduction
    ? [
        new winston.transports.File({
          filename: path.join(logsDir, 'exceptions.log'),
        }),
      ]
    : [consoleTransport],
  rejectionHandlers: !isProduction
    ? [
        new winston.transports.File({
          filename: path.join(logsDir, 'rejections.log'),
        }),
      ]
    : [consoleTransport],
})

// Stream para Morgan
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}

export default logger
