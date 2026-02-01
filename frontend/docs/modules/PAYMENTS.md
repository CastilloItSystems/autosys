# Módulo de Pagos (Payments)

## Descripción

El módulo de Pagos permite registrar y gestionar los pagos asociados a facturas del taller. Soporta múltiples métodos de pago, pagos parciales, y actualiza automáticamente el estado de las facturas según los montos recibidos.

### Características Principales

- **Registro de pagos**: Crear pagos asociados a facturas con múltiples métodos
- **Pagos parciales**: Soporta múltiples pagos para una misma factura
- **7 métodos de pago**: Efectivo, transferencia, tarjetas, cheque, cripto, y más
- **4 estados de pago**: Pendiente, confirmado, rechazado, reembolsado
- **Detalles dinámicos**: Campos específicos según el método de pago seleccionado
- **Actualización automática**: El estado de la factura se actualiza según los pagos
- **Balance en tiempo real**: Muestra el balance pendiente de la factura
- **Filtros avanzados**: Por método de pago, estado, fechas, y montos
- **Paginación**: Integración con mongoose-paginate-v2

---

## Estructura del Módulo

```
libs/
  interfaces/
    workshop/
      payment.interface.ts          # Interfaces de Payment
  zods/
    workshop/
      paymentZod.tsx                 # Schemas de validación
app/
  api/
    workshop/
      paymentService.ts              # Servicio HTTP de pagos
  (autosys)/
    autosys/
      workshop/
        payments/
          page.tsx                   # Página de pagos
components/
  workshop/
    payments/
      PaymentList.tsx                # Lista con DataTable
      PaymentForm.tsx                # Formulario de creación/edición
docs/
  modules/
    PAYMENTS.md                      # Esta documentación
```

---

## Interfaces

### Payment

```typescript
interface Payment {
  _id: string;
  invoice: InvoiceReference | string; // Factura asociada
  amount: number; // Monto del pago
  paymentDate: Date | string; // Fecha del pago
  paymentMethod: PaymentMethod; // Método de pago (enum)
  reference?: string; // Número de transacción
  notes?: string; // Notas adicionales
  status: PaymentStatus; // Estado del pago (enum)
  paymentDetails?: PaymentDetails; // Detalles específicos
  recordedBy: UserReference | string; // Usuario que registró
  eliminado: boolean; // Borrado lógico
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
```

### PaymentMethod (Enum)

```typescript
type PaymentMethod =
  | "efectivo" // Pago en efectivo
  | "transferencia" // Transferencia bancaria
  | "tarjeta_credito" // Tarjeta de crédito
  | "tarjeta_debito" // Tarjeta de débito
  | "cheque" // Pago con cheque
  | "cripto" // Criptomonedas
  | "otro"; // Otros métodos
```

### PaymentStatus (Enum)

```typescript
type PaymentStatus =
  | "pendiente" // Pago registrado pero no confirmado
  | "confirmado" // Pago confirmado (default)
  | "rechazado" // Pago rechazado o cancelado
  | "reembolsado"; // Pago reembolsado
```

### PaymentDetails

Campos específicos según el método de pago:

```typescript
interface PaymentDetails {
  // Para transferencias
  bankName?: string;
  accountNumber?: string;

  // Para tarjetas
  cardLastFour?: string; // Últimos 4 dígitos
  cardType?: string; // visa, mastercard, amex, etc.

  // Para cheques
  checkNumber?: string;

  // Para criptomonedas
  cryptoCurrency?: string; // Bitcoin, Ethereum, etc.
  walletAddress?: string;

  // Para otros métodos
  otherDetails?: string;
}
```

### InvoiceReference

```typescript
interface InvoiceReference {
  _id: string;
  invoiceNumber: string;
  total: number;
  balance: number;
  status: string;
  id?: string;
}
```

### PaymentResponse (mongoose-paginate-v2)

```typescript
interface PaymentResponse {
  success: boolean;
  data: {
    docs: Payment[]; // Array de pagos
    totalDocs: number; // Total de documentos
    limit: number; // Límite por página
    totalPages: number; // Total de páginas
    page: number; // Página actual
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}
```

### PaymentSummary

```typescript
interface PaymentSummary {
  totalPayments: number; // Cantidad de pagos
  totalAmount: number; // Suma total de pagos
  payments: Payment[]; // Array de pagos
}
```

