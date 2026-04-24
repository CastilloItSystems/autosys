# Módulo de Notificaciones — Contexto v1

Fecha de implementación: 2026-04-22

---

## Objetivo

Implementar un sistema de notificaciones en tiempo real para AutoSys que permita:
- Notificar eventos del sistema (notas de salida, stock bajo, pagos) a usuarios con los permisos adecuados
- Configurar políticas por empresa (habilitar/deshabilitar eventos, marcar como obligatorio, ventana de deduplicación)
- Que cada usuario gestione sus preferencias personales de notificación

---

## Arquitectura: 3 capas

```
Catálogo (código) → Política empresa (DB) → Preferencia membership (DB)
```

1. **Catálogo** (`notifications.catalog.ts`): fuente de verdad en código. Define todos los eventos con sus defaults (enabled, mandatory, priority, severity, dedupWindowSec, requiredPermissionsAny).
2. **Política empresa** (`notification_company_policies`): overrides por empresa. Admin configura en UI. Si no existe → usa catalog defaults.
3. **Preferencia membership** (`notification_membership_preferences`): opt-in/out por usuario. Si `mandatory: true` o severidad CRITICAL/ERROR → no se puede desactivar.

---

## Estructura de archivos

### Backend — Feature folder

```
backend/src/features/notifications/
├── notifications.interface.ts       # TypeScript interfaces
├── notifications.dto.ts             # DTOs con asRecord() pattern
├── notifications.validation.ts     # Joi schemas con mensajes ES
├── notifications.service.ts        # Singleton con db: PrismaClientType
├── notifications.controller.ts     # asyncHandler + ApiResponse
├── notifications.routes.ts         # validateRequest en todas las rutas
├── notifications.catalog.ts        # Catálogo estático de eventos
└── notifications.orchestrator.ts   # Orquestador 3 capas
```

### Backend — Servicios de trigger inventory

```
backend/src/features/inventory/shared/notifications/
└── inventory-notification-trigger.service.ts  # Dispara notificaciones desde inventory
```

```
backend/src/features/inventory/shared/events/
└── realtime.bridge.ts  # Escucha EventService y fan-out socket + notificaciones
```

### Frontend

```
frontend/app/api/notificationService.ts              # API client (usa response.data.data)
frontend/hooks/useNotifications.ts                   # Hook de estado local
frontend/layout/AppNotificationDropdown.tsx          # Campana en header
frontend/context/SocketContext.tsx                   # Escucha notifications:received por socket
frontend/app/empresa/configuracion/notificaciones/page.tsx  # Config políticas + preferencias
```

### Prisma

```
backend/prisma/models/notification.prisma
  - Notification              → empresaId FK (onDelete: Cascade) + userId
  - NotificationCompanyPolicy → empresaId FK (onDelete: Cascade) + unique(empresaId, eventCode)
  - NotificationMembershipPreference → membershipId FK (onDelete: Cascade) + unique(membershipId, eventCode)
```

---

## Catálogo de eventos v1

| eventCode | módulo | mandatory | priority | severity | dedupWindowSec |
|---|---|---|---|---|---|
| `inventory.exit_note.created` | inventory | false | MEDIUM | INFO | 120 |
| `inventory.stock.low` | inventory | false | HIGH | WARNING | 300 |
| `stock.low` | inventory | false | HIGH | WARNING | 300 |
| `stock.lowAlert` | inventory | false | HIGH | WARNING | 300 |
| `stock.criticalAlert` | inventory | **true** | CRITICAL | ERROR | 300 |
| `sales.order.created` | sales | false | MEDIUM | INFO | 180 |
| `crm.lead.created` | crm | false | MEDIUM | INFO | 180 |
| `workshop.service_order.created` | workshop | false | MEDIUM | INFO | 180 |
| `system.warning` | system | false | HIGH | WARNING | 120 |
| `system.error` | system | **true** | CRITICAL | ERROR | 120 |

---

## Permisos

| Código | Descripción | Roles |
|---|---|---|
| `notifications.view` | Ver centro de notificaciones | TODOS los roles |
| `notifications.manage_policy` | Gestionar políticas empresa | OWNER, ADMIN, GERENTE |

Archivos donde se registran (regla de oro del proyecto):
1. `backend/src/services/empresa-setup.service.ts` → `PERMISSION_CATALOG` + `DEFAULT_ROLE_PERMISSIONS`
2. `backend/prisma/seeds/permissions.seed.ts`
3. `backend/prisma/seeds/companyRoles.seed.ts`
4. `backend/prisma/seeds/roles.seed.ts`
5. `frontend/lib/permissions.ts` → `PERMISSION_GROUPS` + `PERMISSION_LABELS`

---

## Auto-seed al arrancar y al crear empresa

### Startup (`backend/src/index.ts`)

```ts
await ensurePermissionCatalog()
for (const empresa of empresas) {
  await seedDefaultRolesForEmpresa(empresa.id_empresa)
  await seedDefaultNotificationPoliciesForEmpresa(empresa.id_empresa)
}
```

