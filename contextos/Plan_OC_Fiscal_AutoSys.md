# Plan de Implementación: Órdenes de Compra con Impuestos, Descuentos y Multi-Moneda

**AutoSys — Sistema de Inventario**
Adaptado al marco fiscal venezolano (IVA, IGTF, SENIAT)
Versión 1.0 — Marzo 2026

---

## 1. Resumen Ejecutivo

Este plan detalla la implementación de un sistema completo de facturación fiscal para las Órdenes de Compra en AutoSys, adaptado a la normativa venezolana vigente. Incluye: IVA por línea (16% / Exento / Reducido 8%), IGTF (3%) para pagos en divisas, descuentos por línea y generales, soporte multi-moneda (USD/VES/EUR) con tasa BCV, y condiciones comerciales.

El descuento general se aplica **antes del IVA** (afecta la base imponible), según lo establecido por el SENIAT. Todos los cálculos se ejecutan en el frontend para feedback inmediato, pero el backend los recalcula desde cero por seguridad.

---

## 2. Decisiones Técnicas Clave

### 2.1 Orden de Cálculo (Flujo Matemático)

El cálculo sigue este orden estricto, conforme a la normativa SENIAT:

| Paso | Operación | Fórmula |
|------|-----------|---------|
| 1 | Subtotal por línea | `qty × unitCost` |
| 2 | Descuento por línea | `lineSubtotal × (discountPercent / 100)` |
| 3 | Neto línea | `lineSubtotal - lineDiscount` |
| 4 | Subtotal Bruto | `Σ netos de todas las líneas` |
| 5 | **Descuento General** | **Se resta del subtotalBruto (ANTES del IVA)** |
| 6 | Distribución proporcional | `descGravado = descGeneral × (sumGravadas / subtotalBruto)` |
| 7 | Base Imponible | `sumGravadas - descGravado` |
| 8 | Base Exenta | `sumExentas - descExento` |
| 9 | IVA | `baseImponible × 0.16` |
| 10 | IGTF (si aplica) | `(baseImponible + baseExenta + IVA) × 0.03` |
| 11 | **TOTAL** | `baseImponible + baseExenta + IVA + IGTF` |

### 2.2 Seguridad: Doble Cálculo

El frontend calcula todo en tiempo real para la experiencia del usuario. Sin embargo, el backend **DESCARTA** todos los totales recibidos y los recalcula desde cero usando solo: `itemId`, `quantity`, `unitCost`, `discountPercent`, `taxType`, `igtfApplies`, y `discountAmount` global. Esto previene manipulación de precios vía API.

### 2.3 Tasa BCV

Se integra un servicio externo para obtener la tasa BCV del día automáticamente. Sin embargo, dado que esta API puede fallar (común en Venezuela), siempre existe la opción de ingreso manual. Se agrega un campo `exchangeRateSource` que registra si la tasa fue:
- `BCV_AUTO` — automática
- `MANUAL` — ingresada por el usuario

### 2.4 IGTF

El IGTF (3%) aplica sobre el monto total pagado en moneda extranjera. Si la orden es 100% en USD o EUR, aplica sobre todo. El toggle "Pago en Divisas" activa/desactiva el cálculo. La tasa (actualmente 3%) es configurable por si cambia en el futuro.

### 2.5 ItemRow.tsx es Componente Compartido

El componente `ItemRow.tsx` vive en `components/common/` y es usado tanto por `PurchaseOrderForm` como por `EntryNoteForm`. Los campos nuevos (descuento por línea, tipo de impuesto) deben ser **OPCIONALES** para no romper los formularios existentes. Se agregan como props opcionales con `fieldPaths` condicionales.

---

## 3. Modelos Prisma (Actualizados)