---

## Schemas de Validación (Zod)

### paymentSchema

```typescript
const paymentSchema = z.object({
  invoice: z.string().min(1, "Factura es requerida"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentDate: z.date().optional(),
  paymentMethod: z.enum([
    "efectivo",
    "transferencia",
    "tarjeta_credito",
    "tarjeta_debito",
    "cheque",
    "cripto",
    "otro",
  ]),
  reference: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
  status: z
    .enum(["pendiente", "confirmado", "rechazado", "reembolsado"])
    .default("confirmado")
    .optional(),
  paymentDetails: paymentDetailsSchema.optional(),
});
```

### paymentDetailsSchema

```typescript
const paymentDetailsSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  cardLastFour: z.string().length(4).optional(),
  cardType: z.string().optional(),
  checkNumber: z.string().optional(),
  cryptoCurrency: z.string().optional(),
  walletAddress: z.string().optional(),
  otherDetails: z.string().optional(),
});
```

---

## API Endpoints

Base URL: `/payments`

### 1. getPayments(filters?)

Obtiene lista paginada de pagos con filtros opcionales.

```typescript
getPayments(filters?: PaymentFilters): Promise<PaymentResponse>
```

**Filtros disponibles:**

- `invoice`: Filtrar por ID de factura
- `paymentMethod`: Filtrar por método de pago
- `status`: Filtrar por estado
- `startDate`: Fecha de inicio
- `endDate`: Fecha de fin
- `minAmount`: Monto mínimo
- `maxAmount`: Monto máximo
- `page`: Número de página (default: 1)
- `limit`: Registros por página (default: 10)

### 2. getPaymentsByInvoice(invoiceId)

Obtiene todos los pagos de una factura específica.

```typescript
getPaymentsByInvoice(invoiceId: string): Promise<PaymentSummary>
```

**Respuesta:**

```typescript
{
  totalPayments: 2,
  totalAmount: 500000,
  payments: [...]
}
```

### 3. getPayment(id)

Obtiene un pago específico por su ID.

```typescript
getPayment(id: string): Promise<Payment>
```

### 4. createPayment(data)

Crea un nuevo pago y actualiza automáticamente la factura.

```typescript
createPayment(data: CreatePaymentData): Promise<Payment>
```

**Comportamiento:**

- Suma el monto al `paidAmount` de la factura
- Recalcula el `balance` de la factura
- Actualiza el `status` de la factura:
  - Si `balance === 0` → `pagada_total`
  - Si `paidAmount > 0` y `balance > 0` → `pagada_parcial`

### 5. updatePayment(id, data)

Actualiza un pago existente.

```typescript
updatePayment(id: string, data: UpdatePaymentData): Promise<Payment>
```

### 6. deletePayment(id)

Elimina lógicamente un pago (marca `eliminado: true`).

```typescript
deletePayment(id: string): Promise<void>
```

### 7. confirmPayment(id)

Confirma un pago que está en estado pendiente.

```typescript
confirmPayment(id: string): Promise<Payment>
```

### 8. cancelPayment(id, reason?)

Cancela o rechaza un pago.

```typescript
cancelPayment(id: string, reason?: string): Promise<Payment>
```

---

## Componentes

### PaymentList

Lista principal de pagos con DataTable, filtros y acciones CRUD.

**Características:**

- **DataTable con paginación lazy**: Carga datos bajo demanda
- **Filtros**: Método de pago, estado, búsqueda global
- **Columnas mostradas**:
  - Factura (invoiceNumber con total de factura)
  - Monto (VES, en verde y negrita)
  - Fecha de Pago (dd/mm/yyyy)
  - Método (Tag con colores específicos)
  - Referencia (número de transacción)
  - Estado (Tag con colores: warning, success, danger, info)
  - Acciones (CustomActionButtons: editar, eliminar)

**Tags de Métodos de Pago:**

- Efectivo: `success` (verde)
- Transferencia: `info` (azul)
- Tarjeta Crédito/Débito: `warning` (amarillo)
- Cheque: `secondary` (gris)
- Cripto: `contrast` (oscuro)
- Otro: `secondary` (gris)

**Tags de Estados:**

