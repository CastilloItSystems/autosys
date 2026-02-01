# Módulo de Inventario (Inventory)

## Descripción General

El módulo de Inventario es el núcleo del sistema de gestión de recursos del taller. Permite administrar todos los elementos necesarios para las operaciones diarias, incluyendo clientes, proveedores, productos, movimientos de stock, órdenes de compra y venta, y la gestión completa del almacén.

## Características Principales

- ✅ **Gestión de Clientes**: Registro y administración completa de información de clientes
- ✅ **Gestión de Proveedores**: Control de proveedores y relaciones comerciales
- ✅ **Catálogo de Productos**: Items, modelos, categorías, marcas y unidades de medida
- ✅ **Control de Inventario**: Seguimiento de stock, movimientos y alertas
- ✅ **Órdenes de Compra**: Gestión de adquisiciones y recepción de mercancía
- ✅ **Órdenes de Venta**: Procesamiento de ventas y envíos
- ✅ **Reservas**: Sistema de reservas de productos
- ✅ **Gestión de Almacenes**: Múltiples ubicaciones y transferencias
- ✅ **Flota de Vehículos**: Registro y mantenimiento de vehículos de clientes

## Estructura del Módulo

### 1. Interfaces (TypeScript)

**Ubicación:** `/libs/interfaces/inventory/`

#### Interfaces Principales

```typescript
// Cliente
interface Customer {
  _id?: string;
  nombre: string;
  tipo: "persona" | "empresa";
  rif?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado: "activo" | "inactivo";
  vehicles?: Vehicle[];
}

// Proveedor
interface Supplier {
  _id?: string;
  nombre: string;
  rif?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado: "activo" | "inactivo";
}

// Item de Inventario
interface Item {
  _id?: string;
  nombre: string;
  descripcion?: string;
  categoria?: Category | string;
  marca?: Brand | string;
  modelo?: ItemModel | string;
  unidad?: Unit | string;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
  stockActual: number;
  estado: "activo" | "inactivo";
}

// Orden de Compra
interface PurchaseOrder {
  _id?: string;
  numeroOrden: string;
  proveedor: Supplier | string;
  fechaOrden: Date;
  fechaEsperada?: Date;
  estado: "pendiente" | "parcial" | "completa" | "cancelada";
  items: PurchaseOrderItem[];
  subtotal: number;
  impuesto: number;
  total: number;
}
```

### 2. Esquemas de Validación (Zod)

**Ubicación:** `/libs/zods/inventory/`

#### Archivos Principales

- `customerZod.ts` - Validación de clientes
- `supplierZod.ts` - Validación de proveedores
- `itemZod.ts` - Validación de items
- `purchaseOrderZod.ts` - Validación de órdenes de compra
- `salesOrderZod.ts` - Validación de órdenes de venta
- `vehicleZod.ts` - Validación de vehículos

### 3. Servicios API

**Ubicación:** `/app/api/inventory/`

#### Servicios Disponibles

- `customerService.ts` - Gestión de clientes
- `supplierService.ts` - Gestión de proveedores
- `itemService.ts` - Gestión de items de inventario
- `categoryService.ts` - Gestión de categorías
- `brandService.ts` - Gestión de marcas
- `unitService.ts` - Gestión de unidades de medida
- `warehouseService.ts` - Gestión de almacenes
- `movementService.ts` - Gestión de movimientos de stock
- `purchaseOrderService.ts` - Gestión de órdenes de compra
- `salesOrderService.ts` - Gestión de órdenes de venta
- `reservationService.ts` - Gestión de reservas

### 4. Componentes

**Ubicación:** `/components/inventory/`

#### Estructura por Submódulo

##### Clientes (`customers/`)

- `CustomerList.tsx` - Lista de clientes con filtros y búsqueda
- `CustomerForm.tsx` - Formulario de creación/edición de clientes

##### Proveedores (`suppliers/`)

- `SupplierList.tsx` - Lista de proveedores
- `SupplierForm.tsx` - Formulario de proveedores

##### Items (`items/`)

- `ItemList.tsx` - Catálogo de productos
- `ItemForm.tsx` - Formulario de items

##### Categorías (`categories/`)

- `CategoryList.tsx` - Gestión de categorías de productos
- `CategoryForm.tsx` - Formulario de categorías

##### Marcas (`brands/`)

- `BrandList.tsx` - Gestión de marcas
- `BrandForm.tsx` - Formulario de marcas

##### Unidades (`units/`)

- `UnitList.tsx` - Unidades de medida
- `UnitForm.tsx` - Formulario de unidades

##### Almacenes (`warehouses/`)

- `WarehouseList.tsx` - Gestión de almacenes
- `WarehouseForm.tsx` - Formulario de almacenes

##### Movimientos (`movements/`)

- `MovementList.tsx` - Historial de movimientos de stock
- `MovementForm.tsx` - Registro de movimientos

##### Órdenes de Compra (`purchaseOrders/`)

- `PurchaseOrderList.tsx` - Lista de órdenes de compra
- `PurchaseOrderForm.tsx` - Formulario de órdenes de compra
- `ReceiveOrderDialog.tsx` - Recepción de mercancía

##### Órdenes de Venta (`salesOrders/`)

- `SalesOrderList.tsx` - Lista de órdenes de venta
- `SalesOrderForm.tsx` - Formulario de órdenes de venta
- `ConfirmOrderDialog.tsx` - Confirmación de órdenes
- `ShipOrderDialog.tsx` - Envío de mercancía

##### Reservas (`reservations/`)

- `ReservationList.tsx` - Gestión de reservas
- `ReservationForm.tsx` - Formulario de reservas

##### Stock (`stocks/`)

- `StockList.tsx` - Control de inventario por almacén
- `StockForm.tsx` - Ajustes de stock

