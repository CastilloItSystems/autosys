# Documentación del Módulo de Inventario

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Modelos de Datos (Prisma)](#2-modelos-de-datos-prisma)
3. [Sub-módulos Funcionales](#3-sub-módulos-funcionales)
4. [Sistema de Eventos](#4-sistema-de-eventos)
5. [Sistema de Hooks](#5-sistema-de-hooks)
6. [Jobs en Background](#6-jobs-en-background)
7. [Analytics (Analítica)](#7-analytics-analítica)
8. [Integraciones](#8-integraciones)
9. [Reportes](#9-reportes)
10. [Utilidades Compartidas](#10-utilidades-compartidas)
11. [Flujos de Trabajo Principales](#11-flujos-de-trabajo-principales)
12. [Diagrama de Relaciones entre Entidades](#12-diagrama-de-relaciones-entre-entidades)

---

## 1. Visión General

El módulo de inventario es un **sistema completo de gestión de inventario** de nivel producción. Comprende más de **313 archivos TypeScript** y **60,000+ líneas de código**, organizados en **20+ sub-módulos**.

Todas las rutas se montan bajo `/api/inventory/*` a través del archivo principal `index.ts`.

### Arquitectura del módulo

El módulo sigue una arquitectura modular donde cada sub-módulo tiene su propia estructura:

- **Controller** — Maneja las peticiones HTTP y respuestas
- **Service** — Contiene la lógica de negocio
- **DTO** — Define los objetos de transferencia de datos
- **Validation** — Esquemas de validación con Zod
- **Interface** — Tipos e interfaces TypeScript
- **Routes** — Definición de rutas Express
- **Test** — Pruebas unitarias e integración

### Sub-módulos principales

| Sub-módulo | Ruta API | Descripción |
|---|---|---|
| Items | `/api/inventory/items` | Gestión de artículos |
| Stock | `/api/inventory/stock` | Control de existencias |
| Warehouses | `/api/inventory/warehouses` | Gestión de almacenes |
| Movements | `/api/inventory/movements` | Registro de movimientos |
| Purchase Orders | `/api/inventory/purchase-orders` | Órdenes de compra |
| Receives | `/api/inventory/receives` | Recepción de mercancía |
| Exit Notes | `/api/inventory/exit-notes` | Notas de salida |
| Adjustments | `/api/inventory/adjustments` | Ajustes de inventario |
| Cycle Counts | `/api/inventory/cycle-counts` | Conteos cíclicos |
| Reconciliations | `/api/inventory/reconciliations` | Conciliaciones |
| Batches | `/api/inventory/batches` | Gestión de lotes |
| Serial Numbers | `/api/inventory/serial-numbers` | Números de serie |
| Transfers | `/api/inventory/transfers` | Transferencias entre almacenes |
| Reservations | `/api/inventory/reservations` | Reservas de stock |
| Loans | `/api/inventory/loans` | Préstamos de equipos |
| Returns | `/api/inventory/returns` | Devoluciones |
| Suppliers | `/api/inventory/suppliers` | Proveedores |
| Analytics | `/api/inventory/analytics` | Analítica e inteligencia |
| Reports | `/api/inventory/reports` | Reportes y exportaciones |

---

## 2. Modelos de Datos (Prisma)

El módulo utiliza **32 modelos Prisma** organizados en `prisma/models/inventory/`. A continuación se documenta cada modelo con sus campos, tipos y propósito.

---

### 2.1 Catálogos

#### Brand (Marca)

**Archivo**: `brand.prisma`

Las marcas agrupan artículos, modelos y repuestos por fabricante.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `code` | String (unique) | Código de la marca (ej: "TOY", "CHE") |
| `name` | String | Nombre de la marca (ej: "Toyota", "Chevrolet") |
| `type` | Enum: `VEHICLE`, `PART`, `BOTH` | Tipo de marca |
| `isActive` | Boolean | Si la marca está activa |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Relaciones**: `items[]` (artículos de esta marca), `models[]` (modelos de esta marca)

---

#### Category (Categoría)

**Archivo**: `category.prisma`

Las categorías organizan los artículos de forma **jerárquica** (árbol de categorías). Una categoría puede tener sub-categorías hijas.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `code` | String (unique) | Código de categoría |
| `name` | String | Nombre (ej: "Filtros", "Aceites", "Frenos") |
| `parentId` | UUID? (FK → Category) | Categoría padre (para jerarquía) |
| `defaultMargin` | Decimal(5,2) | Margen de ganancia por defecto (%) |
| `isActive` | Boolean | Si la categoría está activa |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Relaciones**: `parent` (categoría padre), `children[]` (sub-categorías hijas), `items[]` (artículos en esta categoría)

**Nota**: La auto-referencia `parentId → Category` permite crear árboles como:
```
Repuestos
├── Filtros
│   ├── Filtros de Aceite
│   └── Filtros de Aire
├── Frenos
│   ├── Pastillas
│   └── Discos
└── Aceites
```

---

#### Unit (Unidad de Medida)

**Archivo**: `unit.prisma`

Define las unidades de medida para los artículos.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `code` | String (unique) | Código (ej: "UND", "LTR", "KG") |
| `name` | String | Nombre completo (ej: "Unidad", "Litro") |
| `abbreviation` | String (unique) | Abreviatura (ej: "und", "L", "kg") |
| `type` | Enum: `COUNTABLE`, `WEIGHT`, `VOLUME`, `LENGTH` | Tipo de medida |
| `isActive` | Boolean | Si está activa |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Relaciones**: `items[]` (artículos que usan esta unidad)

---

#### Model (Modelo)

**Archivo**: `model.prisma`

Representa modelos de vehículos, piezas o genéricos. Se vincula con una marca y puede tener especificaciones técnicas en JSON.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `brandId` | UUID (FK → Brand) | Marca a la que pertenece |
| `code` | String | Código del modelo |
| `name` | String | Nombre (ej: "Corolla", "Hilux") |
| `year` | Int? | Año del modelo |
| `type` | Enum: `VEHICLE`, `PART`, `GENERIC` | Tipo de modelo |
| `specifications` | Json? | Especificaciones técnicas (viscosidad, capacidad, etc.) |
| `isActive` | Boolean | Si está activo |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Restricción única compuesta**: `[brandId, code, name, year, type]` — No puede haber dos modelos idénticos.

**Relaciones**: `brand` (marca del modelo), `items[]` (artículos asociados), `partCompatibilities[]`, `vehicleCompatibilities[]` (compatibilidades pieza ↔ vehículo)

---

#### ModelCompatibility (Compatibilidad de Modelos)

**Archivo**: `modelCompatibility.prisma`

Tabla intermedia que define **qué piezas son compatibles con qué vehículos**. Permite responder preguntas como "¿qué filtros sirven para un Toyota Corolla 2020?".

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `partModelId` | UUID (FK → Model) | Modelo de la pieza/repuesto |
| `vehicleModelId` | UUID (FK → Model) | Modelo del vehículo |
| `isVerified` | Boolean | Si un técnico verificó la compatibilidad |
| `notes` | String? | Notas adicionales |
| `createdAt` | DateTime | Fecha de creación |

**Restricción única compuesta**: `[partModelId, vehicleModelId]` — Sin duplicados.

---

### 2.2 Entidades Core

#### Item (Artículo)

**Archivo**: `item.prisma`

El **modelo central** del inventario. Representa cualquier artículo almacenado: repuestos, aceites, filtros, herramientas, etc.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `sku` | String (unique) | Código SKU auto-generado |
| `barcode` | String? (unique) | Código de barras (opcional) |
| `name` | String | Nombre del artículo |
| `description` | String? | Descripción detallada |
| `brandId` | UUID (FK → Brand) | Marca del artículo |
| `categoryId` | UUID (FK → Category) | Categoría del artículo |
| `modelId` | UUID? (FK → Model) | Modelo asociado (opcional) |
| `unitId` | UUID (FK → Unit) | Unidad de medida |
| `location` | String? | Ubicación física en almacén (formato "M1-R01-D03") |
| `costPrice` | Decimal(12,2) | Precio de costo |
| `salePrice` | Decimal(12,2) | Precio de venta |
| `wholesalePrice` | Decimal(12,2)? | Precio al mayor |
| `minStock` | Int | Stock mínimo (genera alerta si baja) |
| `maxStock` | Int | Stock máximo (genera alerta si sube) |
| `reorderPoint` | Int | Punto de reorden (cuándo pedir más) |
| `isSerialized` | Boolean | Si el artículo se rastrea por número de serie |
| `hasBatch` | Boolean | Si se maneja por lotes |
| `hasExpiry` | Boolean | Si tiene fecha de vencimiento |
| `allowNegativeStock` | Boolean | Si permite stock negativo |
| `technicalSpecs` | Json? | Especificaciones técnicas en formato JSON |
| `tags` | String[] | Etiquetas de búsqueda |
| `isActive` | Boolean | Si está activo |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Relaciones principales**:
- `brand`, `category`, `model`, `unit` — Catálogos
- `stocks[]` — Existencias por almacén
- `movements[]` — Historial de movimientos
- `batches[]` — Lotes del artículo
- `serialNumbers[]` — Números de serie
- `images[]` — Imágenes del artículo
- `pricing` — Precios escalonados
- `reservations[]` — Reservas activas
- `purchaseOrderItems[]` — Líneas de órdenes de compra
- `exitNoteItems[]` — Líneas de notas de salida
- `adjustmentItems[]` — Líneas de ajustes
- `cycleCountItems[]` — Líneas de conteos cíclicos
- `reconciliationItems[]` — Líneas de conciliaciones
- `loanItems[]` — Líneas de préstamos
- `returnOrderItems[]` — Líneas de devoluciones
- `transferItems[]` — Líneas de transferencias

---

#### Stock (Existencias)

**Archivo**: `stock.prisma`

Registra las **cantidades en tiempo real** de cada artículo en cada almacén. Este es el modelo que responde a "¿cuántos tengo?".

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `itemId` | UUID (FK → Item, Cascade) | Artículo |
| `warehouseId` | UUID (FK → Warehouse, Cascade) | Almacén |
| `quantityReal` | Int | Cantidad física real en el almacén |
| `quantityReserved` | Int | Cantidad reservada (comprometida para ventas/órdenes) |
| `quantityAvailable` | Int | Cantidad disponible = Real - Reservada |
| `averageCost` | Decimal(12,2) | Costo promedio ponderado |
| `lastMovementAt` | DateTime? | Fecha del último movimiento |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Restricción única compuesta**: `[itemId, warehouseId]` — Solo un registro de stock por artículo por almacén.

**Nota importante**: La `quantityAvailable` siempre debe cumplir `quantityAvailable = quantityReal - quantityReserved`. Cuando se reserva stock, se incrementa `quantityReserved` y se decrementa `quantityAvailable`.

---

#### Warehouse (Almacén)

**Archivo**: `warehouse.prisma`

Representa un almacén o ubicación de almacenamiento.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `code` | String (unique) | Código del almacén (ej: "ALM-01") |
| `name` | String | Nombre del almacén |
| `type` | Enum: `PRINCIPAL`, `SUCURSAL`, `TRANSITO` | Tipo de almacén |
| `address` | String? | Dirección física |
| `isActive` | Boolean | Si está activo |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Tipos de almacén**:
- **PRINCIPAL** — Almacén principal de la empresa
- **SUCURSAL** — Almacén en una sucursal
- **TRANSITO** — Almacén virtual para mercancía en tránsito entre almacenes

**Relaciones**: `stocks[]`, `movementsFrom[]`, `movementsTo[]`, `exitNotes[]`, `purchaseOrders[]`, `adjustments[]`, `cycleCounts[]`, `reconciliations[]`, `loans[]`, `returnOrders[]`, `serialNumbers[]`, `transfersFrom[]`, `transfersTo[]`

---

#### Movement (Movimiento)

**Archivo**: `movement.prisma`

Registra **absolutamente todos los movimientos** de inventario. Es el **libro de registro** (audit trail) completo del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `movementNumber` | String (unique) | Número auto-generado (ej: "MOV-2026-00001") |
| `type` | Enum (ver abajo) | Tipo de movimiento |
| `itemId` | UUID (FK → Item) | Artículo movido |
| `warehouseFromId` | UUID? (FK → Warehouse) | Almacén de origen (para salidas) |
| `warehouseToId` | UUID? (FK → Warehouse) | Almacén de destino (para entradas) |
| `quantity` | Int | Cantidad movida |
| `unitCost` | Decimal(12,2)? | Costo unitario |
| `totalCost` | Decimal(12,2)? | Costo total del movimiento |
| `batchId` | UUID? (FK → Batch) | Lote asociado (trazabilidad) |
| `reference` | String? | Referencia cruzada libre |
| `purchaseOrderId` | String? | ID de orden de compra relacionada |
| `workOrderId` | String? | ID de orden de trabajo de taller |
| `reservationId` | String? | ID de reserva relacionada |
| `exitNoteId` | String? | ID de nota de salida relacionada |
| `invoiceId` | String? | ID de factura relacionada |
| `exitType` | String? | Tipo de salida especial |
| `notes` | String? | Notas/observaciones |
| `createdBy` | String? | Usuario que creó el movimiento |
| `approvedBy` | String? | Usuario que aprobó |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Tipos de movimiento** (`type`):

| Tipo | Descripción |
|---|---|
| `PURCHASE` | Entrada por compra (recepción de mercancía) |
| `SALE` | Salida por venta |
| `ADJUSTMENT_IN` | Ajuste positivo (incremento) |
| `ADJUSTMENT_OUT` | Ajuste negativo (decremento) |
| `TRANSFER` | Transferencia entre almacenes |
| `SUPPLIER_RETURN` | Devolución a proveedor |
| `WORKSHOP_RETURN` | Devolución desde taller |
| `RESERVATION_RELEASE` | Liberación de reserva |
| `LOAN_OUT` | Salida por préstamo |
| `LOAN_RETURN` | Retorno de préstamo |

---

### 2.3 Compras y Recepción

#### Supplier (Proveedor)

**Archivo**: `supplier.prisma`

Gestiona la información de los proveedores de mercancía.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `code` | String (unique) | Código del proveedor |
| `name` | String | Nombre/razón social |
| `contactName` | String? | Nombre del contacto |
| `email` | String? | Correo electrónico |
| `phone` | String? | Teléfono |
| `address` | String? | Dirección |
| `taxId` | String? | RIF / Identificación fiscal |
| `isActive` | Boolean | Si está activo |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Relaciones**: `purchaseOrders[]` (órdenes de compra emitidas a este proveedor)

---

#### PurchaseOrder (Orden de Compra)

**Archivo**: `purchaseOrder.prisma`

Representa una **orden de compra a un proveedor**. Tiene un ciclo de vida completo desde borrador hasta completada.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `orderNumber` | String (unique) | Número auto-generado (formato: "PO-YYYY-00001") |
| `supplierId` | UUID (FK → Supplier) | Proveedor destino |
| `warehouseId` | UUID (FK → Warehouse) | Almacén donde se recibirá |
| `status` | Enum (ver abajo) | Estado actual |
| `subtotal` | Decimal(12,2) | Subtotal sin impuestos |
| `tax` | Decimal(12,2) | Monto de impuestos |
| `total` | Decimal(12,2) | Total con impuestos |
| `expectedDate` | DateTime? | Fecha esperada de entrega |
| `notes` | String? | Observaciones |
| `createdBy` | String? | Usuario que creó la orden |
| `approvedBy` | String? | Usuario que aprobó |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Estados** (`status`):

| Estado | Descripción |
|---|---|
| `DRAFT` | Borrador, aún se puede editar |
| `SENT` | Enviada al proveedor |
| `PARTIAL` | Recepción parcial (algunos artículos recibidos) |
| `COMPLETED` | Todos los artículos recibidos |
| `CANCELLED` | Cancelada |

**Relaciones**: `supplier`, `warehouse`, `items[]` (líneas de la orden), `receives[]` (recepciones vinculadas)

---

#### PurchaseOrderItem (Línea de Orden de Compra)

**Archivo**: `purchaseOrderItem.prisma`

Cada línea de una orden de compra con las cantidades pedidas vs recibidas.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `purchaseOrderId` | UUID (FK → PurchaseOrder, Cascade) | Orden de compra |
| `itemId` | UUID (FK → Item) | Artículo solicitado |
| `quantityOrdered` | Int | Cantidad pedida |
| `quantityReceived` | Int | Cantidad recibida hasta ahora |
| `quantityPending` | Int | Cantidad pendiente de recibir |
| `unitCost` | Decimal(12,2) | Costo unitario |
| `subtotal` | Decimal(12,2) | Subtotal de la línea |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Nota**: `quantityPending = quantityOrdered - quantityReceived`. Se actualiza automáticamente al registrar recepciones.

---

#### Receive (Recepción de Mercancía)

**Archivo**: `receive.prisma`

Registra la **recepción física** de mercancía de una orden de compra. Una orden puede tener múltiples recepciones (recepciones parciales).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `receiveNumber` | String (unique) | Número auto-generado ("REC-YYYY-00001") |
| `purchaseOrderId` | UUID (FK → PurchaseOrder) | Orden de compra asociada |
| `receivedBy` | String? | Persona que recibió la mercancía |
| `notes` | String? | Observaciones de la recepción |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Relaciones**: `purchaseOrder`, `items[]` (líneas de recepción)

**¿Qué pasa al crear una recepción?**:
1. Se incrementa `quantityReceived` en `PurchaseOrderItem`
2. Se decrementa `quantityPending`
3. Se crea/actualiza el registro de `Stock` del artículo en el almacén
4. Se genera un `Movement` de tipo `PURCHASE`
5. Si todos los artículos están recibidos, la orden pasa a `COMPLETED`; si no, a `PARTIAL`

---

#### ReceiveItem (Línea de Recepción)

**Archivo**: `receiveItem.prisma`

Detalle de cada artículo recibido en una recepción.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `receiveId` | UUID (FK → Receive, Cascade) | Recepción padre |
| `purchaseOrderItemId` | UUID (FK → PurchaseOrderItem) | Línea de la orden original |
| `itemId` | UUID (FK → Item) | Artículo recibido |
| `quantityReceived` | Int | Cantidad recibida en esta entrega |
| `unitCost` | Decimal(12,2) | Costo unitario real |
| `batchNumber` | String? | Número de lote (si aplica) |
| `expiryDate` | DateTime? | Fecha de vencimiento del lote |
| `notes` | String? | Observaciones |
| `createdAt` | DateTime | Fecha de creación |

---

### 2.4 Salidas de Inventario

#### ExitNote (Nota de Salida)

**Archivo**: `exitNote.prisma`

Gestiona **todas las salidas de inventario** con un flujo de trabajo multi-paso. Soporta **11 tipos diferentes** de salida.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `exitNoteNumber` | String (unique) | Número auto-generado |
| `type` | Enum (ver abajo) | Tipo de salida |
| `status` | Enum (ver abajo) | Estado actual del flujo |
| `preInvoiceId` | UUID? (FK unique → PreInvoice) | Pre-factura vinculada (para ventas) |
| `warehouseId` | UUID (FK → Warehouse) | Almacén de salida |
| `recipientName` | String? | Nombre del receptor |
| `recipientId` | String? | Identificación del receptor |
| `recipientPhone` | String? | Teléfono del receptor |
| `expectedReturnDate` | DateTime? | Fecha esperada de devolución (préstamos) |
| `returnedAt` | DateTime? | Fecha real de devolución |
| `loanId` | UUID? (FK unique → Loan) | Préstamo vinculado |
| `notes` | String? | Observaciones |
| `createdBy` | String? | Usuario creador |
| `preparedBy` | String? | Usuario que preparó la salida |
| `deliveredBy` | String? | Usuario que entregó |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Tipos de salida** (`type`):

| Tipo | Descripción |
|---|---|
| `SALE` | Venta (vinculada a pre-factura) |
| `WARRANTY` | Salida por garantía |
| `LOAN` | Préstamo de equipo/pieza |
| `INTERNAL_USE` | Uso interno de la empresa |
| `SAMPLE` | Muestra para cliente |
| `DONATION` | Donación |
| `OWNER_PICKUP` | Retiro por el propietario |
| `DEMO` | Demostración |
| `TRANSFER` | Transferencia entre almacenes |
| `OTHER` | Otro tipo de salida |
| `LOAN_RETURN` | Devolución de préstamo |

**Estados del flujo** (`status`):

| Estado | Descripción |
|---|---|
| `PENDING` | Pendiente, recién creada |
| `IN_PROGRESS` | En preparación (se está haciendo el picking) |
| `READY` | Lista para entrega (picking completado) |
| `DELIVERED` | Entregada al receptor |
| `CANCELLED` | Cancelada |

---

#### ExitNoteItem (Línea de Nota de Salida)

**Archivo**: `exitNoteItem.prisma`

Cada artículo incluido en una nota de salida.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `exitNoteId` | UUID (FK → ExitNote, Cascade) | Nota de salida padre |
| `itemId` | UUID (FK → Item) | Artículo a despachar |
| `quantity` | Int | Cantidad a despachar |
| `pickedFromLocation` | String? | Ubicación desde donde se tomó (ej: "M1-R01-D03") |
| `batchId` | UUID? (FK → Batch) | Lote del que se toma (trazabilidad FIFO) |
| `serialNumberId` | UUID? (FK → SerialNumber) | Número de serie específico |
| `notes` | String? | Observaciones |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

---

### 2.5 Ajustes e Inventario Físico

#### Adjustment (Ajuste de Inventario)

**Archivo**: `adjustment.prisma`

Permite **corregir manualmente** las cantidades de stock. Requiere aprobación antes de aplicarse.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `adjustmentNumber` | String (unique) | Número auto-generado ("ADJ-YYYY-00001") |
| `warehouseId` | UUID (FK → Warehouse) | Almacén donde se aplica |
| `status` | Enum (ver abajo) | Estado del ajuste |
| `reason` | String | Motivo del ajuste |
| `notes` | String? | Observaciones adicionales |
| `createdBy` | String? | Usuario que creó el ajuste |
| `approvedBy` | String? | Usuario que aprobó |
| `approvedAt` | DateTime? | Fecha de aprobación |
| `appliedBy` | String? | Usuario que aplicó |
| `appliedAt` | DateTime? | Fecha de aplicación |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Estados** (`status`):

| Estado | Descripción |
|---|---|
| `DRAFT` | Borrador, editable |
| `APPROVED` | Aprobado, listo para aplicar |
| `APPLIED` | Aplicado, las cantidades de stock ya fueron modificadas |
| `REJECTED` | Rechazado por un supervisor |
| `CANCELLED` | Cancelado |

---

#### AdjustmentItem (Línea de Ajuste)

**Archivo**: `adjustmentItem.prisma`

Cada artículo dentro de un ajuste de inventario.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `adjustmentId` | UUID (FK → Adjustment, Cascade) | Ajuste padre |
| `itemId` | UUID (FK → Item) | Artículo a ajustar |
| `quantityChange` | Int | Cambio de cantidad (positivo = entrada, negativo = salida) |
| `currentQuantity` | Int? | Cantidad antes del ajuste |
| `newQuantity` | Int? | Cantidad después del ajuste |
| `reason` | String? | Motivo específico de esta línea |
| `createdAt` | DateTime | Fecha de creación |

**Restricción única compuesta**: `[adjustmentId, itemId]` — No se permite duplicar un artículo en el mismo ajuste.

---

#### CycleCount (Conteo Cíclico)

**Archivo**: `cycleCount.prisma`

Gestiona los **conteos físicos de inventario** con análisis de varianza (diferencia entre lo que dice el sistema y lo que hay realmente).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `cycleCountNumber` | String (unique) | Número auto-generado ("CC-YYYY-00001") |
| `warehouseId` | UUID (FK → Warehouse) | Almacén a contar |
| `status` | Enum (ver abajo) | Estado del conteo |
| `notes` | String? | Observaciones |
| `createdBy` | String? | Usuario que inició el conteo |
| `approvedBy` | String? | Usuario que aprobó |
| `approvedAt` | DateTime? | Fecha de aprobación |
| `appliedBy` | String? | Usuario que aplicó |
| `appliedAt` | DateTime? | Fecha de aplicación |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Estados** (`status`):

| Estado | Descripción |
|---|---|
| `DRAFT` | Borrador, se están seleccionando artículos |
| `IN_PROGRESS` | En progreso, se está contando físicamente |
| `APPROVED` | Las diferencias fueron revisadas y aprobadas |
| `APPLIED` | Las correcciones fueron aplicadas al stock |
| `REJECTED` | El conteo fue rechazado |
| `CANCELLED` | Cancelado |

---

#### CycleCountItem (Línea de Conteo Cíclico)

**Archivo**: `cycleCountItem.prisma`

Cada artículo dentro de un conteo cíclico, con la comparación sistema vs realidad.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `cycleCountId` | UUID (FK → CycleCount, Cascade) | Conteo padre |
| `itemId` | UUID (FK → Item) | Artículo contado |
| `expectedQuantity` | Int | Cantidad que dice el sistema |
| `countedQuantity` | Int? | Cantidad contada físicamente |
| `variance` | Int? | Diferencia = contada - esperada |
| `location` | String? | Ubicación donde se contó |
| `notes` | String? | Observaciones del conteo |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Ejemplo de uso**: Si el sistema dice 100 unidades y se cuentan 97, la varianza es -3. Esto genera un ajuste automático o una reconciliación manual.

---

#### Reconciliation (Conciliación)

**Archivo**: `reconciliation.prisma`

Proceso **formal** de corrección de discrepancias entre el stock del sistema y el stock físico. Puede originarse de un conteo cíclico, inventario físico o un error del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `reconciliationNumber` | String (unique) | Número auto-generado ("RC-YYYY-00001") |
| `warehouseId` | UUID (FK → Warehouse) | Almacén |
| `source` | Enum (ver abajo) | Origen de la conciliación |
| `status` | Enum: `DRAFT`, `IN_PROGRESS`, `APPROVED`, `APPLIED`, `REJECTED`, `CANCELLED` | Estado |
| `notes` | String? | Observaciones |
| `createdBy` | String? | Usuario creador |
| `approvedBy` | String? | Usuario aprobador |
| `approvedAt` | DateTime? | Fecha de aprobación |
| `appliedBy` | String? | Usuario que aplicó |
| `appliedAt` | DateTime? | Fecha de aplicación |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Orígenes** (`source`):

| Fuente | Descripción |
|---|---|
| `CYCLE_COUNT` | Originada por un conteo cíclico |
| `PHYSICAL_INVENTORY` | Inventario físico completo |
| `SYSTEM_ERROR` | Error del sistema detectado |
| `ADJUSTMENT` | Derivada de un ajuste |
| `OTHER` | Otro origen |

---

#### ReconciliationItem (Línea de Conciliación)

**Archivo**: `reconciliationItem.prisma`

Cada artículo dentro de una conciliación, mostrando la discrepancia.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `reconciliationId` | UUID (FK → Reconciliation, Cascade) | Conciliación padre |
| `itemId` | UUID (FK → Item) | Artículo |
| `systemQuantity` | Int | Cantidad registrada en el sistema |
| `expectedQuantity` | Int | Cantidad física real encontrada |
| `difference` | Int | Diferencia calculada |
| `notes` | String? | Observaciones |
| `createdAt` | DateTime | Fecha de creación |

---

### 2.6 Lotes y Números de Serie

#### Batch (Lote)

**Archivo**: `batch.prisma`

Gestiona **lotes de producción** para artículos que lo requieren (`hasBatch = true`). Permite trazabilidad FIFO (First In, First Out).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `batchNumber` | String (unique) | Número de lote |
| `itemId` | UUID (FK → Item) | Artículo del lote |
| `manufacturingDate` | DateTime? | Fecha de fabricación |
| `expiryDate` | DateTime? | Fecha de vencimiento |
| `initialQuantity` | Int | Cantidad inicial del lote |
| `currentQuantity` | Int | Cantidad actual disponible |
| `isActive` | Boolean | Si el lote está activo |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Relaciones**: `item`, `movements[]` (movimientos del lote), `exitNoteItems[]` (salidas que usaron este lote)

**Nota**: El sistema despacha primero los lotes más próximos a vencer (FIFO por `expiryDate`). Los jobs en background escanean lotes próximos a vencer (30 días) para generar alertas.

---

#### SerialNumber (Número de Serie)

**Archivo**: `serialNumber.prisma`

Rastrea **artículos individuales** por número de serie (para artículos con `isSerialized = true`). Se usa en equipos de alto valor, herramientas especiales, etc.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `serialNumber` | String (unique) | Número de serie único |
| `itemId` | UUID (FK → Item) | Artículo al que pertenece |
| `warehouseId` | UUID? (FK → Warehouse) | Almacén donde se encuentra actualmente |
| `status` | Enum (ver abajo) | Estado actual |
| `soldAt` | DateTime? | Fecha en que se vendió |
| `workOrderId` | String? | Orden de trabajo del taller vinculada |
| `notes` | String? | Observaciones |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Estados** (`status`):

| Estado | Descripción |
|---|---|
| `IN_STOCK` | En inventario, disponible |
| `SOLD` | Vendido |
| `DEFECTIVE` | Defectuoso |
| `WARRANTY` | En garantía/reclamo |
| `LOANED` | Prestado |

---

### 2.7 Logística

#### Transfer (Transferencia entre Almacenes)

**Archivo**: `transfer.prisma`

Gestiona el movimiento de mercancía **entre almacenes**.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `transferNumber` | String (unique) | Número auto-generado ("TRANS-YYYY-00001") |
| `fromWarehouseId` | UUID (FK → Warehouse) | Almacén de origen |
| `toWarehouseId` | UUID (FK → Warehouse) | Almacén de destino |
| `status` | Enum (ver abajo) | Estado |
| `quantity` | Int | Cantidad total transferida |
| `notes` | String? | Observaciones |
| `createdBy` | String? | Usuario creador |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Estados** (`status`):

| Estado | Descripción |
|---|---|
| `DRAFT` | Borrador |
| `IN_TRANSIT` | En tránsito (salió del origen, no ha llegado al destino) |
| `RECEIVED` | Recibida en el destino |
| `CANCELLED` | Cancelada |

**¿Qué pasa internamente?**:
1. Al pasar a `IN_TRANSIT`: se decrementa el stock en el almacén origen
2. Al pasar a `RECEIVED`: se incrementa el stock en el almacén destino
3. Se generan movimientos de tipo `TRANSFER` para trazabilidad
4. Se usa `$transaction` para garantizar atomicidad (todo o nada)

---

#### Reservation (Reserva de Stock)

**Archivo**: `reservation.prisma`

Permite **reservar stock** para un futuro consumo (ventas pendientes, órdenes de trabajo). El stock reservado se descuenta de `quantityAvailable` pero NO de `quantityReal`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `reservationNumber` | String (unique) | Número auto-generado ("RES-YYYY-00001") |
| `itemId` | UUID (FK → Item) | Artículo reservado |
| `warehouseId` | UUID (FK → Warehouse) | Almacén |
| `quantity` | Int | Cantidad reservada |
| `status` | Enum (ver abajo) | Estado de la reserva |
| `workOrderId` | String? | Orden de trabajo vinculada |
| `saleOrderId` | String? | Orden de venta vinculada |
| `exitNoteId` | String? | Nota de salida vinculada |
| `expiresAt` | DateTime? | Fecha de expiración automática |
| `notes` | String? | Observaciones |
| `createdBy` | String? | Usuario creador |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Estados** (`status`):

| Estado | Descripción |
|---|---|
| `ACTIVE` | Reserva activa, stock comprometido |
| `PENDING_PICKUP` | Pendiente de retiro |
| `CONSUMED` | El stock fue consumido (despachado) |
| `RELEASED` | Reserva liberada (el stock vuelve a estar disponible) |

---

#### Loan (Préstamo)

**Archivo**: `loan.prisma`

Gestiona el **ciclo de vida completo de préstamos** de equipos o piezas, desde la solicitud hasta la devolución.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `loanNumber` | String (unique) | Número auto-generado ("LOAN-YYYY-00001") |
| `borrowerName` | String | Nombre del prestatario |
| `borrowerId` | String? | ID del prestatario |
| `warehouseId` | UUID (FK → Warehouse) | Almacén de salida |
| `status` | Enum (ver abajo) | Estado del préstamo |
| `dueDate` | DateTime | Fecha de vencimiento |
| `notes` | String? | Observaciones |
| `createdBy` | String? | Usuario creador |
| `approvedBy` | String? | Usuario aprobador |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Estados** (`status`):

| Estado | Descripción |
|---|---|
| `DRAFT` | Borrador |
| `PENDING_APPROVAL` | Pendiente de aprobación |
| `APPROVED` | Aprobado |
| `ACTIVE` | Activo (equipo entregado al prestatario) |
| `RETURNED` | Devuelto |
| `OVERDUE` | Vencido (no devuelto a tiempo) |
| `CANCELLED` | Cancelado |

**Relaciones**: `warehouse`, `items[]` (líneas del préstamo), `exitNote` (nota de salida 1:1)

**Job de detección**: Un job en background revisa diariamente los préstamos activos y marca como `OVERDUE` aquellos cuya `dueDate` ya pasó.

---

#### ReturnOrder (Orden de Devolución)

**Archivo**: `return.prisma`

Gestiona **devoluciones** de mercancía hacia el almacén, ya sea de proveedores, talleres o clientes.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `returnNumber` | String (unique) | Número auto-generado ("RET-YYYY-00001") |
| `type` | Enum (ver abajo) | Tipo de devolución |
| `warehouseId` | UUID (FK → Warehouse) | Almacén de recepción |
| `status` | Enum: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `PROCESSED`, `REJECTED`, `CANCELLED` | Estado |
| `reason` | String? | Motivo de la devolución |
| `notes` | String? | Observaciones |
| `createdBy` | String? | Usuario creador |
| `approvedBy` | String? | Usuario aprobador |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Tipos de devolución** (`type`):

| Tipo | Descripción |
|---|---|
| `SUPPLIER_RETURN` | Devolución al proveedor (producto defectuoso, error en pedido) |
| `WORKSHOP_RETURN` | Devolución desde el taller (piezas sobrantes, piezas cambiadas) |
| `CUSTOMER_RETURN` | Devolución del cliente (garantía, error) |

---

### 2.8 Precios e Imágenes

#### Pricing (Precios Escalonados)

**Archivo**: `pricing.prisma`

Configuración avanzada de precios para un artículo, incluyendo márgenes y descuentos.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `itemId` | UUID (FK unique → Item) | Artículo (relación 1:1) |
| `costPrice` | Decimal(12,2) | Precio de costo |
| `salePrice` | Decimal(12,2) | Precio de venta |
| `wholesalePrice` | Decimal(12,2)? | Precio al mayor |
| `minMargin` | Decimal(5,2)? | Margen mínimo permitido (%) |
| `maxMargin` | Decimal(5,2)? | Margen máximo (%) |
| `discountPercentage` | Decimal(5,2)? | Porcentaje de descuento aplicable |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

**Relaciones**: `item` (1:1), `tiers[]` (escalas de precios por cantidad)

**PricingTier** (integrado en `pricing.prisma`):

| Campo | Tipo | Descripción |
|---|---|---|
| `minQuantity` | Int | Cantidad mínima para este precio |
| `maxQuantity` | Int? | Cantidad máxima |
| `price` | Decimal(12,2) | Precio especial para este rango |

---

#### ItemImage (Imagen de Artículo)

**Archivo**: `itemImage.prisma`

Imágenes asociadas a un artículo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `itemId` | UUID (FK → Item, Cascade) | Artículo |
| `url` | String | URL de la imagen |
| `isPrimary` | Boolean | Si es la imagen principal |
| `order` | Int | Orden de visualización |
| `createdAt` | DateTime | Fecha de creación |

---

### 2.9 Modelos Auxiliares

#### Event (Evento de Auditoría)

**Archivo**: `event.prisma`

Registro completo de **auditoría** de todo lo que sucede en el módulo de inventario. Captura **70+ tipos de eventos** cubriendo stock, ajustes, conteos, conciliaciones, préstamos, devoluciones, transferencias, números de serie, artículos, lotes y eventos del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `type` | Enum (70+ valores) | Tipo de evento |
| `entityId` | String | ID de la entidad afectada |
| `entityType` | String | Tipo de entidad (ej: "Item", "Stock", "Movement") |
| `userId` | String? | Usuario que disparó el evento |
| `eventData` | Json | Datos completos del evento (JSONB) |
| `priority` | Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Prioridad del evento |
| `createdAt` | DateTime | Fecha del evento |

**Uso**: Permite reconstruir el historial completo de cualquier entidad. Es la base para auditorías y trazabilidad.

---

#### StockAlert (Alerta de Stock)

**Archivo**: `stockAlert.prisma`

Alertas automáticas generadas cuando el stock alcanza condiciones críticas.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `itemId` | UUID (FK → Item) | Artículo que generó la alerta |
| `warehouseId` | UUID (FK → Warehouse) | Almacén |
| `type` | Enum (ver abajo) | Tipo de alerta |
| `severity` | String: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Severidad |
| `message` | String | Mensaje descriptivo |
| `isRead` | Boolean | Si alguien la ha visto |
| `createdAt` | DateTime | Fecha de la alerta |

**Tipos de alerta** (`type`):

| Tipo | Descripción |
|---|---|
| `LOW_STOCK` | Stock por debajo del mínimo |
| `OUT_OF_STOCK` | Sin stock (agotado) |
| `EXPIRING_SOON` | Lote próximo a vencer |
| `EXPIRED` | Lote vencido |
| `OVERSTOCK` | Stock por encima del máximo |

---

#### BulkOperation (Operación Masiva)

**Archivo**: `bulkOperation.prisma`

Rastrea operaciones de importación/exportación masiva de datos.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `type` | Enum: `IMPORT`, `EXPORT`, `UPDATE`, `DELETE` | Tipo de operación |
| `status` | Enum: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` | Estado |
| `totalRecords` | Int | Total de registros a procesar |
| `processedRecords` | Int | Registros procesados |
| `errorRecords` | Int | Registros con error |
| `errorDetails` | Json? | Detalle de los errores |
| `fileName` | String? | Archivo fuente |
| `createdBy` | String? | Usuario que inició la operación |
| `createdAt` | DateTime | Fecha de inicio |
| `completedAt` | DateTime? | Fecha de finalización |

---

## 3. Sub-módulos Funcionales

Cada sub-módulo se encuentra en `src/features/inventory/` y sigue la misma estructura: controller, service, DTO, validation, interface, routes.

---

### 3.1 Items (Artículos) — `items/`

**Qué hace**: Es el corazón del inventario. Gestiona el CRUD completo de artículos con:

- **Creación de artículos** con validación automática de que la marca, categoría, unidad y modelo existen y están activos
- **Generación automática de SKU** usando el `SKUGenerator` (basado en categoría + marca + secuencial)
- **Validación de ubicación** física con el `LocationValidator` (formato: "M1-R01-D03" = Módulo 1, Rack 01, División 03)
- **Cálculo de precios** con el `PriceCalculator` (márgenes, precios al mayor, descuentos)
- **Búsqueda avanzada** por nombre, SKU, código de barras, marca, categoría, tags
- **Filtros** por estado activo/inactivo, con/sin stock, vencimiento próximo

**Sub-carpetas dentro de `items/`**:

| Carpeta | Qué hace |
|---|---|
| `catalogs/` | CRUD de Marcas (`Brand`), Categorías (`Category`), Unidades (`Unit`), Modelos (`Model`) y Compatibilidades (`ModelCompatibility`) |
| `bulk/` | Importación masiva desde CSV/Excel, exportación de datos. Usa el modelo `BulkOperation` para rastrear progreso |
| `images/` | Subir, eliminar y reordenar imágenes de artículos. Usa el modelo `ItemImage` |
| `pricing/` | Gestión de precios escalonados por cantidad. Usa el modelo `Pricing` con `PricingTier` |
| `search/` | Servicio de búsqueda avanzada con múltiples filtros y ordenamiento |

---

### 3.2 Stock (Existencias) — `stock/`

**Qué hace**: Mantiene las **cantidades en tiempo real** de cada artículo en cada almacén. Es el que responde "¿cuántos hay disponibles?".

**Operaciones principales**:
- Consultar stock por artículo, por almacén o ambos
- Ajustar cantidades (incremento/decremento)
- Reservar y liberar stock
- Transferir stock entre almacenes
- Gestión de alertas de stock (crear, listar, marcar como leídas)

**Reglas de negocio**:
- `quantityAvailable = quantityReal - quantityReserved` (siempre)
- No se puede despachar más de `quantityAvailable` (excepto si `allowNegativeStock = true`)
- Al recibir mercancía, se incrementa `quantityReal` y `quantityAvailable`
- Al reservar, se incrementa `quantityReserved` y se decrementa `quantityAvailable`
- Se recalcula el `averageCost` (costo promedio ponderado) con cada nueva entrada

---

### 3.3 Warehouses (Almacenes) — `warehouses/`

**Qué hace**: CRUD de almacenes con los tres tipos soportados:

- **PRINCIPAL** — Almacén principal de la empresa
- **SUCURSAL** — En una sucursal o punto de venta
- **TRANSITO** — Virtual, para mercancía en camino entre almacenes

**Operaciones**: Crear, editar, desactivar almacenes. Consultar stock total por almacén.

---

### 3.4 Movements (Movimientos) — `movements/`

**Qué hace**: Mantiene el **registro completo de auditoría** de todo movimiento de inventario. Cada vez que cambia una cantidad de stock, se genera un movimiento.

**Operaciones**:
- Listar movimientos con filtros (tipo, artículo, almacén, rango de fechas)
- Consultar detalle de un movimiento
- Generar el número de movimiento automáticamente (`MovementNumberGenerator`)

**No permite**: Crear ni editar movimientos manualmente. Los movimientos se generan automáticamente por los otros sub-módulos (compras, ventas, ajustes, transferencias, etc.)

---

### 3.5 Purchase Orders (Órdenes de Compra) — `purchaseOrders/`

**Qué hace**: Gestiona el flujo completo de **compras a proveedores**:

1. **Crear orden** (`DRAFT`) — Se seleccionan artículos, cantidades y precios
2. **Enviar al proveedor** (`SENT`) — Se marca como enviada
3. **Recibir parcialmente** (`PARTIAL`) — Cuando llega solo una parte
4. **Completar** (`COMPLETED`) — Cuando se recibe todo
5. **Cancelar** (`CANCELLED`) — Si se cancela la compra

**Operaciones**: CRUD de órdenes, agregar/quitar líneas, cambiar estado, consultar pendientes por proveedor.

---

### 3.6 Receives (Recepciones) — `receives/`

**Qué hace**: Registra la **entrada física de mercancía** proveniente de una orden de compra.

**Flujo al crear una recepción**:
1. Se selecciona la orden de compra y los artículos a recibir
2. Se registran cantidades, costos reales, números de lote y fechas de vencimiento
3. **Automáticamente**:
   - Se actualiza `quantityReceived` y `quantityPending` en la orden
   - Se crea/actualiza registro de `Stock` en el almacén
   - Se genera un `Movement` de tipo `PURCHASE`
   - Se recalcula el `averageCost` del stock
   - La orden cambia a `PARTIAL` o `COMPLETED` según corresponda
   - Si el artículo tiene `hasBatch = true`, se crea un `Batch`

---

### 3.7 Exit Notes (Notas de Salida) — `exitNotes/`

**Qué hace**: Gestiona **todas las salidas de inventario** con un flujo multi-paso de preparación y entrega. Es uno de los módulos más complejos.

**Flujo de trabajo completo**:

```
PENDING → IN_PROGRESS → READY → DELIVERED
   ↓                               
CANCELLED                         
```

1. **PENDING** — Se crea la nota con los artículos a despachar
2. **IN_PROGRESS** — El almacenista genera la lista de picking y comienza a preparar
3. **READY** — Todos los artículos están preparados y verificados
4. **DELIVERED** — Se confirma la entrega al receptor
5. **CANCELLED** — Se puede cancelar en cualquier momento antes de entregar

**Sub-carpetas dentro de `exitNotes/`**:

| Carpeta | Qué hace |
|---|---|
| `preparation/` | Genera listas de picking (qué tomar, de qué ubicación, qué lote). Verifica existencias. Cambia estado a `IN_PROGRESS` → `READY` |
| `delivery/` | Confirma la entrega física al receptor. Registra datos del receptor. Cambia estado a `DELIVERED`. Decrementa stock |
| `items/` | Gestión a nivel de línea individual (agregar, quitar, modificar artículos de la nota) |
| `special/` | 7 controladores especializados por tipo de salida |

**Controladores especiales** (`special/`):

| Controlador | Tipo de salida | Descripción |
|---|---|---|
| Sale | `SALE` | Salida por venta, vinculada a pre-factura |
| Warranty | `WARRANTY` | Salida por garantía de un producto |
| Loan | `LOAN` | Préstamo de equipo, con fecha de devolución |
| InternalUse | `INTERNAL_USE` | Consumo interno de la empresa |
| Sample | `SAMPLE` | Muestra enviada a un cliente potencial |
| Donation | `DONATION` | Donación sin costo |
| OwnerPickup | `OWNER_PICKUP` | Retiro por el propietario del equipo |

---

### 3.8 Adjustments (Ajustes) — `adjustments/`

**Qué hace**: Permite **corregir manualmente** cantidades de stock cuando hay discrepancias detectadas.

**Flujo de aprobación**:

```
DRAFT → APPROVED → APPLIED
  ↓        ↓
CANCELLED  REJECTED
```

1. Se crea el ajuste con los artículos y las cantidades a aumentar o disminuir
2. Un supervisor lo revisa y aprueba (o rechaza)
3. Al aplicarse, se modifican las cantidades de stock y se generan movimientos de tipo `ADJUSTMENT_IN` o `ADJUSTMENT_OUT`

**Regla**: `quantityChange` positivo = entrada, negativo = salida.

---

### 3.9 Cycle Counts (Conteos Cíclicos) — `cycleCounts/`

**Qué hace**: Gestiona los **conteos físicos de inventario** programados. El sistema pre-carga las cantidades esperadas y el personal registra lo que realmente encuentra.

**Flujo**:

```
DRAFT → IN_PROGRESS → APPROVED → APPLIED
  ↓                      ↓
CANCELLED              REJECTED
```

1. **DRAFT** — Se seleccionan los artículos y el almacén a contar
2. **IN_PROGRESS** — El personal comienza a contar y registra `countedQuantity`
3. Se calcula automáticamente `variance = countedQuantity - expectedQuantity`
4. **APPROVED** — Un supervisor revisa las varianzas y aprueba
5. **APPLIED** — Se generan ajustes automáticos para corregir las diferencias

**Análisis de varianza**: Las discrepancias significativas pueden disparar una `Reconciliation` formal.

---

### 3.10 Reconciliations (Conciliaciones) — `reconciliations/`

**Qué hace**: Proceso **formal de corrección** cuando se detectan discrepancias importantes entre el sistema y la realidad física.

**Cuándo se usa**:
- Después de un conteo cíclico con varianzas grandes
- Cuando se detecta un error del sistema
- Después de un inventario físico completo

**Flujo**: Similar a ajustes (`DRAFT → IN_PROGRESS → APPROVED → APPLIED`), pero con mayor nivel de auditoría y aprobación.

---

### 3.11 Batches (Lotes) — `batches/`

**Qué hace**: Gestiona lotes de producción para artículos con `hasBatch = true`.

**Funcionalidades**:
- CRUD de lotes
- Consulta de lotes por artículo
- Filtro por estado activo/inactivo
- Despacho FIFO (primer lote en vencer, primero en salir)

**Sub-carpeta `expiry/`**: Servicio de detección de vencimientos que escanea lotes con fecha de vencimiento dentro de 30 días y genera alertas `EXPIRING_SOON` o `EXPIRED`.

---

### 3.12 Serial Numbers (Números de Serie) — `serialNumbers/`

**Qué hace**: Rastrea artículos individuales por número de serie. Cada unidad tiene su propio historial de estados.

**Operaciones**:
- Registrar nuevos números de serie al recibir mercancía
- Cambiar estado (`IN_STOCK` → `SOLD`, `LOANED`, `DEFECTIVE`, `WARRANTY`)
- Consultar historial de ubicación de un número de serie

**Sub-carpeta `tracking/`**: Servicio de seguimiento de ubicación y estado con historial completo.

---

### 3.13 Transfers (Transferencias) — `transfers/`

**Qué hace**: Gestiona **transferencias de mercancía entre almacenes**.

**Flujo**:

```
DRAFT → IN_TRANSIT → RECEIVED
  ↓
CANCELLED
```

1. Se crea la transferencia con los artículos y cantidades
2. Al enviarse (`IN_TRANSIT`): se decrementa el stock en el almacén origen
3. Al recibirse (`RECEIVED`): se incrementa el stock en el almacén destino
4. Se generan movimientos de tipo `TRANSFER` en ambos almacenes

**Validación**: Verifica que haya stock suficiente en el almacén origen antes de enviar.

---

### 3.14 Reservations (Reservas) — `reservations/`

**Qué hace**: Permite **apartar stock** para uso futuro sin sacarlo físicamente del almacén.

**Flujo de estados**:
- `ACTIVE` — Stock comprometido, no disponible para otros
- `PENDING_PICKUP` — Esperando retiro
- `CONSUMED` — El stock fue despachado (se generó nota de salida)
- `RELEASED` — La reserva se canceló y el stock volvió a estar disponible

**Expiración automática**: Si se define `expiresAt`, la reserva se libera automáticamente al pasar la fecha.

---

### 3.15 Loans (Préstamos) — `loans/`

**Qué hace**: Gestiona el **ciclo completo de préstamos de equipos**.

**Flujo**:

```
DRAFT → PENDING_APPROVAL → APPROVED → ACTIVE → RETURNED
  ↓                                      ↓
CANCELLED                              OVERDUE
```

1. Se crea el préstamo con el prestatario y los artículos
2. Se aprueba por un supervisor
3. Al activarse, se genera una `ExitNote` de tipo `LOAN` automáticamente
4. Si no se devuelve antes de `dueDate`, el job en background lo marca como `OVERDUE`
5. Al devolverse, se genera un movimiento `LOAN_RETURN` y se reingresa el stock

---

### 3.16 Returns (Devoluciones) — `returns/`

**Qué hace**: Gestiona **devoluciones** de mercancía al almacén.

**Tres tipos**:
- **Proveedor** — Devolver un artículo defectuoso al proveedor
- **Taller** — Piezas sobrantes o reemplazadas que regresan del taller
- **Cliente** — Devolución por garantía o error

**Flujo**: `DRAFT → PENDING_APPROVAL → APPROVED → PROCESSED`

**Sub-carpeta `items/`**: Permite aprobar, rechazar o reingresar artículos individualmente dentro de una devolución.

---

### 3.17 Suppliers (Proveedores) — `suppliers/`

**Qué hace**: CRUD simple de proveedores con datos de contacto e identificación fiscal (RIF).

---

## 4. Sistema de Eventos

**Ubicación**: `events/`

El sistema de eventos permite que los módulos reaccionen automáticamente cuando algo sucede. Hay **4 módulos de handlers** registrados centralmente.

---

### 4.1 stock.events (Eventos de Stock)

| Escucha | Qué hace |
|---|---|
| `BATCH_CREATED` | Actualiza las cantidades de stock del artículo |
| `BATCH_EXPIRED` | Crea movimientos de baja automática y actualiza stock |

---

### 4.2 movement.events (Eventos de Movimiento)

| Escucha | Qué hace |
|---|---|
| `TRANSFER_CREATED` | Crea movimientos preliminares |
| `TRANSFER_SENT` | Actualiza estado y decrementa stock en origen |
| `TRANSFER_RECEIVED` | Incrementa stock en destino |
| `RETURN_CREATED` | Registra devolución pendiente |
| `RETURN_APPROVED` | Prepara movimiento de reingreso |
| `RETURN_PROCESSED` | Ejecuta el reingreso y actualiza stock |

---

### 4.3 purchase.events (Eventos de Compra)

| Escucha | Qué hace |
|---|---|
| `PO_CREATED` | Registra evento de auditoría |
| `PO_APPROVED` | Registra aprobación |
| `PO_PARTIAL_RECEIPT` | Crea entradas de stock parciales y movimientos `PURCHASE` |
| `PO_RECEIVED` | Completa la recepción y marca la orden como `COMPLETED` |

---

### 4.4 reservation.events (Eventos de Reserva)

| Escucha | Qué hace |
|---|---|
| `RESERVATION_CREATED` | Incrementa `quantityReserved`, decrementa `quantityAvailable` |
| `RESERVATION_CONFIRMED` | Confirma y prepara para despacho |
| `RESERVATION_FULFILLED` | Marca como consumida |
| `RESERVATION_CANCELLED` | Libera stock reservado |
| `RESERVATION_EXPIRED` | Libera stock por expiración automática |

---

## 5. Sistema de Hooks

**Ubicación**: `hooks/`

Los hooks son un **pipeline de validación** que se ejecuta antes y después de cada movimiento de inventario. Garantizan la integridad de los datos.

### Hooks pre-movimiento (se ejecutan ANTES)

| Hook | Qué valida |
|---|---|
| `validateItem` | Que el artículo existe y está activo |
| `validateWarehouse` | Que el almacén existe y está activo |
| `validateStock` | Que hay stock suficiente para movimientos de salida |
| `validateAudit` | Que se proporcionan los datos de auditoría requeridos |

### Hooks post-movimiento (se ejecutan DESPUÉS)

| Hook | Qué hace |
|---|---|
| `updateStock` | Actualiza los saldos de stock (`quantityReal`, `quantityAvailable`) |
| `emitEvents` | Emite eventos para que otros módulos reaccionen |
| `createAlerts` | Crea alertas si el stock quedó por debajo del mínimo |

### Registro de hooks (`hook.registry.ts`)

Los hooks se registran centralmente y se ejecutan en orden. Se pueden añadir nuevos hooks sin modificar el código existente.

---

## 6. Jobs en Background

**Ubicación**: `jobs/`

Tareas programadas que se ejecutan automáticamente a intervalos regulares. Usan Bull Queue para encolamiento y procesamiento.

| Job | Horario | Qué hace |
|---|---|---|
| `calculateRotation` | Diario a las 2 AM | Clasifica artículos en A/B/C según la rotación de los últimos 90 días (principio de Pareto) |
| `generateAlerts` | Cada 6 horas | Escanea todos los artículos y genera alertas de: `LOW_STOCK`, `OUT_OF_STOCK`, `OVERSTOCK`, `EXPIRING_SOON`, `EXPIRED`, `DEAD_STOCK` |
| `syncStock` | Diario a las 3 AM | Reconcilia las cantidades de stock con el historial de movimientos. Si detecta discrepancias, las marca |
| `updateStockLevels` | Diario a las 4 AM | Recalcula los niveles óptimos de stock: punto de reorden, mínimos y máximos, basándose en patrones de demanda |
| `checkExpiry` | Diario | Escanea lotes con fecha de vencimiento dentro de los próximos 30 días y genera alertas |

### Cola de procesamiento (`queue.service.ts`)

Los jobs se procesan a través de una cola Bull con:
- Reintentos automáticos en caso de fallo
- Procesamiento en workers separados
- Priorización de tareas

---

## 7. Analytics (Analítica)

**Ubicación**: `analytics/`

Tres módulos de inteligencia de inventario.

---

### 7.1 Análisis ABC — `abc/`

**Qué hace**: Clasifica los artículos usando el **principio de Pareto (80/20)**:

| Clase | Criterio | Descripción |
|---|---|---|
| **A** | Top 80% del valor | Pocos artículos que representan la mayor parte del valor del inventario. Requieren máximo control |
| **B** | 80% - 95% del valor | Artículos de valor moderado. Control regular |
| **C** | 95% - 100% del valor | Muchos artículos de bajo valor. Control mínimo |

**Cálculo**: Multiplica `stock × unitPrice` para cada artículo, ordena de mayor a menor, y asigna clases según el porcentaje acumulado del valor total.

**Retorna**: Resumen con conteo por clase y clasificación individual de cada artículo.

---

### 7.2 Pronóstico de Demanda — `forecasting/`

**Qué hace**: Predice la demanda futura de cada artículo usando dos modelos estadísticos:

1. **Media móvil** — Promedio de los últimos N períodos
2. **Suavizado exponencial** — Promedio ponderado con factor α = 0.3 (da más peso a datos recientes)

**Retorna para cada artículo**:
- Pronóstico de demanda a 30, 60 y 90 días
- Tendencia: `INCREASING` (creciente), `DECREASING` (decreciente) o `STABLE` (estable)
- Riesgo de agotamiento (stock-out risk)
- Acción recomendada: `INCREASE_STOCK`, `MAINTAIN`, `REDUCE_STOCK` o `MONITOR`

---

### 7.3 Rotación de Inventario — `turnover/`

**Qué hace**: Mide qué tan rápido se mueve cada artículo.

**Métricas calculadas**:
- **Ratio de rotación** — Cuántas veces se "vacía y rellena" el inventario en un período
- **Días de inventario** (Days Inventory Outstanding) — Cuántos días de stock hay disponibles
- **Rotación mensual, trimestral y anual**
- **Puntuación de salud** del inventario

**Clasificación de artículos**:

| Categoría | Descripción |
|---|---|
| `FAST_MOVING` | Se mueve rápido, alta demanda |
| `MODERATE` | Rotación normal |
| `SLOW_MOVING` | Se mueve lento, revisar si reducir stock |
| `STATIC` | Sin movimiento durante el período, posible stock muerto |

---

## 8. Integraciones

**Ubicación**: `integrations/`

Tres módulos que conectan el inventario con otros sistemas de la empresa.

---

### 8.1 Contabilidad — `accounting/`

**Qué hace**: Contabiliza automáticamente los movimientos de inventario en el **libro mayor** (General Ledger) con asientos contables de débito y crédito.

**Mapeo de cuentas**:

| Tipo de movimiento | Débito | Crédito |
|---|---|---|
| `PURCHASE` (Compra) | Inventario (Activo) | Cuentas por Pagar |
| `SALE` (Venta) | Costo de Ventas (Gasto) | Inventario (Activo) |
| `TRANSFER` (Transferencia) | Inventario Destino | Inventario Origen |
| `WRITE_OFF` (Baja) | Pérdida | Inventario (Activo) |
| `ADJUSTMENT` (Ajuste) | Ganancia o Pérdida | Inventario (según sea +/-) |

**Funcionalidad adicional**: Asignación de centros de costo por departamento.

---

### 8.2 Ventas — `sales/`

**Qué hace**: Conecta las notas de salida con el módulo de ventas.

| Funcionalidad | Descripción |
|---|---|
| Vinculación con pre-facturas | Las notas de salida tipo `SALE` se vinculan con pre-facturas |
| Seguimiento de órdenes | Rastrea el cumplimiento de órdenes de venta (`PARTIAL`, `COMPLETE`, `PENDING`) |
| Confirmación de despacho | Registra datos de envío y seguimiento |

---

### 8.3 Taller — `workshop/`

**Qué hace**: Conecta el inventario con las órdenes de trabajo del taller mecánico.

| Funcionalidad | Descripción |
|---|---|
| Consumo de materiales | Registra qué materiales se usaron en cada orden de trabajo |
| Costo planificado vs real | Compara el costo estimado con el costo real de los materiales |
| Desperdicio | Rastrea la cantidad desperdiciada y la eficiencia |
| Verificación de disponibilidad | Valida que hay stock suficiente antes de asignar materiales a una orden |

---

## 9. Reportes

**Ubicación**: `reports/`

Módulo de generación de reportes con exportación a múltiples formatos.

### Reportes disponibles

| Reporte | Qué muestra |
|---|---|
| **Dashboard** | KPIs principales: total de artículos, almacenes, valor del inventario, salud del stock (en stock / bajo / agotado), conteo de movimientos, artículos más movidos, alertas activas |
| **Stock Bajo** | Artículos con stock por debajo del `minStock` definido |
| **Stock Muerto** | Artículos sin ningún movimiento durante 6+ meses |
| **Valorización** | Valor monetario del inventario agrupado por almacén y/o categoría |
| **Salidas sin Factura** | Notas de salida que no están vinculadas a ninguna factura |

### Formatos de exportación

| Formato | Descripción |
|---|---|
| **CSV** | Archivo plano separado por comas |
| **Excel** | Archivo `.xlsx` multi-hoja con encabezados y formato |
| **PDF** | Documento PDF formateado para impresión |

---

## 10. Utilidades Compartidas

**Ubicación**: `shared/`

Herramientas y utilidades reutilizables dentro del módulo de inventario.

### Generadores

| Utilidad | Qué hace |
|---|---|
| `SKUGenerator` | Genera códigos SKU automáticos basados en categoría + marca + secuencial |
| `MovementNumberGenerator` | Genera números secuenciales para movimientos ("MOV-YYYY-00001") |

### Calculadores

| Utilidad | Qué hace |
|---|---|
| `PriceCalculator` | Calcula precios con márgenes de ganancia y descuentos |
| `CostCalculator` | Calcula costos (promedio ponderado, FIFO, etc.) |
| `StockCalculator` | Calcula niveles de stock, disponibilidad, cobertura |

### Validadores (`validators/`)

| Validador | Qué valida |
|---|---|
| `common.validator` | UUID, cantidades (positivas), paginación, precios (> 0), emails, formato de SKU |
| `movement.validator` | Validaciones específicas de movimientos (tipo, cantidades, almacenes) |
| `stock.validator` | Validaciones de stock (disponibilidad, límites) |
| `LocationValidator` | Formato de ubicación física ("M1-R01-D03" = Módulo-Rack-División) |

### Interfaces (`interfaces/`)

| Interfaz | Qué define |
|---|---|
| `IInventoryRepository` | Contrato estándar de CRUD (create, findOne, findMany, update, delete) |
| `IMovementService` | Contrato para servicios de movimiento |
| `IStockService` | Contrato para servicios de stock |

### Plugins (`plugins/`)

| Plugin | Qué hace |
|---|---|
| `auditPlugin` | Middleware que automáticamente registra quién creó y modificó cada registro |
| `softDeletePlugin` | Implementa borrado lógico (marca como eliminado sin borrar de la base de datos) con posibilidad de restaurar |

### Helpers

| Helper | Qué hace |
|---|---|
| `BatchHelper` | Funciones auxiliares para gestión de lotes (selección FIFO, validación de vencimiento) |

---

## 11. Flujos de Trabajo Principales

Los siguientes diagramas muestran los flujos más importantes del sistema.

---

### 11.1 Compra → Recepción → Stock

```
┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│ Crear Orden │───▶│  Enviar  │───▶│ Recibir  │───▶│   Stock   │
│   (DRAFT)   │    │  (SENT)  │    │ Mercancía│    │ Actualizado│
└─────────────┘    └──────────┘    └──────────┘    └───────────┘
                                        │
                                        ▼
                                   ┌──────────┐
                                   │Movimiento│
                                   │ PURCHASE │
                                   └──────────┘
```

1. Se crea la orden de compra con artículos y cantidades (`DRAFT`)
2. Se envía al proveedor (`SENT`)
3. Cuando llega la mercancía, se crea una recepción
4. **Automáticamente**: se incrementa stock, se genera movimiento, se recalcula costo promedio
5. Si queda algo pendiente: `PARTIAL`. Si todo se recibió: `COMPLETED`

---

### 11.2 Reserva → Venta → Despacho

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│ Reservar │───▶│  Crear   │───▶│ Preparar  │───▶│ Entregar │
│  Stock   │    │Nota Salid│    │  (Picking)│    │(DELIVERED)│
│ (ACTIVE) │    │(PENDING) │    │(IN_PROGR.)│    │          │
└──────────┘    └──────────┘    └───────────┘    └──────────┘
     │                                                │
     ▼                                                ▼
  quantityReserved++                          quantityReal--
  quantityAvailable--                         Movimiento SALE
```

1. Se reserva el stock para una venta u orden de trabajo
2. Se crea una nota de salida tipo `SALE` vinculada a una pre-factura
3. El almacenista prepara el picking (verifica ubicaciones y lotes)
4. Se confirma la entrega al cliente
5. Se decrementa el stock real y se genera el movimiento

---

### 11.3 Transferencia entre Almacenes

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Crear   │───▶│  Enviar  │───▶│ Recibir  │
│ (DRAFT)  │    │(IN_TRANS)│    │(RECEIVED)│
└──────────┘    └──────────┘    └──────────┘
                     │                │
                     ▼                ▼
              Stock Origen --   Stock Destino ++
              Mov. TRANSFER     Mov. TRANSFER
```

1. Se crea la transferencia con origen, destino y artículos
2. Al enviar: se decrementa stock en el almacén de origen
3. Al recibir: se incrementa stock en el almacén de destino
4. Se generan movimientos `TRANSFER` en ambos almacenes

---

### 11.4 Préstamo de Equipos

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Crear   │───▶│ Solicitar│───▶│ Aprobar  │───▶│ Activar  │───▶│ Devolver │
│  (DRAFT) │    │Aprobación│    │(APPROVED)│    │ (ACTIVE) │    │(RETURNED)│
└──────────┘    │(PEND_APP)│    └──────────┘    └──────────┘    └──────────┘
                └──────────┘                         │
                                                     ▼
                                              ┌──────────┐
                                              │  Si pasa  │
                                              │ dueDate:  │
                                              │ OVERDUE   │
                                              └──────────┘
```

1. Se crea el préstamo con prestatario, artículos y fecha de vencimiento
2. Se solicita aprobación de un supervisor
3. Al aprobarse y activarse: se genera automáticamente una nota de salida tipo `LOAN`
4. Si no se devuelve antes de la fecha límite: un job lo marca como `OVERDUE`
5. Al devolver: se genera movimiento `LOAN_RETURN` y se reingresa el stock

---

### 11.5 Ajuste Manual de Stock

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Crear   │───▶│ Aprobar  │───▶│ Aplicar  │
│  (DRAFT) │    │(APPROVED)│    │ (APPLIED)│
└──────────┘    └──────────┘    └──────────┘
                     │                │
                     ▼                ▼
                Si rechazado:    Stock modificado
                 REJECTED       Movimiento ADJ_IN/OUT
```

1. Se crea el ajuste indicando para cada artículo si sube (+) o baja (-) la cantidad
2. Un supervisor aprueba o rechaza
3. Al aplicar: se modifican las cantidades de stock y se generan movimientos

---

### 11.6 Conteo Cíclico → Reconciliación

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Crear   │───▶│  Contar  │───▶│ Aprobar  │───▶│ Aplicar  │
│  Conteo  │    │ Físico   │    │Varianzas │    │Corrección│
│  (DRAFT) │    │(IN_PROG) │    │(APPROVED)│    │ (APPLIED)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │                │                │
                     ▼                ▼                ▼
              Registrar         Revisar           Si varianza
              countedQuantity   variance          es grande:
                                                  → Reconciliación
```

1. Se crea el conteo seleccionando artículos y almacén
2. El personal cuenta físicamente y registra cantidades
3. El sistema calcula automáticamente la varianza (diferencia)
4. Un supervisor revisa y aprueba las diferencias
5. Se aplican las correcciones al stock
6. Si las varianzas son significativas, se puede crear una conciliación formal

---

### 11.7 Devolución

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Crear   │───▶│ Solicitar│───▶│ Aprobar  │───▶│ Procesar │
│  (DRAFT) │    │Aprobación│    │(APPROVED)│    │(PROCESSED│
└──────────┘    │(PEND_APP)│    └──────────┘    └──────────┘
                └──────────┘                         │
                                                     ▼
                                              Stock reingresado
                                              (según tipo)
```

1. Se crea la devolución indicando tipo (proveedor, taller o cliente)
2. Se solicita aprobación
3. Al aprobar: se prepara el reingreso
4. Al procesar: se actualiza el stock según el tipo de devolución

---

## 12. Diagrama de Relaciones entre Entidades

```
                            ┌───────────┐
                            │  Supplier │
                            │(Proveedor)│
                            └─────┬─────┘
                                  │ 1:N
                                  ▼
┌───────┐  N:1  ┌───────────────────────────────────┐  1:N  ┌───────────────┐
│ Brand │◀──────│        PurchaseOrder               │──────▶│    Receive     │
│(Marca)│       │     (Orden de Compra)              │       │  (Recepción)  │
└───┬───┘       └──────────┬────────────────────────┘       └───────┬───────┘
    │                      │ 1:N                                    │ 1:N
    │                      ▼                                        ▼
    │               ┌──────────────┐                         ┌──────────────┐
    │               │PurchaseOrder │                         │ ReceiveItem  │
    │               │    Item      │                         │(Línea Recep.)│
    │               └──────┬───────┘                         └──────────────┘
    │                      │ N:1
    │ 1:N                  ▼
    │    ┌──────────────────────────────────────────────────────────────┐
    ├───▶│                        Item (Artículo)                       │
    │    │   SKU · Nombre · Precios · Stock Min/Max · Flags Control    │
    │    └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────┬──┘
    │       │      │      │      │      │      │      │      │     │
┌───┴───┐   │      │      │      │      │      │      │      │     │
│Category│◀─┘      │      │      │      │      │      │      │     │
│(Categ.)│   ┌─────┘      │      │      │      │      │      │     │
└────────┘   ▼            ▼      ▼      ▼      ▼      ▼      ▼     ▼
          ┌──────┐  ┌───────┐ ┌─────┐ ┌─────┐ ┌────┐ ┌────┐ ┌───┐ ┌───────┐
          │Stock │  │Movem. │ │Batch│ │Seria│ │Pric│ │Imag│ │Res│ │ExitNot│
          │(Exist│  │(Movim)│ │(Lote│ │lNum │ │ing │ │e   │ │erv│ │eItem  │
          │encia)│  │       │ │)    │ │     │ │    │ │    │ │   │ │       │
          └──┬───┘  └───────┘ └─────┘ └─────┘ └────┘ └────┘ └───┘ └───┬───┘
             │ N:1                                                      │ N:1
             ▼                                                          ▼
       ┌───────────┐                                            ┌──────────────┐
       │ Warehouse │◀───────────────────────────────────────────│   ExitNote    │
       │ (Almacén) │                          1:N               │(Nota Salida) │
       └─────┬─────┘                                            └──────────────┘
             │                                                         ▲
             │ 1:N                                                     │ 1:1
             ▼                                                         │
       ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ ┌────┴─────┐
       │Adjustment │  │CycleCount │  │Reconcil. │  │ Transfer │ │   Loan   │
       │ (Ajuste)  │  │ (Conteo)  │  │(Concili.)│  │(Transfer)│ │(Préstamo)│
       └─────┬─────┘  └─────┬─────┘  └─────┬────┘  └──────────┘ └──────────┘
             │ 1:N          │ 1:N           │ 1:N
             ▼              ▼               ▼
       ┌───────────┐  ┌───────────┐  ┌──────────┐
       │Adjustment │  │CycleCount │  │Reconcil. │
       │   Item    │  │   Item    │  │   Item   │
       └───────────┘  └───────────┘  └──────────┘


    ┌──────────────────────────────────────────────────────────┐
    │                 Modelos Auxiliares                        │
    │                                                          │
    │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
    │  │   Event    │  │ StockAlert │  │  BulkOperation     │ │
    │  │ (Auditoría)│  │  (Alertas) │  │ (Import/Export)    │ │
    │  │  70+ tipos │  │ 5 tipos    │  │ Rastreo masivo     │ │
    │  └────────────┘  └────────────┘  └────────────────────┘ │
    └──────────────────────────────────────────────────────────┘


    ┌──────────────────────────────────────────────────────────┐
    │              Catálogos Auxiliares                         │
    │                                                          │
    │  ┌────────┐  ┌────────────────────┐                     │
    │  │ Model  │──│ ModelCompatibility  │                     │
    │  │(Modelo)│  │ (Pieza ↔ Vehículo) │                     │
    │  └────────┘  └────────────────────┘                     │
    │                                                          │
    │  ┌─────┐  ┌──────────┐  ┌──────────────┐               │
    │  │Unit │  │ReturnOrder│  │ReturnOrderItem│              │
    │  │(Und)│  │(Devoluc.) │  │(Línea Devol.) │              │
    │  └─────┘  └──────────┘  └──────────────┘               │
    └──────────────────────────────────────────────────────────┘
```

### Resumen de cardinalidades clave

| Relación | Cardinalidad | Descripción |
|---|---|---|
| Item ↔ Stock | 1:N | Un artículo tiene stock en múltiples almacenes |
| Item ↔ Movement | 1:N | Un artículo tiene muchos movimientos |
| Item ↔ Batch | 1:N | Un artículo puede tener múltiples lotes |
| Item ↔ SerialNumber | 1:N | Un artículo serializado tiene múltiples números de serie |
| Item ↔ Pricing | 1:1 | Un artículo tiene una configuración de precios |
| Warehouse ↔ Stock | 1:N | Un almacén tiene stock de múltiples artículos |
| Stock unique | `[itemId, warehouseId]` | Un registro de stock por artículo por almacén |
| Supplier ↔ PurchaseOrder | 1:N | Un proveedor tiene múltiples órdenes |
| PurchaseOrder ↔ Receive | 1:N | Una orden puede tener múltiples recepciones parciales |
| ExitNote ↔ Loan | 1:1 | Un préstamo genera exactamente una nota de salida |
| ExitNote ↔ PreInvoice | 1:1 | Una venta se vincula a una pre-factura |
| Brand ↔ Model | 1:N | Una marca tiene múltiples modelos |
| Category ↔ Category | Auto-ref | Jerarquía de categorías padre-hijo |
| Model ↔ ModelCompatibility | N:N | Compatibilidad pieza ↔ vehículo (tabla intermedia) |

---

## 13. Endpoints de la API

Todos los endpoints están bajo el prefijo base **`/api/inventory`** y requieren autenticación Bearer Token (`authenticate`). Muchos requieren permisos específicos (`authorize(PERMISSIONS.INVENTORY_*)`).

### 13.1 Items (Artículos) — `/api/inventory/items`

| Método | Ruta | Descripción | Body / Query / Params |
|--------|------|-------------|----------------------|
| `GET` | `/` | Listar todos los artículos con filtros y paginación | **Query**: `page`, `limit`, `search`, `categoryId`, `brandId`, `isActive`, `sortBy`, `sortOrder`, `minPrice`, `maxPrice`, `type` |
| `POST` | `/` | Crear nuevo artículo | **Body**: `name`*, `sku`*, `description`, `categoryId`*, `brandId`, `unitId`*, `type`, `minStock`, `maxStock`, `reorderPoint`, `cost`, `price`, `barcode`, `location`, `weight`, `dimensions`, `isActive`, `isSerialized`, `isBatchTracked`, `images` |
| `GET` | `/active` | Obtener artículos activos | **Query**: `limit` |
| `GET` | `/search` | Buscar artículos por texto | **Query**: `q`* (término de búsqueda), `limit` |
| `GET` | `/low-stock` | Artículos con stock bajo (bajo punto de reorden) | **Query**: `warehouseId`, `limit` |
| `GET` | `/out-of-stock` | Artículos sin stock | **Query**: `warehouseId`, `limit` |
| `GET` | `/category/:categoryId` | Artículos por categoría | **Params**: `categoryId`* |
| `GET` | `/sku/:sku` | Obtener artículo por SKU | **Params**: `sku`* |
| `GET` | `/barcode/:barcode` | Obtener artículo por código de barras | **Params**: `barcode`* |
| `GET` | `/:id` | Obtener artículo por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar artículo | **Params**: `id`*; **Body**: campos a actualizar (parcial) |
| `DELETE` | `/:id` | Eliminar artículo (soft delete) | **Params**: `id`* |
| `DELETE` | `/:id/hard` | Eliminar artículo permanentemente | **Params**: `id`* |
| `GET` | `/:id/stats` | Estadísticas del artículo (stock, movimientos, ventas) | **Params**: `id`* |
| `GET` | `/:id/history` | Historial de cambios del artículo | **Params**: `id`*; **Query**: `page`, `limit` |
| `GET` | `/:id/related` | Artículos relacionados | **Params**: `id`* |
| `POST` | `/generate-sku` | Generar SKU automático | **Body**: `categoryId`, `brandId` |
| `POST` | `/check-availability` | Verificar disponibilidad de stock | **Body**: `items[]` con `itemId`, `quantity`, `warehouseId` |
| `POST` | `/:id/duplicate` | Duplicar artículo existente | **Params**: `id`*; **Body**: `newSku` |
| `PUT` | `/:id/pricing` | Actualizar precios del artículo | **Params**: `id`*; **Body**: `cost`, `price`, `margin` |
| `PUT` | `/bulk-update` | Actualización masiva | **Body**: `items[]` con `id` y campos a actualizar |
| `PATCH` | `/:id/toggle` | Activar/desactivar artículo | **Params**: `id`* |

#### 13.1.1 Búsqueda Avanzada — `/api/inventory/items/search`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `POST` | `/` | Búsqueda con texto completo | **Body**: `query`*, `filters`, `page`, `limit` |
| `POST` | `/advanced` | Búsqueda avanzada con múltiples criterios | **Body**: `filters` (precio, categoría, marca, stock, etc.) |
| `GET` | `/suggestions` | Sugerencias de autocompletado | **Query**: `q`* |
| `GET` | `/aggregations` | Agregaciones/facetas de búsqueda | **Query**: `q` |
| `GET` | `/indexes` | Listar índices de búsqueda | — |
| `POST` | `/indexes` | Crear/reconstruir índices | — |
| `PUT` | `/indexes/:itemId` | Actualizar índice de un artículo | **Params**: `itemId`* |
| `DELETE` | `/indexes/:itemId` | Eliminar índice de un artículo | **Params**: `itemId`* |
| `POST` | `/reindex` | Re-indexar todos los artículos | — |

#### 13.1.2 Operaciones Masivas — `/api/inventory/items/bulk`

| Método | Ruta | Descripción | Body |
|--------|------|-------------|------|
| `POST` | `/import` | Importar artículos desde archivo CSV/Excel | **Body**: archivo multipart |
| `POST` | `/export` | Exportar artículos a archivo | **Body**: `format` (csv/excel), `filters` |
| `PATCH` | `/update` | Actualización masiva de artículos | **Body**: `items[]` con datos a actualizar |
| `DELETE` | `/delete` | Eliminación masiva | **Body**: `ids[]` |
| `GET` | `/operations` | Listar operaciones masivas en curso/completadas | — |
| `GET` | `/operations/:operationId` | Estado de una operación masiva | **Params**: `operationId`* |
| `DELETE` | `/operations/:operationId` | Cancelar operación masiva | **Params**: `operationId`* |

#### 13.1.3 Imágenes — `/api/inventory/items/:itemId/images`

| Método | Ruta | Descripción | Body / Params |
|--------|------|-------------|---------------|
| `GET` | `/` | Listar imágenes del artículo | — |
| `POST` | `/` | Subir imagen al artículo | **Body**: archivo multipart (imagen) |
| `GET` | `/:id` | Obtener imagen por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar metadata de imagen | **Params**: `id`*; **Body**: `altText`, `order` |
| `DELETE` | `/:id` | Eliminar imagen | **Params**: `id`* |
| `GET` | `/item/:itemId` | Obtener imágenes por artículo | **Params**: `itemId`* |
| `PATCH` | `/:id/primary` | Marcar imagen como principal | **Params**: `id`* |

#### 13.1.4 Precios — `/api/inventory/items/:itemId/pricing`

| Método | Ruta | Descripción | Body / Params |
|--------|------|-------------|---------------|
| `GET` | `/` | Obtener reglas de precios | — |
| `POST` | `/` | Crear regla de precios | **Body**: `type`, `value`, `minQuantity`, `startDate`, `endDate` |
| `GET` | `/:id` | Obtener regla por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar regla de precios | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar regla de precios | **Params**: `id`* |
| `GET` | `/item/:itemId` | Precios por artículo | **Params**: `itemId`* |
| `GET` | `/tiers` | Listar niveles de precios | — |
| `POST` | `/tiers` | Crear nivel de precios | **Body**: `name`, `minQuantity`, `discount` |
| `GET` | `/tiers/:tierId` | Obtener nivel por ID | **Params**: `tierId`* |
| `PUT` | `/tiers/:tierId` | Actualizar nivel | **Params**: `tierId`* |
| `DELETE` | `/tiers/:tierId` | Eliminar nivel | **Params**: `tierId`* |
| `POST` | `/calculate/margin` | Calcular margen de ganancia | **Body**: `cost`, `price` ó `margin` |

### 13.2 Catálogos — `/api/inventory/catalogs`

#### 13.2.1 Marcas — `/api/inventory/catalogs/brands`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar marcas con paginación | **Query**: `page`, `limit`, `search`, `isActive` |
| `POST` | `/` | Crear nueva marca | **Body**: `name`*, `description`, `logo`, `isActive` |
| `GET` | `/active` | Obtener marcas activas | — |
| `GET` | `/search` | Buscar marcas por texto | **Query**: `q`* |
| `GET` | `/:id` | Obtener marca por ID | **Params**: `id`* |
| `GET` | `/:id/stats` | Estadísticas de la marca (nº artículos, modelos) | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar marca | **Params**: `id`*; **Body**: campos a actualizar |
| `PATCH` | `/:id/toggle` | Activar/desactivar marca | **Params**: `id`* |
| `PATCH` | `/:id/reactivate` | Reactivar marca eliminada | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar marca (soft delete) | **Params**: `id`* |
| `DELETE` | `/:id/hard` | Eliminar marca permanentemente | **Params**: `id`* |

#### 13.2.2 Categorías — `/api/inventory/catalogs/categories`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar categorías con paginación | **Query**: `page`, `limit`, `search`, `isActive`, `parentId` |
| `POST` | `/` | Crear nueva categoría | **Body**: `name`*, `description`, `parentId`, `isActive` |
| `POST` | `/bulk` | Crear categorías masivamente | **Body**: `categories[]` |
| `GET` | `/tree` | Obtener árbol de categorías completo | — |
| `GET` | `/root` | Obtener categorías raíz (sin padre) | — |
| `GET` | `/active` | Categorías activas | — |
| `GET` | `/search` | Buscar categorías | **Query**: `q`* |
| `GET` | `/:id` | Obtener categoría por ID | **Params**: `id`* |
| `GET` | `/:id/tree` | Subárbol desde una categoría | **Params**: `id`* |
| `GET` | `/:id/children` | Hijos directos de la categoría | **Params**: `id`* |
| `GET` | `/:id/ancestors` | Ancestros de la categoría | **Params**: `id`* |
| `GET` | `/:id/path` | Ruta completa desde raíz | **Params**: `id`* |
| `GET` | `/:id/stats` | Estadísticas (nº artículos, subcategorías) | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar categoría | **Params**: `id`*; **Body**: campos a actualizar |
| `PATCH` | `/:id/move` | Mover categoría a otro padre | **Params**: `id`*; **Body**: `parentId` |
| `PATCH` | `/:id/toggle` | Activar/desactivar | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar categoría (soft delete) | **Params**: `id`* |
| `DELETE` | `/:id/hard` | Eliminar permanentemente | **Params**: `id`* |

#### 13.2.3 Unidades de Medida — `/api/inventory/catalogs/units`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar unidades con paginación | **Query**: `page`, `limit`, `search`, `type` |
| `POST` | `/` | Crear nueva unidad | **Body**: `name`*, `abbreviation`*, `type`* (WEIGHT, VOLUME, LENGTH, UNIT, AREA), `conversionFactor` |
| `POST` | `/bulk` | Crear unidades masivamente | **Body**: `units[]` |
| `GET` | `/active` | Unidades activas | — |
| `GET` | `/grouped` | Unidades agrupadas por tipo | — |
| `GET` | `/search` | Buscar unidades | **Query**: `q`* |
| `GET` | `/type/:type` | Unidades por tipo | **Params**: `type`* (WEIGHT, VOLUME, etc.) |
| `GET` | `/:id` | Obtener unidad por ID | **Params**: `id`* |
| `GET` | `/:id/stats` | Estadísticas de uso | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar unidad | **Params**: `id`*; **Body**: campos a actualizar |
| `PATCH` | `/:id/toggle` | Activar/desactivar | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar unidad (soft delete) | **Params**: `id`* |
| `DELETE` | `/:id/hard` | Eliminar permanentemente | **Params**: `id`* |

#### 13.2.4 Modelos — `/api/inventory/catalogs/models`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar modelos con paginación | **Query**: `page`, `limit`, `search`, `brandId`, `year` |
| `POST` | `/` | Crear nuevo modelo | **Body**: `name`*, `brandId`*, `year`, `description`, `isActive` |
| `POST` | `/bulk` | Crear modelos masivamente | **Body**: `models[]` |
| `GET` | `/active` | Modelos activos | — |
| `GET` | `/grouped` | Modelos agrupados por marca | — |
| `GET` | `/years` | Años disponibles de modelos | — |
| `GET` | `/search` | Buscar modelos | **Query**: `q`* |
| `GET` | `/brand/:brandId` | Modelos por marca | **Params**: `brandId`* |
| `GET` | `/year/:year` | Modelos por año | **Params**: `year`* |
| `GET` | `/:id` | Obtener modelo por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar modelo | **Params**: `id`*; **Body**: campos a actualizar |
| `PATCH` | `/:id/toggle` | Activar/desactivar | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar modelo (soft delete) | **Params**: `id`* |
| `DELETE` | `/:id/hard` | Eliminar permanentemente | **Params**: `id`* |

#### 13.2.5 Compatibilidad de Modelos — `/api/inventory/catalogs/model-compatibility`

| Método | Ruta | Descripción | Body / Params |
|--------|------|-------------|---------------|
| `GET` | `/` | Listar compatibilidades | **Query**: `page`, `limit` |
| `POST` | `/` | Crear compatibilidad pieza ↔ vehículo | **Body**: `partModelId`*, `vehicleModelId`*, `notes` |
| `GET` | `/part/:partModelId` | Compatibilidades por pieza | **Params**: `partModelId`* |
| `GET` | `/vehicle/:vehicleModelId` | Compatibilidades por vehículo | **Params**: `vehicleModelId`* |
| `GET` | `/:id` | Obtener compatibilidad por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar compatibilidad | **Params**: `id`* |
| `PATCH` | `/:id/verify` | Verificar/confirmar compatibilidad | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar compatibilidad | **Params**: `id`* |

### 13.3 Almacenes (Warehouses) — `/api/inventory/warehouses`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar almacenes con filtros | **Query**: `page`, `limit`, `search`, `isActive`, `type` |
| `POST` | `/` | Crear nuevo almacén | **Body**: `name`*, `code`*, `type`, `address`, `description`, `isActive` |
| `GET` | `/active` | Almacenes activos | — |
| `GET` | `/search` | Buscar almacenes | **Query**: `q`* |
| `GET` | `/:id` | Obtener almacén por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar almacén | **Params**: `id`*; **Body**: campos a actualizar |
| `DELETE` | `/:id` | Eliminar almacén | **Params**: `id`* |
| `PATCH` | `/:id/activate` | Activar almacén | **Params**: `id`* |
| `PATCH` | `/:id/deactivate` | Desactivar almacén | **Params**: `id`* |

### 13.4 Stock — `/api/inventory/stock`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar registros de stock con filtros | **Query**: `page`, `limit`, `warehouseId`, `itemId`, `belowMin`, `sortBy`, `sortOrder` |
| `POST` | `/` | Crear registro de stock | **Body**: `itemId`*, `warehouseId`*, `quantity`*, `minStock`, `maxStock`, `reorderPoint`, `location` |
| `GET` | `/low-stock` | Stock por debajo del punto de reorden | **Query**: `warehouseId`, `limit` |
| `GET` | `/out-of-stock` | Artículos sin stock | **Query**: `warehouseId` |
| `GET` | `/item/:itemId` | Stock de un artículo en todos los almacenes | **Params**: `itemId`* |
| `GET` | `/warehouse/:warehouseId` | Todo el stock de un almacén | **Params**: `warehouseId`* |
| `GET` | `/:id` | Obtener registro de stock por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar registro de stock | **Params**: `id`*; **Body**: `minStock`, `maxStock`, `reorderPoint`, `location` |
| `POST` | `/adjust` | Ajustar cantidad de stock manualmente | **Body**: `stockId`*, `quantity`*, `reason`*, `notes` |
| `POST` | `/reserve` | Reservar stock para una orden | **Body**: `stockId`*, `quantity`*, `reference`, `expiresAt` |
| `POST` | `/release` | Liberar stock reservado | **Body**: `reservationId`* |
| `POST` | `/transfer` | Transferir stock entre almacenes | **Body**: `itemId`*, `fromWarehouseId`*, `toWarehouseId`*, `quantity`*, `notes` |
| `GET` | `/alerts` | Listar alertas de stock | **Query**: `type`, `isRead`, `limit` |
| `POST` | `/alerts` | Crear alerta de stock manual | **Body**: `type`*, `stockId`*, `message` |
| `PATCH` | `/alerts/:id/read` | Marcar alerta como leída | **Params**: `id`* |

### 13.5 Movimientos — `/api/inventory/movements`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar movimientos con filtros | **Query**: `page`, `limit`, `type` (ENTRY, EXIT, TRANSFER, ADJUSTMENT), `warehouseId`, `itemId`, `startDate`, `endDate`, `sortBy`, `sortOrder` |
| `POST` | `/` | Crear movimiento manual | **Body**: `type`*, `itemId`*, `warehouseId`*, `quantity`*, `unitCost`, `reason`, `reference`, `notes` |
| `GET` | `/type/:type` | Movimientos por tipo | **Params**: `type`* (ENTRY, EXIT, TRANSFER, ADJUSTMENT) |
| `GET` | `/warehouse/:warehouseId` | Movimientos por almacén | **Params**: `warehouseId`* |
| `GET` | `/item/:itemId` | Movimientos de un artículo | **Params**: `itemId`* |
| `GET` | `/:id` | Obtener movimiento por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar movimiento | **Params**: `id`*; **Body**: `notes`, `reference` |
| `DELETE` | `/:id` | Eliminar movimiento | **Params**: `id`* |
| `PATCH` | `/:id/cancel` | Cancelar movimiento (reversión) | **Params**: `id`* |

> **Nota**: Los sub-reportes de movimientos (Kardex, Valuación, Rotación) están definidos como stubs pendientes de implementación en `movements/reports/`.

### 13.6 Proveedores (Suppliers) — `/api/inventory/suppliers`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar proveedores con filtros | **Query**: `page`, `limit`, `search`, `isActive`, `sortBy`, `sortOrder` |
| `POST` | `/` | Crear proveedor | **Body**: `name`*, `code`*, `rif`, `email`, `phone`, `address`, `contactName`, `contactPhone`, `notes`, `isActive` |
| `GET` | `/active` | Proveedores activos | — |
| `GET` | `/code/:code` | Obtener proveedor por código | **Params**: `code`* |
| `GET` | `/:id` | Obtener proveedor por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar proveedor | **Params**: `id`*; **Body**: campos a actualizar |
| `DELETE` | `/:id` | Eliminar proveedor | **Params**: `id`* |
| `PATCH` | `/:id/toggle` | Activar/desactivar proveedor | **Params**: `id`* |

### 13.7 Órdenes de Compra (Purchase Orders) — `/api/inventory/purchase-orders`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar órdenes de compra | **Query**: `page`, `limit`, `supplierId`, `status` (DRAFT, APPROVED, SENT, PARTIAL, RECEIVED, CANCELLED), `startDate`, `endDate` |
| `POST` | `/` | Crear orden de compra | **Body**: `supplierId`*, `warehouseId`*, `items[]`* (cada uno: `itemId`, `quantity`, `unitCost`), `expectedDate`, `notes` |
| `GET` | `/:id` | Obtener orden por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar orden | **Params**: `id`*; **Body**: campos a actualizar |
| `DELETE` | `/:id` | Eliminar orden (solo DRAFT) | **Params**: `id`* |
| `PATCH` | `/:id/approve` | Aprobar orden | **Params**: `id`* |
| `PATCH` | `/:id/cancel` | Cancelar orden | **Params**: `id`* |
| `POST` | `/:id/items` | Agregar items a la orden | **Params**: `id`*; **Body**: `itemId`*, `quantity`*, `unitCost`* |
| `GET` | `/:id/items` | Listar items de la orden | **Params**: `id`* |

### 13.8 Recepciones (Receives) — `/api/inventory/receives`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar recepciones | **Query**: `page`, `limit`, `purchaseOrderId`, `warehouseId`, `status` |
| `POST` | `/` | Crear recepción | **Body**: `purchaseOrderId`*, `warehouseId`*, `items[]`* (cada uno: `itemId`, `quantity`, `condition`), `receivedBy`, `notes` |
| `GET` | `/:id` | Obtener recepción por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar recepción | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar recepción | **Params**: `id`* |
| `POST` | `/:id/items` | Agregar items a la recepción | **Params**: `id`*; **Body**: `itemId`*, `quantity`*, `condition` |
| `GET` | `/:id/items` | Listar items recibidos | **Params**: `id`* |

### 13.9 Notas de Salida (Exit Notes) — `/api/inventory/exit-notes`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar notas de salida con filtros | **Query**: `type` (SALE, WARRANTY, LOAN, INTERNAL_USE, SAMPLE, DONATION, OWNER_PICKUP, DEMO, TRANSFER, LOAN_RETURN, OTHER), `status` (PENDING, IN_PROGRESS, READY, DELIVERED, CANCELLED), `warehouseId`, `recipientId`, `startDate`, `endDate`, `page`, `limit` |
| `POST` | `/` | Crear nota de salida | **Body**: `type`*, `warehouseId`*, `items[]`* (cada uno: `itemId`, `quantity`), `preInvoiceId`, `recipientName`, `recipientId` |
| `GET` | `/number/:exitNoteNumber` | Buscar por número de nota | **Params**: `exitNoteNumber`* |
| `GET` | `/warehouse/:warehouseId` | Notas por almacén | **Params**: `warehouseId`* |
| `GET` | `/type/:type` | Notas por tipo | **Params**: `type`* |
| `GET` | `/status/:status` | Notas por estado | **Params**: `status`* |
| `GET` | `/:id` | Obtener nota por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar nota de salida | **Params**: `id`* |
| `PATCH` | `/:id/start` | Iniciar preparación (PENDING → IN_PROGRESS) | **Params**: `id`* |
| `PATCH` | `/:id/ready` | Marcar como lista (IN_PROGRESS → READY) | **Params**: `id`* |
| `PATCH` | `/:id/deliver` | Entregar nota (READY → DELIVERED) | **Params**: `id`* |
| `PATCH` | `/:id/cancel` | Cancelar nota de salida | **Params**: `id`*; **Body**: `reason` |
| `GET` | `/:id/status` | Información del estado actual | **Params**: `id`* |
| `GET` | `/:id/summary` | Resumen de la nota de salida | **Params**: `id`* |

#### 13.9.1 Items de Nota de Salida — `/api/inventory/exit-notes/:exitNoteId/items`

| Método | Ruta | Descripción | Body / Params |
|--------|------|-------------|---------------|
| `GET` | `/` | Listar items de la nota de salida | — |
| `GET` | `/summary` | Resumen de items | — |
| `GET` | `/batch/:batchId` | Items por lote | **Params**: `batchId`* |
| `GET` | `/serial/:serialNumberId` | Items por número de serie | **Params**: `serialNumberId`* |
| `GET` | `/:itemId` | Obtener item específico | **Params**: `itemId`* |
| `PATCH` | `/:itemId/pick` | Registrar picking del item | **Params**: `itemId`*; **Body**: `quantityPicked`, `location`, `notes` |
| `PATCH` | `/:itemId/batch` | Asignar lote al item | **Params**: `itemId`*; **Body**: `batchId` |
| `PATCH` | `/:itemId/serial` | Asignar número de serie | **Params**: `itemId`*; **Body**: `serialNumberId` |
| `PATCH` | `/:itemId/verify` | Verificar item | **Params**: `itemId`* |
| `PATCH` | `/:itemId/reject` | Rechazar item | **Params**: `itemId`*; **Body**: `reason` |

> **Nota**: Las rutas especiales de notas de salida por tipo (warranty, loan, internal, sample, donation, ownerPickup) están registradas como stubs vacíos.

### 13.10 Transferencias — `/api/inventory/transfers`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar transferencias | **Query**: `page`, `limit`, `status`, `fromWarehouseId`, `toWarehouseId`, `startDate`, `endDate` |
| `POST` | `/` | Crear transferencia | **Body**: `fromWarehouseId`*, `toWarehouseId`*, `items[]`* (cada uno: `itemId`, `quantity`), `notes` |
| `GET` | `/:id` | Obtener transferencia por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar transferencia | **Params**: `id`* |
| `PATCH` | `/:id/send` | Enviar transferencia (PENDING → IN_TRANSIT) | **Params**: `id`* |
| `PATCH` | `/:id/receive` | Recibir transferencia (IN_TRANSIT → RECEIVED) | **Params**: `id`* |
| `PATCH` | `/:id/cancel` | Cancelar transferencia | **Params**: `id`* |

### 13.11 Préstamos (Loans) — `/api/inventory/loans`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar préstamos | **Query**: `page`, `limit`, `status` (PENDING, APPROVED, ACTIVE, RETURNED, CANCELLED), `borrower`, `startDate`, `endDate` |
| `POST` | `/` | Crear préstamo | **Body**: `borrowerName`*, `borrowerId`, `warehouseId`*, `items[]`* (cada uno: `itemId`, `quantity`), `expectedReturnDate`*, `notes` |
| `GET` | `/:id` | Obtener préstamo por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar préstamo | **Params**: `id`* |
| `PATCH` | `/:id/approve` | Aprobar préstamo | **Params**: `id`* |
| `PATCH` | `/:id/activate` | Activar préstamo (entregar items) | **Params**: `id`* |
| `PATCH` | `/:id/return` | Registrar devolución del préstamo | **Params**: `id`*; **Body**: `items[]` con `itemId`, `quantity`, `condition` |
| `PATCH` | `/:id/cancel` | Cancelar préstamo | **Params**: `id`* |

### 13.12 Devoluciones (Returns) — `/api/inventory/returns`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar devoluciones | **Query**: `page`, `limit`, `status`, `type` |
| `POST` | `/` | Crear devolución | **Body**: `type`*, `warehouseId`*, `items[]`* (cada uno: `itemId`, `quantity`, `reason`), `reference`, `notes` |
| `GET` | `/:id` | Obtener devolución por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar devolución | **Params**: `id`* |
| `PATCH` | `/:id/approve` | Aprobar devolución | **Params**: `id`* |
| `PATCH` | `/:id/process` | Procesar devolución (inspeccionar y reintegrar stock) | **Params**: `id`* |

#### 13.12.1 Items de Devoluciones — montadas en el router de returns

| Método | Ruta | Descripción | Body / Params |
|--------|------|-------------|---------------|
| `POST` | `/:returnId/items` | Agregar item a la devolución | **Body**: `itemId`*, `quantity`*, `reason`, `condition` |
| `PUT` | `/:returnId/items/:itemId/process` | Procesar item individual | **Params**: `returnId`*, `itemId`*; **Body**: `action` (RESTOCK, DISCARD, WARRANTY) |
| `GET` | `/:returnId/items` | Listar items de la devolución | **Params**: `returnId`* |
| `GET` | `/items/:itemId/analysis` | Analizar historial de devoluciones de un artículo | **Params**: `itemId`* |
| `GET` | `/items` | Listar todos los items de devoluciones | — |

### 13.13 Ajustes de Inventario (Adjustments) — `/api/inventory/adjustments`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar ajustes | **Query**: `page`, `limit`, `warehouseId`, `status` (DRAFT, APPROVED, APPLIED, REJECTED, CANCELLED), `reason`, `sortBy`, `sortOrder` |
| `POST` | `/` | Crear ajuste | **Body**: `warehouseId`*, `reason`*, `notes`, `items[]`* — cada item: `itemId`*, `quantityChange`* (positivo=entrada, negativo=salida), `unitCost`, `notes` |
| `GET` | `/:id` | Obtener ajuste por ID | **Params**: `id`*; **Query**: `includeItems` (boolean) |
| `PUT` | `/:id` | Actualizar ajuste (solo DRAFT) | **Params**: `id`*; **Body**: `reason`, `notes` |
| `PATCH` | `/:id/approve` | Aprobar ajuste | **Params**: `id`* |
| `PATCH` | `/:id/apply` | Aplicar ajuste (modifica stock real) | **Params**: `id`* |
| `PATCH` | `/:id/reject` | Rechazar ajuste | **Params**: `id`*; **Body**: `reason` |
| `PATCH` | `/:id/cancel` | Cancelar ajuste | **Params**: `id`* |
| `POST` | `/:id/items` | Agregar item al ajuste | **Params**: `id`*; **Body**: `itemId`*, `quantityChange`*, `unitCost`, `notes` |
| `GET` | `/:id/items` | Listar items del ajuste | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar ajuste (solo DRAFT) | **Params**: `id`* |

### 13.14 Ciclos de Conteo (Cycle Counts) — `/api/inventory/cycle-counts`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar ciclos de conteo | **Query**: `warehouseId`, `status` (DRAFT, IN_PROGRESS, APPROVED, APPLIED, REJECTED, CANCELLED), `page`, `limit` |
| `POST` | `/` | Crear ciclo de conteo | **Body**: `warehouseId`*, `notes`, `items[]` |
| `GET` | `/:id` | Obtener ciclo por ID | **Params**: `id`*; **Query**: `includeItems` (boolean) |
| `PUT` | `/:id` | Actualizar ciclo (solo DRAFT) | **Params**: `id`*; **Body**: `notes`, `remarks` |
| `PATCH` | `/:id/start` | Iniciar conteo (DRAFT → IN_PROGRESS) | **Params**: `id`*; **Body**: `startedBy`* |
| `PATCH` | `/:id/complete` | Completar conteo (IN_PROGRESS → APPROVED) | **Params**: `id`*; **Body**: `completedBy`* |
| `PATCH` | `/:id/approve` | Aprobar conteo | **Params**: `id`*; **Body**: `approvedBy`* |
| `PATCH` | `/:id/apply` | Aplicar conteo (actualiza stock real) | **Params**: `id`*; **Body**: `appliedBy`* |
| `PATCH` | `/:id/reject` | Rechazar conteo | **Params**: `id`*; **Body**: `reason` |
| `PATCH` | `/:id/cancel` | Cancelar conteo | **Params**: `id`* |
| `POST` | `/:id/items` | Agregar item al conteo | **Params**: `id`*; **Body**: `itemId`*, `expectedQuantity`*, `location`, `notes` |
| `GET` | `/:id/items` | Listar items del conteo | **Params**: `id`* |
| `PATCH` | `/:id/items/:itemId` | Actualizar cantidad contada de un item | **Params**: `id`*, `itemId`*; **Body**: `countedQuantity`* |
| `DELETE` | `/:id` | Eliminar ciclo (solo DRAFT) | **Params**: `id`* |

### 13.15 Reconciliaciones — `/api/inventory/reconciliations`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar reconciliaciones | **Query**: `warehouseId`, `status` (DRAFT, IN_PROGRESS, APPROVED, APPLIED, REJECTED, CANCELLED), `source` (CYCLE_COUNT, PHYSICAL_INVENTORY, SYSTEM_ERROR, ADJUSTMENT, OTHER), `page`, `limit` |
| `POST` | `/` | Crear reconciliación | **Body**: `warehouseId`*, `source`*, `reason`*, `notes`, `items[]` |
| `GET` | `/:id` | Obtener reconciliación por ID | **Params**: `id`*; **Query**: `includeItems` (boolean) |
| `PUT` | `/:id` | Actualizar reconciliación | **Params**: `id`*; **Body**: `reason`, `notes`, `remarks` |
| `PATCH` | `/:id/start` | Iniciar (DRAFT → IN_PROGRESS) | **Params**: `id`*; **Body**: `startedBy`* |
| `PATCH` | `/:id/complete` | Completar (IN_PROGRESS → APPROVED) | **Params**: `id`*; **Body**: `completedBy`* |
| `PATCH` | `/:id/approve` | Aprobar | **Params**: `id`*; **Body**: `approvedBy`* |
| `PATCH` | `/:id/apply` | Aplicar (actualiza stock real) | **Params**: `id`*; **Body**: `appliedBy`* |
| `PATCH` | `/:id/reject` | Rechazar | **Params**: `id`*; **Body**: `reason` |
| `PATCH` | `/:id/cancel` | Cancelar | **Params**: `id`* |
| `POST` | `/:id/items` | Agregar item | **Params**: `id`*; **Body**: `itemId`*, `systemQuantity`*, `expectedQuantity`*, `notes` |
| `GET` | `/:id/items` | Listar items | **Params**: `id`* |
| `DELETE` | `/:id` | Eliminar reconciliación (solo DRAFT) | **Params**: `id`* |

### 13.16 Lotes (Batches) — `/api/inventory/batches`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar lotes con filtros | **Query**: `page`, `limit`, `itemId`, `batchNumber`, `isActive`, `status` (ACTIVE, EXPIRED, EXPIRING_SOON, INACTIVE) |
| `POST` | `/` | Crear nuevo lote | **Body**: `batchNumber`*, `itemId`*, `initialQuantity`*, `manufacturingDate`, `expiryDate`, `notes` |
| `GET` | `/item/:itemId` | Lotes de un artículo | **Params**: `itemId`* |
| `GET` | `/:id` | Obtener lote por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar lote | **Params**: `id`*; **Body**: `currentQuantity`, `notes`, `isActive` |
| `DELETE` | `/:id` | Eliminar lote | **Params**: `id`* |
| `PATCH` | `/:id/deactivate` | Desactivar lote | **Params**: `id`* |

#### 13.16.1 Vencimiento de Lotes — `/api/inventory/batches/expiry`

| Método | Ruta | Descripción | Query |
|--------|------|-------------|-------|
| `GET` | `/expiring` | Lotes próximos a vencer | **Query**: `daysThreshold` (default: 30) |
| `GET` | `/expired` | Lotes ya vencidos | — |
| `GET` | `/summary` | Resumen de vencimientos por estado | **Query**: `daysThreshold` (default: 30) |

### 13.17 Números de Serie (Serial Numbers) — `/api/inventory/serial-numbers`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar números de serie | **Query**: `page`, `limit`, `itemId`, `serialNumber`, `warehouseId`, `status` (IN_STOCK, SOLD, DEFECTIVE, WARRANTY, LOANED) |
| `POST` | `/` | Crear número de serie | **Body**: `serialNumber`*, `itemId`*, `warehouseId`, `status`, `notes` |
| `GET` | `/search/:serialNumber` | Buscar por número de serie | **Params**: `serialNumber`* |
| `GET` | `/item/:itemId` | Números de serie por artículo | **Params**: `itemId`* |
| `GET` | `/warehouse/:warehouseId` | Números de serie por almacén | **Params**: `warehouseId`* |
| `GET` | `/status/:status` | Números de serie por estado | **Params**: `status`* |
| `GET` | `/:id` | Obtener por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar número de serie | **Params**: `id`*; **Body**: `status`, `warehouseId`, `notes` |
| `DELETE` | `/:id` | Eliminar número de serie | **Params**: `id`* |
| `PATCH` | `/:id/assign` | Asignar a un almacén | **Params**: `id`*; **Body**: `warehouseId`* |

#### 13.17.1 Tracking de Números de Serie — `/api/inventory/serial-numbers/:id/tracking`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/history` | Historial de movimientos del número de serie |
| `GET` | `/summary` | Resumen del ciclo de vida |
| `GET` | `/journey` | Trayectoria completa del número de serie |

### 13.18 Reservas (Reservations) — `/api/inventory/reservations`

| Método | Ruta | Descripción | Body / Query |
|--------|------|-------------|--------------|
| `GET` | `/` | Listar reservas | **Query**: `page`, `limit`, `status` (ACTIVE, PENDING_PICKUP, CONSUMED, RELEASED), `itemId`, `warehouseId` |
| `POST` | `/` | Crear reserva | **Body**: `itemId`*, `warehouseId`*, `quantity`*, `workOrderId`, `saleOrderId`, `reference`, `notes`, `expiresAt` |
| `GET` | `/active` | Reservas activas | **Query**: `limit` |
| `GET` | `/expired` | Reservas expiradas | **Query**: `limit` |
| `GET` | `/item/:itemId` | Reservas de un artículo | **Params**: `itemId`* |
| `GET` | `/warehouse/:warehouseId` | Reservas de un almacén | **Params**: `warehouseId`* |
| `GET` | `/:id` | Obtener reserva por ID | **Params**: `id`* |
| `PUT` | `/:id` | Actualizar reserva | **Params**: `id`*; **Body**: `quantity`, `status` |
| `DELETE` | `/:id` | Eliminar reserva | **Params**: `id`* |
| `POST` | `/:id/consume` | Consumir/entregar reserva | **Params**: `id`*; **Body**: `quantity`, `deliveredBy` |
| `POST` | `/:id/release` | Liberar reserva | **Params**: `id`*; **Body**: `reason` |
| `PATCH` | `/:id/pending-pickup` | Marcar como pendiente de entrega | **Params**: `id`* |

### 13.19 Analíticas — `/api/inventory/analytics`

#### 13.19.1 Análisis ABC — `/api/inventory/analytics/abc`

| Método | Ruta | Descripción | Query |
|--------|------|-------------|-------|
| `GET` | `/` | Clasificación ABC de artículos por valor de inventario | **Query**: `warehouseId`, `startDate`, `endDate`, `method` (value/quantity/frequency) |

**Respuesta**: Lista de artículos clasificados como A (alto valor, ~20% items / ~80% valor), B (medio) o C (bajo).

#### 13.19.2 Pronósticos (Forecasting) — `/api/inventory/analytics/forecasting`

| Método | Ruta | Descripción | Query |
|--------|------|-------------|-------|
| `GET` | `/` | Pronóstico general de demanda | **Query**: `warehouseId`, `horizon` (días), `method` (moving_average/exponential_smoothing/linear_regression) |
| `GET` | `/:itemId` | Pronóstico para un artículo específico | **Params**: `itemId`*; **Query**: `horizon`, `method` |
| `GET` | `/:itemId/accuracy` | Precisión del pronóstico histórico | **Params**: `itemId`* |

**Respuesta**: Predicción de demanda con intervalos de confianza.

#### 13.19.3 Rotación de Inventario (Turnover) — `/api/inventory/analytics/turnover`

| Método | Ruta | Descripción | Query |
|--------|------|-------------|-------|
| `GET` | `/` | Índice de rotación general | **Query**: `warehouseId`, `startDate`, `endDate`, `period` (monthly/quarterly/yearly) |
| `GET` | `/:itemId` | Rotación de un artículo | **Params**: `itemId`*; **Query**: `period` |
| `GET` | `/classification/:classification` | Artículos por clasificación de rotación | **Params**: `classification`* (fast/medium/slow/dead) |

**Respuesta**: Tasa de rotación, días de inventario promedio, clasificación de velocidad.

### 13.20 Reportes — `/api/inventory/reports`

| Método | Ruta | Descripción | Query |
|--------|------|-------------|-------|
| `GET` | `/dashboard` | Dashboard general de inventario | **Query**: `warehouseId` |
| `GET` | `/dashboard/summary` | Resumen numérico del dashboard | **Query**: `warehouseId` |
| `GET` | `/low-stock` | Reporte de artículos con stock bajo | **Query**: `warehouseId`, `limit`, `threshold` |
| `GET` | `/dead-stock` | Reporte de artículos sin movimiento | **Query**: `warehouseId`, `daysSinceLastMovement` (default: 90) |
| `GET` | `/stock-value` | Valuación total del inventario | **Query**: `warehouseId`, `method` (fifo/lifo/weighted_average) |
| `GET` | `/exits-without-invoice` | Notas de salida pendientes de facturación | **Query**: `warehouseId`, `startDate`, `endDate` |

### 13.21 Integraciones — `/api/inventory/integrations`

#### 13.21.1 Contabilidad — `/api/inventory/integrations/accounting`

| Método | Ruta | Descripción | Body / Params |
|--------|------|-------------|---------------|
| `POST` | `/:movementId/gl` | Generar asiento contable para un movimiento | **Params**: `movementId`* |
| `POST` | `/:movementId/allocate` | Asignar costos a un movimiento | **Params**: `movementId`*; **Body**: `costAllocations[]` |
| `GET` | `/costs` | Consultar costos de inventario | **Query**: `warehouseId`, `startDate`, `endDate` |
| `GET` | `/valuation` | Valuación contable del inventario | **Query**: `warehouseId`, `method`, `asOfDate` |

#### 13.21.2 Ventas — `/api/inventory/integrations/sales`

| Método | Ruta | Descripción | Body / Params |
|--------|------|-------------|---------------|
| `POST` | `/:exitNoteId/pre-invoice` | Vincular nota de salida a pre-factura | **Params**: `exitNoteId`*; **Body**: `preInvoiceId`* |
| `POST` | `/:exitNoteId/sales-order` | Vincular nota de salida a orden de venta | **Params**: `exitNoteId`*; **Body**: `salesOrderId`* |
| `GET` | `/:salesOrderId/fulfillment` | Estado de cumplimiento de una orden de venta | **Params**: `salesOrderId`* |
| `GET` | `/pending` | Notas de salida pendientes de vinculación | — |
| `POST` | `/:exitNoteId/confirm` | Confirmar despacho/envío | **Params**: `exitNoteId`* |
| `GET` | `/metrics` | Métricas de integración con ventas | **Query**: `startDate`, `endDate` |

#### 13.21.3 Taller — `/api/inventory/integrations/workshop`

| Método | Ruta | Descripción | Body / Params |
|--------|------|-------------|---------------|
| `POST` | `/:workOrderId/consume` | Consumir materiales de una orden de trabajo | **Params**: `workOrderId`*; **Body**: `items[]` con `itemId`, `quantity` |
| `GET` | `/:workOrderId/summary` | Resumen de consumo de materiales | **Params**: `workOrderId`* |
| `POST` | `/check-requirements` | Verificar disponibilidad de materiales | **Body**: `items[]` con `itemId`, `quantity`, `warehouseId` |
| `POST` | `/:workOrderId/complete` | Marcar consumo como completado | **Params**: `workOrderId`* |
| `GET` | `/history` | Historial de consumos del taller | **Query**: `startDate`, `endDate`, `workOrderId` |

### 13.22 Resumen de Respuestas HTTP Comunes

| Código | Significado |
|--------|-------------|
| `200` | Operación exitosa (GET, PUT, PATCH) |
| `201` | Recurso creado exitosamente (POST) |
| `400` | Datos de entrada inválidos (validación fallida) |
| `401` | No autenticado (token inválido o ausente) |
| `403` | Sin permisos suficientes |
| `404` | Recurso no encontrado |
| `409` | Conflicto (duplicado, estado inválido para la operación) |
| `500` | Error interno del servidor |

### 13.23 Formato de Respuesta Estándar

Todas las respuestas siguen el formato:

```json
// Éxito
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}

// Éxito con paginación
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción del error",
    "details": [ ... ]
  }
}
```

### 13.24 Autenticación y Autorización

- **Autenticación**: Todas las rutas requieren header `Authorization: Bearer <token>`
- **Autorización**: Permisos verificados con `authorize(PERMISSIONS.INVENTORY_*)`:
  - `INVENTORY_VIEW` — Leer/consultar datos
  - `INVENTORY_CREATE` — Crear nuevos registros
  - `INVENTORY_UPDATE` — Modificar registros existentes
  - `INVENTORY_DELETE` — Eliminar registros

---

> **Nota**: Este documento refleja el estado actual del módulo de inventario. Los campos marcados con `*` son obligatorios. Para cambios específicos en la API, consultar los archivos `.routes.ts`, `.validation.ts` y `.dto.ts` de cada sub-módulo.
