/**
 * Event Service - Central Event Dispatcher
 * Manages event emission, listeners, and persistence
 */

import { v4 as uuidv4 } from 'uuid'
import { logger } from '../../../../shared/utils/logger'
import {
  IEvent,
  IEventListener,
  IEventPayload,
  EventType,
  EventPriority,
} from './event.types'
import prisma from '../../../../services/prisma.service'

class EventService {
  private static instance: EventService
  private listeners: Map<EventType | '*', IEventListener[]> = new Map()
  private queue: IEvent[] = []
  private processing = false

  private constructor() {}

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  /**
   * Emit an event to all registered listeners
   */
  async emit(payload: IEventPayload): Promise<IEvent> {
    try {
      const event: IEvent = {
        id: uuidv4(),
        type: payload.type,
        entityId: payload.entityId,
        entityType: payload.entityType,
        userId: payload.userId || 'SYSTEM',
        data: payload.data,
        priority: payload.priority || EventPriority.MEDIUM,
        createdAt: new Date(),
      }

      // Add to queue for processing
      this.queue.push(event)

      // Process queue asynchronously
      this.processQueue()

      // Persist event to database
      await this.persistEvent(event)

      logger.info(`Event emitted: ${event.type}`, {
        eventId: event.id,
        entityId: event.entityId,
        entityType: event.entityType,
      })

      return event
    } catch (error) {
      logger.error('Error emitting event', { error, payload })
      throw error
    }
  }

  /**
   * Register a listener for one or more event types
   */
  on(
    eventType: EventType | EventType[] | '*',
    handler: (event: IEvent) => Promise<void> | void,
    priority = 0
  ): string {
    const listenerId = uuidv4()
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType]

    for (const type of eventTypes) {
      if (!this.listeners.has(type as any)) {
        this.listeners.set(type as any, [])
      }

      const listener: IEventListener = {
        id: listenerId,
        eventType: type as any,
        handler,
        priority,
      }

      const listeners = this.listeners.get(type)!
      listeners.push(listener)
      listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    }

    logger.info(`Event listener registered: ${listenerId}`, {
      eventTypes: eventTypes.join(', '),
    })

    return listenerId
  }

  /**
   * Unregister a listener
   */
  off(listenerId: string): boolean {
    let removed = false

    for (const [, listeners] of this.listeners) {
      const index = listeners.findIndex((l) => l.id === listenerId)
      if (index > -1) {
        listeners.splice(index, 1)
        removed = true
      }
    }

    if (removed) {
      logger.info(`Event listener unregistered: ${listenerId}`)
    }

    return removed
  }

  /**
   * Remove all listeners for a specific event type
   */
  removeAllListeners(eventType?: EventType | '*'): void {
    if (eventType === undefined || eventType === null) {
      // Clear all listeners
      this.listeners.clear()
      logger.info('All event listeners cleared')
      return
    }

    // Clear listeners for specific event type
    if (this.listeners.has(eventType as any)) {
      this.listeners.delete(eventType as any)
      logger.info(`All listeners removed for event type: ${eventType}`)
    }
  }

  /**
   * Process event queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const event = this.queue.shift()
      if (!event) break

      try {
        await this.executeListeners(event)
      } catch (error) {
        logger.error('Error processing event', { error, eventId: event.id })
      }
    }

    this.processing = false
  }

  /**
   * Execute all registered listeners for an event
   */
  private async executeListeners(event: IEvent): Promise<void> {
    const listeners: IEventListener[] = []

    // Get specific listeners
    if (this.listeners.has(event.type)) {
      listeners.push(...this.listeners.get(event.type)!)
    }

    // Get wildcard listeners
    if (this.listeners.has('*' as any)) {
      listeners.push(...this.listeners.get('*' as any)!)
    }

    if (listeners.length === 0) {
      return
    }

    // Execute listeners sequentially by priority
    for (const listener of listeners) {
      try {
        await Promise.resolve(listener.handler(event))
        logger.debug(`Event listener executed: ${listener.id}`, {
          eventType: event.type,
        })
      } catch (error) {
        logger.error(`Event listener failed: ${listener.id}`, {
          error,
          eventType: event.type,
          eventId: event.id,
        })
      }
    }
  }

  /**
   * Persist event to database for audit trail
   */
  private async persistEvent(event: IEvent): Promise<void> {
    try {
      await prisma.event.create({
        data: {
          id: event.id,
          type: event.type as any,
          entityId: event.entityId,
          entityType: event.entityType,
          userId: event.userId,
          eventData: event.data,
          priority: event.priority as any,
          createdAt: event.createdAt,
        },
      })
    } catch (error) {
      logger.warn('Failed to persist event', { error, eventId: event.id })
      // Don't throw - event was emitted to listeners, DB persistence is secondary
    }
  }

  /**
   * Get event history with filters
   */
  async getHistory(filters: {
    entityId?: string
    entityType?: string
    eventType?: EventType
    userId?: string
    fromDate?: Date
    toDate?: Date
    limit?: number
    offset?: number
  }): Promise<{ events: IEvent[]; total: number }> {
    try {
      const where: any = {}

      if (filters.entityId) where.entityId = filters.entityId
      if (filters.entityType) where.entityType = filters.entityType
      if (filters.eventType) where.type = filters.eventType
      if (filters.userId) where.userId = filters.userId

      if (filters.fromDate || filters.toDate) {
        where.createdAt = {}
        if (filters.fromDate) where.createdAt.gte = filters.fromDate
        if (filters.toDate) where.createdAt.lte = filters.toDate
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 100,
          skip: filters.offset || 0,
        }),
        prisma.event.count({ where }),
      ])

      return {
        events: events.map((e: any) => ({
          id: e.id,
          type: e.type as EventType,
          entityId: e.entityId,
          entityType: e.entityType,
          userId: e.userId,
          data: e.eventData as Record<string, any>,
          priority: e.priority as EventPriority,
          createdAt: e.createdAt,
        })),
        total,
      }
    } catch (error) {
      logger.error('Error retrieving event history', { error })
      throw error
    }
  }

  /**
   * Clear old events (for cleanup jobs)
   */
  async clearOldEvents(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await prisma.event.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      })

      logger.info(`Cleared ${result.count} old events`, { daysOld })
      return result.count
    } catch (error) {
      logger.error('Error clearing old events', { error })
      throw error
    }
  }

  /**
   * Get listener count
   */
  getListenerCount(eventType?: EventType): number {
    if (eventType) {
      return this.listeners.get(eventType)?.length || 0
    }

    let total = 0
    for (const listeners of this.listeners.values()) {
      total += listeners.length
    }
    return total
  }
}

export default EventService