- Pendiente: `warning` (amarillo)
- Confirmado: `success` (verde)
- Rechazado: `danger` (rojo)
- Reembolsado: `info` (azul)

**Acciones:**

- **Nuevo Pago**: Abre formulario vacío
- **Editar**: Abre formulario con datos del pago
- **Eliminar**: Muestra diálogo de confirmación

### PaymentForm

Formulario dinámico para crear/editar pagos.

**Campos principales:**

- **Factura** (Dropdown con filtro):
  - Muestra invoiceNumber
  - Filtra solo facturas con balance > 0
  - Deshabilitado en modo edición
  - Template personalizado con balance
- **Panel de Balance** (si hay factura seleccionada):
  - Total Factura (VES)
  - Pagado (VES, verde)
  - Balance Pendiente (VES, naranja)
- **Monto** (InputNumber):
  - Formato VES con 2 decimales
  - Validación: mínimo 0.01
- **Fecha de Pago** (Calendar):
  - Default: fecha actual
  - Formato: dd/mm/yy
- **Método de Pago** (Dropdown):
  - 7 opciones disponibles
  - Cambia los campos de detalles dinámicamente
- **Estado** (Dropdown):
  - 4 opciones: pendiente, confirmado, rechazado, reembolsado
  - Default: confirmado
- **Referencia** (InputText):
  - Opcional, máximo 100 caracteres
  - Ejemplo: TRF-001234, AUTH-567890
- **Detalles de Pago** (Dinámico según método):
  - Ver tabla de campos específicos abajo
- **Notas** (InputTextarea):
  - Opcional, máximo 300 caracteres

**Campos Dinámicos de PaymentDetails:**

| Método                 | Campos Mostrados                   |
| ---------------------- | ---------------------------------- |
| Transferencia          | Banco, Número de Cuenta            |
| Tarjeta Crédito/Débito | Últimos 4 Dígitos, Tipo de Tarjeta |
| Cheque                 | Número de Cheque                   |
| Criptomoneda           | Criptomoneda, Dirección de Wallet  |
| Otro                   | Detalles Adicionales (textarea)    |
| Efectivo               | Ningún campo adicional             |

**Validación:**

- Factura: requerida
- Monto: requerido, > 0.01
- Método de pago: requerido
- Campos de detalles: validados según tipo (ej: cardLastFour debe tener 4 caracteres)

---

## Rutas y Navegación

### Ruta de la Página

```
/autosys/workshop/payments
```

### Entrada en el Menú

```
Menú Principal → Taller → Pagos
```

**Ubicación:**

- Sección: Taller
- Posición: Después de "Facturas", antes de "Servicios"
- Icono: `pi-money-bill`

---

## Flujo de Trabajo (Workflow)

### Escenario Completo: Factura de $500,000 con dos pagos parciales

#### 1. Factura Emitida

```
Invoice:
  status: "emitida"
  total: 500,000
  paidAmount: 0
  balance: 500,000
```

#### 2. Usuario Registra Primer Pago ($200,000)

**Acción en Frontend:**

1. Click en "Nuevo Pago"
2. Seleccionar factura del dropdown
3. Ver panel de balance: Total $500k, Pagado $0, Balance $500k
4. Ingresar monto: $200,000
5. Seleccionar método: "Transferencia"
6. Completar detalles: Banco Estado, Cuenta 1234567890
7. Ingresar referencia: TRF-001234
8. Click "Guardar"

**Actualización Backend:**

```typescript
// Crear Payment 1
Payment {
  invoice: "INV-000001",
  amount: 200000,
  paymentMethod: "transferencia",
  status: "confirmado",
  paymentDetails: {
    bankName: "Banco Estado",
    accountNumber: "1234567890"
  }
}

// Invoice actualizada automáticamente
Invoice {
  status: "pagada_parcial",
  paidAmount: 200000,
  balance: 300000
}
```

#### 3. Usuario Registra Segundo Pago ($300,000)

**Acción en Frontend:**

1. Click en "Nuevo Pago"
2. Seleccionar misma factura
3. Ver panel de balance: Total $500k, Pagado $200k, Balance $300k
4. Ingresar monto: $300,000
5. Seleccionar método: "Efectivo"
6. Click "Guardar"

**Actualización Backend:**

