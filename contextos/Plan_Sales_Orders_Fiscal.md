# Plan: Módulo de Órdenes de Venta con Sistema Fiscal Venezolano

**AutoSys — Sistema de Ventas**
Prioridad: Alta | Fecha: Marzo 2026

---

## 1. Contexto

### Flujo de Venta Completo (ya definido en el schema)
```
Order (Orden) → PreInvoice (Pre-factura) → ExitNote (Despacho) → Invoice (Factura) → Payment (Pago)
```

### Estado Actual
- **Schema Prisma**: Modelos `Order`, `OrderItem`, `PreInvoice`, `PreInvoiceItem`, `Invoice`, `InvoiceItem` ya existen
- **Backend**: Carpetas y archivos creados pero **vacíos** (`orders/`, `preInvoices/`, `invoices/`, etc.)
- **Frontend**: Pendiente
- **Campos fiscales**: Los modelos actuales tienen `subtotal`, `discount`, `tax`, `total` — **faltan** los campos fiscales completos

### Referencia: Lo que ya funciona en PurchaseOrder
- IVA por línea (16% / Exento / Reducido 8%)
- IGTF (3%) para pagos en divisas
- Descuentos por línea y generales (distribuido proporcionalmente ANTES del IVA)
- Multi-moneda (USD/VES/EUR) con tasa BCV
- `calculateOrderTotals()` — función pura reutilizable
- `itemName` snapshot
- `OrderFinancialSummary` — componente visual del desglose

---

## 2. Diferencias Clave: Compra vs Venta

| Aspecto | PurchaseOrder | Order (Venta) |
|---------|--------------|---------------|
| Contraparte | Proveedor (`Supplier`) | Cliente (`Customer`) |
| Precio | `unitCost` (costo) | `unitPrice` (precio de venta) |
| Stock | Sube al recibir | Baja al despachar |
| Flujo post-orden | → EntryNote | → PreInvoice → ExitNote → Invoice |
| Retenciones | No aplica | IVA (75%) e ISLR si es contribuyente especial |
| Facturación | No genera factura | Genera Invoice con correlativo fiscal |
| Condiciones pago | paymentTerms genérico | Métodos de pago (efectivo, transferencia, mixto) |
| IGTF | Aplica si pagamos en divisas | Aplica si el cliente paga en divisas |
| Impresión | No obligatoria | Factura fiscal obligatoria (SENIAT) |

---

## 3. Cambios al Schema Prisma

### 3.1 Order — Campos Nuevos

```prisma
model Order {
  // ... campos existentes ...
  
  // ── Moneda y tasa (NUEVO) ──
  currency          OrderCurrency     @default(USD)
  exchangeRate      Decimal?          @db.Decimal(14, 4)
  exchangeRateSource String?          // 'BCV_AUTO' | 'MANUAL'
  
  // ── Condiciones comerciales (NUEVO) ──
  paymentTerms      String?           // 'Contado', 'Crédito 30 días'
  creditDays        Int?
  deliveryTerms     String?
  
  // ── Descuento general (REEMPLAZA discount) ──
  discountAmount    Decimal           @default(0) @db.Decimal(12, 2)
  
  // ── Totales fiscales (REEMPLAZAN subtotal/tax/total) ──
  subtotalBruto     Decimal           @default(0) @db.Decimal(12, 2)
  baseImponible     Decimal           @default(0) @db.Decimal(12, 2)
  baseExenta        Decimal           @default(0) @db.Decimal(12, 2)
  taxAmount         Decimal           @default(0) @db.Decimal(12, 2)
  taxRate           Decimal           @default(16) @db.Decimal(5, 2)
  
  // ── IGTF (NUEVO) ──
  igtfApplies       Boolean           @default(false)
  igtfRate          Decimal           @default(3) @db.Decimal(5, 2)
  igtfAmount        Decimal           @default(0) @db.Decimal(12, 2)
  
  // ── Total final (REEMPLAZA total) ──
  total             Decimal           @default(0) @db.Decimal(12, 2)
  
  // ── Retenciones (NUEVO - contribuyentes especiales) ──
  retencionIva      Decimal           @default(0) @db.Decimal(12, 2)  // 75% del IVA
  retencionIslr     Decimal           @default(0) @db.Decimal(12, 2)  // % según actividad
  isContribuyenteEspecial Boolean     @default(false)
}

enum OrderCurrency {
  USD
  VES
  EUR
}
```

