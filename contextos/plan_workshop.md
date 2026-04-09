Estado actual: 9/24 features del backend tienen frontend. Faltan 15 features + mejoras mayores.

6 fases, ~139 archivos total:

- Fase 0: Shared components + 5 catálogos config (checklists, motivos ingreso, especialidades, sucursales, turnos)
- Fase 1: Dashboard, Diagnósticos, Materiales, Trabajos Adicionales
- Fase 2: OT Detail con 11 tabs, Calendar de citas, Recepción mejorada, QC con checklists
- Fase 3: Entregas (con firma digital), Retrabajo, Historial de vehículo
- Fase 4: Kanban de planificación (@dnd-kit), Reportes
- Fase 5: Cotizaciones versionadas, Facturación

Decisiones clave: OT Detail y Recepción son páginas dedicadas (no Dialog), Dashboard reemplaza la landing actual, Kanban sigue patrón de LeadKanban del CRM.

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Ready to code?

Here is Claude's plan:  
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Plan: Reescritura del Módulo Frontend Workshop (Taller)

Contexto

El módulo de Workshop tiene 24 rutas backend pero solo 9 tienen frontend. Faltan 15 features completas + mejoras significativas a las existentes (OT con tabs, Reception
multi-sección, Dashboard, Kanban de planificación). El objetivo es cubrir los 17 screens definidos en workchop_documento.md, siguiendo estrictamente los patrones de
contexto_refactorizacion_list_y_form.md.

Rutas base: /empresa/workshop/\* | Menu: AppMenuEmpresa.tsx (línea 370+)

---

Decisiones Arquitectónicas

┌────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Decisión │ Enfoque │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ OT Detail │ Página dedicada /empresa/workshop/service-orders/[id] con TabView (11 tabs). Demasiado complejo para Dialog │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Reception Form │ Página dedicada con Stepper + Accordion para 10 secciones. No cabe en Dialog │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Dashboard │ Reemplaza ServiceOrderList en /empresa/workshop/page.tsx. KPI Cards + Alerts + Timeline │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Planning Board │ @dnd-kit (ya en dependencias) siguiendo patrón de LeadKanban.tsx del CRM │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Calendar (Citas) │ PrimeFlex grid custom (NO agregar FullCalendar). Toggle List/Calendar con SelectButton │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ File Upload │ PrimeReact FileUpload → backend URL. Shared PhotoCapture component │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Firma Digital │ Canvas HTML5 custom (~50 líneas). Retorna base64 data URL │
├────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Componentes existentes │ Mejorar, nunca reescribir. Cambios aditivos │
└────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

---

Componentes Compartidos a Crear Primero

┌────────────────────────┬────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┐
│ Componente │ Ubicación │ Uso │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ StatusBadge (genérico) │ components/workshop/shared/StatusBadge.tsx │ Reemplaza 6+ badges individuales con registry configurable │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ DynamicChecklist │ components/workshop/shared/DynamicChecklist.tsx │ Recepción, QC, Diagnóstico. Renderiza según responseType │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ SignaturePad │ components/workshop/shared/SignaturePad.tsx │ Recepción y Entrega │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ PhotoCapture │ components/workshop/shared/PhotoCapture.tsx │ FileUpload + TabView por categoría + Galleria │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ AttachmentPanel │ components/workshop/shared/AttachmentPanel.tsx │ Reutilizable con entityType + entityId props │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ AuditLogPanel │ components/workshop/shared/AuditLogPanel.tsx │ Timeline de cambios, reutilizable │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ StateTimeline │ components/workshop/shared/StateTimeline.tsx │ Visualización horizontal de máquina de estados │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ EntitySearchInput │ components/workshop/shared/EntitySearchInput.tsx │ AutoComplete para cliente/vehículo (enlaza a CRM) │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ KPICard │ components/common/KPICard.tsx │ Dashboard. Card con borde lateral coloreado + trend │
├────────────────────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ WorkshopFormSection │ components/workshop/shared/WorkshopFormSection.tsx │ Wrapper de sección con Divider consistente │
└────────────────────────┴────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘

---

Fases de Implementación

FASE 0: Config Entities + Shared Components (~35 archivos)

Prioridad: Máxima — desbloquea todo lo demás

Cada entidad de catálogo sigue el patrón exacto de ServiceTypeList/ServiceTypeForm (6 archivos c/u):

0A. Componentes compartidos (10 archivos nuevos)

- Todos los componentes de la tabla anterior

0B. Motivos de Ingreso (6 archivos)

- app/api/workshop/ingressMotiveService.ts
- libs/interfaces/workshop/ingressMotive.interface.ts
- libs/zods/workshop/ingressMotiveZod.ts
- components/workshop/ingress-motives/IngressMotiveList.tsx
- components/workshop/ingress-motives/IngressMotiveForm.tsx
- app/empresa/workshop/ingress-motives/page.tsx

