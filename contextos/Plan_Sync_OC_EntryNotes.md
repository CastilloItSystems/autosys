# Plan: Sincronización de Órdenes de Compra desde Notas de Entrada

**AutoSys — Sistema de Inventario**
Prioridad: Media-Alta | Tipo: Inconsistencia de datos
Fecha: Marzo 2026

---

## 1. Problema Identificado

Actualmente existen dos flujos para recibir mercancía vinculada a una Orden de Compra:

| Flujo | Método | ¿Actualiza la OC? |
|-------|--------|-------------------|
| Recepción desde la OC | `purchaseOrderService.receiveOrder()` | ✅ Sí — actualiza `quantityReceived`, `quantityPending`, status |
| Nota de Entrada manual con `purchaseOrderId` | `entryNoteService.completeEntryNote()` | ❌ No — solo actualiza Stock y crea Movements |

### Consecuencias

- La OC queda con cantidades pendientes que en realidad ya se recibieron
- Se podría recepcionar el doble de lo pedido (una vez por cada flujo)
- Los reportes de OC pendientes muestran datos incorrectos
- El status de la OC nunca cambia a `PARTIAL` o `COMPLETED` por esta vía

---

## 2. Solución: Función Compartida `syncPurchaseOrderQuantities`

Extraer la lógica de actualización de OC a una función pura reutilizable.

### 2.1 Firma de la función

```typescript
// backend/src/features/inventory/shared/utils/syncPurchaseOrderQuantities.ts

interface SyncItem {
  itemId: string
  quantityReceived: number
}

interface SyncResult {
  updatedItems: number
  newStatus: PurchaseOrderStatus
}

async function syncPurchaseOrderQuantities(
  purchaseOrderId: string,
  receivedItems: SyncItem[],
  tx: PrismaTransactionClient
): Promise<SyncResult>
```

### 2.2 Lógica interna

1. Obtener todos los `PurchaseOrderItem` de la OC
2. Para cada item recibido:
   - Buscar el `PurchaseOrderItem` correspondiente por `itemId`
   - Sumar `quantityReceived` al valor actual
   - Recalcular `quantityPending = quantityOrdered - quantityReceived`
   - Validar que `quantityReceived` no exceda `quantityOrdered`
3. Determinar el nuevo status de la OC:
   - Si TODOS los items tienen `quantityPending <= 0` → `COMPLETED`
   - Si ALGÚN item tiene `quantityReceived > 0` → `PARTIAL`
   - Si no → mantener status actual
4. Actualizar el status de la OC

### 2.3 Dónde se llama

| Lugar | Cuándo |
|-------|--------|
| `purchaseOrders.service.ts` → `receiveOrder()` | Refactorizar para usar `syncPurchaseOrderQuantities` en vez de la lógica inline actual |
| `entryNotes.service.ts` → `completeEntryNote()` | Agregar llamada cuando `entryNote.purchaseOrderId` existe |

---

## 3. Archivos a Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `shared/utils/syncPurchaseOrderQuantities.ts` | **Crear** | Función pura compartida |
| `purchaseOrders.service.ts` → `receiveOrder()` | Refactorizar | Reemplazar lógica inline por llamada a `syncPurchaseOrderQuantities` |
| `entryNotes.service.ts` → `completeEntryNote()` | Modificar | Agregar llamada a `syncPurchaseOrderQuantities` dentro de la transacción existente |

---

## 4. Implementación Detallada

### Paso 1: Crear `syncPurchaseOrderQuantities.ts`

```typescript
import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'

type TxClient = Prisma.TransactionClient

interface SyncItem {
  itemId: string
  quantityReceived: number
}

export async function syncPurchaseOrderQuantities(
  purchaseOrderId: string,
  receivedItems: SyncItem[],
  tx: TxClient
): Promise<{ newStatus: string }> {
  // 1. Get all PO items
  const poItems = await tx.purchaseOrderItem.findMany({
    where: { purchaseOrderId },
  })

  // 2. Update each received item
  for (const received of receivedItems) {
    const poItem = poItems.find((i) => i.itemId === received.itemId)
    if (!poItem) continue // Item not in this PO, skip

    const newReceived = poItem.quantityReceived + received.quantityReceived
    const newPending = Math.max(0, poItem.quantityOrdered - newReceived)

    if (newReceived > poItem.quantityOrdered) {
      throw new BadRequestError(
        `Cantidad total recibida (${newReceived}) excede la ordenada (${poItem.quantityOrdered}) para item ${received.itemId}`
      )
    }

    await tx.purchaseOrderItem.update({
      where: { id: poItem.id },
      data: {
        quantityReceived: newReceived,
        quantityPending: newPending,
      },
    })
  }

  // 3. Determine new PO status
  const updatedItems = await tx.purchaseOrderItem.findMany({
    where: { purchaseOrderId },
  })

  const allReceived = updatedItems.every((i) => i.quantityPending <= 0)
  const someReceived = updatedItems.some((i) => i.quantityReceived > 0)

  const newStatus = allReceived
    ? 'COMPLETED'
    : someReceived
      ? 'PARTIAL'
      : 'SENT' // fallback

  // 4. Update PO status
  await tx.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: newStatus },
  })

  return { newStatus }
}
```