### Crear empresa nueva (`backend/src/controllers/empresas.controller.ts`)

```ts
await ensurePermissionCatalog()
await seedDefaultRolesForEmpresa(newEmpresa.id_empresa)
await seedDefaultNotificationPoliciesForEmpresa(newEmpresa.id_empresa)
```

`seedDefaultNotificationPoliciesForEmpresa` usa `createMany({ skipDuplicates: true })` — nunca pisa políticas existentes customizadas.

---

## Flujo de notificación

```
Evento ocurre (exit note, stock, pago)
  → inventoryNotificationTriggerService.notifyXxx(...)
    → notificationOrchestratorService.emitEvent(input, prisma)
      → getCompanyPolicyByEventCode()     # overlay empresa
      → mergePolicy(catalog, dbPolicy)    # policy efectiva
      → membership.findMany (activos)     # destinatarios
      → per membership:
          1. ¿tiene notifications.view?
          2. ¿tiene requiredPermissionsAny?
          3. ¿mandatory o severity CRITICAL/ERROR? (ignora opt-out)
          4. ¿preferencia habilitada?
          5. ¿dedup reciente?
          → notificationService.create(...)
          → emitNotificationToUser(userId, notification)  # socket
```

### Puntos de trigger

| Origen | Archivo | Notas |
|---|---|---|
| Nota de salida manual | `exitNotes.service.ts` línea ~446 | inside try/catch after tx |
| Nota de salida por pago prefactura | `payments.service.ts` | captura exitNoteNotifyInfo fuera del tx |
| Movimiento de inventario | `movements.service.ts` | notifyLowStockAfterMovement |
| EventService (bridge) | `realtime.bridge.ts` | escucha STOCK_LOW, CRITICAL_STOCK_ALERT, SYSTEM_ERROR, etc. |

---

## Socket

- `emitNotificationToUser(userId, notification)` exportado desde `backend/src/socket/index.ts`
- Frontend escucha `notifications:received` en `SocketContext.tsx`
- El socket ahora requiere `empresaId` estrictamente en el JWT (antes era permisivo)
- Roles normalizados en handshake: MANAGER→GERENTE, SELLER→VENDEDOR, etc.

---

## Convenciones frontend

- `response.data.data` para todos los endpoints de notificación (siguen `ApiResponse.success/paginated`)
- `listNotifications` mapea: `{ items: response.data.data ?? [], meta: response.data.meta }`
- El resto: `response.data.data` directamente

---

## Tablas y cuándo se llenan

| Tabla | Cómo se llena |
|---|---|
| `notifications` | Auto — orchestrator al ocurrir un evento |
| `notification_company_policies` | Auto al crear empresa / startup. Admin modifica en `/empresa/configuracion/notificaciones` |
| `notification_membership_preferences` | Usuario guarda sus preferencias en la misma página |

---

## Regla de oro para agregar nuevos eventos

1. Agregar entrada en `notifications.catalog.ts` (eventCode, module, defaults)
2. Llamar `notificationOrchestratorService.emitEvent({ empresaId, eventCode, ... }, db)` donde ocurra el evento
3. Si es un evento de inventory → agregar en `inventory-notification-trigger.service.ts`
4. El catálogo se autodescubre en la UI de configuración — no se necesita más cambio frontend

---

## Archivos eliminados (refactor)

Los siguientes archivos existían en rutas planas y fueron movidos al feature folder:

- `backend/src/controllers/notification.controller.ts` → `features/notifications/notifications.controller.ts`
- `backend/src/routes/notification.routes.ts` → `features/notifications/notifications.routes.ts`
- `backend/src/services/notification.service.ts` → `features/notifications/notifications.service.ts`
- `backend/src/services/notification-catalog.service.ts` → `features/notifications/notifications.catalog.ts`
- `backend/src/services/notification-orchestrator.service.ts` → `features/notifications/notifications.orchestrator.ts`

---

## Script de patch (empresas existentes antes de v1)

Para empresas que ya existían antes de este módulo:

```bash
cd backend
npx tsx prisma/seeds/patch-sync-roles.ts
```

O simplemente reiniciar el backend (el startup auto-sincroniza).

---

## Pendientes / TODOs

- Tests Jest para `NotificationOrchestratorService`: merge 3 capas, dedup, override mandatory, gate por permiso
- N+1 en el loop del orchestrator: considerar `createMany` + emit bulk para empresas con muchos miembros
- Rate limit en socket `notification:send` (admins pueden bypass el orchestrator)
- Forzar `notification:send` por socket a pasar por orchestrator para respetar dedup/preferences
- Página de configuración frontend: migrar a `FormActionButtons`, React Hook Form, PrimeReact Toast
- Extraer tipos a `libs/interfaces/notifications/` y zods a `libs/zods/notifications/`
- Agregar eventos para otros módulos: `sales.order.created`, `crm.lead.created`, `workshop.service_order.created` (actualmente son placeholders en catálogo sin trigger)
