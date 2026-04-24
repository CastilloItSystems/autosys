# Plan — Notificaciones globales multi-módulo (v2)

Fecha: 2026-04-22
Estado: propuesta técnica (implementación incremental)

---

## 1. Contexto y problema

v1 de notificaciones (ver `contexto_modulo_notificaciones_v1.md`) ya tiene:

- Orchestrator de 3 capas (catálogo → política empresa → preferencia membership)
- Dedup por ventana, override `mandatory`, gate por permiso (`requiredPermissionsAny`)
- Socket fan-out por `userId` (`emitNotificationToUser`)
- Auto-seed de políticas por empresa

Pero **solo hay triggers en inventory y un punto de `payments`**. El resto de la app (CRM, taller, ventas fuera de pagos, compras, concesionario, exchange rates, auth) no dispara nada.

Objetivo: que **todos los módulos** publiquen sus cambios de estado relevantes sin duplicar código ni ensuciar servicios con `try/catch` por evento.

Principios:

1. **Un solo punto de fan-out**: el orchestrator.
2. **Los servicios de negocio no llaman al orchestrator directamente** → publican un evento de dominio; un *bridge* lo traduce.
3. **Catálogo = única fuente de verdad** de qué eventos existen, qué permisos requieren y defaults (mandatory, severity, dedup).
4. **Permisos por módulo, no por evento**: un permiso `<module>.notifications.view` por módulo top-level. Granularidad fina vive en `requiredPermissionsAny` del catálogo.
5. Los disparos ocurren **fuera de `$transaction`** para que un fallo de notificación jamás haga rollback.

---

## 2. Arquitectura objetivo

```
[Service de negocio]
   │  (después del commit de la tx)
   ▼
[DomainEventBus.publish({ module, eventCode, empresaId, actorId, payload })]
   │
   ▼
[notifications.bridge.ts] — único suscriptor global
   │
   ▼
[notificationOrchestratorService.emitEvent(input, db)]
   │  (3 capas + dedup + permiso)
   ▼
[notificationService.create] + [emitNotificationToUser socket]
```

### Piezas nuevas

| Archivo | Propósito |
|---|---|
| `backend/src/shared/events/domain-event-bus.ts` | EventEmitter tipado único para toda la app (`publish`, `subscribe`). Reusa patrón de `inventory/shared/events/event.service.ts` pero a nivel global. |
| `backend/src/shared/events/domain-events.ts` | Tipos: `DomainEvent<M extends ModuleCode, E extends EventCode>` con discriminante por `eventCode`. |
| `backend/src/features/notifications/notifications.bridge.ts` | Único suscriptor: mapea `DomainEvent` → `emitEvent` del orchestrator. Registrado en `index.ts`. |
| `backend/src/shared/events/withDomainEvents.ts` | Helper `runWithEvents(tx → result, () => events[])` que ejecuta la transacción y, **si commitea**, publica eventos acumulados. |

### Unificación con `EventService` existente

Hoy `inventory/shared/events/event.service.ts` + `realtime.bridge.ts` hacen lo mismo a pequeña escala para inventory. Plan:

- Mantener `EventService` de inventory (usos internos del módulo: hooks, jobs).
- Agregar en `realtime.bridge.ts` un puente: cualquier evento relevante de `EventService` → `DomainEventBus.publish`. Así no se rompe lo actual y se promueve eventos a globales cuando toca.

---

## 3. Convenciones de nombres

### eventCode
`<module>.<resource>.<action>` — kebab/camel en recurso, acción en pasado cuando aplica:

- `sales.order.created`, `sales.order.approved`, `sales.order.cancelled`
- `sales.payment.completed`, `sales.payment.refunded`
- `sales.invoice.issued`, `sales.invoice.cancelled`
- `workshop.serviceOrder.statusChanged`, `workshop.serviceOrder.readyForDelivery`
- `workshop.appointment.created`, `workshop.appointment.rescheduled`
- `workshop.quotation.approvedByClient`
- `workshop.qualityCheck.failed`
- `crm.lead.created`, `crm.lead.converted`, `crm.lead.stalled`
- `crm.opportunity.stageChanged`, `crm.opportunity.won`, `crm.opportunity.lost`
- `crm.case.opened`, `crm.case.escalated`
- `crm.activity.overdue`
- `purchases.purchaseOrder.approved`, `purchases.purchaseOrder.received`
- `dealer.unit.reserved`, `dealer.unit.sold`
- `dealer.delivery.scheduled`, `dealer.delivery.completed`
- `dealer.afterSale.created`
- `inventory.*` (existentes)
- `exchangeRates.bcv.fetched`, `exchangeRates.bcv.fetchFailed`
- `system.warning`, `system.error`, `auth.user.added`, `auth.role.changed`

