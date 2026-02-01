# Módulo Workshop - Servicios de Taller

## Descripción General

El módulo Workshop gestiona todas las operaciones relacionadas con el taller automotriz, incluyendo:

- Órdenes de trabajo
- Servicios disponibles
- Facturación
- Pagos
- Estados y seguimiento de trabajos

## Entidades del Módulo

### 1. WorkOrder (Orden de Trabajo)

Documento principal que representa un trabajo a realizar en el taller.

**Campos:**

- `workOrderNumber` (string): Número único de orden
- `customer` (Customer | string): Cliente que solicita el trabajo
- `vehicle` (Vehicle | string): Vehículo del cliente
- `technician` (UserReference, opcional): Técnico asignado
- `status` (WorkOrderStatus | string): Estado actual de la orden
- `priority` ("low" | "medium" | "high" | "urgent"): Prioridad del trabajo
- `description` (string): Descripción del trabajo a realizar
- `estimatedCompletionDate` (Date, opcional): Fecha estimada de finalización
- `actualCompletionDate` (Date, opcional): Fecha real de finalización
- `totalAmount` (number): Monto total de la orden
- `items` (WorkOrderItem[]): Lista de servicios y repuestos
- `notes` (string, opcional): Notas adicionales
- `estado` ("activo" | "inactivo"): Estado del registro

### 2. WorkOrderItem (Item de Orden de Trabajo)

Elementos individuales dentro de una orden de trabajo (servicios o repuestos).

**Campos:**

- `service` (Service | string, opcional): Servicio a realizar
- `item` (any, opcional): Repuesto del inventario
- `description` (string): Descripción del item
- `quantity` (number): Cantidad
- `unitPrice` (number): Precio unitario
- `totalPrice` (number): Precio total
- `type` ("service" | "part"): Tipo de item
- `estado` ("activo" | "inactivo"): Estado del item

### 3. WorkOrderStatus (Estado de Orden de Trabajo)

Estados disponibles para las órdenes de trabajo.

**Campos:**

- `nombre` (string): Nombre del estado
- `descripcion` (string, opcional): Descripción del estado
- `color` (string, opcional): Color para UI
- `orden` (number): Orden de aparición
- `estado` ("activo" | "inactivo"): Estado del registro

### 4. Service (Servicio)

Servicios disponibles en el taller.

**Campos:**

- `name` (string): Nombre del servicio
- `description` (string): Descripción detallada
- `price` (number): Precio del servicio
- `category` (string): Categoría del servicio
- `estimatedHours` (number, opcional): Horas estimadas
- `estado` ("activo" | "inactivo"): Estado del servicio

### 5. Invoice (Factura)

Documentos de facturación generados desde órdenes de trabajo.

**Campos:**

- `invoiceNumber` (string): Número único de factura
- `workOrder` (WorkOrder | string, opcional): Orden de trabajo origen
- `customer` (Customer | string): Cliente facturado
- `issueDate` (Date): Fecha de emisión
- `dueDate` (Date): Fecha de vencimiento
- `subtotal` (number): Subtotal
- `tax` (number): Impuestos
- `discount` (number): Descuentos
- `total` (number): Total
- `status` ("borrador" | "emitida" | "pagada_parcial" | "pagada_total" | "vencida" | "cancelada"): Estado
- `items` (InvoiceItem[]): Items facturados
- `notes` (string, opcional): Notas

### 6. Payment (Pago)

Registros de pagos realizados por facturas.

**Campos:**

- `invoice` (Invoice | string): Factura pagada
- `amount` (number): Monto pagado
- `paymentDate` (Date): Fecha del pago
- `paymentMethod` ("efectivo" | "tarjeta" | "transferencia" | "cheque"): Método de pago
- `reference` (string, opcional): Referencia del pago
- `notes` (string, opcional): Notas
- `status` ("confirmado" | "pendiente" | "rechazado" | "cancelado"): Estado del pago

## Estructura de Archivos

```
# Interfaces
libs/interfaces/workshop/
└── workOrder.interface.ts          # Todas las interfaces del módulo

# Validaciones
libs/zods/
└── workshopZod.tsx                 # Schemas Zod para validación

# Servicios API
app/api/workshop/
├── index.ts                        # Exporta todos los servicios
├── workshopService.ts              # Servicios básicos del taller
├── workOrderService.ts             # CRUD órdenes de trabajo
├── serviceService.ts               # CRUD servicios
├── invoiceService.ts               # CRUD facturas
└── paymentService.ts               # CRUD pagos
```

## API Endpoints

### Work Orders

#### `GET /api/work-orders`

Obtiene órdenes de trabajo con filtros opcionales.

**Query Parameters:**

- `status` (string): Filtrar por estado
- `priority` (string): Filtrar por prioridad
- `customer` (string): ID del cliente
- `technician` (string): ID del técnico

#### `GET /api/work-orders/:id`

Obtiene orden de trabajo completa con historial.

#### `POST /api/work-orders`

Crea nueva orden de trabajo.

**Auth:** SuperAdmin

#### `PUT /api/work-orders/:id`

Actualiza orden de trabajo.

**Auth:** SuperAdmin

#### `DELETE /api/work-orders/:id`

Elimina orden de trabajo.

**Auth:** SuperAdmin

#### `POST /api/work-orders/:id/change-status`

Cambia el estado de una orden.

**Auth:** SuperAdmin

**Body:**

```json
{
  "status": "string",
  "notes": "string (optional)"
}
```

#### `GET /api/work-orders/:id/history`

Obtiene historial de cambios de la orden.

#### `GET /api/work-orders/:id/items`

Obtiene items de la orden.

#### `POST /api/work-orders/:id/items`

Agrega item a la orden.

