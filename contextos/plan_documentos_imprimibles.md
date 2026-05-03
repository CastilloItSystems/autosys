# Plan: Documentos Imprimibles — AutoSys

## Contexto y motivación

El sistema AutoSys tiene infraestructura PDF instalada (`@react-pdf/renderer`) y dos templates funcionales
(`WorkshopReceptionTemplate`, `GaritaEventTemplate`). Sin embargo, ningún módulo de ventas, inventario,
taller, finanzas, concesionario ni CRM tiene documentos imprimibles conectados.

**Auditoría inicial:**

- 13 templates huérfanos en `frontend/components/pdf/templates/` (legacy, estructura incorrecta — **borrar**)
- 2 templates funcionales en `frontend/components/pdf/templates/` — mantener como referencia
- 1 template inline en `frontend/modules/inventory/cycleCounts/components/CycleCountRouteSheetPDF.tsx` — funcional
- 17 documentos prioritarios sin implementación
- `CustomActionButtons` tiene prop `pdfTemplate` pero ningún módulo la usa — **no usar** ese patrón

---

## Decisiones de diseño

| Decisión               | Resolución                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Ubicación de templates | **Opción B co-ubicado**: `modules/<mod>/<submod>/templates/<Name>Template.tsx`              |
| Templates legacy       | Borrar los 13 huérfanos; mantener solo `WorkshopReceptionTemplate` y `GaritaEventTemplate`  |
| Patrón de conexión     | Estado `pdfItem` en el List component + `Dialog` con `PDFViewer` (dynamic import)           |
| Estilos                | `StyleSheet.create()` inline en cada template — NO importar `pdfStyles.ts` (legacy)         |
| Fuentes                | Roboto via `@/utils/pdfUtils.ts` (mismo patrón que CycleCount)                              |
| Imágenes remotas       | URL directa en `<Image>`. Si hay CORS: usar `urlToBase64ViaProxy` del `ReceptionPDFPreview` |
| Endpoints backend      | Fuera de scope — los datos ya vienen en la fila del DataTable                               |
| Logo empresa           | Incluir si el store/session expone `empresaLogo`; opcional en Fase 1                        |

---

## Patrón de template (referencia exacta)

Basado en `WorkshopReceptionTemplate.tsx` y `GaritaEventTemplate.tsx`:

```tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { registerFonts } from "@/utils/pdfUtils";

registerFonts();

interface EntityTemplatePDFData {
  // campos de la entidad mapeados para el template
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 30,
    fontFamily: "Roboto",
  },
  // header fijo
  header: {
    position: "absolute",
    top: 0,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 8,
  },
  // footer fijo
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // secciones con borde izquierdo azul
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Roboto-Bold",
    color: "#1e3a8a",
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
    paddingLeft: 6,
    marginBottom: 6,
  },
  // grid 2 columnas
  grid2Col: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  // tabla de items
  tableHeader: { flexDirection: "row", backgroundColor: "#1e3a8a" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  // badge de status
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
  },
});

const EntityTemplate = ({ data }: { data: EntityTemplatePDFData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header fijo */}
      <View style={styles.header} fixed>
        <Text style={{ fontSize: 11, fontFamily: "Roboto-Bold" }}>
          {data.empresaName ?? "AutoSys"}
        </Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 8 }}>N° {data.numero}</Text>
          <Text style={{ fontSize: 8 }}>{data.fecha}</Text>
        </View>
      </View>

      {/* Contenido */}
      {/* ... secciones y tabla ... */}

      {/* Footer fijo */}
      <View style={styles.footer} fixed>
        <Text style={{ fontSize: 7, color: "#6b7280" }}>
          {data.empresaName ?? "AutoSys"}
        </Text>
        <Text
          style={{ fontSize: 7, color: "#6b7280" }}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </View>
    </Page>
  </Document>
);

export default EntityTemplate;
```

---

## Patrón de conexión en List components

