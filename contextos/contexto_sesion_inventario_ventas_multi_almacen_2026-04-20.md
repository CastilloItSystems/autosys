# Contexto de Sesion - Inventario y Ventas Multi-Almacen

Fecha: 20 de abril de 2026

## Resumen ejecutivo
- Se priorizo estabilidad y consistencia operativa en inventario/ventas.
- Se endurecio el control de stock para evitar reservas/salidas invalidas por almacen.
- Se incorporo el flujo de faltantes multi-almacen con transferencias sugeridas reutilizando el modulo `transfers`.
- El control de faltantes ya no queda solo en pago: ahora tambien se controla desde la aprobacion de la orden de venta.

## 1) Carga masiva de stock (hardening por timeouts de transaccion)
- Problema observado: errores masivos `Transaction API error: Unable to start a transaction in the given time`.
- Ajuste aplicado:
- Backend: procesamiento por lotes con concurrencia controlada en lugar de `Promise.allSettled` masivo.
- Backend: opciones explicitas de transaccion (`maxWait`/`timeout`) para mayor tolerancia.
- Frontend: reduccion de `CHUNK_SIZE` para envios mas estables y predecibles.
- Resultado esperado:
- Menor pico de presion sobre Prisma/DB.
- Menor probabilidad de timeout al iniciar transacciones.

## 2) Super buscador en Stock (similar a Items)
- Se agrego busqueda server-side con `search` en stock.
- Cobertura de campos de busqueda:
- `item.sku`, `item.name`, `item.code`, `item.identity`
- `warehouse.name`, `warehouse.code`
- `stock.location`
- La busqueda se combina con filtros existentes:
- `warehouseId`
- `lowStock` / `outOfStock`
- paginacion/vistas actuales
- En frontend se mantiene UX de progreso/filtros y se integra debounce para reducir solicitudes.

## 3) Exit Notes: reservas sin existencia (correccion atomica)
- Problema: se detectaron reservas creadas aun cuando no habia stock real en el almacen indicado.
- Endurecimiento aplicado:
- Reserva/validacion atomica dentro de transaccion.
- Bloqueo de transicion a `IN_PROGRESS` cuando no hay cobertura suficiente.
- Revalidaciones en `create`, `update`, `startPreparing`, `cancel`, `deliver`.
- Guards para evitar underflow/valores negativos en reservados/disponibles.
- Manejo consistente para casos `WORKSHOP_SUPPLY` en rutas donde no corresponde tocar reserva.
- Resultado esperado:
- No se crean reservas inconsistentes por almacen/item.
- Si falta stock, el flujo se bloquea con error de negocio claro.

## 4) Mensajeria de error de stock insuficiente (legible para usuario)
- Se mejoro el mensaje para negocio usando:
- Codigo y nombre del articulo.
- Codigo y nombre de almacen.
- Cantidad requerida vs disponible.
- Se elimino ruido tecnico para usuario final (IDs internos en detalle visual).
- El frontend ya limpia detalles tecnicos con `stripTechnicalDetails` en `frontend/utils/errorHandlers.ts`.

## 5) Ubicacion en Exit Notes auto-generadas desde pago de pre-factura
- Problema: `exitNoteItem.pickedFromLocation` quedaba en `null` para salidas `SALE` auto-generadas.
- Ajuste:
- En flujo de pago completo, se resuelve `stock.location` por `itemId + warehouseId`.
- Se persiste `pickedFromLocation` al crear `exitNoteItem`.
- Si no hay ubicacion, no se bloquea facturacion (queda `null`).
- Alcance:
- Solo nuevas salidas; sin backfill historico.

## 6) Ventas multi-almacen con transferencias sugeridas (base operacional)
- Se adopto politica de consolidacion:
- La venta sale desde un almacen de venta.
- Si falta stock en ese almacen, se bloquea el avance y se sugieren transferencias.
- Cambios estructurales:
- `Warehouse.isSalesDefault` para definir almacen de venta por empresa.
- `Transfer.preInvoiceId` para trazabilidad de transferencias sugeridas por pre-factura.
- Endpoints de pre-factura para:
- diagnostico de faltantes
- creacion de borradores de transferencias sugeridas
- Reuso directo de `transfers.service.create` para generar `DRAFT` (1..N) por origen.

## 7) Control de faltantes movido tambien a Orden de Venta
- Decision funcional: controlar desde orden (no esperar hasta pagar factura).
- Implementado en `orders`:
- Hard gate en `approve` con error estructurado `SALES_STOCK_SHORTAGE` y `scope: ORDER`.
- Diagnostico de faltantes por orden.
- Generacion de transferencias sugeridas desde orden (reuso de `transfers`).
- Si hay faltante, se bloquea aprobacion de orden y se muestra detalle.
- Se fuerza almacen de venta al generar pre-factura (`salesWarehouse.id`), no el almacen original sin validar.

## 8) Frontend en Ordenes de Venta (UX de bloqueo + CTA)
- En `OrderList`:
- Se parsea el payload estructurado `SALES_STOCK_SHORTAGE`.
- Se muestra modal con:
- almacen de venta
- faltante por item
- origenes sugeridos
- Boton para `Generar transferencias sugeridas`.
- Tras crear borradores, se redirige a transferencias para continuar operacion.

## Endpoints relevantes activos
- `GET /api/sales/pre-invoices/:id/sales-stock-diagnosis`
- `POST /api/sales/pre-invoices/:id/suggested-transfers`
- `GET /api/sales/orders/:id/sales-stock-diagnosis`
- `POST /api/sales/orders/:id/suggested-transfers`
- `PATCH /api/sales/orders/:id/approve` (con gate de faltantes)

## Validaciones ejecutadas
- `backend`: `npm run build` OK.
- `frontend`: `npm run build` OK.
- Nota de pruebas:
- `backend/src/features/sales/orders/orders.test.ts` esta vacio (Jest falla por suite sin tests), no por error de compilacion funcional.

## Estado actual y pendientes recomendados
- Estado actual:
- Flujo multi-almacen ya bloquea y orienta transferencias desde orden y pago.
- Trazabilidad con `preInvoiceId` ya integrada en transferencias sugeridas de pre-factura.
- Pendientes recomendados:
- Agregar tests de ordenes para casos `SALES_STOCK_SHORTAGE`.
- Agregar pruebas de sugerencias multi-origen (1..N DRAFTs).
- Validar en QA E2E con 4 almacenes y ciclo completo hasta `RECEIVED`.

