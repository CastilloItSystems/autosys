# Implementación Técnica — Módulo de Concesionario

> Documento de referencia para el equipo de desarrollo.
> Resume el estado objetivo y la implementación sugerida del módulo de concesionario de AutoSys.

---

## Tabla de contenidos

1. Resumen ejecutivo
2. Base existente reutilizable
3. Modelos Prisma sugeridos
4. Backend — estructura y endpoints
5. Frontend — páginas
6. Frontend — componentes
7. Integraciones críticas
8. Flujos de negocio a implementar
9. Decisiones de diseño

---

## 1. Resumen ejecutivo

El módulo de concesionario debe cubrir el ciclo comercial completo de venta de vehículos:

```text
Lead → Oportunidad → Cotización → Reserva → Financiamiento/Pago → Facturación → Entrega → Postventa inicial
```

AutoSys ya tiene piezas fuertes en CRM, inventario y ventas, por lo que la implementación recomendada es **componer** esas capacidades y añadir los submódulos que hoy faltan:

- unidades comerciales
- reservas
- pruebas de manejo
- retomas/avalúos
- expediente documental
- entregas comerciales
- tablero operativo del concesionario

---

## 2. Base existente reutilizable

### 2.1. CRM

Ya implementado:

- leads
- oportunidades
- actividades
- cotizaciones
- campañas
- clientes
- `CustomerVehicle`

Uso en concesionario:

- el canal base es `VEHICULOS`
- las oportunidades de concesionario deben nacer aquí

### 2.2. Inventory

Ya implementado:

- marcas
- modelos
- tipos `VEHICLE`
- compatibilidad y catálogos

Uso en concesionario:

- alimentar catálogo y metadatos de unidades

### 2.3. Sales

Ya implementado:

- orders
- preInvoices
- invoices
- payments

Uso en concesionario:

- orquestar cierre comercial y fiscal del negocio

### 2.4. Frontend actual

Ya existe:

- `/frontend/app/empresa/concesionario/page.tsx`

Situación:

- sirve como base UX/visual
- no debe seguir siendo una demo aislada
- debe migrar a consumo real del módulo

---

## 3. Modelos Prisma sugeridos

Se recomienda crear una carpeta:

```text
backend/prisma/models/dealer/
```

### 3.1. `dealerUnit.prisma`

Representa la unidad comercial vendible.

Campos sugeridos:

- `id`
- `empresaId`
- `brandId`
- `modelId`
- `version`
- `year`
- `vin`
- `engineSerial`
- `plate`
- `condition`
- `mileage`
- `colorExterior`
- `colorInterior`
- `fuelType`
- `transmission`
- `listPrice`
- `promoPrice`
- `commercialStatus`
- `location`
- `isDemo`
- `isPublished`

### 3.2. `dealerReservation.prisma`

- `id`
- `empresaId`
- `dealerUnitId`
- `customerId`
- `opportunityId`
- `quoteId`
- `reservedByUserId`
- `reservedAt`
- `expiresAt`
- `depositAmount`
- `depositCurrency`
- `status`
- `cancellationReason`

### 3.3. `dealerTestDrive.prisma`

- `id`
- `empresaId`
- `dealerUnitId`
- `customerId`
- `opportunityId`
- `advisorUserId`
- `scheduledAt`
- `startedAt`
- `finishedAt`
- `route`
- `result`
- `notes`
- `status`

### 3.4. `dealerTradeIn.prisma`

- `id`
- `empresaId`
- `customerId`
- `customerVehicleId`
- `opportunityId`
- `quoteId`
- `estimatedValue`
- `approvedValue`
- `status`
- `inspectorUserId`
- `notes`

### 3.5. `dealerApproval.prisma`

- `id`
- `empresaId`
- `entityType`
- `entityId`
- `approvalType`
- `requestedByUserId`
- `approvedByUserId`
- `status`
- `reason`
- `requestedAt`
- `resolvedAt`

### 3.6. `dealerDocument.prisma`

- `id`
- `empresaId`
- `customerId`
- `opportunityId`
- `orderId`
- `documentType`
- `fileUrl`
- `status`
- `validatedByUserId`
- `validatedAt`
- `notes`

### 3.7. `dealerDelivery.prisma`

- `id`
- `empresaId`
- `dealerUnitId`
- `customerId`
- `orderId`
- `invoiceId`
- `deliveredByUserId`
- `deliveredAt`
- `odometer`
- `conformitySignature`
- `notes`
- `status`

### 3.8. Relaciones a reusar

- `Customer`
- `CustomerVehicle`
- `Lead`
- `Opportunity`
- `Quote`
- `Order`
- `Invoice`

---

## 4. Backend — estructura y endpoints

Todos los endpoints pueden montarse bajo:

```text
/api/dealer
```

### 4.1. Unidades — `/dealer/units`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar unidades |
| POST | `/` | Crear unidad |
| GET | `/:id` | Obtener unidad |
| PUT | `/:id` | Actualizar unidad |
| PATCH | `/:id/status` | Cambiar estado comercial |
| DELETE | `/:id` | Desactivar unidad |

### 4.2. Reservas — `/dealer/reservations`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar reservas |
| POST | `/` | Crear reserva |
| GET | `/:id` | Obtener reserva |
| PATCH | `/:id/renew` | Renovar reserva |
| PATCH | `/:id/cancel` | Cancelar reserva |
| PATCH | `/:id/convert` | Convertir a negocio |