```tsx
// 1. Import dinámico (evitar SSR)
import dynamic from "next/dynamic";
const PDFViewer = dynamic(() => import("@/components/pdf/PDFViewer"), { ssr: false });
const PaymentReceiptTemplate = dynamic(
  () => import("../templates/PaymentReceiptTemplate"),
  { ssr: false }
);

// 2. Estado en el componente
const [pdfItem, setPdfItem] = useState<Payment | null>(null);

// 3a. Módulos con Menu existente — agregar item al array:
{ label: "Imprimir PDF", icon: "pi pi-print", command: () => setPdfItem(selectedRow) }

// 3b. Módulos sin Menu — agregar Button en la columna de acciones:
<Button
  icon="pi pi-print"
  rounded size="small"
  severity="secondary"
  tooltip="Imprimir PDF"
  tooltipOptions={{ position: "top" }}
  onClick={() => setPdfItem(rowData)}
/>

// 4. Dialog con preview al final del JSX:
{pdfItem && (
  <Dialog
    visible
    onHide={() => setPdfItem(null)}
    header="Vista Previa — Comprobante de Pago"
    style={{ width: "85%", height: "90vh" }}
    contentStyle={{ padding: 0, height: "100%" }}
    modal
  >
    <PDFViewer width="100%" height="100%">
      <PaymentReceiptTemplate data={pdfItem} />
    </PDFViewer>
  </Dialog>
)}
```

---

## Fase 0 — Limpiar legacy

**Borrar** los siguientes archivos (estructura legacy, no compatible con interfaces actuales):

```
frontend/components/pdf/templates/FacturaTemplate.tsx
frontend/components/pdf/templates/AbonoTemplate.tsx
frontend/components/pdf/templates/AbonosPorMesTemplate.tsx
frontend/components/pdf/templates/BalancesReportePDF.tsx
frontend/components/pdf/templates/ChequeoCalidadTemplate.tsx
frontend/components/pdf/templates/ChequeoCantidadTemplate.tsx
frontend/components/pdf/templates/ContactosReporteTemplate.tsx
frontend/components/pdf/templates/ContratoTemplate.tsx
frontend/components/pdf/templates/ContratosReporteTemplate.tsx
frontend/components/pdf/templates/ContratosTemplate.tsx
frontend/components/pdf/templates/CuentasPendientesTemplate.tsx
frontend/components/pdf/templates/DespachoTemplate.tsx
frontend/components/pdf/templates/recepcionTemplate.tsx
frontend/components/pdf/templates/reportesLogisticaTemplate.tsx
```

**Mantener:**

- `frontend/components/pdf/templates/WorkshopReceptionTemplate.tsx` ✅
- `frontend/components/pdf/templates/GaritaEventTemplate.tsx` ✅

---

## Fase 1 — Alta Prioridad (13 templates)

### Ventas (4 templates)

#### 1. Comprobante de Pago

| Atributo          | Valor                                                         |
| ----------------- | ------------------------------------------------------------- |
| **Template**      | `modules/sales/payments/templates/PaymentReceiptTemplate.tsx` |
| **Conectar en**   | `modules/sales/payments/components/PaymentList.tsx`           |
| **Patrón acción** | Button inline (no tiene Menu)                                 |
| **Interface**     | `Payment` desde `../interfaces/payment.interface`             |

**Campos clave del template:**

- Encabezado: N° de pago (`paymentNumber`), fecha (`processedAt`), estado (`status`)
- Datos cliente: `customer.name`, `customer.code`, `customer.taxId`
- Método(s) de pago: tabla `details[]` → `{ method, amount, reference?, currency }`
- Totales: `amount`, `igtfApplies`, `igtfAmount`, `totalWithIgtf`, `currency`, `exchangeRate`
- Pre-factura asociada: `preInvoice.preInvoiceNumber`, `preInvoice.total`
- Procesado por: `processedBy`
- Notas: `notes`

---

#### 2. Factura

