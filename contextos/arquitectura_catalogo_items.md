# Análisis: Catálogo Unificado de Ítems — Taller + Inventario

**Fecha:** Abril 2026  
**Estado:** En discusión — pendiente de implementación

---

## 1. Contexto

Durante el desarrollo del módulo de taller, surgió la pregunta de si los modelos de ítems de inventario (`Item`) y los servicios de taller (`WorkshopOperation`, `ServiceType`) deben ser entidades separadas o unificarse en un catálogo único.

El objetivo es evitar duplicar productos: un filtro de aceite debería existir una sola vez en el sistema, poder venderse en mostrador (módulo de ventas) y también usarse en una orden de taller, descontando el mismo stock.

---

## 2. Estado Actual del Modelo

### Tabla `Item` (inventario)
Catálogo de productos físicos con inventario. Campos actuales relevantes:
- `useStock: Boolean` — si maneja stock
- `isInternalUse: Boolean` — uso interno (flag simple, no diferencia bien los casos)
- `costPrice`, `salePrice` — precios
- **NO tiene**: `itemType` (producto/servicio), `usedIn` (repuesto/taller/ambos)

### Tabla `WorkshopOperation` (taller)
Definición de servicios de mano de obra. Campos relevantes:
- `standardMinutes` — tiempo estándar de referencia
- `listPrice` — precio de la operación
- `serviceTypeId` — categoría del servicio
- Relaciones: `laborTimes[]`, `diagnosisSuggestions[]`

### Tabla `ServiceType` (taller)
Categorías de operaciones. Campos:
- `code`, `name`, `standardMinutes`, `standardLaborPrice`
- Relaciones: `operations[]`, `appointments[]`

### Tabla `ServiceOrderItem` (órdenes de servicio)
Ítem dentro de una OS. Tiene **dos FKs separadas**:
- `operationId → WorkshopOperation` (para ítems tipo LABOR)
- `itemId → Item` (para ítems tipo PART/CONSUMABLE)

---

## 3. Problema Identificado

El campo `isInternalUse` en `Item` no es suficiente para saber:
1. Si un ítem es un **producto físico** o un **servicio**
2. Si un ítem puede usarse en **repuestos (ventas)**, **taller**, o **ambos**

Esto significa que:
- No hay forma de filtrar el picker de ítems en cotizaciones por "disponible para taller"
- Un filtro de aceite puede aparecer en ventas aunque sea solo para consumo interno
- No hay distinción semántica entre producto y servicio en el catálogo

---

## 4. Solución Propuesta: Enriquecer `Item` con dos nuevos campos

### Nuevos enums en `item.prisma`

```prisma
enum ItemType {
  PRODUCT   // Producto físico (maneja inventario)
  SERVICE   // Servicio sin stock (ej: diagnóstico a precio fijo)
  COMBO     // Paquete de productos/servicios
}

enum ItemUse {
  PARTS     // Solo para ventas de repuestos
  WORKSHOP  // Solo para uso en taller
  BOTH      // Disponible en ambos módulos (default)
}
```

### Nuevos campos en modelo `Item`

```prisma
itemType  ItemType  @default(PRODUCT)
usedIn    ItemUse   @default(BOTH)
```

**Por qué `BOTH` como default:** Todos los ítems existentes quedan accesibles desde ambos módulos sin migración manual. Solo se cambia cuando se necesita restringir.

---

## 5. WorkshopOperation: ¿Se elimina o se mantiene?

### Conclusión: **Se mantiene**

`WorkshopOperation` tiene lógica propia que no encaja en un catálogo de inventario:

#### a) Control de eficiencia de técnicos

```
LaborTime.standardMinutes = snapshot de WorkshopOperation.standardMinutes al registrar
LaborTime.realMinutes = tiempo real del técnico
efficiency% = (realMinutes / standardMinutes) × 100
```

Este cálculo alimenta el reporte de productividad de técnicos en `workshop-reports.service.ts`. Poner `standardMinutes` en el catálogo `Item` no tiene sentido conceptual para un filtro de aceite.

#### b) 50+ referencias a `operationId` en el backend
LaborTimes, diagnósticos, órdenes de servicio, reportes. Migrar todo a `itemId` sería alto riesgo sin valor funcional.

#### c) `DiagnosisSuggestedOperation`
El técnico sugiere operaciones durante el diagnóstico — puede o no estar en catálogo. Lógica diferente a un ítem de inventario.

---

## 6. ServiceType: ¿Se mantiene o se elimina?

### Conclusión: **Discutible — es una categoría de operaciones**

`ServiceType` es esencialmente una categoría para `WorkshopOperation`. Tiene sentido mantenerlo si:
- El módulo de citas (`appointments`) lo requiere
- Se necesita agrupar operaciones por tipo (ej: mecánica, electricidad, carrocería)

