# Plan de Implementación — Módulo de Concesionario

**AutoSys — Canal Vehículos**
Prioridad: Alta | Fecha: Abril 2026

---

## 1. Contexto

El repositorio ya cuenta con capacidades parciales que sirven de base para el módulo de concesionario:

- CRM con canal `VEHICULOS`
- leads, oportunidades, actividades, cotizaciones y clientes
- `CustomerVehicle` como entidad compartida
- catálogo visual de concesionario en `frontend/app/empresa/concesionario/page.tsx`
- módulos de ventas (`sales`) para órdenes, pre-facturas, facturas y pagos
- catálogos de inventario para marcas, modelos y compatibilidades

Lo que falta es el **módulo operacional de negocio del concesionario**, que conecte esas piezas en un flujo único:

```text
Lead → Oportunidad → Cotización → Reserva → Financiamiento/Pago → Facturación → Entrega → Postventa inicial
```

---

## 2. Objetivo del plan

Construir el módulo de concesionario de vehículos de AutoSys, alineado con el PRD en `Documento_Funcional_Concesionario_v1.md`, sin duplicar funcionalidades ya resueltas en CRM, inventario o ventas, sino orquestándolas bajo una experiencia de negocio única.

---

## 3. Decisiones arquitectónicas

| Decisión | Enfoque |
|---|---|
| Canal comercial | Reutilizar CRM `VEHICULOS` como origen de leads, oportunidades y actividades |
| Catálogo de unidades | Crear una capa de “unidad comercial” específica del concesionario; no depender solo del catálogo genérico visual actual |
| Cotización | Reutilizar `crm/quotes` cuando sea posible, extendiendo comportamiento para `QuoteType = VEHICLE` |
| Reserva | Implementar submódulo nuevo propio; no existe hoy una reserva comercial de unidad |
| Facturación | Integrar con `sales/orders`, `preInvoices`, `invoices`, `payments`; no reinventar el flujo fiscal |
| Retoma / usado | Implementar submódulo nuevo apoyado en `CustomerVehicle` para historial y relación con cliente |
| Entrega | Crear flujo comercial de entrega distinto al de taller |
| Frontend | Mantener `/empresa/concesionario` como entrada visual, pero evolucionarlo a módulo operativo |
| Estado de unidad | Separar estado comercial de la unidad respecto a datos de modelo o catálogo |

---

## 4. Entidades nuevas o extendidas

### 4.1. Nuevas entidades funcionales

- `DealerUnit` o equivalente
- `DealerReservation`
- `DealerTestDrive`
- `DealerTradeIn`
- `DealerDeal` / negocio comercial
- `DealerDocumentChecklist`
- `DealerDelivery`
- `DealerApproval`
- `DealerFinancingRequest`

### 4.2. Entidades existentes a reutilizar

- `Lead`
- `Opportunity`
- `Activity`
- `Quote`
- `Customer`
- `CustomerVehicle`
- `Order`
- `PreInvoice`
- `Invoice`
- `Payment`
- Catálogos de `Brand` y `Model`

### 4.3. Extensiones probables

- `Quote` para trazabilidad más fuerte del caso `VEHICLE`
- `CustomerVehicle` para marcar origen en concesionario, retoma o unidad entregada
- `Order` para vincular negocio comercial y unidad específica

---

## 5. Fases de implementación

## Fase 0 — Base documental, schema y contratos

Prioridad: Máxima

Entregables:

- Definición final de entidades Prisma del módulo
- Mapa de relaciones con CRM, inventario y ventas
- Enumeraciones de estados comerciales
- Convenciones de permisos y rutas
- Documento técnico inicial del módulo

Tareas:

- Crear modelos Prisma del módulo de concesionario
- Definir enums de estados:
  - unidad comercial
  - reserva
  - prueba de manejo
  - retoma
  - negocio
  - entrega
  - financiamiento
- Definir claves de integración con `customer`, `lead`, `opportunity`, `quote`, `order`, `invoice`
- Definir permisos base del módulo

Resultado:

Una base de datos y un vocabulario técnico consistente antes de empezar UI o servicios.

---

## Fase 1 — Catálogo comercial de unidades

Prioridad: Muy alta

Objetivo:

Pasar de un catálogo visual tipo demo a un catálogo comercial real de unidades disponibles.