| Atributo          | Valor                                                 |
| ----------------- | ----------------------------------------------------- |
| **Template**      | `modules/sales/invoice/templates/InvoiceTemplate.tsx` |
| **Conectar en**   | `modules/sales/invoice/components/InvoiceList.tsx`    |
| **Patrón acción** | Button inline (no tiene Menu)                         |
| **Interface**     | `Invoice` desde `../interfaces/invoice.interface`     |

**Campos clave del template:**

- Encabezado: `invoiceNumber`, `fiscalNumber`, `invoiceDate`, `status`
- Datos cliente: `customer.name`, `customer.code`, `customer.taxId`
- Tabla de items: `items[]` → `{ itemName, qty, unitPrice, discountPercent, taxType, taxRate, taxAmount, totalLine }`
- Totales: `subtotalBruto`, `discountAmount`, `baseImponible`, `baseExenta`, `taxAmount`, `taxRate`, `igtfApplies`, `igtfAmount`, `total`
- Moneda: `currency`, `exchangeRate`
- Pre-factura / Orden: `preInvoice.preInvoiceNumber`, `preInvoice.order`
- Pago: `payment.paymentNumber`, `payment.method`
- Notas: `notes`

---

#### 3. Pre-Factura

| Atributo          | Valor                                                       |
| ----------------- | ----------------------------------------------------------- |
| **Template**      | `modules/sales/preInvoice/templates/PreInvoiceTemplate.tsx` |
| **Conectar en**   | `modules/sales/preInvoice/components/PreInvoiceList.tsx`    |
| **Patrón acción** | Button inline (múltiples botones de estado ya existen)      |
| **Interface**     | `PreInvoice` desde `../interfaces/preInvoice.interface`     |

**Campos clave del template:**

- Encabezado: `preInvoiceNumber`, `status`, fecha de emisión
- Datos cliente: nombre, código, RIF/taxId
- Tabla de items con descripción, cantidad, precio, descuento, impuesto, total línea
- Totales: subtotal, descuento, base imponible, base exenta, IVA, IGTF, total
- Moneda y tasa de cambio
- Orden de venta asociada: `orderId`

---

#### 4. Orden de Venta

| Atributo          | Valor                                                  |
| ----------------- | ------------------------------------------------------ |
| **Template**      | `modules/sales/order/templates/SalesOrderTemplate.tsx` |
| **Conectar en**   | `modules/sales/order/components/OrderList.tsx`         |
| **Patrón acción** | Agregar item al Menu existente (menuRef)               |
| **Interface**     | `Order` desde `../interfaces/order.interface`          |

**Campos clave del template:**

- Encabezado: `orderNumber`, `status`, fecha
- Datos cliente: nombre, código, contacto
- Tabla de items con sku, descripción, cantidad, precio unitario, descuento, subtotal
- Totales generales
- Observaciones / notas

---

### Taller (5 templates)

#### 5. Orden de Servicio

| Atributo          | Valor                                                               |
| ----------------- | ------------------------------------------------------------------- |
| **Template**      | `modules/workshop/serviceOrders/templates/ServiceOrderTemplate.tsx` |
| **Conectar en**   | `modules/workshop/serviceOrders/components/ServiceOrderList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                                      |
| **Interface**     | `ServiceOrder` desde `./interfaces/serviceOrder.interface`          |

**Campos clave del template:**

- Encabezado: `folio`, `status`, `priority`, `receivedAt`, `estimatedDelivery`
- Datos cliente: `customer.name`, teléfono, correo
- Datos vehículo: `vehiclePlate`, `vehicleDesc`, `mileageIn`, `mileageOut`, `customerVehicle` (marca, modelo, año, color, VIN)
- Asignaciones: `assignedTechnicianId`, `bayId`, `serviceTypeId`, `assignedAdvisorId`
- Tabla de items: `items[]` → `{ type, description, quantity, unitPrice, discountPct, taxType, taxAmount, total }`
- Totales: `laborTotal`, `partsTotal`, `otherTotal`, `subtotal`, `taxAmt`, `total`
- Moneda: `currency`, `exchangeRate`
- Diagnóstico: `diagnosisNotes`, `observations`
- Notas internas
- Firmas: cliente + técnico (líneas en blanco)

---

#### 6. Cotización de Taller

| Atributo          | Valor                                                         |
| ----------------- | ------------------------------------------------------------- |
| **Template**      | `modules/workshop/quotations/templates/QuotationTemplate.tsx` |
| **Conectar en**   | `modules/workshop/quotations/components/QuotationList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                                |
| **Interface**     | `WorkshopQuotation` desde `./interfaces/quotation.interface`  |

