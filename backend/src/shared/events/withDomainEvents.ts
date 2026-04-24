import { domainEventBus } from './domain-event-bus.js'
import {
  DomainEvent,
  DomainEventDraft,
  toDomainEvent,
} from './domain-events.js'

export interface DomainEventCollector {
  add: (event: DomainEventDraft) => void
  list: () => DomainEvent[]
}

const createCollector = (): DomainEventCollector => {
  const events: DomainEvent[] = []

  return {
    add: (event) => {
      events.push(toDomainEvent(event))
    },
    list: () => [...events],
  }
}

export async function withDomainEvents<T>(
  handler: (collector: DomainEventCollector) => Promise<T>
): Promise<T> {
  const collector = createCollector()
  const result = await handler(collector)
  await domainEventBus.publishMany(collector.list())
  return result
}