0C. Especialidades Técnicas (6 archivos) — misma estructura

0D. Sucursales (6 archivos) — campos: code, name, address, phone, managerUserId, isActive

0E. Turnos (6 archivos) — campos: code, name, startTime, endTime, workDays, isActive

0F. Checklists (6 archivos) — más complejo: templates con useFieldArray para items anidados (responseType: BOOLEAN/TEXT/NUMBER/SELECTION)

0G. Actualizar barrels — app/api/workshop/index.ts, libs/interfaces/workshop/index.ts, libs/zods/workshop/index.tsx

0H. Actualizar menú — layout/AppMenuEmpresa.tsx (agregar sub-items bajo Configuración)

---

FASE 1: Screens Operacionales Core (~30 archivos)

Prioridad: Alta — backbone del flujo

1A. Dashboard Operativo (4 archivos)

- app/api/workshop/dashboardService.ts — getDashboard(), getSummary()
- libs/interfaces/workshop/dashboard.interface.ts
- components/workshop/dashboard/WorkshopDashboard.tsx — KPI Cards (7) + Quick Actions (4 botones) + Alerts Panel + Timeline + Chart donut OT por estado
- Modificar app/empresa/workshop/page.tsx → renderizar WorkshopDashboard en vez de ServiceOrderList

1B. Diagnósticos (7 archivos)

- Service, interface, zod, List, Form, SeverityBadge, page
- Form multi-sección: info general + sub-tabla hallazgos + sub-tabla operaciones sugeridas + sub-tabla repuestos sugeridos (inline add/remove)

1C. Materiales para OT (7 archivos)

- Service, interface, zod, List, Form, StatusBadge, page
- Flujo de estados: REQUESTED → RESERVED → DISPATCHED → CONSUMED → RETURNED
- Campos de cantidad: requested, reserved, dispatched, consumed, returned

1D. Trabajos Adicionales (7 archivos)

- Service, interface, zod, List, Form, StatusBadge, page
- Flujo: PROPOSED → QUOTED → APPROVED → EXECUTED | REJECTED
- Form con useFieldArray para items detalle

---

FASE 2: Mejora de Screens Existentes (~20 archivos)

Prioridad: Alta — completa el flujo operacional

2A. OT Detail Page con Tabs (3 archivos nuevos + 1 modificado)

- app/empresa/workshop/service-orders/[id]/page.tsx
- components/workshop/service-orders/ServiceOrderDetail.tsx — TabView con 11 tabs:
  - Resumen | Operaciones | Técnicos | Materiales | Tiempos | Adicionales | Observaciones | Calidad | Facturación | Historial | Adjuntos
  - Cada tab embebe el List correspondiente filtrado por serviceOrderId
- components/workshop/service-orders/ServiceOrderSummaryTab.tsx
- Modificar ServiceOrderList.tsx — "Ver detalle" → router.push()

2B. Calendar View Citas (2 archivos + 1 modificado)

- components/workshop/appointments/AppointmentCalendar.tsx — Grid semanal con PrimeFlex
- Modificar AppointmentList.tsx — SelectButton toggle Lista/Calendario

2C. Recepción Mejorada (2 archivos + 1 modificado)

- components/workshop/receptions/ReceptionMediaPanel.tsx — Daños + Fotos con tabs
- app/api/workshop/receptionMediaService.ts
- Modificar ReceptionForm.tsx — agregar sección media al final

2D. Quality Check + Checklist (1 modificado)

- Modificar QualityCheckForm.tsx — botón "Cargar Checklist" que usa DynamicChecklist shared

2E. Attachments (3 archivos)

- app/api/workshop/attachmentService.ts, interface, AttachmentPanel (ya en shared)

2F. Audit Log (3 archivos)

- app/api/workshop/auditLogService.ts, interface, AuditLogPanel (ya en shared)

2G. Labor Time mejorado (1 modificado)

- Modificar LaborTimeList.tsx — toggle "Vista Técnico" + botones Start/Pause/Resume/Finish inline

---

FASE 3: Entrega, Retrabajo, Historial (~19 archivos)

Prioridad: Media — completa el flujo end-to-end

3A. Entregas (7 archivos)

- Service, interface, zod, List, Form (con SignaturePad), page
- Form: orden, entregado por, recibido por, conformidad, observaciones, próxima visita, firma

3B. Retrabajo (7 archivos)

- Service, interface, zod, List, Form, StatusBadge, page
- Estados: OPEN → IN_PROGRESS → RESOLVED → CLOSED

3C. Historial de Vehículo (4 archivos)

