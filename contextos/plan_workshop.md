---

Plan: Módulo de Taller — Gap Analysis y Roadmap

Estado actual vs documento funcional

Lo que YA existe en Prisma

┌──────────────────┬─────────────────────────────────────────────────────────────────────┐  
 │ Modelo │ Cubre │
├──────────────────┼─────────────────────────────────────────────────────────────────────┤  
 │ ServiceOrder │ OT básica (MVP): cliente, vehículo, técnico, estado simple, totales │
├──────────────────┼─────────────────────────────────────────────────────────────────────┤
│ ServiceOrderItem │ Ítems de OT: LABOR / PART / OTHER, cantidad, precio │  
 ├──────────────────┼─────────────────────────────────────────────────────────────────────┤  
 │ Customer │ Cliente con relación a serviceOrders │  
 ├──────────────────┼─────────────────────────────────────────────────────────────────────┤  
 │ CustomerVehicle │ Vehículo del cliente con relación a serviceOrders │
├──────────────────┼─────────────────────────────────────────────────────────────────────┤  
 │ Lead │ Lead con serviceOrderId comentado (pendiente) │
├──────────────────┼─────────────────────────────────────────────────────────────────────┤  
 │ Quote (CRM) │ Cotización genérica, tipo SERVICE incluido │
└──────────────────┴─────────────────────────────────────────────────────────────────────┘

---

Brechas críticas — Lo que FALTA en Prisma

Fase 1 — Núcleo operativo

1. ServiceAppointment — Agenda y citas (no existe)

- Cita programada antes de recibir el vehículo
- Estados: SCHEDULED → CONFIRMED → ARRIVED → CANCELLED → NO_SHOW
- Datos: cliente, vehículo, fecha/hora, tipo servicio, asesor, motivo, observaciones
- Relación con ServiceOrder (1:1 cuando se concreta)  


2. VehicleReception — Recepción formal (no existe)

- Registro de ingreso con checklist e inspección visual
- Datos: kilometraje, nivel combustible, accesorios, daños pre-existentes, fotos, firma autorización
- Genera la OT o se vincula a una existente  


3. ServiceOrder necesita mejoras

- Faltan estados del documento: DRAFT → OPEN → DIAGNOSING → PENDING_APPROVAL → APPROVED → IN_PROGRESS → PAUSED → WAITING_PARTS → WAITING_AUTH → QUALITY_CHECK → READY →
  DELIVERED → INVOICED → CLOSED → CANCELLED
- Falta: priority, appointmentId, receptionId, workshopQuoteId, bayId, serviceTypeId
- Lead.serviceOrderId FK aún comentado — hay que activarlo  


4. ServiceOrderPart con link a inventario (ServiceOrderItem.PART no tiene FK a Item)

- Vincular consumo de repuestos a Item y Stock
- Registrar cantidad solicitada, despachada, devuelta  


---

Fase 2 — Control operativo

5. LaborTime — Mano de obra y tiempos (no existe)

- Control de reloj por técnico y por operación de OT
- Datos: OT, operación, técnico, inicio, fin, pausas, horas reales vs estándar
- Regla: un técnico no puede tener dos registros activos simultáneos  


6. WorkshopBay — Bahías/estaciones de trabajo (no existe)

- Catálogo de bahías con disponibilidad
- Relación N:N temporal con OT (asignación por turno)  


7. QualityCheck — Control de calidad (no existe)

- Checklist de cierre antes de entrega
- Estado: PENDING → PASSED → FAILED
- Si falla → genera retrabajo  


8. WorkshopWarranty — Garantías y retrabajos (no existe)

- Vinculada a OT origen
- Tipos: mano de obra, repuesto, mixta, comercial
- Genera nueva OT de retrabajo con costo interno  


9. Link ServiceOrder → Invoice (no existe)

- ServiceOrder facturada debe vincularse al Invoice del módulo de ventas  


---

Fase 3 — Catálogos y configuración

10. ServiceType — Tipos de servicio (no existe)

- Catálogo: mantenimiento preventivo, correctivo, diagnóstico, servicio rápido, etc.
- Con tiempo estándar, precio estándar de mano de obra

11. WorkshopOperation — Operaciones estándar (no existe)

- Operaciones con tiempo estándar, precio lista
- Base para cotizar y para control de tiempos  


---

Roadmap de implementación

Fase 1 — Núcleo operativo (MVP robusto)

1. Mejorar ServiceOrder.prisma:


    - Nuevo enum de estados completo
    - Agregar campos: priority, appointmentId?, receptionId?, bayId?, serviceTypeId?
    - Activar Lead.serviceOrderId FK

2. Crear ServiceAppointment.prisma
3. Crear VehicleReception.prisma (con campos de checklist e inspección)
4. Crear ServiceType.prisma (catálogo básico)
5. Vincular ServiceOrderItem.PART → itemId (FK a Item) + campo stockDeducted  


Fase 2 — Control operativo

6. Crear LaborTime.prisma (control de reloj por técnico)
7. Crear WorkshopBay.prisma (bahías)
8. Crear QualityCheck.prisma
9. Crear WorkshopWarranty.prisma
10. Agregar FK ServiceOrder → invoiceId?  


Fase 3 — Catálogos y operaciones

11. Crear WorkshopOperation.prisma (operaciones estándar con tiempos)
12. Mejorar Quote.prisma para workshop: link serviceOrderId cuando se convierte

---

Resumen de nuevos modelos necesarios

┌──────────────────────────────┬──────┬───────────┐
│ Modelo │ Fase │ Prioridad │  
 ├──────────────────────────────┼──────┼───────────┤  
 │ ServiceAppointment │ 1 │ Alta │
├──────────────────────────────┼──────┼───────────┤
│ VehicleReception │ 1 │ Alta │  
 ├──────────────────────────────┼──────┼───────────┤
│ Mejoras ServiceOrder │ 1 │ Alta │  
 ├──────────────────────────────┼──────┼───────────┤  
 │ ServiceType │ 1 │ Media │
├──────────────────────────────┼──────┼───────────┤  
 │ ServiceOrderItem → FK itemId │ 1 │ Alta │
├──────────────────────────────┼──────┼───────────┤  
 │ LaborTime │ 2 │ Alta │  
 ├──────────────────────────────┼──────┼───────────┤  
 │ WorkshopBay │ 2 │ Media │  
 ├──────────────────────────────┼──────┼───────────┤
│ QualityCheck │ 2 │ Media │
├──────────────────────────────┼──────┼───────────┤
│ WorkshopWarranty │ 2 │ Media │
├──────────────────────────────┼──────┼───────────┤  
 │ WorkshopOperation │ 3 │ Media │
└──────────────────────────────┴──────┴───────────┘

---

¿Quieres que empiece a escribir los modelos Prisma? ¿Por cuál Fase arrancamos?