**Auth:** SuperAdmin

#### `PUT /api/work-orders/:id/items/:itemId`

Actualiza item de la orden.

**Auth:** SuperAdmin

#### `DELETE /api/work-orders/:id/items/:itemId`

Elimina item de la orden.

**Auth:** SuperAdmin

### Work Order Statuses

#### `GET /api/work-orders/statuses`

Obtiene todos los estados disponibles.

#### `GET /api/work-orders/statuses/:id`

Obtiene estado específico.

#### `POST /api/work-orders/statuses`

Crea nuevo estado.

**Auth:** SuperAdmin

#### `PUT /api/work-orders/statuses/:id`

Actualiza estado.

**Auth:** SuperAdmin

#### `DELETE /api/work-orders/statuses/:id`

Elimina estado.

**Auth:** SuperAdmin

### Services

#### `GET /api/services`

Obtiene todos los servicios.

#### `GET /api/services/:id`

Obtiene servicio específico.

#### `POST /api/services`

Crea nuevo servicio.

**Auth:** SuperAdmin

**Body:**

```json
{
  "name": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "estimatedHours": "number (optional)"
}
```

#### `PUT /api/services/:id`

Actualiza servicio.

**Auth:** SuperAdmin

#### `DELETE /api/services/:id`

Elimina servicio.

**Auth:** SuperAdmin

### Invoices

#### `GET /api/invoices`

Obtiene facturas con filtros opcionales.

**Query Parameters:**

- `status` (string): Estado de la factura
- `customer` (string): ID del cliente
- `startDate` (Date): Fecha inicio
- `endDate` (Date): Fecha fin

#### `GET /api/invoices/:id`

Obtiene factura específica.

#### `POST /api/invoices`

Crea nueva factura.

**Auth:** SuperAdmin

#### `PUT /api/invoices/:id`

Actualiza factura.

**Auth:** SuperAdmin

#### `DELETE /api/invoices/:id`

Elimina factura.

**Auth:** SuperAdmin

#### `POST /api/invoices/:id/emit`

Emite factura (cambia estado a "emitida").

#### `POST /api/invoices/from-work-order/:workOrderId`

Crea factura desde orden de trabajo.

#### `GET /api/invoices/reports/accounts-receivable`

Obtiene reporte de cuentas por cobrar.

### Payments

#### `GET /api/payments`

Obtiene pagos con filtros opcionales.

**Query Parameters:**

- `invoice` (string): ID de factura
- `status` (string): Estado del pago
- `startDate` (Date): Fecha inicio
- `endDate` (Date): Fecha fin

#### `GET /api/payments/:id`

Obtiene pago específico.

#### `POST /api/payments`

Crea nuevo pago.

**Auth:** SuperAdmin

**Body:**

```json
{
  "invoice": "string",
  "amount": "number",
  "paymentDate": "Date",
  "paymentMethod": "efectivo|tarjeta|transferencia|cheque",
  "reference": "string (optional)",
  "notes": "string (optional)"
}
```

#### `PUT /api/payments/:id`

Actualiza pago.

**Auth:** SuperAdmin

#### `DELETE /api/payments/:id`

Elimina pago.

**Auth:** SuperAdmin

## Estados Disponibles

### Órdenes de Trabajo

- Estados personalizables vía `/api/work-orders/statuses`

### Facturas

- `borrador`: Factura en preparación
- `emitida`: Factura emitida al cliente
- `pagada_parcial`: Pagada parcialmente
- `pagada_total`: Pagada completamente
- `vencida`: Vencida sin pago
- `cancelada`: Cancelada

### Pagos

- `confirmado`: Pago confirmado
- `pendiente`: Pago pendiente de confirmación
- `rechazado`: Pago rechazado
- `cancelado`: Pago cancelado

## Flujo de Trabajo Típico

1. **Crear Orden de Trabajo**

   - Cliente llega con vehículo
   - Técnico crea orden con diagnóstico inicial
   - Se asignan servicios y repuestos necesarios

2. **Ejecutar Trabajo**

   - Técnico actualiza estado de la orden
   - Se agregan/modifican items según sea necesario
   - Se registra progreso y notas

3. **Facturación**

   - Al completar trabajo, se crea factura desde orden
   - Factura se emite al cliente
   - Se registra pago

4. **Cierre**
   - Orden se marca como completada
   - Factura se marca como pagada
   - Historial queda registrado

## Validación con Zod

### Ejemplo: Crear Orden de Trabajo

```typescript
import { workOrderSchema, WorkOrderFormData } from "@/libs/zods/workshopZod";

const formData: WorkOrderFormData = {
  workOrderNumber: "WO-2024-001",
  customer: "customer_id",
  vehicle: "vehicle_id",
  status: "status_id",
  priority: "medium",
  description: "Cambio de aceite y filtros",
  totalAmount: 150.0,
  items: [
    {
      description: "Cambio de aceite",
      quantity: 1,
      unitPrice: 100.0,
      totalPrice: 100.0,
      type: "service",
    },
    {
      description: "Filtro de aceite",
      quantity: 1,
      unitPrice: 50.0,
      totalPrice: 50.0,
      type: "part",
    },
  ],
};

// Validar datos
const validation = workOrderSchema.safeParse(formData);
if (validation.success) {
  // Datos válidos, enviar a API
  await createWorkOrder(validation.data);
} else {
  // Mostrar errores
  console.error(validation.error.errors);
}
```

## Próximos Pasos

- Ver documentación de API completa: `/docs/api/workshop-api.md`
- Ver guías de creación de componentes: `/docs/guides/creating-components.md`
- Ver ejemplos de flujos de trabajo: `/docs/guides/workshop-workflows.md`
