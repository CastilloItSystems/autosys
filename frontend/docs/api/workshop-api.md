# API de Workshop - Documentación Completa

## Información General

- **Base URL:** `/api/work-orders`, `/api/services`, `/api/invoices`, `/api/payments`
- **Autenticación:** JWT Token requerido en header `Authorization: Bearer <token>`
- **Permisos de Escritura:** Rol SuperAdmin requerido para POST, PUT, DELETE

## Endpoints de Órdenes de Trabajo

### GET /api/work-orders

Obtiene la lista de órdenes de trabajo con filtros opcionales.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `status` (string, optional): Filtrar por estado
- `priority` (string, optional): Filtrar por prioridad ("low", "medium", "high", "urgent")
- `customer` (string, optional): ID del cliente
- `technician` (string, optional): ID del técnico

**Response 200:**

```json
[
  {
    "_id": "65abc123...",
    "workOrderNumber": "WO-2024-001",
    "customer": {
      "_id": "65abc456...",
      "nombre": "Juan Pérez"
    },
    "vehicle": {
      "_id": "65abc789...",
      "placa": "ABC-1234"
    },
    "technician": {
      "_id": "65abc012...",
      "nombre": "Carlos López"
    },
    "status": {
      "_id": "65abc345...",
      "nombre": "En Progreso"
    },
    "priority": "medium",
    "description": "Cambio de aceite y filtros",
    "estimatedCompletionDate": "2024-01-20T00:00:00.000Z",
    "totalAmount": 150.0,
    "estado": "activo",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### GET /api/work-orders/:id

Obtiene una orden de trabajo específica con historial completo.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Parameters:**

- `id` (string, required): ID de la orden de trabajo

**Response 200:**

```json
{
  "_id": "65abc123...",
  "workOrderNumber": "WO-2024-001",
  "customer": { ... },
  "vehicle": { ... },
  "technician": { ... },
  "status": { ... },
  "priority": "medium",
  "description": "Cambio de aceite y filtros",
  "totalAmount": 150.00,
  "items": [
    {
      "_id": "65abc678...",
      "description": "Cambio de aceite",
      "quantity": 1,
      "unitPrice": 100.00,
      "totalPrice": 100.00,
      "type": "service"
    }
  ],
  "history": [
    {
      "_id": "65abc901...",
      "fecha": "2024-01-15T10:30:00.000Z",
      "modificadoPor": {
        "_id": "65abc012...",
        "nombre": "Carlos López"
      },
      "cambios": {
        "status": { "from": "Pendiente", "to": "En Progreso" }
      }
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### POST /api/work-orders

Crea una nueva orden de trabajo.

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Permisos:** SuperAdmin

**Request Body:**

```json
{
  "workOrderNumber": "WO-2024-001",
  "customer": "65abc456...",
  "vehicle": "65abc789...",
  "technician": "65abc012...",
  "status": "65abc345...",
  "priority": "medium",
  "description": "Cambio de aceite y filtros",
  "estimatedCompletionDate": "2024-01-20T00:00:00.000Z",
  "totalAmount": 150.0,
  "items": [
    {
      "description": "Cambio de aceite",
      "quantity": 1,
      "unitPrice": 100.0,
      "totalPrice": 100.0,
      "type": "service"
    }
  ],
  "notes": "Vehículo en buen estado general"
}
```

**Validaciones:**

- `workOrderNumber` (required): String no vacío
- `customer` (required): ID válido de cliente
- `vehicle` (required): ID válido de vehículo
- `status` (required): ID válido de estado
- `priority` (required): "low" | "medium" | "high" | "urgent"
- `description` (required): String no vacío
- `totalAmount` (required): Number >= 0
- `items` (optional): Array de items válidos

---

### PUT /api/work-orders/:id

Actualiza una orden de trabajo existente.

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Permisos:** SuperAdmin

**Parameters:**

- `id` (string, required): ID de la orden a actualizar

**Request Body:** Igual que POST pero todos los campos opcionales

---

### DELETE /api/work-orders/:id

Elimina una orden de trabajo.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Permisos:** SuperAdmin

---

### POST /api/work-orders/:id/change-status

Cambia el estado de una orden de trabajo.

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Permisos:** SuperAdmin

**Parameters:**

- `id` (string, required): ID de la orden

**Request Body:**

```json
{
  "status": "65abc345...",
  "notes": "Trabajo completado satisfactoriamente"
}
```

---

### GET /api/work-orders/:id/history

Obtiene el historial de cambios de una orden.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

---

### GET /api/work-orders/:id/items

Obtiene los items de una orden de trabajo.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

---

### POST /api/work-orders/:id/items

Agrega un item a la orden de trabajo.

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Permisos:** SuperAdmin

**Request Body:**

```json
{
  "service": "65abc678...",
  "description": "Cambio de aceite",
  "quantity": 1,
  "unitPrice": 100.0,
  "totalPrice": 100.0,
  "type": "service"
}
```

---

### PUT /api/work-orders/:id/items/:itemId

Actualiza un item de la orden.

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Permisos:** SuperAdmin

---

### DELETE /api/work-orders/:id/items/:itemId

Elimina un item de la orden.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Permisos:** SuperAdmin

---

## Endpoints de Estados de Órdenes

### GET /api/work-orders/statuses

Obtiene todos los estados disponibles.

**Response 200:**

```json
[
  {
    "_id": "65abc345...",
    "nombre": "Pendiente",
    "descripcion": "Orden creada, esperando asignación",
    "color": "#FFA500",
    "orden": 1,
    "estado": "activo"
  },
  {
    "_id": "65abc346...",
    "nombre": "En Progreso",
    "descripcion": "Trabajo en ejecución",
    "color": "#0000FF",
    "orden": 2,
    "estado": "activo"
  }
]
```

### POST /api/work-orders/statuses

Crea un nuevo estado.

**Permisos:** SuperAdmin

**Request Body:**

```json
{
  "nombre": "Completado",
  "descripcion": "Trabajo finalizado",
  "color": "#00FF00",
  "orden": 3
}
```

---

## Endpoints de Servicios

### GET /api/services

Obtiene todos los servicios disponibles.

**Response 200:**

```json
[
  {
    "_id": "65abc678...",
    "name": "Cambio de Aceite",
    "description": "Cambio completo de aceite y filtro",
    "price": 100.0,
    "category": "Mantenimiento",
    "estimatedHours": 1.5,
    "estado": "activo"
  }
]
```

### POST /api/services

Crea un nuevo servicio.

**Permisos:** SuperAdmin

**Request Body:**

```json
{
  "name": "Cambio de Aceite",
  "description": "Cambio completo de aceite y filtro",
  "price": 100.0,
  "category": "Mantenimiento",
  "estimatedHours": 1.5
}
```

**Validaciones:**

- `name` (required): String no vacío
- `description` (required): String no vacío
- `price` (required): Number >= 0
- `category` (required): String no vacío
- `estimatedHours` (optional): Number >= 0

---

## Endpoints de Facturas

### GET /api/invoices

Obtiene facturas con filtros opcionales.

**Query Parameters:**

- `status` (string, optional): Estado de la factura
- `customer` (string, optional): ID del cliente
- `startDate` (Date, optional): Fecha inicio
- `endDate` (Date, optional): Fecha fin

**Response 200:**

```json
[
  {
    "_id": "65abc901...",
    "invoiceNumber": "INV-2024-001",
    "customer": {
      "_id": "65abc456...",
      "nombre": "Juan Pérez"
    },
    "issueDate": "2024-01-15T00:00:00.000Z",
    "dueDate": "2024-02-15T00:00:00.000Z",
    "subtotal": 150.0,
    "tax": 22.5,
    "discount": 0,
    "total": 172.5,
    "status": "emitida",
    "items": [
      {
        "description": "Cambio de aceite",
        "quantity": 1,
        "unitPrice": 100.0,
        "totalPrice": 100.0,
        "type": "service"
      }
    ]
  }
]
```

### POST /api/invoices

Crea una nueva factura.

**Permisos:** SuperAdmin

### POST /api/invoices/:id/emit

Emite una factura (cambia estado a "emitida").

**Permisos:** SuperAdmin

### POST /api/invoices/from-work-order/:workOrderId

Crea una factura desde una orden de trabajo completada.

**Permisos:** SuperAdmin

### GET /api/invoices/reports/accounts-receivable

Obtiene reporte de cuentas por cobrar.

**Response 200:**

```json
[
  {
    "customer": {
      "_id": "65abc456...",
      "nombre": "Juan Pérez"
    },
    "totalInvoices": 1500.00,
    "totalPaid": 1000.00,
    "totalPending": 500.00,
    "overdueAmount": 200.00,
    "invoices": [...]
  }
]
```

---

## Endpoints de Pagos

### GET /api/payments

Obtiene pagos con filtros opcionales.

**Query Parameters:**

- `invoice` (string, optional): ID de factura
- `status` (string, optional): Estado del pago
- `startDate` (Date, optional): Fecha inicio
- `endDate` (Date, optional): Fecha fin

### POST /api/payments

Crea un nuevo pago.

**Permisos:** SuperAdmin

**Request Body:**

```json
{
  "invoice": "65abc901...",
  "amount": 172.5,
  "paymentDate": "2024-01-20T00:00:00.000Z",
  "paymentMethod": "efectivo",
  "reference": "Pago en efectivo",
  "notes": "Pago completo de factura INV-2024-001"
}
```

**Validaciones:**

- `invoice` (required): ID válido de factura
- `amount` (required): Number > 0
- `paymentDate` (required): Date válida
- `paymentMethod` (required): "efectivo" | "tarjeta" | "transferencia" | "cheque"
- `reference` (optional): String
- `notes` (optional): String

---

## Estados Disponibles

### Órdenes de Trabajo

Estados personalizables a través de `/api/work-orders/statuses`

### Facturas

- `borrador`: Factura en preparación
- `emitida`: Factura emitida al cliente
- `pagada_parcial`: Pagada parcialmente
- `pagada_total`: Pagada completamente
- `vencida`: Vencida sin pago completo
- `cancelada`: Factura cancelada

### Pagos

- `confirmado`: Pago confirmado y procesado
- `pendiente`: Pago registrado pero pendiente de confirmación
- `rechazado`: Pago rechazado por el sistema bancario
- `cancelado`: Pago cancelado por el cliente o administrador

## Códigos de Estado HTTP

| Código | Significado                                |
| ------ | ------------------------------------------ |
| 200    | OK - Solicitud exitosa                     |
| 201    | Created - Recurso creado                   |
| 400    | Bad Request - Datos inválidos              |
| 401    | Unauthorized - Token inválido              |
| 403    | Forbidden - Sin permisos                   |
| 404    | Not Found - Recurso no encontrado          |
| 500    | Internal Server Error - Error del servidor |

## Ejemplos de Uso

### Crear Orden de Trabajo Completa

```typescript
import apiClient from "@/app/api/apiClient";

const createWorkOrder = async () => {
  const workOrderData = {
    workOrderNumber: "WO-2024-001",
    customer: "customer_id",
    vehicle: "vehicle_id",
    status: "status_id",
    priority: "medium",
    description: "Servicio completo de mantenimiento",
    totalAmount: 500.0,
    items: [
      {
        service: "service_id",
        description: "Cambio de aceite",
        quantity: 1,
        unitPrice: 100.0,
        totalPrice: 100.0,
        type: "service",
      },
    ],
  };

  try {
    const response = await apiClient.post("/api/work-orders", workOrderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating work order:", error);
  }
};
```

### Flujo Completo: Orden → Factura → Pago

```typescript
// 1. Crear orden de trabajo
const workOrder = await createWorkOrder(workOrderData);

// 2. Cambiar estado cuando se complete
await apiClient.post(`/api/work-orders/${workOrder._id}/change-status`, {
  status: "completed_status_id",
  notes: "Trabajo completado exitosamente",
});

// 3. Crear factura desde orden
const invoice = await apiClient.post(
  `/api/invoices/from-work-order/${workOrder._id}`
);

// 4. Emitir factura
await apiClient.post(`/api/invoices/${invoice._id}/emit`);

// 5. Registrar pago
const payment = await apiClient.post("/api/payments", {
  invoice: invoice._id,
  amount: invoice.total,
  paymentDate: new Date(),
  paymentMethod: "efectivo",
  notes: "Pago en efectivo",
});
```

## Notas Importantes

1. **Relaciones:** Todas las entidades están relacionadas (WorkOrder → Customer/Vehicle, Invoice → WorkOrder/Customer, Payment → Invoice)
2. **Validaciones:** Se validan todas las referencias antes de crear/actualizar
3. **Auditoría:** Todas las operaciones quedan registradas en el historial
4. **Estados:** Los cambios de estado se registran automáticamente en el historial
5. **Cálculos:** Los totales se calculan automáticamente basado en los items

## Soporte

Para soporte técnico contactar al equipo de desarrollo.
