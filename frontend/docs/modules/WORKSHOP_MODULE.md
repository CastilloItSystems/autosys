# Workshop Module - Órdenes de Trabajo

## Overview

Module for managing workshop work orders, including vehicle service requests, repairs, and maintenance tracking.

## Structure

### Interfaces

- **Location**: `/libs/interfaces/workshop/`
- **Files**:
  - `workOrderStatus.interface.ts` - Work order status definitions
  - `workOrderMain.interface.ts` - Main work order entity and related types
  - `index.ts` - Exports aggregator

### Zod Schemas

- **Location**: `/libs/zods/workshop/`
- **Files**:
  - `workOrderStatusZod.tsx` - Validation for work order statuses
  - `workOrderZod.tsx` - Validation for work orders
  - `index.tsx` - Exports aggregator

### API Services

- **Location**: `/app/api/workshop/`
- **Files**:
  - `workOrderService.ts` - Work order CRUD operations
  - `serviceService.ts` - Workshop services management
  - `invoiceService.ts` - Invoice management
  - `paymentService.ts` - Payment processing
  - `workshopService.ts` - General workshop operations

### Components

- **Location**: `/components/workshop/work-orders/`
- **Files**:
  - `WorkOrderList.tsx` - DataTable view with pagination, filters, and CRUD operations
  - `WorkOrderForm.tsx` - Form for creating/editing work orders

### Pages

- **Location**: `/app/(autosys)/autosys/workshop/`
- **Routes**:
  - `/autosys/workshop` - Work orders list page

## Features

### Work Order Management

- **CRUD Operations**: Create, read, update, and delete work orders
- **Customer Assignment**: Link work orders to customers from CRM
- **Vehicle Assignment**: Link work orders to vehicles from CRM
- **Technician Assignment**: Assign technicians to work orders
- **Status Tracking**: Dynamic status management with colors and icons
- **Priority Levels**: baja, normal, alta, urgente
- **Cost Tracking**: Subtotals for parts, services, discounts, tax, and total cost
- **Time Tracking**: Days elapsed since work order creation
- **Estimated Delivery**: Date and time estimation for completion

### Work Order List Features

- **Pagination**: Backend-driven pagination with configurable page size
- **Global Search**: Filter work orders by any field
- **Custom Columns**:
  - Order number
  - Customer (name + phone)
  - Vehicle plate
  - Status (with dynamic color and icon)
  - Priority (with severity badges)
  - Assigned technician
  - Mileage (formatted)
  - Total cost (currency format)
  - Days elapsed (with color coding)
- **Actions**: Edit and delete with confirmation
- **Animation**: Smooth page transitions with framer-motion

### Work Order Form Features

- **Customer Selection**: Dropdown with search filter
- **Vehicle Selection**: Filtered by selected customer
- **Technician Assignment**: Optional technician selection
- **Status Management**: Dynamic status options from backend
- **Priority Selection**: Four priority levels
- **Text Fields**: Motivo, descripción del problema, observaciones
- **Number Fields**: Kilometraje, subtotals, descuento, impuesto, total
- **Date Picker**: Fecha estimada de entrega with time selection
- **Validation**: Zod schema validation with error messages
- **Edit Mode**: Auto-populate form for editing existing work orders

## API Endpoints

### Work Orders

- `GET /work-orders` - List all work orders with filters and pagination
- `GET /work-orders/:id` - Get single work order by ID
- `POST /work-orders` - Create new work order
- `PUT /work-orders/:id` - Update work order
- `DELETE /work-orders/:id` - Delete work order
- `PUT /work-orders/:id/estado` - Change work order status

### Work Order Statuses

- `GET /work-order-statuses` - List all available statuses
- `POST /work-order-statuses` - Create new status
- `PUT /work-order-statuses/:id` - Update status
- `DELETE /work-order-statuses/:id` - Delete status

## Data Structure

### WorkOrder Entity

```typescript
{
  _id: string;
  numeroOrden: string;
  customer: CustomerReference | string;
  vehicle: VehicleReference | string;
  motivo: string;
  kilometraje: number;
  tecnicoAsignado?: TechnicianReference | string;
  estado: WorkOrderStatusReference | string;
  prioridad: "baja" | "normal" | "alta" | "urgente";
  descripcionProblema?: string;
  observaciones?: string;
  subtotalRepuestos: number;
  subtotalServicios: number;
  descuento: number;
  impuesto: number;
  costoTotal: number;
  fechaApertura: Date | string;
  fechaEstimadaEntrega?: Date | string;
  eliminado: boolean;
  diasTranscurridos: number;
}
```

### API Response Structure

All API responses follow this structure:

```typescript
{
  success: boolean;
  data: T | T[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Dependencies

### Required Services

- **Customer Service**: For customer selection
- **Vehicle Service**: For vehicle selection (filtered by customer)
- **User Service**: For technician selection
- **Work Order Status Service**: For status management

### UI Libraries

- **PrimeReact**: DataTable, Dialog, Dropdown, InputText, InputNumber, InputTextarea, Calendar, Tag, Button, Toast
- **react-hook-form**: Form state management
- **Zod**: Schema validation
- **framer-motion**: Page animations

## Usage

### Creating a New Work Order

1. Navigate to `/autosys/workshop`
2. Click "Crear Orden de Trabajo" button
3. Select customer (required)
4. Select vehicle (filtered by customer, required)
5. Enter motivo (reason for service, required)
6. Enter kilometraje (mileage, required)
7. Select prioridad (priority, required)
8. Select estado (status, required)
9. Optionally assign a technician
10. Optionally add descripción del problema and observaciones
11. Optionally set fecha estimada de entrega
12. Click "Guardar"

### Editing a Work Order

1. From the work order list, click the edit button
2. Update any fields as needed
3. Click "Guardar"

### Deleting a Work Order

1. From the work order list, click the delete button
2. Confirm the deletion in the dialog
3. Work order is soft-deleted (eliminado = true)

## Menu Integration

Work orders are accessible from the main menu:

- **Menu Section**: Taller
- **Menu Item**: Órdenes de Trabajo
- **Icon**: pi-file-edit
- **Route**: `/autosys/workshop`

## Future Enhancements

- Service line items management
- Invoice generation from work orders
- Payment tracking
- Status change history
- File attachments (photos, documents)
- Email notifications
- Print/PDF export
- Advanced filtering (date range, cost range, etc.)