### Paso 2: Refactorizar `receiveOrder` en `purchaseOrders.service.ts`

Reemplazar las líneas 816-907 (donde actualiza PurchaseOrderItem quantities y determina nuevo status) por:

```typescript
import { syncPurchaseOrderQuantities } from '../shared/utils/syncPurchaseOrderQuantities.js'

// Dentro de la transacción de receiveOrder:
await syncPurchaseOrderQuantities(
  poId,
  data.items.map((i) => ({
    itemId: i.itemId,
    quantityReceived: i.quantityReceived,
  })),
  tx
)
```

### Paso 3: Agregar a `completeEntryNote` en `entryNotes.service.ts`

Dentro de la transacción existente de `completeEntryNote`, después de crear los Movements y antes del return:

```typescript
import { syncPurchaseOrderQuantities } from '../shared/utils/syncPurchaseOrderQuantities.js'

// Dentro de la transacción de completeEntryNote:
if (entryNote.purchaseOrderId) {
  await syncPurchaseOrderQuantities(
    entryNote.purchaseOrderId,
    entryNote.items.map((i) => ({
      itemId: i.itemId,
      quantityReceived: i.quantityReceived,
    })),
    tx
  )

  logger.info('Orden de compra sincronizada desde nota de entrada', {
    purchaseOrderId: entryNote.purchaseOrderId,
    entryNoteId: id,
  })
}
```

---

## 5. Validaciones de Seguridad

- **No exceder cantidad ordenada:** `syncPurchaseOrderQuantities` valida que `quantityReceived` total no supere `quantityOrdered`. Si se intenta, lanza `BadRequestError` y la transacción hace rollback completo.
- **Idempotencia:** La función SUMA al `quantityReceived` existente, no lo reemplaza. Si se llama dos veces con los mismos datos, duplicará la cantidad — esto es correcto porque cada llamada representa una recepción diferente.
- **Solo en transacción:** La función requiere un `tx` (transaction client), nunca se llama fuera de una transacción.

---

## 6. Plan de Verificación

### Test Manual
1. Crear una OC con 2 items (10 unidades cada uno), aprobarla (DRAFT → SENT)
2. Crear una Nota de Entrada manual tipo PURCHASE vinculada a esa OC
3. Agregar los 2 items con 5 unidades cada uno
4. Completar la nota de entrada
5. Verificar que la OC cambió a status `PARTIAL`
6. Verificar que los PurchaseOrderItems muestran `quantityReceived: 5`, `quantityPending: 5`
7. Crear otra nota de entrada con las 5 unidades restantes
8. Completar → verificar que la OC cambió a `COMPLETED`

### Casos Borde
- Completar nota de entrada sin `purchaseOrderId` → no debe tocar ninguna OC
- Intentar recibir más de lo pendiente → debe fallar con error claro
- OC ya `COMPLETED` → la nota de entrada no debería poder crearse (ya está validado en `createEntryNote`)
- Recepcionar parcialmente desde la OC y luego completar con nota de entrada → cantidades deben sumar correctamente

---

## 7. Notas

- Esta función también servirá en el futuro si se agregan otros flujos de recepción (ej: recepción por código de barras, app móvil, etc.)
- Considerar agregar un log/audit trail que registre qué nota de entrada actualizó qué OC
- El `receiveOrder` actual del `purchaseOrders.service.ts` ya crea la EntryNote internamente — al refactorizar, asegurarse de no crear una doble actualización (la EntryNote creada por `receiveOrder` NO debe triggerear `completeEntryNote` → `syncPurchaseOrderQuantities` porque `receiveOrder` ya llama directamente a `sync`)