### 4.3. Pruebas de manejo — `/dealer/test-drives`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar |
| POST | `/` | Programar |
| GET | `/:id` | Obtener |
| PATCH | `/:id/start` | Iniciar |
| PATCH | `/:id/finish` | Finalizar |
| PATCH | `/:id/cancel` | Cancelar |

### 4.4. Retomas — `/dealer/trade-ins`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar |
| POST | `/` | Crear solicitud |
| GET | `/:id` | Obtener |
| PUT | `/:id` | Actualizar avalúo |
| PATCH | `/:id/approve` | Aprobar |
| PATCH | `/:id/reject` | Rechazar |

### 4.5. Aprobaciones — `/dealer/approvals`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar |
| POST | `/` | Solicitar aprobación |
| PATCH | `/:id/approve` | Aprobar |
| PATCH | `/:id/reject` | Rechazar |

### 4.6. Documentos — `/dealer/documents`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar expediente |
| POST | `/` | Cargar documento |
| PATCH | `/:id/validate` | Validar |
| PATCH | `/:id/reject` | Rechazar |
| DELETE | `/:id` | Eliminar |

### 4.7. Financiamiento — `/dealer/financing`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar solicitudes |
| POST | `/` | Crear solicitud |
| GET | `/:id` | Obtener |
| PATCH | `/:id/status` | Cambiar estado |

### 4.8. Entregas — `/dealer/deliveries`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar entregas |
| POST | `/` | Registrar entrega |
| GET | `/:id` | Obtener |
| PATCH | `/:id/complete` | Completar entrega |

### 4.9. Dashboard / reportes

| Submódulo | Ruta base | Descripción |
|---|---|---|
| Dashboard | `/dealer/dashboard` | KPIs, alertas, pipeline, reservas, entregas |
| Reportes | `/dealer/reports` | Ventas, conversión, reservas, descuentos, entregas |
| Automatizaciones | `/dealer/automations` | Alertas y reglas operativas |

---

## 5. Frontend — páginas

Rutas propuestas bajo `/empresa/concesionario/`:

| Ruta | Descripción |
|---|---|
| `/` | Dashboard operativo del concesionario |
| `/units` | Catálogo operativo de unidades |
| `/opportunities` | Oportunidades del canal vehículos |
| `/quotations` | Cotizaciones de vehículo |
| `/reservations` | Reservas |
| `/test-drives` | Pruebas de manejo |
| `/trade-ins` | Retomas y avalúos |
| `/approvals` | Bandeja de aprobaciones |
| `/documents` | Expedientes documentales |
| `/financing` | Solicitudes de financiamiento |
| `/deals/[id]` | Vista 360 del negocio |
| `/deliveries` | Entregas programadas y completadas |
| `/reports` | Reportes comerciales |

---

## 6. Frontend — componentes

### 6.1. Shared

```text
frontend/components/dealer/shared/
```

Componentes sugeridos:

- `DealerStatusBadge`
- `DealerTimeline`
- `DealerQuickActions`
- `ApprovalStatusChip`
- `DocumentChecklistPanel`
- `MoneySummaryPanel`
- `UnitIdentityCard`

### 6.2. Units

- `DealerUnitList`
- `DealerUnitForm`
- `DealerUnitCard`
- `DealerUnitFilters`
- `DealerUnitDetail`

### 6.3. Reservations

- `ReservationList`
- `ReservationForm`
- `ReservationSummaryCard`

### 6.4. Opportunities / deals

- `VehicleOpportunityBoard`
- `DealerDealDetail`
- `DealHeader`
- `DealFinancialPanel`
- `DealDocumentsPanel`
- `DealActivityPanel`

### 6.5. Deliveries

- `DeliveryList`
- `DeliveryForm`
- `DeliveryChecklist`
- `DeliveryActaPreview`

---

## 7. Integraciones críticas

## 7.1. Dealer ↔ CRM

- leads/orígenes
- oportunidades
- actividades
- clientes
- cotizaciones

## 7.2. Dealer ↔ Inventory

- marcas/modelos
- datos técnicos base
- accesorios cuando existan como items inventariables

## 7.3. Dealer ↔ Sales

- orden de venta
- pre-factura
- factura
- pago

## 7.4. Dealer ↔ Workshop

- activación de postventa
- garantía inicial
- primer mantenimiento

---

## 8. Flujos de negocio a implementar

### 8.1. Flujo mínimo viable

```text
Lead CRM
  → Opportunity VEHICULOS
  → Quote VEHICLE
  → DealerReservation
  → Validación documental
  → Sales Order / Invoice
  → DealerDelivery
```

### 8.2. Flujo con retoma

```text
Opportunity
  → TradeIn request
  → TradeIn approval
  → Quote adjusted
  → Reservation / closing
```

### 8.3. Flujo con financiamiento

```text
Opportunity
  → Quote
  → FinancingRequest
  → Approval / rejection
  → Sales flow
  → Delivery
```

---

## 9. Decisiones de diseño

- El módulo no debe reemplazar CRM, sino especializarlo para el canal vehículos.
- Las unidades comerciales deben ser entidades propias; un modelo genérico no basta para disponibilidad real.
- La entrega comercial del concesionario es distinta a la entrega de taller y requiere su propio flujo.
- La experiencia actual de `/empresa/concesionario` debe evolucionar de catálogo demo a dashboard operativo.
- La facturación debe seguir apoyándose en `sales`, no en lógica duplicada.