### 3.2 OrderItem — Campos Nuevos

```prisma
model OrderItem {
  // ... campos existentes ...
  
  itemName          String?           @db.VarChar(255)  // Snapshot del nombre
  
  // ── Descuento por línea (NUEVO) ──
  discountPercent   Decimal           @default(0) @db.Decimal(5, 2)
  discountAmount    Decimal           @default(0) @db.Decimal(12, 2)
  
  // ── Impuesto por línea (NUEVO) ──
  taxType           TaxType           @default(IVA)     // Reutiliza el enum de PurchaseOrder
  taxRate           Decimal           @default(16) @db.Decimal(5, 2)
  taxAmount         Decimal           @default(0) @db.Decimal(12, 2)
  
  // ── Total línea (NUEVO) ──
  totalLine         Decimal           @default(0) @db.Decimal(12, 2)
}
```

### 3.3 Nota sobre modelos PreInvoice/Invoice

Los mismos campos fiscales deben replicarse en `PreInvoice` e `Invoice` porque:
- **PreInvoice**: Hereda los totales de la Order al crearla (copia)
- **Invoice**: Es el documento fiscal final — DEBE tener todos los campos para impresión

Esto se hace en una fase posterior. Primero Order.

---

## 4. Fases de Implementación

### Fase 0: Migración Prisma

```sql
-- Nuevos enums
CREATE TYPE "OrderCurrency" AS ENUM ('USD', 'VES', 'EUR');

-- Order: nuevos campos
ALTER TABLE "orders" ADD COLUMN "currency" "OrderCurrency" DEFAULT 'USD';
ALTER TABLE "orders" ADD COLUMN "exchangeRate" DECIMAL(14,4);
ALTER TABLE "orders" ADD COLUMN "exchangeRateSource" VARCHAR(20);
ALTER TABLE "orders" ADD COLUMN "paymentTerms" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN "creditDays" INTEGER;
ALTER TABLE "orders" ADD COLUMN "deliveryTerms" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN "discountAmount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "subtotalBruto" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "baseImponible" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "baseExenta" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "taxAmount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "taxRate" DECIMAL(5,2) DEFAULT 16;
ALTER TABLE "orders" ADD COLUMN "igtfApplies" BOOLEAN DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "igtfRate" DECIMAL(5,2) DEFAULT 3;
ALTER TABLE "orders" ADD COLUMN "igtfAmount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "retencionIva" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "retencionIslr" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "isContribuyenteEspecial" BOOLEAN DEFAULT false;

-- OrderItem: nuevos campos
ALTER TABLE "order_items" ADD COLUMN "itemName" VARCHAR(255);
ALTER TABLE "order_items" ADD COLUMN "discountPercent" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN "discountAmount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN "taxType" "TaxType" DEFAULT 'IVA';
ALTER TABLE "order_items" ADD COLUMN "taxRate" DECIMAL(5,2) DEFAULT 16;
ALTER TABLE "order_items" ADD COLUMN "taxAmount" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN "totalLine" DECIMAL(12,2) DEFAULT 0;

-- Migrar datos existentes (si hay)
UPDATE "orders" SET 
  "subtotalBruto" = "subtotal",
  "baseImponible" = "subtotal",
  "taxAmount" = "tax"
WHERE "subtotalBruto" = 0;

UPDATE "order_items" SET 
  "discountAmount" = "discount",
  "totalLine" = "subtotal"
WHERE "totalLine" = 0;
```

---

### Fase 1: Backend — Shared Utils

**Reutilizar** `calculateOrderTotals.ts` de PurchaseOrder. La misma función pura sirve para ventas porque la lógica fiscal es idéntica:

1. Subtotal por línea = qty × unitPrice (en vez de unitCost)
2. Descuento por línea
3. Neto línea
4. Subtotal Bruto
5. Descuento General (proporcional gravadas/exentas)
6. Base Imponible / Base Exenta
7. IVA 16%
8. IGTF 3% (si aplica)
9. Total

**La función ya existe en** `backend/src/features/inventory/purchaseOrders/calculateOrderTotals.ts`. Podemos:
- **Opción A**: Moverla a `backend/src/shared/utils/calculateOrderTotals.ts` (compartida entre módulos)
- **Opción B**: Importarla directamente desde el módulo de inventory