Se podría colapsar en un campo `serviceCategory` dentro de `WorkshopOperation` si se elimina el módulo de citas.

---

## 7. Modelo Final Propuesto (3 capas)

| Entidad | Propósito | Acción |
|---|---|---|
| `Item` | Catálogo de productos físicos (con/sin stock) | Agregar `itemType` + `usedIn` |
| `WorkshopOperation` | Definición de mano de obra (tiempo, costo, métricas) | Mantener sin cambios |
| `ServiceType` | Categoría de operaciones de taller | Mantener por ahora (evaluar al refactorizar citas) |

### Ejemplos de datos con el nuevo modelo

| sku | nombre | itemType | usedIn | useStock |
|-----|--------|----------|--------|----------|
| REP-001 | Filtro de aceite | PRODUCT | BOTH | true |
| REP-002 | Batería 12V | PRODUCT | BOTH | true |
| CON-001 | Aceite 10W30 | PRODUCT | WORKSHOP | true |
| SRV-001 | Diagnóstico por computadora | SERVICE | WORKSHOP | false |

Los servicios de mano de obra (Cambio de aceite, Alineación) siguen como `WorkshopOperation`, **NO** en `Item`.

---

## 8. Integración con el resto del sistema

### Cotizaciones / Órdenes de Servicio
Cuando se elige un ítem `PART` o `CONSUMABLE` en el picker de cotización, filtrar por `usedIn IN (WORKSHOP, BOTH)`.

### Módulo de Ventas
El picker de ventas filtra por `usedIn IN (PARTS, BOTH)` — los ítems `WORKSHOP` puros no aparecen.

### Inventario
Sin cambios — todos los ítems con `useStock=true` siguen siendo gestionados igual.

### `isInternalUse` (deprecación gradual)
Una vez implementados `itemType` y `usedIn`, el campo `isInternalUse` se puede deprecar ejecutando:
```sql
UPDATE items SET "usedIn" = 'WORKSHOP' WHERE "isInternalUse" = true;
```
Luego eliminar el campo en una migración posterior.

---

## 9. Plan de Implementación

### Fase 1 — Schema (bloqueante)
1. Agregar enums `ItemType`, `ItemUse` en `backend/prisma/models/inventory/item.prisma`
2. Agregar campos `itemType` y `usedIn` al modelo `Item`
3. Correr `npm run prisma:migrate`

### Fase 2 — Backend (paralelo con Fase 3)
4. Actualizar `ICreateItem`, `IUpdateItem`, `CreateItemDTO`, `UpdateItemDTO`
5. Agregar validación Joi en `items.validation.ts`
6. Agregar filtro `usedIn` en `findItems()` del servicio

### Fase 3 — Frontend (paralelo con Fase 2)
7. Actualizar `itemZod.ts` e `item.interface.ts`
8. Agregar Dropdowns en `ItemForm.tsx`
9. Filtrar pickers de cotización/OS por `usedIn`

---

## 10. Contexto adicional: Integración Cotización → Inventario

*(Discusión relacionada — plan separado)*

Se identificó también que `registerApproval()` y `convertToServiceOrder()` en `workshopQuotations.service.ts` **NO** crean registros de `ServiceOrderMaterial` ni llaman a `stockService.reserve()`.

**El gap:**
- `WorkshopQuotationItem.referenceId` apunta al ítem de inventario (soft link)
- Al aprobar/convertir, ese vínculo no se usa para reservar stock

Esto se planifica implementar en dos fases:
- **Fase 1** (sin schema change): Auto-crear `ServiceOrderMaterial` al convertir cotización a OS
- **Fase 2** (con schema change): Agregar `warehouseId` a `WorkshopQuotation` y reservar stock al aprobar

---

## 11. Archivos Clave

| Archivo | Relevancia |
|---------|------------|
| `backend/prisma/models/inventory/item.prisma` | Agregar enums + campos |
| `backend/src/features/inventory/items/items.interface.ts` | Tipos TS |
| `backend/src/features/inventory/items/items.dto.ts` | DTOs |
| `backend/src/features/inventory/items/items.validation.ts` | Validación Joi |
| `backend/src/features/inventory/items/items.service.ts` | Filtro `usedIn` |
| `frontend/libs/zods/inventory/itemZod.ts` | Zod schema |
| `frontend/libs/interfaces/inventory/item.interface.ts` | Interfaces TS |
| `frontend/components/inventory/ItemForm.tsx` | Dropdowns nuevos |
| `frontend/components/workshop/quotations/QuotationForm.tsx` | Filtro picker |
| `backend/prisma/models/workshop/workshopOperation.prisma` | Sin cambios |
| `backend/src/features/workshop/workshopQuotations/workshopQuotations.service.ts` | Integración inventario |
