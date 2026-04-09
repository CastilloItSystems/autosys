Análisis del Módulo de Órdenes de Servicio — Problemas, Gaps y Mejoras

Contexto

El módulo de ServiceOrder es el corazón del taller. Conecta recepciones, diagnósticos, materiales, mano de obra, calidad y facturación. Este análisis identifica  
 problemas concretos en el código actual, gaps en el modelo de negocio, y mejoras necesarias para escenarios reales como: cliente con múltiples OTs abiertas que hay que  
 facturar juntas, integración real con inventario, y consistencia de datos financieros.

---

1.  PROBLEMAS CONCRETOS EN EL CÓDIGO ACTUAL  


1.1 calcTotals() ignora descuentos, impuestos y tipo OTHER

Archivo: backend/src/features/workshop/serviceOrders/serviceOrders.service.ts:65-76
El cálculo actual solo hace quantity \* unitPrice y clasifica en LABOR o PART (todo lo que no es LABOR va a partsTotal). Problemas:

- No aplica discountPct (el campo existe en el modelo pero se ignora)
- No calcula taxAmount (el modelo tiene taxType/taxRate/taxAmount pero se ignoran)
- Los items tipo OTHER se suman a partsTotal en vez de otherTotal
- subtotal y taxAmt en ServiceOrder siempre quedan en 0

  1.2 updateServiceOrder() no usa transacción para reemplazar items

Archivo: serviceOrders.service.ts:275-289
Hace deleteMany + createMany sin $transaction. Si createMany falla, los items anteriores ya se borraron → pérdida de datos.

1.3 generateFolio() tiene race condition

Archivo: serviceOrders.service.ts:51-63
findFirst + incremento manual sin lock. Dos requests concurrentes pueden generar el mismo folio.
Solución: usar un raw query con SELECT FOR UPDATE o un campo sequence atómico.

1.4 stockDeducted nunca se usa

Archivo: serviceOrder.prisma:197 — el campo existe pero ningún servicio lo actualiza.
No hay lógica que descuente stock del inventario al consumir materiales.

1.5 PreInvoice tax calculation está mal

Archivo: so-invoice-generator.service.ts:113-114
const lineTax = item.taxType === 'EXEMPT' ? 0 : lineBase \* (Number(item.taxRate || 0.16) / 100)
taxRate ya es 0.16 (porcentaje decimal), pero lo divide entre 100 → calcula 0.16% en vez de 16%. El impuesto queda ~100x más bajo.

1.6 Material service no descuenta stock real del inventario

Archivo: serviceOrderMaterials.service.ts
recordMovement() solo crea un registro en ServiceOrderMaterialMovement.
No hace ningún ajuste en la tabla Stock del inventario (no llama a inventory services).
Los materiales se "consumen" conceptualmente pero el inventario físico nunca se actualiza.

1.7 El servicio de materiales no propaga createdBy del usuario real

Archivo: serviceOrderMaterials.service.ts:115 — hardcodea createdBy: 'system'

---

2.  GAPS EN EL MODELO DE NEGOCIO

2.1 No existe facturación consolidada por cliente

Escenario: Un cliente tiene 3 OTs abiertas (READY/DELIVERED). Quiere pagar todo junto en una sola factura.
Actualmente: Cada SO genera su propia PreInvoice (1:1). No hay forma de:

- Agrupar múltiples SOs en una sola PreInvoice
- Crear una factura consolidada que cubra varias OTs
- Ver el saldo pendiente total de un cliente por OTs abiertas
  Propuesta: Agregar un modelo ConsolidatedPreInvoice o permitir que PreInvoice tenga relación M:N con ServiceOrders en vez de 1:1. Alternativamente, agregar un campo
  groupId o consolidationId para agrupar PreInvoices en una sola factura.

  2.2 No hay flujo de aprobación de presupuesto por el cliente

El modelo tiene PENDING_APPROVAL pero:

- No hay un modelo de "Presupuesto de Taller" separado de la cotización CRM
- El ServiceOrderAdditional tiene flujo PROPOSED→APPROVED pero no genera un documento formal
- No hay forma de enviar un presupuesto al cliente (email/WhatsApp/PDF) y registrar su respuesta
- Los "adicionales aprobados" no se suman automáticamente a los items de la SO

  2.3 No hay integración real Item ↔ ServiceOrderItem

ServiceOrderItem tiene itemId (FK a Item de inventario) pero:

- Al crear una SO, los items se crean con description libre (texto), no se vincula al catálogo
- No se valida disponibilidad de stock al agregar un PART
- No se reserva stock al aprobar la OT
- No se descuenta stock al consumir/completar
- El precio del item no se toma del catálogo (Pricing) — se ingresa manualmente

  2.4 Falta flujo de Materiales → Items de la SO

ServiceOrderMaterial y ServiceOrderItem son entidades separadas sin relación directa.

- Los materiales consumidos no se reflejan como líneas de la SO para facturación
- Podrías consumir 10 filtros de aceite en materiales pero facturar 5 en items
- No hay reconciliación entre lo consumido y lo facturado

  2.5 No hay control de costos vs precios

ServiceOrderItem tiene unitPrice (precio al cliente) pero NO tiene unitCost.
ServiceOrderMaterial tiene unitCost y unitPrice.
→ No puedes calcular el margen de la OT (ganancia = precio - costo).
→ No hay alertas si se vende por debajo del costo.

2.6 No hay asignación de técnico a nivel de item

ServiceOrderItem tiene status (PENDING→ASSIGNED→IN_PROGRESS...) pero no tiene technicianId.
LaborTime sí tiene userId, pero un item puede no tener tiempos registrados aún.
→ No puedes ver el tablero "¿qué tiene asignado cada técnico?" directamente desde items.

---

3.  MEJORAS RECOMENDADAS (PRIORIZADAS)

Prioridad ALTA (afectan integridad de datos / facturación)

┌─────┬───────────────────────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────┐
│ # │ Mejora │ Archivos afectados │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ A1 │ Corregir calcTotals(): incluir discountPct, taxAmount, otherTotal, subtotal, taxAmt │ serviceOrders.service.ts │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ A2 │ Corregir tax en PreInvoice: taxRate ya es decimal, no dividir /100 │ so-invoice-generator.service.ts:113 │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ A3 │ Transacción en updateServiceOrder: wrap deleteMany+createMany en $transaction │ serviceOrders.service.ts:275-289 │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ A4 │ Fix race condition en generateFolio(): usar raw SQL con lock o sequence │ serviceOrders.service.ts:51-63 │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤
│ A5 │ Integrar inventario real: al consumir material → descontar Stock, al devolver → reponerlo │ serviceOrderMaterials.service.ts + inventory services │
└─────┴───────────────────────────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────┘

Prioridad MEDIA (funcionalidad de negocio clave)

┌─────┬───────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────┐
│ # │ Mejora │ Descripción │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ M1 │ Facturación consolidada: endpoint para agrupar SOs de un cliente en una sola PreInvoice │ Nuevo endpoint + modificar PreInvoice para soportar │
│ │ │ M:N │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ M2 │ Vincular items al catálogo: al agregar un PART, buscar en Item, tomar precio, validar stock │ serviceOrders.service.ts, ServiceOrderForm.tsx │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ M3 │ Sincronizar materiales consumidos → items facturables: auto-agregar items de tipo PART desde │ Nuevo servicio de sincronización │
│ │ materiales CONSUMED │ │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ M4 │ Agregar unitCost a ServiceOrderItem: para calcular margen por OT │ serviceOrder.prisma, DTOs, service │
├─────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ M5 │ Presupuesto formal de taller: modelo + PDF/envío al cliente + aprobación digital │ Nuevo módulo │
└─────┴───────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────┘

Prioridad BAJA (mejoras operativas)

