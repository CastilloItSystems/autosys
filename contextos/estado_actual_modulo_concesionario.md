# Estado Actual — Módulo de Concesionario (AutoSys)

Fecha de actualización: 2026-04-15

## Resumen

Se encuentra implementada la base operativa v1 del módulo de concesionario bajo el prefijo:

- Backend: `/api/dealer/*`
- Frontend: `/empresa/concesionario/*`

El módulo dejó de ser una vista demo y ahora consume servicios reales para gestión comercial.

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

### 4. Roles y permisos

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

## Nota técnica de compilación

Actualmente el `build` de backend presenta errores heredados fuera del módulo concesionario en:

- `features/inventory/reservations`
- `features/workshop/serviceOrderMaterials`

Estos errores no corresponden a la implementación de concesionario y deben resolverse de forma transversal para obtener `tsc` en verde para todo el repositorio.
