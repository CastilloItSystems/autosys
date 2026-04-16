# Estado Actual — Módulo de Concesionario (AutoSys)

Fecha de actualización: 2026-04-16

## Resumen

Se encuentra implementada la base operativa v1 del módulo de concesionario bajo el prefijo:

- Backend: `/api/dealer/*`
- Frontend: `/empresa/concesionario/*`

El módulo dejó de ser una vista demo y ahora consume servicios reales para gestión comercial.
Además, la capa frontend quedó homologada al estándar de `List + Form` definido en `contexto_refactorizacion_list_y_form.md`.

## Implementado

### 1. Submódulos operativos (backend + frontend)

- Unidades (`dealer/units`)
- Reservas (`dealer/reservations`)
- Cotizaciones (`dealer/quotes`)
- Pruebas de manejo (`dealer/test-drives`)
- Retomas / avalúos (`dealer/trade-ins`)
- Financiamiento (`dealer/financing`)
- Entregas (`dealer/deliveries`)
- Expediente documental (`dealer/documents`)
- Aprobaciones comerciales (`dealer/approvals`)
- Postventa inicial (`dealer/after-sales`)
- Reportes (`dealer/reports`)
- Automatizaciones (`dealer/automations`)

### 2. Dashboard, historial e integraciones funcionales

- Dashboard de KPIs (`dealer/dashboard/overview`)
- Historial comercial consolidado (`dealer/history`)
- Estado de integraciones (`dealer/integrations/status`)
- Reportería ejecutiva y pipeline (`dealer/reports/executive`, `dealer/reports/pipeline`)
- Automatizaciones operativas (`dealer/automations/alerts`, `dealer/automations/run-checks`)

Rutas frontend incorporadas:

- `/empresa/concesionario/reports`
- `/empresa/concesionario/automations`
- `/empresa/concesionario/documents`
- `/empresa/concesionario/vehicles`
- `/empresa/concesionario/reservations`
- `/empresa/concesionario/quotes`
- `/empresa/concesionario/test-drives`
- `/empresa/concesionario/trade-ins`
- `/empresa/concesionario/financing`
- `/empresa/concesionario/deliveries`
- `/empresa/concesionario/approvals`
- `/empresa/concesionario/after-sales`
- `/empresa/concesionario/history`
- `/empresa/concesionario/integrations`

Coberturas de integración iniciales:

- Señales CRM (`leads` en canal `VEHICULOS`)
- Alertas de continuidad comercial:
  - reservas sin cotización
  - cotizaciones aprobadas sin financiamiento
  - financiamientos aprobados sin entrega
  - unidades entregadas con alerta de validación fiscal/contable

### 3. Reglas de negocio aplicadas

- Restricciones de transición de estado en:
  - `trade-ins`
  - `financing`
  - `deliveries`
- Sincronización de estado de unidad en hitos clave:
  - reserva activa -> unidad `RESERVED`
  - cotización convertida -> unidad `IN_DOCUMENTATION`
  - entrega realizada -> unidad `DELIVERED`

### 4. Homogeneización UI (List + Form)

Se aplicó el estándar funcional/visual de listados y formularios para concesionario:

- `CreateButton` como acción de alta.
- `Menu` contextual por fila con botón de acciones (engranaje).
- `DeleteConfirmDialog` con estado dedicado y loading de eliminación.
- `FormActionButtons` en `footer` de `Dialog`.
- `DataTable` con `header`, filtros, búsqueda, paginación `lazy`, `scrollable` y `sortMode="multiple"`.
- Formularios separados por submódulo, usando `react-hook-form` con `mode: "onBlur"`.
- Manejo centralizado de errores con `handleFormError`.

Submódulos homologados:

- unidades, reservas, cotizaciones, pruebas de manejo, retomas, financiamiento, entregas, documentos, aprobaciones, postventa.
- historial, integraciones, reportes, automatizaciones y dashboard alineados al mismo lenguaje visual de módulo.

### 5. Roles y permisos

- Permisos backend de concesionario incluidos en catálogo:
  - `dealer.view`
  - `dealer.create`
  - `dealer.update`
  - `dealer.delete`
  - `dealer.approve`
- Semillas de roles por empresa actualizadas para incluir permisos de concesionario.
- Catálogo de permisos frontend actualizado para mostrar grupo y etiquetas de concesionario.

## Pendiente para cierre funcional v1

1. Integración profunda con facturación/contabilidad:
   - vínculo transaccional explícito con `sales/orders`, `sales/invoices`, `sales/payments`
2. Reportería avanzada:
   - `dealer/reports` (embudo, tasas de conversión, aging, descuentos, tiempos de cierre)
3. Automatizaciones de negocio:
   - `dealer/automations` (SLA de seguimiento, vencimientos, alertas proactivas)
4. Trazabilidad documental completa:
   - checklist de entrega y expediente digital auditable.
5. Pruebas funcionales de punta a punta por flujo comercial:
   - lead → oportunidad → cotización → reserva → venta → facturación → entrega → postventa.
6. Convergencia final de contratos tipados frontend para submódulos dealer:
   - reducir `Record<string, unknown>` / `any` en servicios donde aplique.

## Nota técnica de compilación

Estado de compilación observado:

- Frontend (`npm run build`): en verde.
- Backend (`npm run build`): presenta errores heredados fuera del módulo concesionario en:

- `features/inventory/reservations`
- `features/workshop/serviceOrderMaterials`

Estos errores no corresponden a la implementación de concesionario y deben resolverse de forma transversal para obtener `tsc` en verde para todo el repositorio.
