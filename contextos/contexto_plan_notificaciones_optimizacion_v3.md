# Plan — Optimización del módulo de notificaciones (v3)

Fecha: 2026-04-23
Estado: listo para implementar
Precede: `contexto_modulo_notificaciones_v1.md`, `contexto_plan_notificaciones_global_v2.md`

---

## Contexto

v1 y v2 dejaron el sistema funcional: catálogo + políticas + preferencias + bus de dominio + bridge + triggers en todos los módulos. El pipe `service → bus → bridge → orchestrator → socket` funciona y typecheck pasa.

Problemas detectados en la revisión completa:

- Publishers **esperan** el fan-out completo (`await domainEventBus.publish`) — agrega latencia a cada request.
- Orchestrator hace **N+1 en el loop** de miembros (una `INSERT` + una consulta de perms por usuario).
- **Faltan índices** en `notifications` para dedup y listado.
- El **frontend pierde notifs** cuando llegan varias rápidas (`useState` guarda solo la última).
- **`unreadCount`** no se actualiza en vivo cuando llega un socket.
- Tabla `notifications` **crece sin purga**.

Este plan lo arregla en 5 cambios prioritizados por impacto.

---

## Fase 1 — Índices Prisma (5 min)

### Archivo
`backend/prisma/models/notification.prisma`

### Cambios
Agregar dentro del modelo `Notification`:

```prisma
@@index([empresaId, eventCode, dedupKey, createdAt])
@@index([userId, empresaId, read, eliminado, createdAt])
```

Ya existe `@@index([userId, empresaId, createdAt])` — si colisiona, dejar solo el nuevo más específico.

### Migración
```bash
cd backend
npm run prisma:migrate
# nombre sugerido: 20260423000000_notifications_indexes
```

### Verificación
`EXPLAIN` en la query del orchestrator (`findMany where empresaId+eventCode+dedupKey+createdAt`) debe usar `Index Scan`, no `Seq Scan`.

---

## Fase 2 — Bus no-bloqueante (2 min)

### Archivo
`backend/src/shared/events/domain-event-bus.ts`

### Cambio
`publish` encola en el event loop en vez de await-ear suscriptores:

```ts
async publish(event: DomainEvent): Promise<void> {
  if (this.subscribers.size === 0) return

  setImmediate(async () => {
    for (const [id, handler] of this.subscribers.entries()) {
      try {
        await Promise.resolve(handler(event))
      } catch (error) {
        logger.error('DomainEventBus subscriber failed', {
          subscriberId: id, eventCode: event.eventCode, empresaId: event.empresaId, error,
        })
      }
    }
  })
}
```

Mantener la firma `async` / `Promise<void>` para no romper los 76 call-sites.

### Impacto
- Request de negocio (crear orden, pagar, etc.) ya no espera el fan-out → -50ms a -500ms según empresa.
- Errores siguen capturados por el bus; los `try/catch` redundantes de los publishers pueden quitarse pero no es bloqueante.

### Verificación
Medir tiempo de `POST /api/sales/orders` antes vs después con una empresa de 50+ memberships.

### Riesgo
Si el proceso muere justo después de responder y antes del `setImmediate`, se pierde el fan-out. Las notifs están respaldadas por el listado HTTP (el cliente las verá al recargar) — no es pérdida crítica. Eventos hard-mandatory (SYSTEM_ERROR, BCV fetch_failed) aceptables para v1.

---

## Fase 3 — `createMany` en orchestrator (30 min)

### Archivo
`backend/src/features/notifications/notifications.orchestrator.ts`

### Cambio
Reemplazar el loop `for (const membership of memberships)` que hace `notificationService.create` por persona → construir array de recipients, insertar en bulk, luego emitir por socket.

