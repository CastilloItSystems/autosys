# Contexto de los permisos

Resumen de la sesión y guía rápida para futuros cambios relacionados con permisos y roles.

## Resumen general (en español)

- Objetivo: Rehacer y armonizar el catálogo de permisos del sistema para que refleje las rutas y flujos reales, añadir acción `approve` a los módulos, sembrar permisos y roles automáticamente al crear empresas, y propagar cambios al frontend.
- Resultado: Catálogo centralizado y consistente, seeds actualizados, servicio de setup actualizado, rutas corregidas y componentes frontend actualizados.

## Cambios realizados (archivos principales)

- Backend
  - `backend/src/shared/constants/permissions.ts`
    - Nuevo catálogo con 14 módulos: `users`, `inventory`, `items`, `warehouses`, `stock`, `movements`, `loans`, `transfers`, `customers`, `orders`, `invoices`, `quotes`, `payments`, `reports`.
    - Cada módulo tiene acciones consistentes: `view`, `create`, `update`, `delete`, `approve` (cuando aplica). Acciones especiales: `stock.adjust`, `stock.transfer`, `reports.export`.
  - `backend/prisma/seeds/permissions.seed.ts`
    - Reescrito para incluir todos los códigos nuevos (upsert idempotente).
  - `backend/prisma/seeds/roles.seed.ts`
    - Reescrito con definiciones coherentes de roles del sistema (OWNER, ADMIN, GERENTE, ALMACENISTA, VENDEDOR, VIEWER) asignando los nuevos permisos.
  - `backend/prisma/seeds/companyRoles.seed.ts`
    - Reescrito (archivo originalmente corrupto) para sembrar roles por empresa usando los nuevos permisos.
  - `backend/src/services/empresa-setup.service.ts`
    - `PERMISSION_CATALOG` y `DEFAULT_ROLE_PERMISSIONS` actualizados; `ensurePermissionCatalog()` y `seedDefaultRolesForEmpresa()` usan los nuevos códigos.
  - Rutas corregidas (constantes usadas actualizadas):
    - `backend/src/routes/users.routes.ts` — `USERS_READ` → `USERS_VIEW`
    - `backend/src/routes/memberships.routes.ts` — `USERS_READ` → `USERS_VIEW`
    - `backend/src/features/inventory/loans/loans.routes.ts` — `LOAN_APPROVE` → `LOANS_APPROVE`
    - `backend/src/features/inventory/transfers/transfers.routes.ts` — `TRANSFER_APPROVE` → `TRANSFERS_APPROVE`

- Frontend
  - `frontend/components/usuarioComponents/MembershipPermissions.tsx`
    - Grupos y etiquetas sincronizados con el nuevo catálogo (14 grupos).
  - `frontend/components/empresas/EmpresaRoles.tsx`
    - Grupos/labels actualizados.
  - `frontend/layout/AppTopbar.tsx`
    - Mostrar roles desde `session.user.empresas` (estructura real) y en minúsculas.
  - `frontend/layout/AppSidebar.tsx`
    - Lógica de detección de rutas ajustada para mostrar `AppMenuEmpresa` solamente cuando la ruta es `empresa` (no `empresas`).
  - `frontend/components/usuarioComponents/UsuarioList.tsx`
    - Plantillas de columna y uso de `membership.role.name` preservadas; no se requiere cambio adicional por ahora.

## Estructura de datos observada

- Token/session user sample (lo que devuelve el backend):
  - `user.empresas` es un array con objetos tipo:
    ```json
    {
      membershipId: string,
      empresaId: string,
      nombre: string,
      role: { id: string, name: string, description?: string },
      permissions: string[]
    }
    ```
  - Nota: También se mantiene `memberships` como alias legacy en algunos endpoints, pero la representación actual usada en UI es `empresas`.

## Comandos útiles para aplicar/validar cambios

- Sembrar permisos/roles en la base de datos (desde `backend`):

```bash
# en la carpeta backend
npx prisma db seed
# o si usas script en package.json
npm run prisma:seed
```

- Verificar TypeScript (backend):

```bash
cd backend
npx tsc --noEmit
```

- Reiniciar servidor de desarrollo (root del repo):

```bash
# ejemplo con nx/npn/pnpm según setup
npm run dev
# o, si arrancas backend separado:
cd backend && npx tsx src/index.ts
```

## Donde buscar cada cosa