### 3.1 PurchaseOrder — Campos nuevos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `currency` | Enum | `USD \| VES \| EUR` (default: USD) |
| `exchangeRate` | Decimal(14,4)? | Tasa BCV del día (VES por 1 USD) |
| `exchangeRateSource` | String? | `'BCV_AUTO' \| 'MANUAL'` |
| `paymentTerms` | String? | Ej: "Contado", "Crédito 30 días" |
| `creditDays` | Int? | Días de crédito si aplica |
| `deliveryTerms` | String? | Ej: "Puesto en almacén", "FOB" |
| `discountAmount` | Decimal(12,2) | Descuento general sobre subtotal bruto |
| `subtotalBruto` | Decimal(12,2) | Σ netos de líneas (antes de desc. general) |
| `baseImponible` | Decimal(12,2) | Base gravada (IVA 16%) después de desc. |
| `baseExenta` | Decimal(12,2) | Base exenta (0%) después de desc. |
| `taxAmount` | Decimal(12,2) | IVA total calculado |
| `taxRate` | Decimal(5,2) | % IVA vigente (default: 16) |
| `igtfApplies` | Boolean | Toggle: pago en divisas (default: false) |
| `igtfRate` | Decimal(5,2) | % IGTF vigente (default: 3) |
| `igtfAmount` | Decimal(12,2) | Monto IGTF calculado |
| `total` | Decimal(12,2) | Total final: bases + IVA + IGTF |

### 3.2 PurchaseOrderItem — Campos nuevos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `discountPercent` | Decimal(5,2) | % descuento de línea (default: 0) |
| `discountAmount` | Decimal(12,2) | Monto desc. calculado |
| `taxType` | Enum TaxType | `IVA \| EXEMPT \| REDUCED` |
| `taxRate` | Decimal(5,2) | % según taxType (16, 0, 8) |
| `taxAmount` | Decimal(12,2) | IVA calculado para esta línea |
| `totalLine` | Decimal(12,2) | subtotal + taxAmount |

### 3.3 Enum TaxType

```prisma
enum TaxType { IVA  EXEMPT  REDUCED }
```

`IVA` = 16% (gravado), `EXEMPT` = 0% (exento), `REDUCED` = 8% (reducido, para uso futuro).

---

## 4. Fases de Implementación

### Fase 0: Migración de Datos Existentes

> **⚠️ ANTES de tocar código, migrar los registros existentes para que no se rompan.**

1. **Crear migración Prisma** que agregue las columnas nuevas con defaults seguros.
2. **Script de datos:** Para órdenes existentes: `currency='USD'`, `taxRate=16`, `igtfApplies=false`, `subtotalBruto=subtotal` (viejo), `baseImponible=subtotal`, `baseExenta=0`, `taxAmount=tax` (viejo), `total=total` (viejo).
3. **Items existentes:** `taxType='IVA'`, `taxRate=16`, `discountPercent=0`, `discountAmount=0`, `totalLine=subtotal` (viejo).
4. **Eliminar columnas viejas** (`subtotal`, `tax`, `total` originales) solo después de verificar que todo funciona. No en esta migración.

**Archivos:**
- `prisma/migrations/XXXX_add_fiscal_fields/migration.sql`
- `prisma/schema.prisma` (actualizar modelos)

---

### Fase 1: Backend — Interfaces, DTOs y Validación

1. **Actualizar `purchaseOrders.interface.ts`:** Agregar los enums `PurchaseOrderCurrency` y `TaxType`. Agregar campos nuevos a la interfaz `IPurchaseOrder` e `IPurchaseOrderItem`.
2. **Actualizar `purchaseOrders.dto.ts`:** Agregar los campos nuevos a `CreatePurchaseOrderDto` e `ItemDto`. Los totales (`taxAmount`, `total`, etc.) son opcionales en el DTO porque el backend los recalcula.
3. **Actualizar `purchaseOrders.validation.ts` (Joi):** Validar `currency` como enum, `discountPercent` entre 0-100, `taxType` como enum, `exchangeRate` positivo, `igtfApplies` boolean. Los totales se validan como numéricos positivos pero no se confiará en sus valores.

**Archivos:**
- `purchaseOrders.interface.ts`
- `purchaseOrders.dto.ts`
- `purchaseOrders.validation.ts`

---

### Fase 2: Backend — Servicio (Lógica de Cálculo)

> **Esta es la fase más crítica. El servicio recalcula TODOS los totales.**

