# Implementación Técnica — Módulo de Taller (Workshop)

> Documento de referencia para el equipo de desarrollo.
> Refleja el estado al cierre de las Fases 0–5.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Stack y convenciones](#2-stack-y-convenciones)
3. [Prisma — modelos nuevos](#3-prisma--modelos-nuevos)
4. [Backend — estructura y endpoints](#4-backend--estructura-y-endpoints)
5. [Frontend — páginas](#5-frontend--páginas)
6. [Frontend — componentes](#6-frontend--componentes)
7. [Frontend — servicios API](#7-frontend--servicios-api)
8. [Integración Workshop ↔ CRM/Sales](#8-integración-workshop--crmsales)
9. [Flujos de negocio implementados](#9-flujos-de-negocio-implementados)
10. [Decisiones de diseño](#10-decisiones-de-diseño)

---

## 1. Resumen ejecutivo

El módulo Workshop cubre el ciclo operativo completo de un taller automotriz:

```
Cita → Recepción → Diagnóstico → OT → Trabajo → Calidad → Entrega → Facturación
```

Se implementó en 6 fases sobre una base existente de 9 pantallas, llegando a **25 páginas** y **25+ subdirectorios de componentes**. Se integra con los módulos CRM (cotizaciones) y Sales (facturación) en lugar de duplicar esa lógica.

---

## 2. Stack y convenciones

| Capa | Tecnología |
|------|-----------|
| Backend | Express + TypeScript (ES modules) |
| ORM | Prisma + PostgreSQL |
| Frontend | Next.js 14 App Router |
| UI | PrimeReact + PrimeFlex |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| HTTP client | axios (`apiClient`) |

**Patrones backend:**
- Estructura por feature: `src/features/workshop/<submodulo>/` con 6 archivos (routes, controller, service, dto, validation, interface)
- Controllers: funciones async planas — `asyncHandler` se aplica en las rutas, no en el controller
- Servicios: clase singleton, aceptan `db: PrismaClientType`, siempre filtran por `empresaId`
- Todos los imports con extensión `.js`
- `userId` = `(req as any).user?.id`

**Patrones frontend:**
- Servicios: object literal con `apiClient` (axios)
- Interfaces en `libs/interfaces/workshop/<entity>.interface.ts` (un archivo por entidad)
- Zod schemas en `libs/zods/workshop/<entity>Zod.tsx` (un archivo por entidad)
- `index.ts` en cada carpeta = solo barrel re-export

---

## 3. Prisma — modelos nuevos

Los siguientes archivos `.prisma` se añadieron en `backend/prisma/models/workshop/`:

| Archivo | Modelo | Descripción |
|---------|--------|-------------|
| `checklist.prisma` | `Checklist`, `ChecklistItem` | Plantillas de checklists con tipos de respuesta |
| `ingressMotive.prisma` | `IngressMotive` | Catálogo de motivos de ingreso al taller |
| `materialMovement.prisma` | `MaterialMovement` | Movimientos de material por OT |
| `receptionMedia.prisma` | `ReceptionDamage`, `ReceptionPhoto` | Daños y fotos en recepción |
| `serviceDiagnosis.prisma` | `ServiceDiagnosis` | Diagnósticos técnicos |
| `serviceOrderHistory.prisma` | `ServiceOrderHistory` | Historial de cambios de OT |
| `technicianSpecialty.prisma` | `TechnicianSpecialty` | Especialidades de técnicos |
| `vehicleDelivery.prisma` | `VehicleDelivery` | Entregas de vehículo con firma digital |
| `workshopAttachment.prisma` | `WorkshopAttachment` | Adjuntos polimórficos del taller |
| `workshopAuditLog.prisma` | `WorkshopAuditLog` | Log de auditoría de acciones |
| `workshopBranch.prisma` | `WorkshopBranch` | Sucursales del taller |
| `workshopRework.prisma` | `WorkshopRework` | Retrabajos y garantías internas |
| `workshopShift.prisma` | `WorkshopShift` | Turnos del taller |

**Modelos modificados:**
- `ServiceOrder` — campos: `preInvoice`, `invoiceId`, `INVOICED` (status enum)
- `Quote` — campos: `isWorkshopQuote`, `vehicleReceptionNotes`, `estimatedLaborHours`, `diagnosisRecommendation`, `workshopApprovalFlow`, `convertedToSOId`
- `PreInvoice` — campo: `serviceOrderId String? @unique`

> El `schema.prisma` es auto-generado. Nunca editar directamente.
> Comando: `npm run prisma:merge && npm run prisma:migrate`

---

## 4. Backend — estructura y endpoints

Todos los endpoints viven bajo el prefijo `/workshop` (montado en `backend/src/features/workshop/index.ts`).

### 4.1 Catálogos de configuración

| Submódulo | Ruta base | Operaciones |
|-----------|-----------|-------------|
| Tipos de servicio | `/workshop/service-types` | CRUD completo |
| Bahías | `/workshop/bays` | CRUD completo |
| Operaciones | `/workshop/operations` | CRUD completo |
| Motivos de ingreso | `/workshop/ingress-motives` | CRUD completo |
| Especialidades técnico | `/workshop/technician-specialties` | CRUD completo |
| Checklists (plantillas) | `/workshop/checklists` | CRUD + duplicar + exportar |
| Sucursales | `/workshop/branches` | CRUD completo |
| Turnos | `/workshop/shifts` | CRUD completo |

### 4.2 Flujo operativo

#### Citas — `/workshop/appointments`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar (filtros: fechas, status, técnico) |
| POST | `/` | Crear cita |
| GET | `/:id` | Obtener una |
| PUT | `/:id` | Actualizar |
| PATCH | `/:id/status` | Cambiar status |
| DELETE | `/:id` | Eliminar |
| POST | `/check-conflicts` | Verificar conflictos de horario |
| GET | `/advisor/:advisorId/availability` | Disponibilidad de asesor |

#### Recepciones — `/workshop/receptions`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar |
| POST | `/` | Crear recepción |
| GET | `/:id` | Obtener una |
| PUT | `/:id` | Actualizar |
| PATCH | `/:id/status` | Cambiar status |
| DELETE | `/:id` | Eliminar |

#### Media de recepción — `/workshop/receptions/:receptionId`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/damages` | Listar daños pre-existentes |
| POST | `/damages` | Agregar daño |
| PUT | `/damages/:damageId` | Editar daño |
| DELETE | `/damages/:damageId` | Eliminar daño |
| GET | `/photos` | Listar fotos |
| POST | `/photos` | Agregar foto |
| DELETE | `/photos/:photoId` | Eliminar foto |

#### Órdenes de Trabajo — `/workshop/service-orders`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar (filtros: status, técnico, bahía, fechas) |
| POST | `/` | Crear OT |
| GET | `/:id` | Obtener OT completa |
| PUT | `/:id` | Actualizar |
| PATCH | `/:id/status` | Cambiar status |
| DELETE | `/:id` | Eliminar |
| POST | `/from-quote/:quoteId` | Crear OT desde cotización CRM aprobada |
| GET | `/:id/quote` | Obtener cotización vinculada a OT |
| POST | `/:id/generate-invoice` | Generar Pre-Factura desde OT (READY/DELIVERED) |
| POST | `/bulk-generate-invoices` | Generar Pre-Facturas en lote |
| GET | `/:id/billing` | Obtener trail: OT → PreInvoice → Invoice → Payments |

### 4.3 Control operativo

| Submódulo | Ruta base | Operaciones |
|-----------|-----------|-------------|
| Tiempos de labor | `/workshop/labor-times` | CRUD + start/pause/stop |
| Control de calidad | `/workshop/quality-checks` | CRUD + respuestas de checklist |
| Garantías | `/workshop/warranties` | CRUD completo |
| Retrabajos | `/workshop/reworks` | CRUD completo |

### 4.4 Detalles de OT

| Submódulo | Ruta base | Descripción |
|-----------|-----------|-------------|
| Materiales | `/workshop/materials` | Consumo de inventario por OT |
| Trabajos adicionales | `/workshop/additionals` | Servicios adicionales a la OT |
| Diagnósticos | `/workshop/diagnoses` | Diagnósticos técnicos con recomendaciones |
| Entregas | `/workshop/deliveries` | Entrega de vehículo con firma digital base64 |

### 4.5 Información e historial

| Submódulo | Ruta base | Descripción |
|-----------|-----------|-------------|
| Historial de vehículo | `/workshop/vehicles` | Historial de OTs por vehículo/placa |
| Adjuntos | `/workshop/attachments` | Archivos adjuntos polimórficos |
| Audit log | `/workshop/audit-log` | Log de auditoría del taller |

### 4.6 Inteligencia operacional

| Submódulo | Ruta base | Descripción |
|-----------|-----------|-------------|
| Dashboard | `/workshop/dashboard` | KPIs, alertas, métricas en tiempo real |
| Reportes | `/workshop/reports` | Reportes de productividad, ingresos, técnicos |
| Automatizaciones | `/workshop/automations` | Reglas automáticas (escalaciones, alertas) |

### 4.7 Servicios de integración

Ubicados en `backend/src/features/workshop/integrations/`:

| Archivo | Descripción |
|---------|-------------|
| `so-invoice-generator.service.ts` | Bridge OT → PreInvoice → Invoice. Mapea ítems de OT a ítems fiscales con IVA 16%. |
| `quote-so-converter.service.ts` | Convierte Quote CRM APPROVED (tipo SERVICE) → ServiceOrder DRAFT |
| `appointment-conflict-detector.service.ts` | Detecta conflictos de horario en citas por bahía/técnico |
| `diagnosis-templates-manager.service.ts` | Gestión de plantillas de diagnóstico |

---

## 5. Frontend — páginas

Rutas bajo `/empresa/workshop/`:

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard operativo (KPIs, alertas, timeline) |
| `/appointments` | Lista + vista calendario semanal de citas |
| `/receptions` | Recepciones de vehículos |
| `/service-orders` | Lista de Órdenes de Trabajo |
| `/service-orders/[id]` | Detalle de OT (TabView 11 tabs) |
| `/planning` | Tablero Kanban de planificación (@dnd-kit) |
| `/diagnoses` | Diagnósticos técnicos |
| `/additionals` | Trabajos adicionales |
| `/quotations` | Cotizaciones de taller (wrapper CRM, `isWorkshopQuote=true`) |
| `/materials` | Control de materiales e insumos |
| `/labor-times` | Control de tiempos de labor |
| `/quality-checks` | Control de calidad |
| `/deliveries` | Entregas de vehículos |
| `/warranties` | Garantías |
| `/reworks` | Retrabajos |
| `/vehicle-history` | Historial de vehículos |
| `/billing` | Facturación taller (wrapper Sales PreInvoices, `hasServiceOrder=true`) |
| `/reports` | Reportes y estadísticas |
| `/service-types` | Catálogo tipos de servicio |
| `/bays` | Catálogo bahías |
| `/checklists` | Catálogo plantillas de checklists |
| `/ingress-motives` | Catálogo motivos de ingreso |
| `/technician-specialties` | Catálogo especialidades técnicas |
| `/branches` | Sucursales del taller |
| `/shifts` | Turnos del taller |

---

## 6. Frontend — componentes

### Detalle de OT (`components/workshop/service-orders/`)

El componente principal es `ServiceOrderDetail.tsx` con TabView de 11 tabs:

| Tab | Componente | Descripción |
|-----|-----------|-------------|
| General | inline | Info básica, cliente, vehículo, técnico |
| Tiempos | `LaborTimePanel` | Control de tiempos con start/pause/stop |
| Diagnóstico | `DiagnosisPanel` | Formulario de diagnóstico técnico |
| Checklist | `DynamicChecklist` | Checklist dinámico (BOOLEAN/TEXT/NUMBER/SELECTION) |
| Materiales | `MaterialsPanel` | Consumo de inventario |
| Adicionales | `AdditionalsPanel` | Trabajos adicionales |
| Calidad | `QualityCheckPanel` | Control de calidad |
| Medios | `ReceptionMediaPanel` | Daños y fotos de recepción |
| Historial | `OrderHistoryPanel` | Historial de cambios de status |
| Cotización | `tabs/QuotationTab` | Cotización CRM vinculada |
| Facturación | `tabs/BillingTab` | Pre-Factura + stepper fiscal |

### Tablero Kanban (`components/workshop/planning/`)

| Componente | Descripción |
|-----------|-------------|
| `PlanningBoard.tsx` | Tablero principal con DndContext. 9 columnas de status. Toggle "Por estado"/"Por bahía". |
| `PlanningKanbanCard.tsx` | Tarjeta draggable con folio, placa, cliente, prioridad Tag, días transcurridos. |

**Implementación dnd-kit:**
- `PointerSensor` con `activationConstraint: { distance: 8 }` (evita drag accidental)
- `DragOverlay` con drop animation
- Actualización optimista + rollback en error
- `NEXT_STATUSES` map define transiciones válidas

### Vista calendario de citas (`components/workshop/appointments/`)

| Componente | Descripción |
|-----------|-------------|
| `AppointmentList.tsx` | Lista con SelectButton toggle "Lista"/"Semana" |
| `AppointmentCalendar.tsx` | Grid semanal horas 08-18 × 7 días. Navegación prev/next/hoy. |

### Recepción de medios (`components/workshop/receptions/`)

`ReceptionMediaPanel.tsx` — TabView con:
- **Tab Daños**: DataTable con Tag de severidad, dialogs para agregar/editar
- **Tab Fotos (N)**: Grid de thumbnails con Galleria para fullscreen

### Tabs de integración (`components/workshop/service-orders/tabs/`)

| Componente | Funcionalidad |
|-----------|---------------|
| `BillingTab.tsx` | Muestra `PreInvoiceStepper` si existe Pre-Factura. Botón "Generar Pre-Factura" si OT es READY/DELIVERED y no tiene Pre-Factura. Muestra datos de Invoice cuando está facturado. |
| `QuotationTab.tsx` | Muestra cotización CRM vinculada con status Tag y totales. Botón "Crear Cotización" si no hay cotización. |

### Formulario de Control de Calidad (`components/workshop/quality-checks/`)

`QualityCheckForm.tsx` — Incluye:
- Dropdown de plantillas de checklist (categoría `QUALITY_CONTROL`)
- Carga lazy de plantillas (on dropdown show)
- Renderiza `DynamicChecklist` al seleccionar plantilla
- Envía `checklistTemplateId` + `responses` junto con campos base

---

## 7. Frontend — servicios API

Todos en `frontend/app/api/workshop/`. Pattern: object literal con `apiClient`.

| Archivo | Endpoints principales |
|---------|----------------------|
| `appointmentService.ts` | CRUD + checkConflicts + getAdvisorAvailability |
| `receptionService.ts` | CRUD + changeStatus |
| `receptionMediaService.ts` | getDamages/addDamage/editDamage/removeDamage + getPhotos/addPhoto/removePhoto |
| `serviceOrderService.ts` | CRUD + updateStatus + convertFromQuote |
| `laborTimeService.ts` | CRUD + start/pause/stop |
| `qualityCheckService.ts` | CRUD + submit |
| `diagnosisService.ts` | CRUD |
| `materialService.ts` | CRUD por OT |
| `additionalService.ts` | CRUD por OT |
| `deliveryService.ts` | CRUD + firma digital |
| `warrantyService.ts` | CRUD |
| `reworkService.ts` | CRUD |
| `checklistService.ts` | CRUD + getTemplates + getTemplateById |
| `ingressMotiveService.ts` | CRUD |
| `technicianSpecialtyService.ts` | CRUD |
| `serviceTypeService.ts` | CRUD |
| `workshopBayService.ts` | CRUD |
| `workshopOperationService.ts` | CRUD |
| `workshopBranchService.ts` | CRUD |
| `workshopShiftService.ts` | CRUD |
| `dashboardService.ts` | getKPIs + getAlerts + getTimeline |
| `reportService.ts` | getProductivityReport + getRevenueReport + getTechnicianReport |
| `vehicleHistoryService.ts` | getByPlate + getByCustomer |
| `attachmentService.ts` | getAll(entityType, entityId) + create + remove |
| `auditLogService.ts` | getAll(filters) |
| `billingBridgeService.ts` | generatePreInvoice(soId) + createQuoteFromSO(soId) |

---

## 8. Integración Workshop ↔ CRM/Sales

En lugar de duplicar los módulos de cotizaciones y facturación, el taller reutiliza los módulos existentes:

### Cotizaciones

- **CRM Quotes ya existe** con workflow completo: `DRAFT → ISSUED → SENT → NEGOTIATING → APPROVED → CONVERTED`
- El modelo `Quote` tiene campos workshop: `isWorkshopQuote`, `vehicleReceptionNotes`, `estimatedLaborHours`, `diagnosisRecommendation`
- La página `/empresa/workshop/quotations` filtra las quotes CRM con `isWorkshopQuote=true`
- El tab "Cotización" en la OT Detail permite crear/ver la cotización asociada
- `POST /workshop/service-orders/:id/create-quote` → crea Quote CRM pre-llenada
- `quote-so-converter.service.ts` → convierte Quote APPROVED → nueva ServiceOrder

### Facturación

- **Sales pipeline ya existe**: PreInvoice → Payment → Invoice + ExitNote (auto)
- El modelo `PreInvoice` tiene `serviceOrderId String? @unique`
- La página `/empresa/workshop/billing` filtra PreInvoices con `hasServiceOrder=true`
- El tab "Facturación" en la OT Detail muestra el estado del pipeline fiscal
- `POST /workshop/service-orders/:id/generate-invoice` → crea PreInvoice con ítems mapeados desde OT
- `so-invoice-generator.service.ts` maneja el mapeo fiscal (IVA 16%, número formato `PF-YYYYMM-NNNNNN`)
- Al completar un pago en Sales, la OT se actualiza a status `INVOICED` con `invoiceId`

### Legacy eliminado

Se eliminaron ~8 archivos de un sistema MongoDB que estaba muerto (no tenía backend en este repo):
- `frontend/app/api/workshop/invoiceService.ts`
- `frontend/app/api/workshop/paymentService.ts`
- `frontend/components/workshop/invoices/` (directorio completo)
- `frontend/libs/interfaces/workshop/invoice.interface.ts`
- `frontend/libs/zods/workshop/invoiceZod.tsx`

---

## 9. Flujos de negocio implementados

### Flujo A — Operación estándar de taller

```
1. CITA         → /workshop/appointments      (opcional)
2. RECEPCIÓN    → /workshop/receptions        + daños/fotos (ReceptionMediaPanel)
3. OT ABIERTA   → /workshop/service-orders    (status: OPEN)
4. DIAGNÓSTICO  → /workshop/diagnoses         (técnico documenta hallazgos)
5. TRABAJO      → labor-times + materials     (status: IN_PROGRESS)
6. CALIDAD      → /workshop/quality-checks    (con checklist dinámico)
7. LISTA        → status: READY
8. ENTREGA      → /workshop/deliveries        (firma digital del cliente)
9. FACTURACIÓN  → generate-invoice → pipeline Sales → INVOICED
```

### Flujo B — Cotización desde taller

```
OT/Diagnóstico
  → Tab "Cotización" → "Crear Cotización"
  → POST /workshop/service-orders/:id/create-quote
  → Quote CRM (isWorkshopQuote=true, type=SERVICE)
  → Workflow CRM: DRAFT → APPROVED
  → (Opcional) APPROVED → quote-so-converter → nueva OT
```

### Flujo C — Facturación desde taller

```
OT (status: READY o DELIVERED)
  → Tab "Facturación" → "Generar Pre-Factura"
  → POST /workshop/service-orders/:id/generate-invoice
  → PreInvoice (PENDING_PREPARATION) con serviceOrderId
  → Pipeline Sales: PENDING_PREP → IN_PREP → READY_FOR_PAYMENT
  → Cajero: POST /sales/payments
  → Auto-genera Invoice (FAC-YYYY-...) + ExitNote (NS-YYYY-...)
  → OT → status: INVOICED, invoiceId seteado
```

### Flujo D — Planificación (Kanban)

```
/empresa/workshop/planning
  → Vista por estado: 9 columnas (OPEN → READY)
  → Vista por bahía: columnas dinámicas por WorkshopBay
  → Drag & drop cambia status vía PATCH /:id/status
  → Optimistic update + rollback en error
  → Dialog de confirmación para transiciones desde IN_PROGRESS
```

---

## 10. Decisiones de diseño

| Decisión | Enfoque elegido | Alternativa descartada |
|----------|----------------|----------------------|
| OT Detail | Página dedicada `/service-orders/[id]` con TabView 11 tabs | Dialog (demasiado complejo) |
| Recepción Form | Página dedicada con Stepper + Accordion | Dialog |
| Calendario citas | PrimeFlex grid custom (horas × días) | FullCalendar (dependencia externa) |
| Drag & drop | `@dnd-kit` con `PointerSensor(distance:8)` | react-beautiful-dnd (deprecado) |
| Cotizaciones taller | Filtro sobre CRM Quotes (`isWorkshopQuote=true`) | Módulo propio duplicado |
| Facturación taller | Pipeline Sales existente + bridge PreInvoice | Módulo propio duplicado |
| Firma digital | Canvas HTML5 custom (~50 líneas), base64 | Librería externa |
| Checklists | DynamicChecklist con 4 tipos de respuesta | Solo boolean |
| Auditoría | `WorkshopAuditLog` propio del módulo | Audit log global |
| Menú de navegación | `AppMenuEmpresa.tsx` — sección "Taller" con subgrupos | — |