**Campos clave del template:**

- Encabezado: `quotationNumber`, `version`, `status`, `validUntil`
- Datos cliente: `customer.name`, `customer.taxId`
- Datos vehículo: `customerVehicle`, `vehiclePlate`
- Tabla de items: `items[]` → `{ type, description, qty, unitPrice, discountPct, taxType, taxAmount, total, approved }`
- Ítems rechazados vs aprobados (sección visual separada)
- Totales: `subtotal`, `discount`, `taxAmt`, `total`
- Aprobaciones: `approvals[]` → `{ type, channel, approvedByName, approvedAt, rejectionReason? }`
- Moneda: `currency`, `exchangeRate`
- Notas cliente / notas internas
- Cotizaciones suplementarias: `supplementaries[]`

---

#### 7. Diagnóstico

| Atributo          | Valor                                                        |
| ----------------- | ------------------------------------------------------------ |
| **Template**      | `modules/workshop/diagnoses/templates/DiagnosisTemplate.tsx` |
| **Conectar en**   | `modules/workshop/diagnoses/components/DiagnosisList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                               |
| **Interface**     | `Diagnosis` desde `./interfaces/diagnosis.interface`         |

**Campos clave del template:**

- Encabezado: ID diagnóstico, `status`, `severity`, `startedAt`, `finishedAt`
- Técnico: `technician.name`
- Orden de servicio asociada: `serviceOrder.folio`
- Tabla de hallazgos: `findings[]` → `{ category, description, severity, requiresClientAuth, clientApproved, observation }`
- Hallazgos ocultos: `isHiddenFinding` (sección separada o marcada)
- Operaciones sugeridas: `suggestedOperations[]` → `{ description, estimatedMins, estimatedPrice }`
- Repuestos sugeridos: `suggestedParts[]` → `{ description, quantity, estimatedCost, estimatedPrice }`
- Evidencias: `evidences[]` → `{ type, url, description }` (fotos si son base64)
- Notas generales: `generalNotes`
- Firmas: técnico + autorización cliente (si `requiresClientAuth`)

---

#### 8. Entrega de Vehículo — Taller

| Atributo          | Valor                                                        |
| ----------------- | ------------------------------------------------------------ |
| **Template**      | `modules/workshop/deliveries/templates/DeliveryTemplate.tsx` |
| **Conectar en**   | `modules/workshop/deliveries/components/DeliveryList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                               |
| **Interface**     | `VehicleDelivery` desde `./interfaces/delivery.interface`    |

**Campos clave del template:**

- Encabezado: folio de entrega, fecha (`deliveredAt`), estado
- Datos cliente: nombre, identificación
- Datos vehículo: placa, descripción, `mileageOut`
- Orden de servicio: `serviceOrder.folio`
- Trabajo realizado (resumen)
- Condición de entrega del vehículo
- Firma cliente (línea en blanco)
- Firma responsable de entrega (línea en blanco)

---

#### 9. Chequeo de Calidad

| Atributo          | Valor                                                               |
| ----------------- | ------------------------------------------------------------------- |
| **Template**      | `modules/workshop/qualityChecks/templates/QualityCheckTemplate.tsx` |
| **Conectar en**   | `modules/workshop/qualityChecks/components/QualityCheckList.tsx`    |
| **Patrón acción** | Button inline (no tiene Menu)                                       |
| **Interface**     | `QualityCheck` desde `./interfaces/qualityCheck.interface`          |

**Campos clave del template:**