**Recomendación**: Opción A — moverla a shared, es lógica fiscal genérica.

**Archivo nuevo para ventas**: `taxCalculator.ts` en `sales/shared/utils/` que extiende la lógica base con:
- Retención IVA (75% del IVA si `isContribuyenteEspecial`)
- Retención ISLR (% según actividad económica)
- Cálculo del neto a cobrar: `total - retencionIva - retencionIslr`

---

### Fase 2: Backend — Orders Module (service, dto, validation, controller)

Los archivos están vacíos. Escribir desde cero siguiendo el patrón de PurchaseOrder:

#### 2.1 `orders.validation.ts` (Joi)
- `createOrderSchema`: customerId, warehouseId, items[], currency, paymentTerms, etc.
- `updateOrderSchema`: header + items[] opcionales (mismo patrón que ExitNote)
- `orderFiltersSchema`: search, status, customerId, sortBy, sortOrder, page, limit
- Items: itemId, quantity, unitPrice, discountPercent, taxType, itemName

#### 2.2 `orders.dto.ts`
- `CreateOrderDTO`, `CreateOrderItemDTO`, `UpdateOrderDTO`, `OrderResponseDTO`
- Mismo patrón: constructor con parsing, null handling, `!= null` checks

#### 2.3 `orders.service.ts`
- `createWithItems()`: Valida customer + warehouse + items, calcula totales, crea en transacción
- `update()`: Si DRAFT + items provided → delete all + recreate (mismo patrón ExitNote)
- `findAll()`: Con search, sort, pagination
- `findById()`: Con include items + customer + warehouse
- `approve()`: DRAFT → APPROVED (genera PreInvoice automáticamente)
- `cancel()`: Si no tiene PreInvoice activa
- `delete()`: Solo DRAFT

#### 2.4 `orders.controller.ts`
- CRUD + approve + cancel
- Pasa `req.prisma` para tenant safety

#### 2.5 `orders.routes.ts`
- GET /, GET /:id, POST /, PUT /:id, PATCH /:id/approve, PATCH /:id/cancel, DELETE /:id

#### 2.6 `items/items.service.ts` y `items/controller.ts`
- addItem, removeItem, getItems (sub-ruta)

---

### Fase 3: Frontend — Interfaces, Zod, Service

#### 3.1 `order.interface.ts`
- Enums: `OrderStatus`, `OrderCurrency`
- Interfaces: `Order`, `OrderItem`, `CreateOrder`, `CreateOrderItem`
- Configs: `ORDER_STATUS_CONFIG`, `ORDER_CURRENCY_LABELS`

#### 3.2 `orderZod.tsx`
- itemId con UUID regex, itemName, quantity, unitPrice, discountPercent, taxType
- warehouseId, customerId con UUID regex

#### 3.3 `orderService.ts`
- getAll, getById, create, update, approve, cancel, delete
- Con params: search, sortBy, sortOrder, page, limit

---

### Fase 4: Frontend — Componentes

#### 4.1 `OrderForm.tsx`
Espejo de `PurchaseOrderForm.tsx`:
- Header: Cliente (AutoComplete) + Almacén + Moneda + Tasa BCV
- Items: `ItemsTable` + `ItemRow` con descuento%, tipo impuesto, total línea
- Footer: `OrderFinancialSummary` (reutilizable) + IGTF toggle
- Condiciones comerciales
- `selectedItemsMap` + `itemName` sync

#### 4.2 `OrderList.tsx`
Espejo de `PurchaseOrderList.tsx` / `ExitNoteList.tsx`:
- Lazy pagination + debounced search
- `confirmAction` para status transitions
- Cog menu para CRUD (solo DRAFT)
- Row expansion con stepper + tabla estilizada
- `CreateButton` + `FormActionButtons`

#### 4.3 `OrderStepper.tsx`
DRAFT → APPROVED → (se genera PreInvoice)

#### 4.4 Componentes reutilizables (ya existen):
- `ItemsTable`, `ItemRow` — con props opcionales de descuento/impuesto
- `OrderFinancialSummary` — muestra desglose fiscal
- `useBcvRate()` — hook de tasa BCV
- `useOrderCalculation()` — hook de cálculo en tiempo real
- `CreateButton`, `FormActionButtons`, `ConfirmAction`