1. **Crear función `calculateOrderTotals()`:** Función pura que recibe `items[]` + `discountAmount` global + `igtfApplies` + `taxRate` + `igtfRate`, y retorna: `{ subtotalBruto, baseImponible, baseExenta, taxAmount, igtfAmount, total, itemsWithTotals[] }`.
2. **Distribución proporcional del descuento general:** Si `subtotalBruto = 275`, de los cuales 150 son gravadas y 125 son exentas, y el descuento es 10: `descGravado = 10 × (150/275) = 5.45`, `descExento = 10 × (125/275) = 4.55`. Usar `Decimal.js` para precisión.
3. **Refactorizar `createWithItems()`:** Recibir items con `taxType` y `discountPercent`. Llamar `calculateOrderTotals()`. Guardar todos los campos nuevos en la orden y en cada item.
4. **Refactorizar `update()`:** Si cambia moneda, descuento global, o `igtfApplies` en estado DRAFT, recalcular totales automáticamente.
5. **Refactorizar `addItem()` y `removeItem()`:** Al agregar/eliminar un item, recalcular todos los totales de la orden completa.

**Archivos:**
- `purchaseOrders.service.ts`
- `utils/calculateOrderTotals.ts` (nuevo, función pura reutilizable)

---

### Fase 3: Frontend — Interfaces, Zod y API Service

1. **Actualizar `purchaseOrder.interface.ts`:** Agregar los tipos que coincidan con Prisma. Agregar `CURRENCY_LABELS`, `TAX_TYPE_LABELS`, etc.
2. **Actualizar `purchaseOrderZod.ts`:** Agregar validaciones: `discountPercent` z.number().min(0).max(100), `taxType` z.enum(['IVA','EXEMPT','REDUCED']), `currency` z.enum(['USD','VES','EUR']), `exchangeRate` z.number().positive().optional().
3. **Actualizar `purchaseOrderService.ts`:** Actualizar el payload de create/update para enviar los campos nuevos.
4. **Crear hook `useBcvRate()`:** Fetch automático de tasa BCV. Con fallback manual y estado de carga. Retorna `{ rate, source, loading, error, setManualRate }`.
5. **Crear hook `useOrderCalculation()`:** Hook que recibe `items[]` + `discountAmount` + `igtfApplies` y retorna el desglose financiero completo en tiempo real. Misma lógica que el backend pero para UI.

**Archivos:**
- `libs/interfaces/inventory/purchaseOrder.interface.ts`
- `libs/zods/inventory/purchaseOrderZod.ts`
- `app/api/inventory/purchaseOrderService.ts`
- `hooks/useBcvRate.ts` (nuevo)
- `hooks/useOrderCalculation.ts` (nuevo)

---

### Fase 4: Frontend — UI (Formulario y Componentes)

1. **Header del formulario (`PurchaseOrderForm.tsx`):** Agregar sección "Moneda y Condiciones": Dropdown moneda, campo tasa BCV (read-only con botón manual), condiciones de pago, días de crédito, términos de entrega.
2. **`ItemRow.tsx` (componente compartido):** Agregar props OPCIONALES: `fieldPaths.discountPercent`, `fieldPaths.taxType`, `colWidths.discountPercent`, `colWidths.taxType`. Renderizar solo si se proveen. Así `EntryNoteForm` sigue funcionando sin cambios.
3. **Resumen Financiero (nuevo componente):** Componente `OrderFinancialSummary.tsx` que muestra el desglose: Subtotal Bruto, Descuentos Generales, Base Imponible (16%), Base Exenta (0%), IVA (16%), IGTF (3%), Total a Pagar. Con colores y formato como la imagen de referencia.
4. **Toggle IGTF:** Card con switch "Pago en Divisas (Aplica IGTF 3%)" con texto explicativo. Al activar, el resumen financiero muestra la línea IGTF destacada en amarillo.
5. **Campo Descuento General:** InputNumber debajo de la tabla de items, con label "Descuento General". Puede ser monto fijo o porcentaje (toggle $/ %).