##### Vehículos (`vehicles/`)

- `VehicleList.tsx` - Flota de vehículos de clientes
- `VehicleForm.tsx` - Registro de vehículos

## Funcionalidades por Submódulo

### Gestión de Clientes

- **Registro completo**: Nombre, tipo (persona/empresa), RIF, teléfono, email, dirección
- **Estado activo/inactivo**: Control de clientes activos
- **Integración con vehículos**: Asociación automática de vehículos a clientes
- **Búsqueda y filtros**: Localización rápida de clientes
- **Historial**: Seguimiento de órdenes de trabajo por cliente

### Gestión de Proveedores

- **Información completa**: Datos de contacto y fiscales
- **Evaluación**: Calificación y seguimiento de proveedores
- **Historial de compras**: Registro de todas las transacciones
- **Estados**: Control de proveedores activos/inactivos

### Catálogo de Productos

- **Items de inventario**: Productos, repuestos, accesorios
- **Clasificación jerárquica**: Categorías, subcategorías, marcas, modelos
- **Precios duales**: Costo de compra y precio de venta
- **Control de stock**: Niveles mínimos, stock actual, alertas
- **Unidades de medida**: Configuración flexible de unidades

### Control de Inventario

- **Múltiples almacenes**: Gestión de stock por ubicación
- **Movimientos detallados**: Entradas, salidas, transferencias, ajustes
- **Alertas de stock**: Notificaciones cuando se alcanzan niveles mínimos
- **Historial completo**: Trazabilidad de todos los movimientos
- **Reservas**: Sistema de apartado de productos

### Órdenes de Compra

- **Creación desde cotizaciones**: Conversión automática de cotizaciones
- **Seguimiento de estado**: Pendiente → Parcial → Completa
- **Recepción parcial**: Recepción de items por separado
- **Integración contable**: Cálculos automáticos de subtotales e impuestos
- **Historial de proveedores**: Optimización de compras

### Órdenes de Venta

- **Procesamiento de pedidos**: Desde cotización hasta entrega
- **Control de inventario**: Validación de stock disponible
- **Estados de orden**: Pendiente → Confirmada → Enviada → Entregada
- **Facturación integrada**: Generación automática de facturas
- **Seguimiento logístico**: Control de envíos y entregas

### Gestión de Almacenes

- **Múltiples ubicaciones**: Configuración de diferentes almacenes
- **Transferencias**: Movimiento de productos entre almacenes
- **Zonas y estanterías**: Organización física del almacén
- **Inventarios periódicos**: Conteos y ajustes de stock
- **Reportes**: Análisis de ocupación y rotación

## API Endpoints

### Clientes

- `GET /customers` - Listar clientes con filtros
- `POST /customers` - Crear cliente
- `PUT /customers/:id` - Actualizar cliente
- `DELETE /customers/:id` - Eliminar cliente

### Proveedores

- `GET /suppliers` - Listar proveedores
- `POST /suppliers` - Crear proveedor
- `PUT /suppliers/:id` - Actualizar proveedor
- `DELETE /suppliers/:id` - Eliminar proveedor

### Items

- `GET /items` - Listar items con filtros
- `POST /items` - Crear item
- `PUT /items/:id` - Actualizar item
- `DELETE /items/:id` - Eliminar item

### Órdenes de Compra

- `GET /purchase-orders` - Listar órdenes de compra
- `POST /purchase-orders` - Crear orden de compra
- `PUT /purchase-orders/:id` - Actualizar orden
- `PUT /purchase-orders/:id/receive` - Recibir mercancía

### Órdenes de Venta

- `GET /sales-orders` - Listar órdenes de venta
- `POST /sales-orders` - Crear orden de venta
- `PUT /sales-orders/:id` - Actualizar orden
- `PUT /sales-orders/:id/confirm` - Confirmar orden
- `PUT /sales-orders/:id/ship` - Enviar mercancía

### Movimientos

- `GET /movements` - Historial de movimientos
- `POST /movements` - Registrar movimiento

### Reservas

- `GET /reservations` - Listar reservas
- `POST /reservations` - Crear reserva
- `PUT /reservations/:id` - Actualizar reserva
- `DELETE /reservations/:id` - Cancelar reserva

## Integraciones

### Con Workshop

- **Órdenes de trabajo**: Asignación de items y servicios
- **Facturación**: Generación automática de facturas
- **Consumo de stock**: Reducción automática al completar trabajos

### Con CRM

- **Clientes**: Sincronización bidireccional
- **Vehículos**: Asociación con clientes y órdenes de trabajo

### Con Contabilidad

- **Facturación**: Registro automático de ingresos
- **Compras**: Registro de gastos y cuentas por pagar
- **Inventario**: Valoración de stock y costeo

## Reportes y Analytics

- **Rotación de inventario**: Análisis de productos más vendidos
- **ABC Analysis**: Clasificación de productos por importancia
- **Tendencias de venta**: Análisis histórico de demanda
- **Rentabilidad por producto**: Márgenes y contribuciones
- **Eficiencia de proveedores**: Tiempos de entrega y calidad
- **Ocupación de almacén**: Utilización de espacio

## Seguridad y Permisos

- **Roles por módulo**: Control granular de acceso
- **Auditoría**: Registro de todas las operaciones
- **Validaciones**: Reglas de negocio automáticas
- **Backup**: Estrategias de respaldo de datos críticos

## Próximas Funcionalidades

- **Códigos de barras**: Lectura automática de productos
- **Integración IoT**: Sensores de inventario automático
- **Machine Learning**: Predicción de demanda
- **Blockchain**: Trazabilidad completa de productos
- **Realidad Aumentada**: Asistencia en picking y ubicación</content>

