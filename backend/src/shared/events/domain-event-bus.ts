import { logger } from '../utils/logger.js'
import { DomainEvent } from './domain-events.js'

type DomainEventHandler = (event: DomainEvent) => Promise<void> | void

class DomainEventBus {
  private subscribers = new Map<string, DomainEventHandler>()

  subscribe(handler: DomainEventHandler): () => void {
    const id = Math.random().toString(36).slice(2, 10)
    this.subscribers.set(id, handler)

    return () => {
      this.subscribers.delete(id)
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    if (this.subscribers.size === 0) return

    setImmediate(async () => {
      for (const [id, handler] of this.subscribers.entries()) {
        try {
          await Promise.resolve(handler(event))
        } catch (error) {
          logger.error('DomainEventBus subscriber failed', {
            subscriberId: id,
            eventCode: event.eventCode,
            empresaId: event.empresaId,
            error,
          })
        }
      }
    })
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }
}

export const domainEventBus = new DomainEventBus()