```typescript
// Crear Payment 2
Payment {
  invoice: "INV-000001",
  amount: 300000,
  paymentMethod: "efectivo",
  status: "confirmado"
}

// Invoice actualizada automáticamente
Invoice {
  status: "pagada_total",
  paidAmount: 500000,
  balance: 0
}
```

---

## Ciclo de Estados

### Estados de Payment

```
┌──────────┐
│pendiente │ ← Estado inicial opcional
└────┬─────┘
     │ confirm()
     ↓
┌──────────┐
│confirmado│ ← Estado por defecto
└────┬─────┘
     │
     ├─→ reject(reason) → [rechazado]
     │
     └─→ refund(reason) → [reembolsado]
```

### Transiciones de Estado de Invoice según Pagos

```
┌─────────┐
│ emitida │ ← Sin pagos
└────┬────┘
     │ Pago parcial
     ↓
┌──────────────┐
│pagada_parcial│ ← balance > 0
└──────┬───────┘
       │ Pago final
       ↓
┌─────────────┐
│pagada_total │ ← balance === 0
└─────────────┘
```

---

## Integraciones

### Relación con Invoices

El módulo de pagos está fuertemente integrado con el módulo de facturas:

**En PaymentForm:**

- Dropdown carga facturas con status "emitida" y balance > 0
- Muestra balance actual antes de registrar pago
- Sugiere monto igual al balance pendiente

**En Backend (automático):**

- Cada pago actualiza `invoice.paidAmount`
- Recalcula `invoice.balance = total - paidAmount`
- Actualiza `invoice.status` según corresponda

### Relación con Users

- Campo `recordedBy` guarda referencia al usuario autenticado
- Permite auditoría de quién registró cada pago
- Se puede popular para mostrar nombre del usuario

---

## Consideraciones Técnicas

### Paginación

El módulo usa **mongoose-paginate-v2** con lazy loading:

- Frontend solicita página específica
- Backend retorna solo los docs de esa página
- Metadata incluye totalPages, hasNext, hasPrev

### Formato de Moneda

Uso de `Intl.NumberFormat` para VES:

```typescript
new Intl.NumberFormat("es-VE", {
  style: "currency",
  currency: "VES",
  minimumFractionDigits: 2,
}).format(amount);
```

### Referencias Populadas

El backend puede retornar referencias populadas:

```typescript
Payment {
  invoice: {
    _id: "...",
    invoiceNumber: "INV-000001",
    total: 500000,
    balance: 300000
  }
}
```

O como string simple:

```typescript
Payment {
  invoice: "507f1f77bcf86cd799439012"
}
```

El frontend maneja ambos casos con type guards.

### Campos Dinámicos

El formulario usa `watch("paymentMethod")` para:

- Detectar cambios en el método seleccionado
- Renderizar campos específicos dinámicamente
- Aplicar validaciones según el método

---

## Componentes Reutilizables

El módulo utiliza estos componentes comunes:

- **CreateButton**: Botón estilizado para "Nuevo Pago"
- **CustomActionButtons**: Botones de editar/eliminar en cada fila
- **DataTable** (PrimeReact): Tabla con paginación y filtros
- **Dialog** (PrimeReact): Diálogos modales para formulario y confirmaciones
- **Dropdown** (PrimeReact): Selectores con filtro
- **Calendar** (PrimeReact): Selector de fechas
- **InputNumber** (PrimeReact): Input con formato de moneda
- **Tag** (PrimeReact): Etiquetas de colores para estados y métodos
- **Toast** (PrimeReact): Notificaciones de éxito/error

---

## Permisos y Seguridad

### Frontend

- Validación de formularios con Zod
- Confirmación antes de eliminar
- Deshabilitar campos según contexto (ej: invoice en edición)
- Mostrar solo facturas con balance > 0

### Backend

- Header `x-token` requerido en todas las rutas
- Validación de invoice existente
- Validación de amount > 0
- Actualización atómica de invoices
- Soft delete (no elimina físicamente)

---

## Testing

### Casos de Prueba Sugeridos

1. **Crear pago efectivo**:

   - Verificar que no muestre campos adicionales
   - Verificar actualización de invoice

2. **Crear pago con transferencia**:

   - Verificar campos de banco y cuenta
   - Verificar guardado de paymentDetails