```ts
// Recolectar recipients que pasan los gates
const recipients: { userId: string; membershipId: string }[] = []
for (const membership of memberships) {
  const perms = new Set(resolveMembershipPermissions(
    membership.role.permissions, membership.permissions
  ))
  if (!perms.has('notifications.view')) { skippedByPolicy++; continue }
  if (modulePermission && !perms.has(modulePermission)) { skippedByPolicy++; continue }
  if (effectivePolicy.requiredPermissionsAny.length > 0 &&
      !effectivePolicy.requiredPermissionsAny.some(p => perms.has(p))) {
    skippedByPolicy++; continue
  }
  const mandatory = effectivePolicy.mandatory || hardLocked
  const preferenceEnabled = preferenceMap.get(membership.id)
  if (!mandatory && preferenceEnabled === false) { skippedByPreference++; continue }
  if (recentlyNotifiedUserIds.has(membership.userId)) { skippedByDedup++; continue }
  recipients.push({ userId: membership.userId, membershipId: membership.id })
}

if (recipients.length === 0) return { createdCount: 0, ... }

// Bulk insert
const baseData = {
  empresaId: input.empresaId,
  eventCode,
  module,
  channel: 'IN_APP' as const,
  title: input.title || catalogItem?.title || eventCode,
  message: input.message || catalogItem?.description || `Evento ${eventCode} registrado`,
  type: normalizeNotificationType(input.type),
  entityType: input.entityType ?? null,
  entityId: input.entityId ?? null,
  priority: normalizePriority(priority),
  severity: normalizeSeverity(severity),
  link: input.link ?? null,
  source: input.source ?? null,
  dedupKey,
  isMandatory: mandatory,
  read: false,
  eliminado: false,
  createdBy: input.createdById ?? 'SYSTEM',
  createdByName: input.createdByName ?? 'Sistema',
  metadata: (input.metadata ?? null) as Prisma.InputJsonValue | null,
}

await client.notification.createMany({
  data: recipients.map(r => ({ ...baseData, userId: r.userId })),
})

// Leer las rows recién creadas para emit (prisma.createMany no devuelve rows en postgres-ext)
const createdRows = await client.notification.findMany({
  where: {
    empresaId: input.empresaId,
    eventCode,
    dedupKey,
    userId: { in: recipients.map(r => r.userId) },
    createdAt: { gte: new Date(Date.now() - 5000) },
  },
})

for (const row of createdRows) {
  emitNotificationToUser(row.userId, mapRowToNotification(row as any))
}
```

### Complicación
Si `dedupKey` es opcional, usar `id in (...)` pero `createMany` no devuelve ids. Alternativa: un `createManyAndReturn` si Prisma lo soporta en tu versión (Prisma 5.14+), o caer a `$transaction` con `create` individuales **sin await** (`Promise.all`) — sigue siendo 1 round-trip si Prisma bundle-ea.

Preferido: **verificar versión Prisma**:
```bash
grep '"prisma"' backend/package.json
```
Si ≥ 5.14: usar `createManyAndReturn({ data: ... })` — más limpio.

### Verificación
Crear una empresa con 50 memberships, disparar 1 evento, ver logs: debe haber **1 INSERT** (no 50).

---

## Fase 4 — Cache de permisos por membership (20 min)

### Archivo nuevo
`backend/src/features/notifications/memberships-permissions.cache.ts`

```ts
import { PrismaClient, Prisma } from '../../generated/prisma/client.js'
import { resolveMembershipPermissions } from '../../shared/utils/resolvePermissions.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

interface CacheEntry {
  memberships: Array<{
    membershipId: string
    userId: string
    permissions: Set<string>
  }>
  expiresAt: number
}

const TTL_MS = 60_000 // 60s
const cache = new Map<string, CacheEntry>()

export async function getActiveMembershipsWithPermissions(
  empresaId: string,
  db: PrismaClientType
) {
  const now = Date.now()
  const cached = cache.get(empresaId)
  if (cached && cached.expiresAt > now) return cached.memberships

  const client = db as PrismaClient
  const rows = await client.membership.findMany({
    where: { empresaId, status: 'active', user: { eliminado: false, estado: 'activo' } },
    include: {
      role: { include: { permissions: { include: { permission: { select: { code: true } } } } } },
      permissions: { include: { permission: { select: { code: true } } } },
    },
  })

  const memberships = rows.map(m => ({
    membershipId: m.id,
    userId: m.userId,
    permissions: new Set(resolveMembershipPermissions(m.role.permissions, m.permissions)),
  }))

  cache.set(empresaId, { memberships, expiresAt: now + TTL_MS })
  return memberships
}

export function invalidateMembershipsCache(empresaId?: string) {
  if (empresaId) cache.delete(empresaId)
  else cache.clear()
}
```