**Archivos:**
- `components/inventory/purchaseOrders/PurchaseOrderForm.tsx`
- `components/inventory/common/ItemRow.tsx` (modificaciones opcionales)
- `components/inventory/common/OrderFinancialSummary.tsx` (nuevo)

---

## 5. Mapa de Archivos

| Fase | Archivo | Acción | Prioridad |
|------|---------|--------|-----------|
| 0 | `prisma/schema.prisma` | Modificar | 🔴 CRÍTICA |
| 0 | `prisma/migrations/XXXX_.../migration.sql` | Crear | 🔴 CRÍTICA |
| 1 | `purchaseOrders.interface.ts` | Modificar | 🟠 Alta |
| 1 | `purchaseOrders.dto.ts` | Modificar | 🟠 Alta |
| 1 | `purchaseOrders.validation.ts` | Modificar | 🟠 Alta |
| 2 | `purchaseOrders.service.ts` | Modificar | 🟠 Alta |
| 2 | `utils/calculateOrderTotals.ts` | Crear | 🟠 Alta |
| 3 | `purchaseOrder.interface.ts` (FE) | Modificar | 🔵 Media |
| 3 | `purchaseOrderZod.ts` | Modificar | 🔵 Media |
| 3 | `purchaseOrderService.ts` (FE) | Modificar | 🔵 Media |
| 3 | `hooks/useBcvRate.ts` | Crear | 🔵 Media |
| 3 | `hooks/useOrderCalculation.ts` | Crear | 🔵 Media |
| 4 | `PurchaseOrderForm.tsx` | Modificar | 🔵 Media |
| 4 | `ItemRow.tsx` | Modificar | 🔵 Media |
| 4 | `OrderFinancialSummary.tsx` | Crear | 🔵 Media |

---

## 6. Plan de Verificación

### 6.1 Test Manual

- Crear orden con 2 items: uno gravado IVA 16% y otro Exento (0%).
- Aplicar descuento del 10% en la línea gravada.
- Aplicar descuento general de $10 sobre el subtotal.
- Verificar que la distribución proporcional del descuento es correcta.
- Activar toggle IGTF y verificar que aparece la línea en el resumen.
- Cambiar moneda a VES y verificar que la tasa BCV se autocompleta.
- Guardar y verificar en BD que los totales del backend coinciden con los del frontend.

### 6.2 Casos Borde

- Orden con TODOS los items exentos (`baseImponible = 0`, `IVA = 0`).
- Descuento general mayor que el subtotal (debe limitarse al subtotal).
- Descuento por línea del 100% (línea en $0).
- API BCV caída: verificar que el fallback manual funciona.
- Edición de orden existente (migrada) que no tenía los campos nuevos.

### 6.3 Validación Matemática (Ejemplo Completo)

| Concepto | Valor |
|----------|-------|
| Línea 1: Licencia Software (1 × $150, IVA 16%) | $150.00 |
| Línea 2: Soporte Técnico (5 × $25, Exento, -10% desc) | $112.50 |
| Subtotal Bruto | $262.50 |
| Descuento General | -$10.00 |
| Proporción gravada: 10 × (150/262.50) | $5.71 |
| Proporción exenta: 10 × (112.50/262.50) | $4.29 |
| Base Imponible (150 - 5.71) | $144.29 |
| Base Exenta (112.50 - 4.29) | $108.21 |
| IVA 16% sobre $144.29 | $23.09 |
| IGTF 3% sobre (144.29 + 108.21 + 23.09) | $8.27 |
| **TOTAL A PAGAR** | **$283.86** |

---

## 7. Notas Finales

- Usar `Decimal.js` en backend para todos los cálculos monetarios (evitar errores de punto flotante).
- Las tasas (IVA 16%, IGTF 3%) deben ser configurables, no hardcodeadas, por si cambian.
- No eliminar las columnas viejas (`subtotal`, `tax`, `total`) hasta verificar que todo funciona en producción.
- El componente `OrderFinancialSummary.tsx` puede reutilizarse después para cotizaciones, facturas de venta, etc.
- Considerar a futuro: retenciones IVA (75%) e ISLR para contribuyentes especiales.
