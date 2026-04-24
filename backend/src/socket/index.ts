import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import { corsConfig } from '../config/cors.config.js'
import { logger } from '../shared/utils/logger.js'
import prisma from '../services/prisma.service.js'

let io: SocketIOServer

// ==============================
// Types
// ==============================
interface AuthPayload {
  userId?: string
  empresaId?: string
  role?: string
}

interface SocketData {
  userId: string
  empresaId?: string
  role?: string
}

interface StockUpdatePayload {
  productId: string
  stock: number
  empresaId: string
}

interface LowStockPayload {
  productId: string
  currentStock: number
  threshold: number
  empresaId: string
}

interface NewOrderPayload {
  orderId: string
  total: number
  empresaId: string
}

interface PaymentPayload {
  orderId: string
  amount: number
  empresaId: string
}

interface NotificationPayload {
  notification: {
    id?: string
    empresaId?: string
    module?: string
    title: string
    message: string
    type?: string
    entityType?: string
    entityId?: string
    eventCode?: string
    priority?: string
    severity?: string
    link?: string
    read?: boolean
    metadata?: Record<string, any>
    createdAt?: string | Date
    createdBy?: {
      id?: string
      nombre?: string
    }
  }
}

// ==============================
// Helpers
// ==============================
const ROLE_ALIASES: Record<string, string> = {
  MANAGER: 'GERENTE',
  SELLER: 'VENDEDOR',
  CASHIER: 'CAJERO',
  WAREHOUSE: 'ALMACENISTA',
}

const normalizeRoleName = (role?: string): string | undefined => {
  if (!role || typeof role !== 'string') return undefined
  const normalized = role.trim().toUpperCase().replace(/\s+/g, '_')
  return ROLE_ALIASES[normalized] ?? normalized
}

const resolveUserIdFromPayload = (payload: AuthPayload): string | null => {
  if (!payload.userId || typeof payload.userId !== 'string') return null
  const normalized = payload.userId.trim()
  return normalized || null
}

const getTokenFromSocket = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth?.token
  if (typeof authToken === 'string' && authToken.trim()) return authToken.trim()

  const authHeader = socket.handshake.headers.authorization
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  return null
}

const getEmpresaIdFromSocket = (
  socket: Socket<any, any, any, SocketData>,
  payload?: AuthPayload
): string | undefined => {
  const authEmpresaId = socket.handshake.auth?.empresaId
  if (typeof authEmpresaId === 'string' && authEmpresaId.trim()) {
    return authEmpresaId.trim()
  }

  const headerEmpresaId = socket.handshake.headers['x-empresa-id']
  if (typeof headerEmpresaId === 'string' && headerEmpresaId.trim()) {
    return headerEmpresaId.trim()
  }
  if (Array.isArray(headerEmpresaId) && headerEmpresaId[0]?.trim()) {
    return headerEmpresaId[0].trim()
  }

  if (payload?.empresaId && typeof payload.empresaId === 'string') {
    const empresaId = payload.empresaId.trim()
    return empresaId || undefined
  }

  return undefined
}

const hasRole = (
  socket: Socket<any, any, any, SocketData>,
  roles: string[]
): boolean => {
  const currentRole = normalizeRoleName(socket.data.role)
  if (!currentRole) return false

  return roles.some((role) => normalizeRoleName(role) === currentRole)
}

// Restringe rooms arbitrarias para evitar abuso
const isAllowedRoom = (
  socket: Socket<any, any, any, SocketData>,
  roomId: string
): boolean => {
  if (!roomId || typeof roomId !== 'string') return false

  // Puede unirse a su propia room de usuario
  if (roomId === `user-${socket.data.userId}`) return true

  // Puede unirse a room de su empresa
  if (socket.data.empresaId && roomId === `empresa-${socket.data.empresaId}`) {
    return true
  }

  // Permitir salas funcionales controladas (ej: sales-*, inventory-*)
  if (roomId.startsWith('sales-') || roomId.startsWith('inventory-')) {
    return true
  }

  return false
}