- app/api/workshop/vehicleHistoryService.ts
- libs/interfaces/workshop/vehicleHistory.interface.ts
- components/workshop/vehicle-history/VehicleHistoryView.tsx — Search por placa/VIN + PrimeReact Timeline
- app/empresa/workshop/vehicle-history/page.tsx

---

FASE 4: Kanban + Reportes (~10 archivos)

Prioridad: Media-Alta — visibilidad operacional

4A. Tablero de Planificación / Kanban (3 archivos)

- components/workshop/planning/PlanningBoard.tsx — Sigue patrón LeadKanban.tsx:
  - DndContext + PointerSensor (distance: 8)
  - Columnas = estados OT (useDroppable)
  - Cards = OT (useDraggable) con folio, placa, prioridad badge, días transcurridos
  - DragOverlay para preview
  - Optimistic update + rollback on error
  - SelectButton toggle "Por bahía" / "Por técnico"
  - ProgressBar capacidad por columna
- components/workshop/planning/PlanningKanbanCard.tsx
- app/empresa/workshop/planning/page.tsx

4B. Reportes (5 archivos)

- app/api/workshop/reportService.ts — 7 endpoints de reportes
- libs/interfaces/workshop/report.interface.ts
- components/workshop/reports/WorkshopReports.tsx — Date range + TabView por tipo + DataTable + export CSV
- components/workshop/reports/ReportSummaryCards.tsx
- app/empresa/workshop/reports/page.tsx

---

FASE 5: Cotizaciones + Facturación (~15 archivos)

Prioridad: Menor — puede requerir ajustes backend

5A. Cotizaciones Taller (7 archivos) — versioned, approval history
5B. Facturación/Pre-factura (5 archivos) — resumen + generación factura
5C. Automations view (3 archivos) — ya consumido por Dashboard, standalone si necesario

---

Navegación (Menú Sidebar Reestructurado)

Taller (pi-wrench)
├── Dashboard Operativo (pi-chart-line) → /empresa/workshop
├── Operaciones Diarias
│ ├── Citas (pi-calendar) → /empresa/workshop/appointments
│ ├── Recepciones (pi-inbox) → /empresa/workshop/receptions
│ ├── Órdenes de Trabajo (pi-file-edit) → /empresa/workshop/service-orders
│ ├── Tablero de Planeación (pi-th-large) → /empresa/workshop/planning
│ └── Control de Tiempos (pi-stopwatch) → /empresa/workshop/labor-times
├── Diagnóstico y Cotización
│ ├── Diagnósticos (pi-search-plus) → /empresa/workshop/diagnoses
│ ├── Cotizaciones (pi-file-o) → /empresa/workshop/quotations
│ └── Trabajos Adicionales (pi-plus-circle) → /empresa/workshop/additionals
├── Materiales (pi-box) → /empresa/workshop/materials
├── Calidad y Entrega
│ ├── Control de Calidad (pi-check-square) → /empresa/workshop/quality-checks
│ └── Entregas (pi-sign-out) → /empresa/workshop/deliveries
├── Facturación (pi-dollar) → /empresa/workshop/billing
├── Historial
│ ├── Historial de Vehículo (pi-car) → /empresa/workshop/vehicle-history
│ ├── Garantías (pi-shield) → /empresa/workshop/warranties
│ └── Retrabajo (pi-replay) → /empresa/workshop/reworks
├── Reportes (pi-chart-bar) → /empresa/workshop/reports
└── Configuración (pi-cog)
├── Tipos de Servicio (pi-tags) → /empresa/workshop/service-types
├── Operaciones (pi-list) → /empresa/workshop/operations
├── Bahías (pi-sitemap) → /empresa/workshop/bays
├── Checklists (pi-list-check) → /empresa/workshop/checklists
├── Motivos de Ingreso (pi-sign-in) → /empresa/workshop/ingress-motives
├── Especialidades Técnicas (pi-star) → /empresa/workshop/tech-specialties
├── Sucursales (pi-building) → /empresa/workshop/branches
└── Turnos (pi-clock) → /empresa/workshop/shifts

---

Esquema de Colores (Estados/Prioridades)

Todos usan severity de PrimeReact Tag — sin hex custom:

┌────────────────────────────────────────────────────────────────────────┬───────────┐
│ Estado OT │ Severity │
├────────────────────────────────────────────────────────────────────────┼───────────┤
│ DRAFT │ secondary │
├────────────────────────────────────────────────────────────────────────┼───────────┤
│ OPEN / DIAGNOSING / APPROVED │ info │
├────────────────────────────────────────────────────────────────────────┼───────────┤
│ PENDING_APPROVAL / IN_PROGRESS / PAUSED / WAITING_PARTS / WAITING_AUTH │ warning │
├────────────────────────────────────────────────────────────────────────┼───────────┤
│ QUALITY_CHECK │ contrast │
├────────────────────────────────────────────────────────────────────────┼───────────┤
│ READY / DELIVERED / INVOICED │ success │
├────────────────────────────────────────────────────────────────────────┼───────────┤
│ CLOSED │ secondary │
├────────────────────────────────────────────────────────────────────────┼───────────┤
│ CANCELLED │ danger │
└────────────────────────────────────────────────────────────────────────┴───────────┘