Entregables:

- CRUD de unidades comerciales
- estados comerciales de unidad
- ficha de unidad
- filtros por marca, modelo, año, condición, ubicación y disponibilidad
- bloqueo comercial por reserva o facturación

Backend:

- feature `dealer/units`
- endpoints CRUD + filtros + cambio de estado
- validación de unicidad por VIN/chasis

Frontend:

- página `/empresa/concesionario/units`
- lista de unidades
- formulario de unidad
- vista detalle de unidad
- mejorar `/empresa/concesionario/page.tsx` para consumir datos reales

Dependencias:

- marcas/modelos de inventario

---

## Fase 2 — Pipeline comercial de vehículos

Prioridad: Muy alta

Objetivo:

Conectar leads y oportunidades con el módulo de concesionario sin duplicar CRM.

Entregables:

- filtros y vistas del canal `VEHICULOS`
- oportunidad vinculada a unidad o modelo de interés
- agenda comercial integrada
- tablero operativo de pipeline de concesionario

Backend:

- ajustes en consultas CRM para vistas especializadas de vehículos
- servicios de agregación concesionario ↔ CRM

Frontend:

- dashboard de oportunidades de vehículos
- lista especializada de oportunidades de vehículos
- acciones rápidas: cotizar, programar prueba, reservar, perder, cerrar

Dependencias:

- leads/opportunities/activities existentes

---

## Fase 3 — Cotización y propuesta comercial

Prioridad: Alta

Objetivo:

Formalizar la propuesta comercial de una unidad específica o modelo.

Entregables:

- cotización de vehículo
- versiones y vigencia
- accesorios y descuentos
- integración con retoma y financiamiento estimado

Backend:

- extender `crm/quotes` o crear `dealer/quotations` si la complejidad lo exige
- validación para `QuoteType = VEHICLE`
- vínculo entre cotización, oportunidad y unidad

Frontend:

- cotizador comercial de vehículo
- historial de versiones
- generación desde catálogo u oportunidad

Decisión recomendada:

Empezar reutilizando `crm/quotes` y solo separar submódulo si aparecen fricciones fuertes.

---

## Fase 4 — Reserva de unidad

Prioridad: Alta

Objetivo:

Controlar apartados reales de unidades para evitar sobreventa o conflictos comerciales.

Entregables:

- creación de reserva
- anticipo
- vencimiento
- renovación
- cancelación
- liberación de unidad

Backend:

- feature `dealer/reservations`
- validación de una sola reserva activa por unidad
- transición automática de estado de unidad

Frontend:

- lista de reservas
- formulario de reserva
- alertas de vencimiento
- acciones de renovar, convertir o cancelar

---

## Fase 5 — Prueba de manejo

Prioridad: Media-alta

Objetivo:

Registrar la ejecución de pruebas de manejo y su impacto comercial.

Entregables:

- programación de prueba
- validación documental mínima
- cierre con resultado
- vínculo al pipeline

Backend:

- feature `dealer/test-drives`

Frontend:

- agenda/lista de pruebas de manejo
- formulario de programación y cierre

---

## Fase 6 — Retoma y avalúo de usados

Prioridad: Media-alta

Objetivo:

Incorporar el vehículo usado como parte de pago de manera controlada.

Entregables:

- solicitud de retoma
- avalúo
- aprobación/rechazo
- integración con cotización y negocio

Backend:

- feature `dealer/trade-ins`
- soporte de fotos, observaciones, valor estimado y valor aprobado

Frontend:

- lista y formulario de avalúos
- detalle de retoma

Dependencias:

- `CustomerVehicle`

---

## Fase 7 — Negociación, aprobaciones y expediente documental

Prioridad: Alta

Objetivo:

Controlar excepciones comerciales y documentación obligatoria antes de facturar o entregar.

Entregables:

- flujo de aprobaciones
- checklist documental
- estado de expediente
- bloqueo administrativo si falta documentación crítica

Backend:

- features `dealer/approvals` y `dealer/documents`

Frontend:

- bandeja de aprobaciones
- bandeja documental
- visibilidad por negocio

---

## Fase 8 — Financiamiento, facturación y cobro

Prioridad: Muy alta

Objetivo:

Cerrar administrativamente el negocio usando la infraestructura fiscal existente.