- Encabezado: folio de chequeo, `status`, fecha
- Orden de servicio asociada: folio
- Técnico QC: nombre
- Tabla de respuestas del checklist: pregunta / respuesta / observación
- Hallazgos / defectos encontrados
- Decisión final: PASSED / FAILED / REWORK
- Notas
- Firma inspector de calidad

---

### Inventario (4 templates)

#### 10. Orden de Compra

| Atributo          | Valor                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| **Template**      | `modules/inventory/purchaseOrders/templates/PurchaseOrderTemplate.tsx` |
| **Conectar en**   | `modules/inventory/purchaseOrders/components/PurchaseOrderList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                                         |
| **Interface**     | `PurchaseOrder` desde `./interfaces/purchaseOrder.interface`           |

**Campos clave del template:**

- Encabezado: `orderNumber`, `status`, `orderDate`, `expectedDate`
- Proveedor: `supplier.name`, `supplier.taxId`, `supplier.email`, `supplier.phone`
- Almacén destino: `warehouse.name`, `warehouse.code`
- Condiciones: `paymentTerms`, `creditDays`, `deliveryTerms`
- Tabla de items: `items[]` → `{ itemName, quantityOrdered, quantityReceived, quantityPending, unitCost, discountPercent, taxType, taxAmount, totalLine }`
- Totales: `subtotalBruto`, `discountAmount`, `baseImponible`, `baseExenta`, `taxAmount`, `igtfApplies`, `igtfAmount`, `total`
- Moneda: `currency`, `exchangeRate`
- Aprobaciones: `submittedBy`, `submittedAt`, `approvedBy`, `approvedAt`
- Rechazo: `rejectedBy`, `rejectionReason`
- Notas: `notes`

---

#### 11. Nota de Entrada

| Atributo          | Valor                                                          |
| ----------------- | -------------------------------------------------------------- |
| **Template**      | `modules/inventory/entryNotes/templates/EntryNoteTemplate.tsx` |
| **Conectar en**   | `modules/inventory/entryNotes/components/EntryNoteList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                                 |
| **Interface**     | `EntryNote` desde `./interfaces/entryNote.interface`           |

**Campos clave del template:**

- Encabezado: `entryNoteNumber`, `type`, `status`, `receivedAt`
- Almacén: `warehouse.name`, `warehouse.code`
- Proveedor: `supplierName` / `catalogSupplier.name`
- Referencia: `reference`, `reason`
- OC asociada: `purchaseOrder.orderNumber`
- Tabla de items: `items[]` → `{ itemName, quantityReceived, unitCost, batchNumber?, expiryDate?, storedToLocation?, notes? }`
- Recibido por: `receivedByName`
- Verificado por: `verifiedBy`
- Autorizado por: `authorizedBy`
- Notas: `notes`
- Firmas: recibido + verificado + autorizado (líneas en blanco)

---

#### 12. Nota de Salida

| Atributo          | Valor                                                        |
| ----------------- | ------------------------------------------------------------ |
| **Template**      | `modules/inventory/exitNotes/templates/ExitNoteTemplate.tsx` |
| **Conectar en**   | `modules/inventory/exitNotes/components/ExitNoteList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                               |
| **Interface**     | `ExitNote` desde `./interfaces/exitNote.interface`           |

**Campos clave del template:**

- Encabezado: `exitNoteNumber`, `type`, `status`, `createdAt`
- Almacén origen: `warehouse.name`, `warehouse.code`
- Destinatario: `recipientName`, `recipientId`, `recipientPhone`
- Motivo / referencia: `reason`, `reference`
- Fecha esperada de devolución (si `type = LOAN`): `expectedReturnDate`
- Tabla de items: `items[]` → `{ itemName, quantity, pickedFromLocation?, notes? }`
- Autorizado por: `authorizedBy`
- Preparado por: `preparedBy`
- Entregado por: `deliveredBy`
- Notas: `notes`
- Firmas: preparó + entregó + recibió (líneas en blanco)

---

#### 13. Transferencia entre Almacenes

| Atributo          | Valor                                                        |
| ----------------- | ------------------------------------------------------------ |
| **Template**      | `modules/inventory/transfers/templates/TransferTemplate.tsx` |
| **Conectar en**   | `modules/inventory/transfers/components/TransferList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                               |
| **Interface**     | `Transfer` desde `./interfaces/transfer.interface`           |