┌───────────┬───────────┐
│ Prioridad │ Severity │
├───────────┼───────────┤
│ LOW │ secondary │
├───────────┼───────────┤
│ NORMAL │ info │
├───────────┼───────────┤
│ HIGH │ warning │
├───────────┼───────────┤
│ ASAP │ danger │
└───────────┴───────────┘

---

Optimizaciones UX

1.  KPI Cards clickeables — navegan con filtros pre-aplicados
2.  Status badge clickeable en DataTable — abre StatusDialog (1 click vs 2)
3.  Navegación contextual — OT → appointment/reception/customer con Links
4.  Fast-track Cita → Recepción → OT — pre-llena datos en cascada
5.  Smart defaults — fecha próxima disponible, checklist por tipo de servicio, copiar datos recepción a OT
6.  Bulk operations — selección múltiple + cambio masivo de estado/asignación
7.  Timer inline en tab Tiempos de OT — reloj digital grande + botones prominentes

---

Dependencias entre Fases

Fase 0 (Config + Shared) ──→ Fase 1 (Core)
│
┌─────────────┤
↓ ↓
Fase 2 (Enhance) Fase 4 (Kanban/Reports) ← pueden ser paralelas
│
↓
Fase 3 (Delivery/Rework/History)
│
↓
Fase 5 (Quotation/Billing)

---

Archivos de Referencia Clave

┌─────────────────────────────────────────────────────────┬─────────────────────────────────────────────────┐
│ Archivo │ Para qué │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ components/workshop/service-orders/ServiceOrderList.tsx │ Patrón List canónico │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ components/workshop/service-orders/ServiceOrderForm.tsx │ Patrón Form con useFieldArray │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ components/crm/leads/LeadKanban.tsx │ Patrón Kanban con @dnd-kit │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ components/inventory/brands/BrandList.tsx │ Patrón List de referencia general │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ components/inventory/brands/BrandForm.tsx │ Patrón Form de referencia general │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ libs/interfaces/workshop/shared.interface.ts │ Generics WorkshopPagedResponse/WorkshopResponse │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ app/api/inventory/brandService.ts │ Patrón service object literal │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ layout/AppMenuEmpresa.tsx:370 │ Menú actual a reestructurar │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ backend/src/features/workshop/index.ts │ 24 route groups del backend │
└─────────────────────────────────────────────────────────┴─────────────────────────────────────────────────┘

---

Verificación

1.  Por cada feature nueva: compilar (npm run build), navegar a la página, CRUD completo, verificar responsive en tablet (768px)
2.  Dashboard: verificar que KPIs cargan del backend, auto-refresh funciona, cards navegan correctamente
3.  OT Detail: verificar que todos los tabs cargan datos filtrados por serviceOrderId
4.  Kanban: drag-and-drop cambia estado, rollback en error, persist on refresh
5.  Recepción: formulario multi-sección valida cada sección, fotos se suben, firma se captura
6.  Menú: todas las rutas navegan correctamente, iconos visibles

---

Resumen de Archivos

┌─────────────────────────────────┬────────┬─────────────┬───────┐
│ Fase │ Nuevos │ Modificados │ Total │
├─────────────────────────────────┼────────┼─────────────┼───────┤
│ 0 - Config + Shared │ 40 │ 4 │ 44 │
├─────────────────────────────────┼────────┼─────────────┼───────┤
│ 1 - Core Operacional │ 25 │ 5 │ 30 │
├─────────────────────────────────┼────────┼─────────────┼───────┤
│ 2 - Mejoras Existentes │ 14 │ 5 │ 19 │
├─────────────────────────────────┼────────┼─────────────┼───────┤
│ 3 - Entrega/Retrabajo/Historial │ 19 │ 2 │ 21 │
├─────────────────────────────────┼────────┼─────────────┼───────┤
│ 4 - Kanban/Reportes │ 8 │ 2 │ 10 │
├─────────────────────────────────┼────────┼─────────────┼───────┤
│ 5 - Cotización/Facturación │ 15 │ 0 │ 15 │
├─────────────────────────────────┼────────┼─────────────┼───────┤
│ TOTAL │ ~121 │ ~18 │ ~139 │
└─────────────────────────────────┴────────┴─────────────┴───────┘
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