- Catálogo de permisos (constantes): `backend/src/shared/constants/permissions.ts`
- Seeds: `backend/prisma/seeds/permissions.seed.ts`, `roles.seed.ts`, `companyRoles.seed.ts`
- Servicio que garantiza catálogo y roles: `backend/src/services/empresa-setup.service.ts`
- Rutas que necesitan permiso específico: `backend/src/routes/` y `backend/src/features/**/routes.ts`
- Componentes UI: `frontend/components/usuarioComponents/`, `frontend/components/empresas/`, `frontend/layout/`

## Consideraciones y pasos futuros (lista corta)

- Validar que no queden referencias a códigos antiguos (`users.read`, `loans.approve` singular, `transfer.approve`, etc.). Buscar en todo el repo por esos patrones.
- Ejecutar `npx prisma db seed` en entorno de desarrollo y revisar que no se creen duplicados y que `rolePermission` apunte a permisos existentes.
- Revisar endpoints que usan `extractEmpresaFromParam` vs `authorizeGlobal()` para permisos que deben aplicarse sin membership en la empresa (ya corregido en `companyRoles.routes.ts`).
- Revisar frontend: actualizar cualquier mapeo de `perm` a labels si agregas nuevos permisos especiales.
- Añadir pruebas unitarias para el servicio de `empresa-setup` si se desea evitar regresiones.

## Notas rápidas (para quien retome esta tarea)

- El formato de permisos es `module.action` (ej.: `items.create`, `loans.approve`).
- El rol `ADMIN` en la muestra tiene 66 permisos (acceso amplio) — fíjate en `permissions.seed.ts` si quieres quitar/añadir permisos para ese rol.
- Si vas a cambiar códigos, primero actualiza `backend/src/shared/constants/permissions.ts`, luego actualiza seeds y `empresa-setup.service.ts`, y finalmente corre `prisma db seed`.

---

## Actualización — Módulo CRM (2026-03-28)

### Cambios realizados

**Módulo CRM agregado:** 20 permisos nuevos en 5 grupos — `crm.customers`, `crm.vehicles`, `crm.leads`, `crm.interactions`, `crm.activities`. Cada grupo tiene `.view`, `.create`, `.update`, `.delete`.

**Los 4 archivos de permisos del backend** se actualizaron en sincronía con los mismos arrays `ALL_CRM` / `VIEW_CRM`:

| Archivo | Cambio |
|---|---|
| `backend/src/services/empresa-setup.service.ts` | Fuente de verdad — `PERMISSION_CATALOG` + roles actualizados |
| `backend/prisma/seeds/permissions.seed.ts` | 20 permisos CRM agregados |
| `backend/prisma/seeds/companyRoles.seed.ts` | `ALL_CRM`/`VIEW_CRM` spreads en roles |
| `backend/prisma/seeds/roles.seed.ts` | Mismo patrón (sincronía) |

**Distribución de permisos CRM por rol:**
- `OWNER`, `ADMIN`, `GERENTE`, `VENDEDOR` → `...ALL_CRM` (todos los 20)
- `VIEWER` → `...VIEW_CRM` (solo los 5 `.view`)
- `ALMACENISTA` → ninguno

**Auto-sync en arranque del servidor** (`backend/src/index.ts`):
```typescript
await ensurePermissionCatalog()
const empresas = await prisma.empresa.findMany({ where: { eliminado: false }, select: { id_empresa: true } })
for (const empresa of empresas) {
  await seedDefaultRolesForEmpresa(empresa.id_empresa)
}
```
Esto hace que cada vez que se levanta el backend, los nuevos permisos se propaguen automáticamente a todas las empresas activas sin intervención manual.

**Frontend — catálogo de permisos unificado:**

Se creó `frontend/lib/permissions.ts` con `PERMISSION_GROUPS`, `PERMISSION_LABELS` y `ALL_PERMISSIONS` como única fuente de verdad del catálogo en el frontend.

Los siguientes componentes ahora importan desde ese archivo (ya no tienen definiciones locales):
- `frontend/components/empresas/EmpresaRoles.tsx`
- `frontend/components/usuarioComponents/MembershipPermissions.tsx`

**Regla de oro:** cuando agregues un nuevo módulo al sistema, toca estos archivos en orden:
1. `empresa-setup.service.ts` → `PERMISSION_CATALOG` + `DEFAULT_ROLE_PERMISSIONS`
2. `permissions.seed.ts` → array `PERMISSIONS`
3. `companyRoles.seed.ts` → arrays de permisos por rol
4. `roles.seed.ts` → mismo patrón
5. `frontend/lib/permissions.ts` → `PERMISSION_GROUPS` + `PERMISSION_LABELS`

Los puntos 1-4 son idempotentes (upsert), por lo que un simple reinicio del servidor propagará los cambios a todas las empresas existentes.