**Campos clave del template:**

- Encabezado: `transferNumber`, `status`, `createdAt`
- Almacén origen: `fromWarehouse.name`
- Almacén destino: `toWarehouse.name`
- Pre-factura asociada: `preInvoiceNumber`
- Tabla de items: `items[]` → `{ item.name, item.sku, quantity, unitCost?, notes? }`
- Aprobado por: `approvedBy`, `approvedAt`
- Rechazado por: `rejectedBy`, `rejectionReason`
- Notas de entrada/salida: `exitNote.exitNoteNumber`, `entryNote.entryNoteNumber`
- Notas: `notes`
- Firmas: origen + destino (líneas en blanco)

---

## Fase 2 — Media Prioridad (4 templates)

#### 14. Cuentas por Cobrar

| Atributo          | Valor                                                               |
| ----------------- | ------------------------------------------------------------------- |
| **Template**      | `modules/finance/receivables/templates/ReceivablesTemplate.tsx`     |
| **Conectar en**   | `modules/finance/receivables/components/AccountsReceivableList.tsx` |
| **Patrón acción** | Button inline (no tiene Menu)                                       |
| **Interface**     | `ReceivableItem` desde `../services/receivablesService`             |

**Campos clave del template:**

- Cliente: nombre, taxId, código
- Saldo pendiente total
- Tabla de facturas pendientes: número de factura, fecha, vencimiento, monto, saldo
- Días de vencimiento (aging)
- Fecha de generación del reporte

---

#### 15. Cotización — Concesionario