### moduleCode (top-level)
`inventory | sales | purchases | workshop | crm | dealer | exchangeRates | system | auth`

---

## 4. Modelo de permisos escalado

### Nuevos permisos (por módulo)

| Código | Descripción |
|---|---|
| `inventory.notifications.view` | Ver notificaciones de inventory |
| `sales.notifications.view` | Ver notificaciones de ventas |
| `purchases.notifications.view` | Ver notificaciones de compras |
| `workshop.notifications.view` | Ver notificaciones de taller |
| `crm.notifications.view` | Ver notificaciones de CRM |
| `dealer.notifications.view` | Ver notificaciones de concesionario |
| `exchangeRates.notifications.view` | Ver notificaciones de tasas |
| `system.notifications.view` | Ver notificaciones de sistema (admins) |

Global `notifications.view` se **mantiene** como super-gate (lo tiene cualquier usuario que pueda abrir el centro de notificaciones); sin él, ningún canal aplica.

### Orchestrator — nueva regla de gating

Para cada destinatario, permitir la entrega si cumple TODAS:

1. Tiene `notifications.view` (gate global).
2. Tiene `<module>.notifications.view` del módulo del evento.
3. Tiene al menos uno de `requiredPermissionsAny` (granularidad fina, p. ej. `orders.view` o `workshop.create`).
4. Preferencia del usuario no desactivada (salvo `mandatory` / severity CRITICAL/ERROR).
5. No hay duplicado dentro de `dedupWindowSec`.

Ventaja: admin de taller recibe todo taller sin mezclar con ventas; vendedor solo lo suyo; OWNER recibe todo porque tiene todos los módulos.

### Roles por defecto (delta vs v1)

En `DEFAULT_ROLE_PERMISSIONS`:

- **OWNER / ADMIN / GERENTE**: todos los `<module>.notifications.view` + `system.notifications.view` + `notifications.manage_policy`.
- **VENDEDOR**: `sales.notifications.view`, `crm.notifications.view`, `inventory.notifications.view` (para stock bajo que afecta sus ventas), `dealer.notifications.view`.
- **ALMACENISTA**: `inventory.notifications.view`, `purchases.notifications.view`.
- **TÉCNICO / MECÁNICO (si existe)**: `workshop.notifications.view`.
- **VIEWER**: todos los `*.notifications.view` (solo lectura pero ve alertas).

Todos los roles con `notifications.view` global.

### Archivos a tocar (regla de oro)

1. `backend/src/services/empresa-setup.service.ts` → `PERMISSION_CATALOG` + `DEFAULT_ROLE_PERMISSIONS`
2. `backend/prisma/seeds/permissions.seed.ts`
3. `backend/prisma/seeds/companyRoles.seed.ts`
4. `backend/prisma/seeds/roles.seed.ts`
5. `backend/src/shared/constants/permissions.ts`
6. `frontend/lib/permissions.ts` → `PERMISSION_GROUPS` + `PERMISSION_LABELS`

Auto-sync on startup ya propaga el delta a empresas existentes.

---

## 5. Cómo agregar notificaciones a un módulo (receta repetible)

Meta: que un dev agregue notifs a un módulo en **~15 min** sin tocar orchestrator ni socket.

### Paso 1 — Catálogo
Editar `backend/src/features/notifications/notifications.catalog.ts`:

```ts
{
  eventCode: 'workshop.serviceOrder.statusChanged',
  module: 'workshop',
  title: 'Orden de servicio actualizada',
  defaultEnabled: true,
  defaultMandatory: false,
  priority: 'MEDIUM',
  severity: 'INFO',
  defaultDedupWindowSec: 120,
  requiredPermissionsAny: ['workshop.view', 'workshop.update'],
}
```

### Paso 2 — Publicar evento en el service
En el service del módulo (ej. `workshop/serviceOrders/serviceOrders.service.ts`), después de commit de la tx:

```ts
domainEventBus.publish({
  module: 'workshop',
  eventCode: 'workshop.serviceOrder.statusChanged',
  empresaId,
  actorId: userId,
  payload: { serviceOrderId: so.id, previousStatus, newStatus },
  meta: { title: `OS #${so.number} → ${newStatus}`, link: `/empresa/taller/ordenes/${so.id}` },
})
```

Regla: **nunca dentro de `$transaction`**. Usar `withDomainEvents` helper o acumular y emitir después.

### Paso 3 — (no hay paso 3)

El bridge ya escucha. El frontend (configuración) auto-descubre el catálogo. Las políticas por empresa se crean automáticamente al reiniciar backend (o en `/empresas/:id/seed-defaults`).

---

## 6. Roadmap de implementación (incremental, por fases)

Cada fase es un PR independiente, funcional end-to-end.

### Fase 0 — Infra (prerequisito)
- [ ] `backend/src/shared/events/domain-event-bus.ts` (EventEmitter tipado)
- [ ] `backend/src/shared/events/domain-events.ts` (tipos)
- [ ] `backend/src/shared/events/withDomainEvents.ts` (helper tx→events)
- [ ] `backend/src/features/notifications/notifications.bridge.ts` (suscriptor → orchestrator)
- [ ] Registrar bridge en `backend/src/index.ts` al lado de `registerInventoryRealtimeBridge()`
- [ ] Puente de `EventService` (inventory) → `DomainEventBus` en `realtime.bridge.ts` para eventos "globales"
- [ ] Tests Jest: bus dispara bridge, bridge llama orchestrator, errores en bridge no explotan al publisher.

### Fase 1 — Permisos scoped
- [ ] Agregar `<module>.notifications.view` en los 6 archivos listados en §4.
- [ ] Modificar orchestrator para aplicar gate por módulo (extraer prefix de `eventCode`).
- [ ] Seed + restart → empresas existentes reciben los nuevos permisos.
- [ ] Frontend: agrupar en `PERMISSION_GROUPS` bajo cada módulo.

### Fase 2 — Sales
Eventos:
- `sales.order.created|approved|cancelled` (en `sales/orders/orders.service.ts`)
- `sales.preInvoice.created|cancelled`
- `sales.invoice.issued|cancelled`
- `sales.payment.completed|refunded` (ya hay un trigger manual — migrar a bus)
- `sales.quote.created|converted`

### Fase 3 — Workshop
Eventos:
- `workshop.serviceOrder.created|statusChanged|readyForDelivery|delivered`
- `workshop.appointment.created|rescheduled|cancelled|missed`
- `workshop.quotation.created|approvedByClient|rejectedByClient|convertedToSO`
- `workshop.qualityCheck.failed`
- `workshop.reception.created`
- `workshop.warranty.activated|claimed`

Hook automatizaciones (`workshop-automations.service.ts`) → publicar eventos cuando detectan delayed/stagnant/ready.

### Fase 4 — CRM
Eventos:
- `crm.lead.created|statusChanged|converted`
- `crm.opportunity.created|stageChanged|won|lost|stalled`
- `crm.case.opened|escalated|closed`
- `crm.activity.created|overdue|completed`
- `crm.quote.created|approved`
- `crm.campaign.launched` (opcional)

### Fase 5 — Purchases (hoy vive en inventory/purchaseOrders)
Eventos:
- `purchases.purchaseOrder.created|approved|sentToSupplier|received|cancelled`
- `purchases.supplier.rated` (opcional)

Crear permiso top-level `purchases.notifications.view` aunque el código resida físicamente en inventory.

### Fase 6 — Dealer / Concesionario
Eventos:
- `dealer.unit.reserved|sold|returnedToStock`
- `dealer.delivery.scheduled|completed|delayed`
- `dealer.testDrive.scheduled|completed`
- `dealer.tradeIn.appraised|approved`
- `dealer.financing.submitted|approved|rejected`
- `dealer.afterSale.opened`

### Fase 7 — Exchange Rates + System + Auth
Eventos:
- `exchangeRates.bcv.fetched|fetchFailed` (desde `bcvFetch.job.ts`)
- `system.warning`, `system.error` (ya existen en catálogo)
- `auth.user.invited|added`, `auth.role.permissionsChanged`

### Fase 8 — Mejoras transversales
- [ ] `createMany` en orchestrator para evitar N+1 cuando una empresa tiene cientos de miembros
- [ ] Rate limit en socket `notification:send`; forzar ruta por orchestrator
- [ ] Preferencias agrupadas por módulo en la UI (`/empresa/configuracion/notificaciones`) con tabs
- [ ] Link `metadata.link` en notificación → click lleva al recurso (frontend dropdown)
- [ ] Digest diario / semanal (opcional, fase futura)

---

## 7. Templates de código reutilizables

### DomainEventBus (esbozo)

```ts
// backend/src/shared/events/domain-event-bus.ts
import { EventEmitter } from 'events'
import type { DomainEvent } from './domain-events.js'