### Invalidación
Invalidar `cache.delete(empresaId)` en:
- `memberships.controller.ts` — cada create/update/delete
- `companyRoles.controller.ts` — cambios de rol
- `users.controller.ts` — cambios de estado/eliminado

### Modificación en orchestrator
Reemplazar `client.membership.findMany(...)` por `getActiveMembershipsWithPermissions(empresaId, db)` y usar los permisos ya calculados.

### Verificación
1000 eventos seguidos a la misma empresa = 1 query de memberships (no 1000).

---

## Fase 5 — Retención / purga (15 min)

### Archivo nuevo
`backend/src/features/notifications/notifications.cleanup.job.ts`

```ts
import cron from 'node-cron'
import prisma from '../../services/prisma.service.js'
import { logger } from '../../shared/utils/logger.js'

const RETENTION_DAYS_READ = 90
const RETENTION_DAYS_DELETED = 30

export function initNotificationsCleanupJob() {
  // Todos los días a las 03:00 UTC
  cron.schedule('0 3 * * *', async () => {
    const readCutoff = new Date(Date.now() - RETENTION_DAYS_READ * 86400_000)
    const deletedCutoff = new Date(Date.now() - RETENTION_DAYS_DELETED * 86400_000)

    const { count: readCount } = await prisma.notification.deleteMany({
      where: { read: true, createdAt: { lt: readCutoff } },
    })
    const { count: deletedCount } = await prisma.notification.deleteMany({
      where: { eliminado: true, updatedAt: { lt: deletedCutoff } },
    })

    logger.info('Notifications cleanup completed', { readCount, deletedCount })
  })
  logger.info('Notifications cleanup job scheduled (03:00 UTC daily)')
}
```

### Registro
En `backend/src/index.ts` junto a `initBcvFetchJob(prisma)`:

```ts
initNotificationsCleanupJob()
```

### Verificación
Disparar manualmente (exponer como endpoint admin temporalmente o correr el handler a mano).

---

## Fase 6 — Frontend: acumular notifs y unread live (20 min)

### Archivo
`frontend/hooks/useNotifications.ts`

### Cambios

1. Recibir `notification` del `SocketContext` y prepend al estado.

```ts
import { useContext, useEffect } from "react"
import { SocketContext } from "@/context/SocketContext"

// dentro del hook:
const socketCtx = useContext(SocketContext)
const socketNotification = socketCtx?.notification

useEffect(() => {
  if (!socketNotification) return
  setNotifications(prev => {
    // evita duplicado si el fetch ya lo trajo
    if (prev.items.some(i => i.id === socketNotification.id)) return prev
    return {
      ...prev,
      items: [socketNotification, ...prev.items].slice(0, prev.meta?.limit ?? 50),
      meta: {
        ...prev.meta,
        total: (prev.meta?.total ?? 0) + 1,
      },
    }
  })
}, [socketNotification])
```

2. `unreadCount` sigue derivándose de `items` → se actualiza solo.

### Archivo
`frontend/context/SocketContext.tsx`

Mantener `setNotification(notificationData)` — el hook consume el valor y reacciona via `useEffect`. Si hay race (llegan 2 seguidas, misma ref), cambiar a:

```ts
const [notification, setNotification] = useState<NotificationItem | null>(null)
socketTemp.on("notifications:received", (data) => setNotification({ ...data, _rxAt: Date.now() }))
```