---

## 5. Particularidades de Ventas (Venezuela)

### 5.1 Retenciones (Contribuyentes Especiales)
Si el cliente es **Agente de Retención** designado por el SENIAT:
- **Retención IVA**: 75% del IVA facturado (el cliente retiene y lo paga al SENIAT)
- **Retención ISLR**: Variable según actividad (normalmente 1-5%)
- El monto neto a cobrar = `total - retencionIva - retencionIslr`
- Se debe emitir **comprobante de retención**

**Implementación**: Campo `isContribuyenteEspecial` en `Customer` y en `Order`. Si está activo, calcular retenciones automáticamente.

### 5.2 Numeración Fiscal
Las facturas en Venezuela requieren:
- Número de control (correlativo, no puede tener gaps)
- Número de factura
- RIF del emisor y receptor
- Formato específico SENIAT

**Esto aplica a Invoice, no a Order**. La Order es un documento interno.

### 5.3 Exoneración de IVA
Algunos bienes/servicios están exonerados de IVA por decreto:
- Alimentos de primera necesidad
- Medicinas
- Servicios de salud

**Implementación**: El `taxType: EXEMPT` ya lo maneja. Se define por item en el catálogo.

### 5.4 IGTF en Ventas
Si el **cliente paga en divisas** (USD/EUR en efectivo o transferencia internacional):
- Se aplica IGTF 3% sobre el monto pagado en divisas
- Si paga parcialmente en divisas (mixto), solo aplica sobre la porción en divisas

---

## 6. Mapa de Archivos

### Backend (Escribir desde cero)

| Archivo | Descripción |
|---------|-------------|
| `shared/utils/calculateOrderTotals.ts` | **Mover** de inventory → shared |
| `sales/shared/utils/taxCalculator.ts` | Extender con retenciones IVA/ISLR |
| `sales/orders/orders.validation.ts` | Joi schemas |
| `sales/orders/orders.dto.ts` | DTOs con parsing |
| `sales/orders/orders.service.ts` | CRUD + approve + cancel + cálculos |
| `sales/orders/orders.controller.ts` | Endpoints |
| `sales/orders/orders.routes.ts` | Rutas Express |
| `sales/orders/items/items.service.ts` | Add/remove items |
| `sales/orders/items/items.controller.ts` | Sub-endpoints |
| `sales/orders/items/items.validation.ts` | Joi para items |

### Frontend (Crear)

| Archivo | Descripción |
|---------|-------------|
| `libs/interfaces/sales/order.interface.ts` | Tipos e interfaces |
| `libs/zods/sales/orderZod.tsx` | Validación Zod |
| `app/api/sales/orderService.ts` | API client |
| `components/sales/orders/OrderForm.tsx` | Formulario con fiscal |
| `components/sales/orders/OrderList.tsx` | Lista con lazy pagination |
| `components/sales/orders/OrderStepper.tsx` | Stepper visual |

### Migración

| Archivo | Descripción |
|---------|-------------|
| `prisma/schema.prisma` | Agregar campos fiscales a Order/OrderItem |
| `prisma/migrations/XXXX_add_fiscal_to_orders/` | SQL de migración |

---

## 7. Orden de Ejecución

1. **Migración Prisma** (campos fiscales en Order/OrderItem)
2. **Mover** `calculateOrderTotals` a shared
3. **Backend Orders** (validation → dto → service → controller → routes)
4. **Frontend interfaces + zod + service**
5. **Frontend OrderForm + OrderList**
6. **Probar flujo completo**: Crear orden → aprobar → verificar PreInvoice

---

## 8. Notas

- Los archivos de `preInvoices/`, `invoices/`, `payments/`, `creditNotes/`, `quotes/` también están vacíos pero NO los tocamos en esta fase — solo Orders
- El `Customer` model necesitará un campo `isContribuyenteEspecial` si no lo tiene
- `calculateOrderTotals` usa `unitCost` internamente — para ventas usamos `unitPrice`, pero la función acepta un campo genérico `unitCost` que puede ser el precio de venta
- El componente `OrderFinancialSummary` ya existe y es reutilizable — solo agregar líneas de retención
- El `ExitNote` tipo SALE se vincula al `PreInvoice`, no directamente a `Order`