class DomainEventBus extends EventEmitter {
  publish(event: DomainEvent) {
    this.emit('event', event)
    this.emit(event.eventCode, event)
  }
  subscribe(handler: (e: DomainEvent) => void | Promise<void>) {
    this.on('event', async (e) => {
      try { await handler(e) } catch (err) { logger.error('event handler failed', err) }
    })
  }
}
export const domainEventBus = new DomainEventBus()
```

### Helper transaccional

```ts
// backend/src/shared/events/withDomainEvents.ts
export async function withDomainEvents<T>(
  fn: () => Promise<{ result: T; events: DomainEvent[] }>,
): Promise<T> {
  const { result, events } = await fn()
  for (const ev of events) domainEventBus.publish(ev)
  return result
}
```

Uso:
```ts
return withDomainEvents(async () => {
  const result = await prisma.$transaction(async (tx) => { ... })
  const events = [{ module: 'sales', eventCode: 'sales.order.created', ... }]
  return { result, events }
})
```

### Bridge único

```ts
// backend/src/features/notifications/notifications.bridge.ts
import prisma from '../../services/prisma.service.js'
import { domainEventBus } from '../../shared/events/domain-event-bus.js'
import notificationOrchestratorService from './notifications.orchestrator.js'

let registered = false
export function registerNotificationsBridge() {
  if (registered) return
  registered = true
  domainEventBus.subscribe(async (ev) => {
    await notificationOrchestratorService.emitEvent({
      empresaId: ev.empresaId,
      eventCode: ev.eventCode,
      title: ev.meta?.title,
      message: ev.meta?.message,
      link: ev.meta?.link,
      metadata: ev.payload,
      actorId: ev.actorId,
    }, prisma)
  })
}
```

---

## 8. Permisos — gate por módulo (pseudo-orchestrator)

Dentro del loop por membership, antes del check actual:

```ts
const moduleCode = event.eventCode.split('.')[0]   // 'sales', 'workshop', ...
const moduleViewPerm = `${moduleCode}.notifications.view`

if (!perms.includes('notifications.view')) continue
if (!perms.includes(moduleViewPerm)) continue
if (policy.requiredPermissionsAny?.length &&
    !policy.requiredPermissionsAny.some(p => perms.includes(p))) continue
```

`system.*` puede requerir `system.notifications.view` (admins solamente).

---

## 9. Verificación end-to-end por fase

Por cada fase (2-7):

1. Catálogo actualizado y `notification_company_policies` se auto-siembra al reiniciar.
2. Login con usuario OWNER → ve todas las nuevas notifs al disparar el evento.
3. Login con usuario rol limitado (ej. VENDEDOR) → solo recibe las de sales/crm/inventory relevantes, NO las de taller.
4. `/empresa/configuracion/notificaciones` lista el nuevo evento; toggle off → no llega.
5. Evento CRITICAL/mandatory ignora opt-out.
6. Disparo dentro de tx fallida → **no** se crea notif huérfana.
7. Socket recibe `notifications:received` en el frontend en tiempo real.

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Service publica evento dentro de tx y luego la tx falla → notif fantasma | Usar `withDomainEvents` siempre; publicar solo después de commit |
| Explosión de volumen (mil notifs/min con muchos empleados) | Dedup por ventana + `createMany` (fase 8) + rate limit socket |
| Drift entre módulos en nombrar eventCodes | Este documento + lint opcional (eventCode debe empezar por módulo permitido) |
| Rol sin permiso scoped tras upgrade | Auto-sync on startup + `/empresas/:id/seed-defaults` |
| Orchestrator N+1 con gate doble | Cachear perms por membership dentro de la llamada |
| Tests frágiles con EventEmitter async | Helper `flushEvents()` en tests que await los handlers |

---

## 11. Archivos críticos a crear / modificar

### Nuevos
- `backend/src/shared/events/domain-event-bus.ts`
- `backend/src/shared/events/domain-events.ts`
- `backend/src/shared/events/withDomainEvents.ts`
- `backend/src/features/notifications/notifications.bridge.ts`

### Modificados
- `backend/src/features/notifications/notifications.catalog.ts` (+N entradas por fase)
- `backend/src/features/notifications/notifications.orchestrator.ts` (gate por módulo)
- `backend/src/index.ts` (registrar bridge)
- `backend/src/services/empresa-setup.service.ts` (permisos scoped + roles)
- `backend/prisma/seeds/{permissions,companyRoles,roles}.seed.ts`
- `backend/src/shared/constants/permissions.ts`
- `frontend/lib/permissions.ts`
- Services de cada módulo (fase 2-7): una o dos líneas `domainEventBus.publish(...)` después del commit

---

## 12. Regla de oro para el futuro

> Antes de escribir `console.log`, `io.emit`, un toast o un correo ad-hoc sobre un cambio de estado: publica un `DomainEvent`. Si quieres que alguien sea notificado, agrega la entrada al catálogo. Todo lo demás lo hace la infraestructura.