El `_rxAt` garantiza nueva referencia → `useEffect` dispara aunque el id sea igual.

### Toast (opcional pero recomendado)
`frontend/layout/AppNotificationDropdown.tsx` — importar `useRef<Toast>` de PrimeReact y mostrar un toast al recibir cada notif según severity:

```ts
const toast = useRef<Toast>(null)
useEffect(() => {
  if (!socketNotification) return
  toast.current?.show({
    severity: mapSeverity(socketNotification.severity),
    summary: socketNotification.title,
    detail: socketNotification.message,
    life: 4000,
  })
}, [socketNotification])
```

### Verificación
1. Abrir 2 pestañas del frontend logueadas como mismo user.
2. Disparar 3 eventos seguidos desde Postman (crear 3 órdenes).
3. Ver en ambas pestañas: 3 items en el dropdown, `unreadCount = 3`, 3 toasts.

---

## Orden de implementación y PRs

Cada fase es un PR independiente salvo que se indique lo contrario.

| # | Fase | Tiempo | PR sugerido |
|---|---|---|---|
| 1 | Índices Prisma | 5 min | PR #1 |
| 2 | Bus `setImmediate` | 2 min | PR #2 (con Fase 1 si quieres) |
| 3 | `createMany` orchestrator | 30 min | PR #3 |
| 4 | Cache de memberships | 20 min | PR #4 |
| 5 | Job de purga | 15 min | PR #5 |
| 6 | Frontend acumular + toast | 20 min | PR #6 |

Total: ~90 min de código + pruebas.

---

## Checklist de smoke test end-to-end

Después de cada PR correr:

- [ ] `cd backend && npx tsc --noEmit` → exit 0
- [ ] `cd frontend && npm run build` → sin errores
- [ ] `npm run dev` back + front levantan sin error
- [ ] Login como OWNER → ver dropdown de notificaciones
- [ ] Crear orden venta (usuario distinto de OWNER) → llega al OWNER por socket
- [ ] Cerrar pestaña, crear evento, reabrir → notif persistida en DB
- [ ] Tabla `notifications` tiene entradas con el `dedupKey` correcto
- [ ] Dispara mismo evento 2 veces rápido → solo 1 notif por destinatario (dedup funciona)
- [ ] Stock crítico → ignora opt-out del usuario (mandatory override)
- [ ] Usuario sin `<module>.notifications.view` → NO recibe socket ni persiste

---

## Archivos críticos por fase

| Fase | Archivos |
|---|---|
| 1 | `backend/prisma/models/notification.prisma`, migración nueva |
| 2 | `backend/src/shared/events/domain-event-bus.ts` |
| 3 | `backend/src/features/notifications/notifications.orchestrator.ts` |
| 4 | `backend/src/features/notifications/memberships-permissions.cache.ts` (nuevo), `orchestrator.ts`, `memberships.controller.ts`, `companyRoles.controller.ts`, `users.controller.ts` |
| 5 | `backend/src/features/notifications/notifications.cleanup.job.ts` (nuevo), `backend/src/index.ts` |
| 6 | `frontend/hooks/useNotifications.ts`, `frontend/context/SocketContext.tsx`, `frontend/layout/AppNotificationDropdown.tsx` |

---

## Fuera de alcance (para v4)

- Digest por email / agrupación (requiere integración SMTP)
- Rate limit por usuario (máx 20 notifs/min)
- Canales adicionales: EMAIL, SMS, PUSH (necesita `channels` en catálogo activar)
- Outbox pattern para garantizar entrega en crash
- Constraint `@@unique([empresaId, userId, dedupKey])` en `Notification` — evaluar si rompe dedup por ventana (probablemente sí, mejor dejar como está)
- Métricas Prometheus/Grafana de `createdCount / skippedByPolicy / skippedByPreference / skippedByDedup`

---

## Regla de oro

Cada PR debe mantener el sistema **funcional end-to-end** — nada de PRs que dejen el branch roto. Si Fase 3 queda a medias, la 4 espera.
