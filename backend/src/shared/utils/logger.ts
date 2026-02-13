// backend/src/shared/utils/logger.ts

import winston from 'winston'
import path from 'path'

const { combine, timestamp, printf, colorize, errors } = winston.format

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

// Transports
const transports: winston.transport[] = [
  // Console
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customFormat
    ),
  }),

  // Error file
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      customFormat
    ),
  }),

  // Combined file
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
  }),
]

// Crear logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    customFormat
  ),
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
    }),
  ],
})

// Stream para Morgan (HTTP logger)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}

export default logger