| Atributo          | Valor                                                            |
| ----------------- | ---------------------------------------------------------------- |
| **Template**      | `modules/concesionario/quotes/templates/DealerQuoteTemplate.tsx` |
| **Conectar en**   | `modules/concesionario/quotes/components/DealerQuoteList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                                   |
| **Interface**     | `DealerQuote` desde `../interfaces/dealerQuote.interface`        |

**Campos clave del template:**

- Encabezado: número de cotización, fecha, validez
- Cliente: nombre, contacto, documento
- Vehículo cotizado: marca, modelo, año, color, versión, VIN
- Precio base, descuentos, impuestos, precio final
- Plan de financiamiento (si aplica): cuota inicial, plazo, cuota mensual, tasa
- Accesorios adicionales
- Observaciones
- Firma vendedor + firma cliente (líneas en blanco)

---

#### 16. Acta de Entrega — Concesionario

| Atributo          | Valor                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| **Template**      | `modules/concesionario/deliveries/templates/DealerDeliveryTemplate.tsx` |
| **Conectar en**   | `modules/concesionario/deliveries/components/DealerDeliveryList.tsx`    |
| **Patrón acción** | Agregar item al Menu existente                                          |
| **Interface**     | `DealerDelivery` desde `../interfaces/dealerDelivery.interface`         |

**Campos clave del template:**

- Encabezado: folio de entrega, fecha
- Cliente: nombre, cédula/RIF, dirección
- Vehículo: marca, modelo, año, color, VIN, placa, km entregado
- Accesorios entregados: lista de items con checkbox
- Documentos entregados: tarjeta de circulación, manual, garantía, etc.
- Condición del vehículo al entregar
- Firma comprador + firma vendedor/gestor + firma director (líneas en blanco)

---

#### 17. Cotización — CRM

| Atributo          | Valor                                                   |
| ----------------- | ------------------------------------------------------- |
| **Template**      | `modules/crm/quotes/templates/CRMQuoteTemplate.tsx`     |
| **Conectar en**   | `modules/crm/quotes/components/QuoteList.tsx`           |
| **Patrón acción** | Agregar item al Menu existente (menuRef con 2 items ya) |
| **Interface**     | `Quote` desde `../interfaces/quote.interface`           |

**Campos clave del template:**

- Encabezado: `quoteNumber`, versión, `status`, fecha, `validUntil`
- Cliente / Prospecto: nombre, correo, teléfono, empresa
- Oportunidad asociada (si aplica)
- Tabla de items/servicios: descripción, cantidad, precio unitario, descuento, subtotal
- Totales: subtotal, descuento, impuesto, total
- Condiciones comerciales / términos
- Notas
- Firma vendedor (línea en blanco)

---

## Fase 3 — Baja Prioridad (roadmap futuro)

| Documento                    | Módulo                      | Notas                                      |
| ---------------------------- | --------------------------- | ------------------------------------------ |
| Resultados de Conteo Cíclico | `inventory/cycleCounts`     | Ya existe hoja de ruta (Fase 1 del conteo) |
| Reporte de Reconciliación    | `inventory/reconciliations` |                                            |
| Ajuste de Inventario         | `inventory/adjustments`     |                                            |
| Nota de Devolución           | `inventory/returns`         |                                            |
| Garantía de Trabajo          | `workshop/warranties`       |                                            |
| Cierre de Turno / TOT        | `workshop/tot`              |                                            |
| Retrabajo (Rework)           | `workshop/reworks`          |                                            |
| Factura de Proveedor         | `finance/supplierBills`     |                                            |
| Pago a Proveedor             | `finance/supplierPayments`  |                                            |
| Flujo de Caja                | `finance/cashFlow`          |                                            |
| Reporte de Contactos CRM     | `crm/customer`              |                                            |
| Préstamo de Inventario       | `inventory/loans`           |                                            |

---

## Archivos de referencia

| Archivo                                                                         | Propósito                                                       |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `frontend/components/pdf/templates/WorkshopReceptionTemplate.tsx`               | **Patrón exacto de layout A4**                                  |
| `frontend/components/pdf/templates/GaritaEventTemplate.tsx`                     | **Patrón exacto de layout A4**                                  |
| `frontend/modules/inventory/cycleCounts/components/CycleCountRouteSheetPDF.tsx` | Patrón landscape + `PDFDownloadLink` directo                    |
| `frontend/modules/workshop/receptions/components/ReceptionPDFPreview.tsx`       | Patrón `urlToBase64ViaProxy` para imágenes remotas              |
| `frontend/components/pdf/PDFGenerator.tsx`                                      | Componente de print/preview con Dialog (opcional, no requerido) |
| `frontend/components/pdf/PDFViewer.tsx`                                         | Wrapper SSR-safe del visor                                      |
| `frontend/utils/pdfUtils.ts`                                                    | Registro de fuentes Roboto                                      |
| `frontend/types/pdfTypes.ts`                                                    | Tipos genéricos `PDFGeneratorProps<T>`                          |

---

## Verificación por documento

Para cada template nuevo:

1. `npx tsc --noEmit` en `frontend/` — sin errores de tipo
2. Botón/item "Imprimir PDF" visible en columna Acciones de la lista
3. Dialog abre con `PDFViewer` renderizando el documento
4. Datos de la fila seleccionada aparecen correctamente en el PDF
5. Header y footer aparecen en cada página (atributo `fixed`)
6. `npm run build` pasa en frontend

---

## Orden de ejecución

```
Fase 0: Borrar 13 templates legacy
    ↓
Fase 1 (paralelo entre módulos):
  Ventas:      PaymentReceipt → Invoice → PreInvoice → SalesOrder
  Taller:      ServiceOrder → Quotation → Diagnosis → Delivery → QualityCheck
  Inventario:  PurchaseOrder → EntryNote → ExitNote → Transfer
    ↓
Fase 2 (paralelo entre módulos):
  Finance: Receivables
  Concesionario: DealerQuote → DealerDelivery
  CRM: CRMQuote
    ↓
Fase 3: roadmap futuro (sin fecha)
```