┌─────┬──────────────────────────────────────┬──────────────────────────────────────────────────────────────────────┐
│ # │ Mejora │ Descripción │
├─────┼──────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ B1 │ technicianId en ServiceOrderItem │ Para tablero de asignaciones │
├─────┼──────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ B2 │ Vista de saldo pendiente por cliente │ Query que sume totales de SOs en estado READY/DELIVERED sin facturar │
├─────┼──────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ B3 │ Alertas de SOs estancadas │ OTs en WAITING_PARTS > X días, PAUSED > Y días │
├─────┼──────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ B4 │ Fix createdBy hardcoded en materials │ Pasar userId real │
└─────┴──────────────────────────────────────┴──────────────────────────────────────────────────────────────────────┘

---

4.  ESCENARIO: CLIENTE CON VARIAS OTs → FACTURACIÓN UNIFICADA

Estado actual

Cliente "Juan Pérez" tiene:
SO-0045 (DELIVERED) — Cambio de aceite → $150
SO-0048 (READY) — Frenos delanteros → $800
SO-0051 (DELIVERED) — Alineación → $200

Hoy NO puedes generar una sola factura por $1,150.
Tienes que generar 3 PreInvoices separadas → 3 facturas.

Propuesta de implementación

Opción A — PreInvoice consolidada (recomendada):

1.  Nuevo endpoint: POST /api/workshop/service-orders/consolidated-invoice
    Body: { customerIds: string, serviceOrderIds: string[] }
2.  Valida que todas las SOs sean del mismo cliente y estén en READY/DELIVERED
3.  Genera UNA PreInvoice sumando todos los items de todas las SOs
4.  Agrega campo serviceOrderIds[] (JSON) en PreInvoice o tabla pivot PreInvoiceServiceOrder
5.  Al facturar, todas las SOs pasan a INVOICED

Opción B — Factura que agrupa PreInvoices:

1.  Cada SO genera su PreInvoice normal
2.  Nuevo endpoint: POST /api/sales/invoices/from-pre-invoices
    Body: { preInvoiceIds: string[] }
3.  Genera UNA Invoice consolidada
    Más simple pero no reduce el paso de prefactura

---

5.  ESCENARIO: INTEGRACIÓN CON INVENTARIO

Estado actual

ServiceOrderItem (PART) tiene itemId → Item del inventario
ServiceOrderMaterial tiene itemId → Item del inventario
PERO: ninguno consulta Stock, reserva o descuenta cantidades.

Flujo ideal propuesto

1.  Técnico solicita material → ServiceOrderMaterial (REQUESTED)
2.  Almacén verifica disponibilidad → consulta Stock(itemId, warehouseId)
3.  Almacén reserva → Stock.quantityReserved += qty, Material→RESERVED
4.  Almacén despacha → Stock.quantityAvailable -= qty, Material→DISPATCHED
5.  Técnico consume → Material→CONSUMED, ServiceOrderItem se crea/actualiza
6.  Si sobra → Material→RETURNED, Stock.quantityAvailable += returnedQty
7.  Al facturar → se facturan los items CONSUMED, stockDeducted=true

Archivos a modificar

- serviceOrderMaterials.service.ts — agregar llamadas a inventory Stock service
- backend/src/features/inventory/stock/ — exponer funciones reserve/release/deduct
- serviceOrders.service.ts — en status transition a INVOICED, verificar materiales reconciliados

---

6.  VERIFICACIÓN

Para bugs (A1-A5):

- Crear una SO con items que tengan discountPct > 0 y verificar que subtotal/taxAmt/total se calculen bien
- Crear 2 SOs concurrentes y verificar folios únicos
- Generar PreInvoice y verificar que el IVA sea 16% (no 0.16%)
- Hacer update de items y verificar que no se pierdan si createMany falla

Para facturación consolidada (M1):

- Crear 3 SOs del mismo cliente en DELIVERED
- Llamar al nuevo endpoint consolidado
- Verificar que se genere una sola PreInvoice con todos los items
- Verificar que las 3 SOs pasen a INVOICED al facturar

Para inventario (A5):

- Crear material con itemId válido
- Cambiar status a RESERVED → verificar que Stock.quantityReserved aumente
- Cambiar a DISPATCHED → verificar Stock.quantityAvailable disminuya
- RETURN → verificar que stock se reponga