3. **Crear pago con tarjeta**:

   - Verificar validación de cardLastFour (4 dígitos)
   - Verificar dropdown de cardType

4. **Crear pago con cripto**:

   - Verificar campos de criptomoneda y wallet
   - Verificar guardado de datos

5. **Pagos parciales**:

   - Crear 2 pagos para misma factura
   - Verificar actualización de balance
   - Verificar cambio de estado a pagada_parcial

6. **Pago total**:

   - Crear pago por balance completo
   - Verificar estado cambia a pagada_total
   - Verificar balance === 0

7. **Editar pago**:

   - Verificar carga de datos
   - Verificar que invoice esté deshabilitado
   - Verificar actualización

8. **Eliminar pago**:

   - Verificar diálogo de confirmación
   - Verificar soft delete
   - Verificar recarga de lista

9. **Filtros**:

   - Filtrar por método de pago
   - Filtrar por estado
   - Búsqueda global

10. **Paginación**:
    - Verificar cambio de página
    - Verificar cambio de rows per page
    - Verificar totalRecords

---

## Troubleshooting

### Problema 1: No aparecen facturas en el dropdown

**Causa**: Solo se cargan facturas con status "emitida" y balance > 0

**Solución**:

- Verificar que la factura esté emitida (no en borrador)
- Verificar que tenga balance pendiente
- En modo edición, se carga la factura original aunque tenga balance 0

### Problema 2: Balance no se actualiza

**Causa**: Backend no actualiza invoice al crear payment

**Solución**:

- Verificar que el endpoint `/payments` ejecute lógica de actualización
- Verificar que la factura exista y sea válida
- Revisar logs del backend para errores

### Problema 3: Campos de paymentDetails no se guardan

**Causa**: Schema de Zod no incluye paymentDetails anidados

**Solución**:

- Verificar que paymentDetailsSchema esté incluido en paymentSchema
- Usar `Controller` de react-hook-form para campos anidados
- Verificar que el nombre del campo sea `paymentDetails.bankName` (no `bankName`)

### Problema 4: Error al filtrar por método/estado

**Causa**: Valor null no se envía correctamente como "sin filtro"

**Solución**:

- Convertir null a undefined antes de enviar al backend
- Verificar que el backend maneje undefined como "sin filtro"

---

## Mejoras Futuras

### Fase 2

1. **Recibos de pago**: Generar PDF con recibo para entregar al cliente
2. **Email automático**: Enviar recibo por email al registrar pago
3. **Reportes**: Dashboard con pagos por método, por período, etc.
4. **Reconciliación bancaria**: Comparar pagos con extractos bancarios
5. **Pagos recurrentes**: Programar pagos automáticos para clientes frecuentes

### Fase 3

1. **Integración con pasarelas**: Stripe, PayPal, MercadoPago
2. **Webhooks**: Recibir notificaciones de pagos externos
3. **Multi-moneda**: Soportar USD, EUR, etc.
4. **Tipos de cambio**: Convertir automáticamente entre monedas
5. **Notas de crédito**: Generar créditos para devoluciones

---

## Changelog

### v1.0.0 - Noviembre 2024

**Características Completas:**

- ✅ Interfaces de Payment con mongoose-paginate-v2
- ✅ Schemas de validación con Zod (7 métodos, 4 estados)
- ✅ Servicio de API completo (8 métodos)
- ✅ PaymentList con DataTable, filtros, paginación
- ✅ PaymentForm con campos dinámicos según método
- ✅ Panel de balance de factura en formulario
- ✅ Actualización automática de invoice al crear pago
- ✅ Tags de colores para métodos y estados
- ✅ CustomActionButtons para acciones CRUD
- ✅ Dialog-based confirmaciones
- ✅ Formato VES para monedas
- ✅ Página de pagos en /autosys/workshop/payments
- ✅ Entrada en menú bajo Taller
- ✅ Documentación completa

---

## Soporte

Para dudas o problemas con el módulo de pagos:

1. Revisar esta documentación
2. Consultar código en:
   - `libs/interfaces/workshop/payment.interface.ts`
   - `components/workshop/payments/`
3. Verificar integración con invoices:
   - `docs/modules/INVOICES.md`
4. Reportar issues en el repositorio del proyecto