// ==============================
// Type guards mínimos
// ==============================
const isStockUpdatePayload = (data: unknown): data is StockUpdatePayload =>
  !!data &&
  typeof data === 'object' &&
  typeof (data as StockUpdatePayload).productId === 'string' &&
  typeof (data as StockUpdatePayload).stock === 'number' &&
  typeof (data as StockUpdatePayload).empresaId === 'string'

const isLowStockPayload = (data: unknown): data is LowStockPayload =>
  !!data &&
  typeof data === 'object' &&
  typeof (data as LowStockPayload).productId === 'string' &&
  typeof (data as LowStockPayload).currentStock === 'number' &&
  typeof (data as LowStockPayload).threshold === 'number' &&
  typeof (data as LowStockPayload).empresaId === 'string'

const isNewOrderPayload = (data: unknown): data is NewOrderPayload =>
  !!data &&
  typeof data === 'object' &&
  typeof (data as NewOrderPayload).orderId === 'string' &&
  typeof (data as NewOrderPayload).total === 'number' &&
  typeof (data as NewOrderPayload).empresaId === 'string'

const isPaymentPayload = (data: unknown): data is PaymentPayload =>
  !!data &&
  typeof data === 'object' &&
  typeof (data as PaymentPayload).orderId === 'string' &&
  typeof (data as PaymentPayload).amount === 'number' &&
  typeof (data as PaymentPayload).empresaId === 'string'

const buildSocketNotification = (
  notification: NotificationPayload['notification'],
  createdBy?: { id?: string; nombre?: string }
) => {
  const now = new Date().toISOString()
  return {
    id:
      typeof notification.id === 'string' && notification.id.trim()
        ? notification.id
        : randomUUID(),
    empresaId: notification.empresaId,
    module: notification.module,
    title: notification.title,
    message: notification.message,
    type: notification.type ?? 'info',
    entityType: notification.entityType,
    entityId: notification.entityId,
    eventCode: notification.eventCode,
    priority: notification.priority ?? 'MEDIUM',
    severity: notification.severity ?? 'INFO',
    link: notification.link,
    read: notification.read ?? false,
    metadata: notification.metadata,
    createdAt:
      notification.createdAt instanceof Date
        ? notification.createdAt.toISOString()
        : typeof notification.createdAt === 'string'
          ? notification.createdAt
          : now,
    createdBy: createdBy ?? notification.createdBy ?? { id: 'SYSTEM', nombre: 'Sistema' },
  }
}

export const emitNotificationToUser = (
  userId: string,
  notification: NotificationPayload['notification'],
  createdBy?: { id?: string; nombre?: string }
) => {
  if (!io) {
    logger.warn('Socket.IO: intento de emitir notificación sin inicializar io', {
      userId,
    })
    return
  }

  io.to(`user-${userId}`).emit(
    'notifications:received',
    buildSocketNotification(notification, createdBy)
  )
}

