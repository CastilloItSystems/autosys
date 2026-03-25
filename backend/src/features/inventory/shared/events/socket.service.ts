/**
 * Socket Service - Real-time Event Emission via Socket.io
 * Broadcasts inventory events to connected clients
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { logger } from '../../../../shared/utils/logger.js'
import { IEvent, EventType, ISocketEventPayload } from './event.types.js'

class SocketService {
  private static instance: SocketService
  private io: SocketIOServer | null = null
  private connectedClients: Map<string, Socket> = new Map()
  private clientChannels: Map<string, Set<string>> = new Map()

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  /**
   * Initialize Socket.io server with existing instance
   */
  initialize(io: SocketIOServer): void {
    if (this.io) {
      logger.warn('SocketService already initialized')
      return
    }

    this.io = io
    this.setupEventHandlers()

    logger.info('SocketService connected to global Socket.io instance')
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`, {
        userId: socket.data.userId,
      })

      this.connectedClients.set(socket.id, socket)

      // Handle channel subscription
      socket.on('subscribe', (channel: string) => {
        socket.join(channel)
        if (!this.clientChannels.has(socket.id)) {
          this.clientChannels.set(socket.id, new Set())
        }
        this.clientChannels.get(socket.id)!.add(channel)

        logger.debug(`Client subscribed to channel: ${channel}`, {
          socketId: socket.id,
        })

        socket.emit('subscribed', { channel })
      })

      // Handle channel unsubscribe
      socket.on('unsubscribe', (channel: string) => {
        socket.leave(channel)
        const channels = this.clientChannels.get(socket.id)
        if (channels) {
          channels.delete(channel)
        }

        logger.debug(`Client unsubscribed from channel: ${channel}`, {
          socketId: socket.id,
        })

        socket.emit('unsubscribed', { channel })
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`, {
          userId: socket.data.userId,
        })

        this.connectedClients.delete(socket.id)
        this.clientChannels.delete(socket.id)
      })

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}`, {
          error,
          userId: socket.data.userId,
        })
      })
    })
  }

  /**
   * Broadcast event to specific channel
   */
  broadcastToChannel(
    channel: string,
    event: IEvent,
    additionalData?: Record<string, any>
  ): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized')
      return
    }

    const payload: ISocketEventPayload = {
      channel,
      event: event.type,
      data: {
        ...event.data,
        ...additionalData,
        eventId: event.id,
        entityId: event.entityId,
        entityType: event.entityType,
        timestamp: event.createdAt,
      },
      timestamp: new Date(),
    }

    this.io.to(channel).emit(event.type, payload)

    logger.debug(`Event broadcasted to channel: ${channel}`, {
      eventType: event.type,
      eventId: event.id,
    })
  }

  /**
   * Broadcast event to user
   */
  broadcastToUser(
    userId: string,
    event: IEvent,
    additionalData?: Record<string, any>
  ): void {
    this.broadcastToChannel(`user:${userId}`, event, additionalData)
  }

  /**
   * Broadcast event to warehouse
   */
  broadcastToWarehouse(
    warehouseId: string,
    event: IEvent,
    additionalData?: Record<string, any>
  ): void {
    this.broadcastToChannel(`warehouse:${warehouseId}`, event, additionalData)
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcastToAll(event: IEvent, additionalData?: Record<string, any>): void {
    this.broadcastToChannel('inventory', event, additionalData)
  }

  /**
   * Send targeted message to specific socket
   */
  sendToSocket(
    socketId: string,
    event: IEvent,
    additionalData?: Record<string, any>
  ): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized')
      return
    }

    const socket = this.connectedClients.get(socketId)
    if (!socket) {
      logger.warn(`Socket not found: ${socketId}`)
      return
    }

    const payload = {
      eventId: event.id,
      type: event.type,
      data: {
        ...event.data,
        ...additionalData,
      },
      timestamp: new Date(),
    }

    socket.emit('event', payload)
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size
  }

  /**
   * Get clients subscribed to channel
   */
  getChannelSubscribers(channel: string): number {
    if (!this.io) return 0
    const room = this.io.sockets.adapter.rooms.get(channel)
    return room ? room.size : 0
  }

  /**
   * Get Socket.io instance (for direct access if needed)
   */
  getIO(): SocketIOServer | null {
    return this.io
  }

  /**
   * Shutdown Socket.io server
   */
  shutdown(): void {
    if (this.io) {
      this.io.close()
      this.io = null
      logger.info('Socket.io server shutdown')
    }
  }
}

export default SocketService