Entregables:

- solicitud y estado de financiamiento
- integración con órdenes de venta
- pre-factura
- factura
- pagos y saldo

Backend:

- feature `dealer/financing`
- servicios de integración con `sales/orders`, `preInvoices`, `invoices`, `payments`

Frontend:

- resumen financiero del negocio
- panel de estado de financiamiento
- acciones para generar orden/pre-factura/factura

Decisión clave:

El concesionario no debe duplicar el motor fiscal; debe orquestar el flujo de `sales`.

---

## Fase 9 — Entrega y postventa inicial

Prioridad: Alta

Objetivo:

Formalizar la entrega y activar el seguimiento postventa.

Entregables:

- checklist de entrega
- acta de conformidad
- entrega de documentos y accesorios
- activación de garantía/postventa

Backend:

- feature `dealer/deliveries`
- integración con CRM y taller

Frontend:

- lista de entregas programadas
- formulario de entrega
- detalle del expediente de salida

---

## Fase 10 — Dashboard, reportes y automatizaciones

Prioridad: Media

Entregables:

- dashboard comercial del concesionario
- KPIs por asesor, marca, modelo y etapa
- alertas de reserva vencida, cotización por vencer, expediente incompleto
- automatizaciones operativas

Backend:

- feature `dealer/dashboard`
- feature `dealer/reports`
- feature `dealer/automations`

Frontend:

- dashboard principal de concesionario
- reportes exportables

---

## 6. Estructura sugerida del backend

```text
backend/src/features/dealer/
  index.ts
  shared/
  units/
  reservations/
  testDrives/
  tradeIns/
  approvals/
  documents/
  financing/
  deals/
  deliveries/
  dashboard/
  reports/
  automations/
  integrations/
```

Patrón por submódulo:

- `*.routes.ts`
- `*.controller.ts`
- `*.service.ts`
- `*.dto.ts`
- `*.validation.ts`
- `*.interface.ts`

---

## 7. Estructura sugerida del frontend

```text
frontend/app/empresa/concesionario/
  page.tsx
  units/page.tsx
  opportunities/page.tsx
  quotations/page.tsx
  reservations/page.tsx
  test-drives/page.tsx
  trade-ins/page.tsx
  approvals/page.tsx
  documents/page.tsx
  financing/page.tsx
  deals/[id]/page.tsx
  deliveries/page.tsx
  reports/page.tsx
```

```text
frontend/components/dealer/
  units/
  opportunities/
  quotations/
  reservations/
  test-drives/
  trade-ins/
  approvals/
  documents/
  financing/
  deals/
  deliveries/
  dashboard/
  shared/
```

---

## 8. Orden recomendado de ejecución

1. Fase 0 — schema + contratos
2. Fase 1 — unidades comerciales
3. Fase 2 — pipeline de vehículos
4. Fase 3 — cotización
5. Fase 4 — reserva
6. Fase 7 — aprobaciones + expediente documental
7. Fase 8 — financiamiento + facturación
8. Fase 9 — entrega
9. Fase 5 — prueba de manejo
10. Fase 6 — retoma
11. Fase 10 — dashboard/reportes/automatizaciones

Este orden prioriza el flujo mínimo viable de negocio:

```text
Unidad → Oportunidad → Cotización → Reserva → Documentación → Facturación → Entrega
```

---

## 9. Riesgos y decisiones abiertas

- Si se reutiliza `crm/quotes`, puede ser necesario extender más de lo deseado el modelo actual.
- Si se reutiliza `sales/orders`, habrá que definir claramente cuándo nace la orden comercial del concesionario.
- La retoma puede requerir más información técnica de la que hoy tiene `CustomerVehicle`.
- El catálogo actual de concesionario parece demo/UI-first; habrá que reemplazarlo por servicios reales sin romper UX.

---

## 10. Criterios de éxito

- El equipo comercial puede trabajar todo el ciclo de venta sin salir del ecosistema AutoSys.
- No existen conflictos de disponibilidad o doble reserva sobre una unidad.
- La venta no avanza a entrega sin cobro/documentación/aprobación correspondiente.
- La información comercial queda trazable desde CRM hasta facturación y postventa.
- El módulo puede extenderse luego a maquinaria/equipos sin rehacer la base.