// ==============================
// Init
// ==============================
export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: corsConfig.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket)
      if (!token) return next(new Error('Unauthorized: token requerido'))

      const secret = process.env.JWT_SECRET
      if (!secret) {
        return next(new Error('Server misconfigured: JWT_SECRET faltante'))
      }

      const payload = jwt.verify(token, secret) as AuthPayload
      const userId = resolveUserIdFromPayload(payload)
      if (!userId) return next(new Error('Unauthorized: token sin userId'))

      socket.data.userId = userId

      const requestedEmpresaId = getEmpresaIdFromSocket(socket, payload)
      if (requestedEmpresaId) {
        const membership = await prisma.membership.findUnique({
          where: {
            userId_empresaId: {
              userId,
              empresaId: requestedEmpresaId,
            },
          },
          include: {
            role: {
              select: { name: true },
            },
          },
        })

        if (!membership) {
          return next(
            new Error('Forbidden: no tienes acceso a la empresa seleccionada')
          )
        }
        if (membership.status !== 'active') {
          return next(
            new Error('Forbidden: tu membresía de empresa no está activa')
          )
        }

        socket.data.empresaId = requestedEmpresaId
        socket.data.role = normalizeRoleName(membership.role?.name)
      } else {
        // Compatibilidad temporal: conexión por usuario (sin empresa activa)
        socket.data.role = normalizeRoleName(payload.role)
      }

      return next()
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      return next(new Error(`Unauthorized: ${err.message}`))
    }
  })

  io.on('connection', (socket: Socket<any, any, any, SocketData>) => {
    logger.info('Socket.IO: Usuario conectado', {
      socketId: socket.id,
      userId: socket.data.userId,
      empresaId: socket.data.empresaId,
    })

    // Auto-join rooms base
    socket.join(`user-${socket.data.userId}`)
    if (socket.data.empresaId) {
      socket.join(`empresa-${socket.data.empresaId}`)
    }

    socket.on('join-room', (roomId: string) => {
      if (!isAllowedRoom(socket, roomId)) {
        logger.warn('Socket.IO: intento de join-room no permitido', {
          socketId: socket.id,
          userId: socket.data.userId,
          roomId,
        })
        return
      }

      socket.join(roomId)
      logger.info('Socket.IO: Usuario se unió a sala', {
        socketId: socket.id,
        roomId,
      })

      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('leave-room', (roomId: string) => {
      if (!roomId || typeof roomId !== 'string') return
      socket.leave(roomId)

      logger.info('Socket.IO: Usuario salió de sala', {
        socketId: socket.id,
        roomId,
      })

      socket.to(roomId).emit('user-left', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      })
    })

    // INVENTORY
    socket.on('inventory:stock-update', (data: unknown) => {
      if (!isStockUpdatePayload(data)) return
      if (!hasRole(socket, ['SUPER_ADMIN', 'ADMIN', 'GERENTE'])) return
      if (!socket.data.empresaId || socket.data.empresaId !== data.empresaId) return

      logger.info('Socket.IO: Actualización de stock', {
        productId: data.productId,
        empresaId: data.empresaId,
      })

      io.to(`empresa-${data.empresaId}`).emit('inventory:stock-updated', data)
    })

    socket.on('inventory:low-stock-alert', (data: unknown) => {
      if (!isLowStockPayload(data)) return
      if (
        !hasRole(socket, ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'VENDEDOR', 'ALMACENISTA'])
      )
        return
      if (!socket.data.empresaId || socket.data.empresaId !== data.empresaId) return

      logger.warn('Socket.IO: Alerta de stock bajo', {
        productId: data.productId,
        empresaId: data.empresaId,
      })

      io.to(`empresa-${data.empresaId}`).emit('inventory:alert', {
        type: 'LOW_STOCK',
        ...data,
        timestamp: new Date().toISOString(),
      })
    })

    // SALES
    socket.on('sales:new-order', (data: unknown) => {
      if (!isNewOrderPayload(data)) return
      if (!hasRole(socket, ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'VENDEDOR']))
        return
      if (!socket.data.empresaId || socket.data.empresaId !== data.empresaId) return

      logger.info('Socket.IO: Nueva orden de venta', {
        orderId: data.orderId,
        empresaId: data.empresaId,
      })

      io.to(`empresa-${data.empresaId}`).emit('sales:order-created', data)
    })

    socket.on('sales:payment-received', (data: unknown) => {
      if (!isPaymentPayload(data)) return
      if (!hasRole(socket, ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'CAJERO']))
        return
      if (!socket.data.empresaId || socket.data.empresaId !== data.empresaId) return

      logger.info('Socket.IO: Pago recibido', {
        orderId: data.orderId,
        empresaId: data.empresaId,
      })

      io.to(`empresa-${data.empresaId}`).emit('sales:payment-processed', data)
    })

    // NOTIFICATIONS
    socket.on('notification:send', (_data: unknown) => {
      logger.warn(
        'Socket.IO: notification:send está deshabilitado; use NotificationOrchestrator'
      )
    })

    socket.on('disconnect', (reason) => {
      logger.info('Socket.IO: Usuario desconectado', {
        socketId: socket.id,
        userId: socket.data.userId,
        reason,
      })
    })

    socket.on('error', (error: Error) => {
      logger.error('Socket.IO: Error', {
        socketId: socket.id,
        userId: socket.data.userId,
        error: error.message,
      })
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io no ha sido inicializado')
  return io
}
