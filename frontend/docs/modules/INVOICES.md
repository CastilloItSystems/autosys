# Módulo de Facturas (Invoices)

## Descripción General

El módulo de Facturas permite gestionar la facturación de las órdenes de trabajo del taller. Proporciona funcionalidades para crear, editar, emitir, y gestionar el estado de las facturas, incluyendo el seguimiento de pagos.

## Características Principales

- ✅ Creación de facturas desde órdenes de trabajo
- ✅ Gestión de estados de factura (borrador, emitida, pagada, vencida, cancelada)
- ✅ Visualización de información financiera detallada
- ✅ Seguimiento de pagos parciales y totales
- ✅ Listado con filtros por estado
- ✅ Cálculo automático de subtotales, impuestos y totales

## Estructura del Módulo

### 1. Interfaces (TypeScript)

**Ubicación:** `/libs/interfaces/workshop/invoice.interface.ts`

#### Interfaces Principales

```typescript
// Referencia de Orden de Trabajo (poblada)
interface WorkOrderReference {
  _id?: string;
  customer?: CustomerReference | string;
  vehicle?: VehicleReference | string;
  diasTranscurridos?: number;
  id?: string;
}

// Referencia de Usuario (creador)
interface UserReference {
  _id?: string;
  nombre: string;
  id?: string;
}

// Item de Factura
interface InvoiceItem {
  _id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  service?: string;
  repuesto?: string;
}

// Impuesto de Factura
interface InvoiceTax {
  name: string;
  rate: number;
  amount: number;
}

// Factura Principal
interface Invoice {
  _id?: string;
  invoiceNumber: string;
  workOrder: WorkOrderReference | string;
  customer: CustomerReference | string;
  issueDate: Date | string;
  dueDate?: Date | string;
  status:
    | "borrador"
    | "emitida"
    | "pagada_parcial"
    | "pagada_total"
    | "vencida"
    | "cancelada";
  subtotal: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  paidAmount: number;
  balance: number;
  createdBy?: UserReference | string;
  eliminado?: boolean;
  taxes?: InvoiceTax[];
  items?: InvoiceItem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
```

#### Respuesta con Paginación (mongoose-paginate-v2)

```typescript
interface InvoiceResponse {
  success: boolean;
  data: {
    docs: Invoice[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}
```

### 2. Validación (Zod Schemas)

**Ubicación:** `/libs/zods/workshop/invoiceZod.tsx`

```typescript
// Schema de Factura
const invoiceSchema = z.object({
  workOrder: z.string().min(1, "La orden de trabajo es requerida"),
  issueDate: z.date(),
  dueDate: z.date().optional(),
  status: z
    .enum([
      "borrador",
      "emitida",
      "pagada_parcial",
      "pagada_total",
      "vencida",
      "cancelada",
    ])
    .default("borrador"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

// Schema de Item de Factura
const invoiceItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  unitPrice: z.number().min(0, "El precio no puede ser negativo"),
  service: z.string().optional(),
  repuesto: z.string().optional(),
});
```

### 3. Servicios API

**Ubicación:** `/app/api/workshop/invoiceService.ts`

#### Endpoints Disponibles

```typescript
// Obtener lista de facturas con paginación
getInvoices(filters?: InvoiceFilters & { page?: number; limit?: number }): Promise<InvoiceResponse>

// Obtener una factura por ID
getInvoice(id: string): Promise<Invoice>

// Crear nueva factura
createInvoice(data: Partial<Invoice>): Promise<Invoice>

// Actualizar factura existente
updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice>

// Eliminar factura
deleteInvoice(id: string): Promise<void>

// Emitir factura (cambiar de borrador a emitida)
emitInvoice(id: string): Promise<Invoice>

// Crear factura desde orden de trabajo
createInvoiceFromWorkOrder(workOrderId: string): Promise<Invoice>

// Marcar factura como pagada
markInvoiceAsPaid(id: string, amount: number): Promise<Invoice>
```

**Base URL:** `/invoices`

### 4. Componentes

#### 4.1 InvoiceList (Lista de Facturas)

**Ubicación:** `/components/workshop/invoices/InvoiceList.tsx`

**Características:**

- DataTable con paginación del servidor (mongoose-paginate-v2)
- Filtros por estado de factura
- Búsqueda global
- Columnas con formato de moneda (VES)
- Tags de estado con colores diferenciados
- Acciones contextuales según el estado

**Columnas Mostradas:**

- N° Factura (monospace)
- Cliente (nombre completo)
- Orden de Trabajo (referencia)
- Fecha de Emisión
- Fecha de Vencimiento
- Estado (Tag con colores)
- Subtotal (VES)
- Total (VES)
- Pagado (VES)
- Saldo (VES, rojo si pendiente)
- Acciones

**Estados de Factura y Colores:**

- `borrador` → Info (azul) - Editable
- `emitida` → Warning (amarillo)
- `pagada_parcial` → Contrast (gris)
- `pagada_total` → Success (verde)
- `vencida` → Danger (rojo)
- `cancelada` → Secondary (gris oscuro)

**Acciones Disponibles:**

- **Editar**: Solo disponible para facturas en estado "borrador"
- **Eliminar**: Solo disponible para "borrador" y "cancelada"
- **Emitir**: Solo para "borrador", cambia estado a "emitida"
- **Marcar como Pagada**: Para "emitida", "pagada_parcial" o "vencida" con saldo > 0

#### 4.2 InvoiceForm (Formulario de Facturas)

**Ubicación:** `/components/workshop/invoices/InvoiceForm.tsx`

**Características:**

- Formulario con react-hook-form + Zod
- Dropdown de órdenes de trabajo con filtro
- Visualización automática de información financiera
- Validación en tiempo real
- Modo creación/edición

**Campos del Formulario:**

1. **Orden de Trabajo** (requerido)

   - Dropdown filtrable
   - Muestra: OT-XXXXXX - Número de Orden
   - Información adicional: Cliente y Vehículo
   - Deshabilitado en modo edición

2. **Fecha de Emisión** (requerido)

   - Calendar con formato dd/mm/yy
   - Por defecto: fecha actual

3. **Fecha de Vencimiento** (opcional)

   - Calendar con formato dd/mm/yy
   - Validación: debe ser mayor o igual a fecha de emisión

4. **Estado** (requerido)

   - Dropdown con 6 opciones
   - Por defecto: "borrador"

5. **Términos de Pago** (opcional)

   - Texto libre
   - Ejemplo: "30 días", "contado"

6. **Notas** (opcional)
   - Textarea de 3 líneas
   - Para observaciones adicionales

**Panel de Resumen Financiero:**

Cuando se selecciona una orden de trabajo, se muestra automáticamente:

```
┌─────────────────────────────────────────────────────────┐
│ Resumen Financiero de la Orden de Trabajo              │
├─────────────────────────────────────────────────────────┤
│ Subtotal Servicios  │ Subtotal Repuestos │ Descuento   │
│ VES 1,000.00        │ VES 500.00         │ VES 50.00   │
│                                                          │
│ Impuesto (IVA)      │ Estado OT          │ Costo Total │
│ VES 232.00          │ En Progreso        │ VES 1,682.00│
└─────────────────────────────────────────────────────────┘

Items de la Orden:
┌─────────────────────────────────────────────────────────┐
│ Cambio de Aceite                         2 x VES 250.00│
│ Incluye filtro                                VES 500.00│
├─────────────────────────────────────────────────────────┤
│ Filtro de Aire - Filtro Original          1 x VES 150.00│
│ Repuesto original                              VES 150.00│
└─────────────────────────────────────────────────────────┘
```

### 5. Rutas y Navegación

**Ruta:** `/autosys/workshop/invoices`

**Ubicación del Archivo:** `/app/(autosys)/autosys/workshop/invoices/page.tsx`

**Entrada en el Menú:**

- Sección: Taller
- Icono: `pi-file`
- Posición: Después de "Órdenes de Trabajo"

```typescript
{
  label: "Taller",
  icon: "pi pi-fw pi-wrench",
  items: [
    {
      label: "Órdenes de Trabajo",
      icon: "pi pi-fw pi-file-edit",
      to: "/autosys/workshop",
    },
    {
      label: "Facturas",
      icon: "pi pi-fw pi-file",
      to: "/autosys/workshop/invoices",
    },
    // ... otros items
  ],
}
```

## Flujo de Trabajo

### Flujo Principal

```
1. Usuario abre "Facturas"
   ↓
2. Click en "Nueva Factura"
   ↓
3. Selecciona Orden de Trabajo
   ↓ (Se cargan automáticamente los datos)
4. Se muestra Resumen Financiero
   ↓
5. Completa fechas, términos y notas
   ↓
6. Guarda como "Borrador"
   ↓
7. Revisa información
   ↓
8. Click en "Emitir"
   ↓
9. Factura cambia a estado "Emitida"
   ↓
10. Cliente paga
    ↓
11. Click en "Marcar como Pagada"
    ↓
12. Factura cambia a "Pagada Total"
```

### Estados del Ciclo de Vida

```
borrador → emitida → pagada_parcial → pagada_total
            ↓            ↓
         vencida    cancelada
```

**Transiciones Permitidas:**

- `borrador` → `emitida` (mediante botón "Emitir")
- `emitida` → `pagada_parcial` (pago parcial)
- `emitida` → `pagada_total` (pago completo)
- `pagada_parcial` → `pagada_total` (completar pago)
- `emitida` → `vencida` (automático por fecha)
- Cualquier estado → `cancelada` (manual)

## Integraciones

### Relación con Órdenes de Trabajo

Las facturas están directamente vinculadas a las órdenes de trabajo:

- Una factura se crea desde una orden de trabajo específica
- Hereda toda la información financiera de la OT
- Muestra el cliente y vehículo asociados
- Replica los items (servicios y repuestos) de la OT
- Mantiene referencia bidireccional

### Relación con CRM (Clientes)

- Cliente poblado desde la orden de trabajo
- Muestra nombre completo del cliente
- Se puede filtrar facturas por cliente

### Relación con Usuarios

- Cada factura registra quién la creó (`createdBy`)
- Timestamps automáticos (`createdAt`, `updatedAt`)

## Consideraciones Técnicas

### Paginación

El módulo utiliza **mongoose-paginate-v2** en el backend:

```typescript
// Respuesta esperada del backend
{
  success: true,
  data: {
    docs: Invoice[],      // Array de facturas
    totalDocs: number,    // Total de documentos
    limit: number,        // Límite por página
    totalPages: number,   // Total de páginas
    page: number,         // Página actual
    pagingCounter: number,// Contador de paginación
    hasPrevPage: boolean, // Tiene página anterior
    hasNextPage: boolean, // Tiene página siguiente
    prevPage: number | null,
    nextPage: number | null
  }
}
```

### Formato de Moneda

Todas las cantidades monetarias se formatean como VES (Bolívares):

```typescript
new Intl.NumberFormat("es-VE", {
  style: "currency",
  currency: "VES",
  minimumFractionDigits: 2,
}).format(amount);
```

### Manejo de Referencias Pobladas

Las interfaces soportan tanto strings (IDs) como objetos poblados:

```typescript
// Puede ser string (ID)
customer: "64abc123def456789"

// O objeto poblado
customer: {
  _id: "64abc123def456789",
  nombre: "Juan Pérez",
  nombreCompleto: "Juan Carlos Pérez González",
  id: "64abc123def456789"
}
```

## Componentes Reutilizados

- `CreateButton` - Botón de crear con estilo consistente
- `CustomActionButtons` - Botones de editar/eliminar estándar
- `Toast` - Notificaciones de éxito/error
- `Dialog` - Modales para formularios y confirmaciones
- `DataTable` - Tabla con paginación y filtros
- `motion.div` - Animaciones con framer-motion

## Permisos y Seguridad

### Validaciones de Frontend

- Solo se pueden editar facturas en estado "borrador"
- Solo se pueden eliminar facturas en "borrador" o "cancelada"
- Fechas de vencimiento deben ser posteriores a emisión
- Orden de trabajo es obligatoria

### Validaciones Esperadas en Backend

- Verificar que la orden de trabajo existe
- Validar que no exista factura duplicada para la misma OT
- Verificar permisos del usuario
- Validar transiciones de estado
- Calcular automáticamente subtotales e impuestos

## Testing

### Casos de Prueba Sugeridos

1. **Creación de Factura**

   - Crear factura desde orden de trabajo válida
   - Validar que se muestren los totales correctos
   - Verificar estado inicial "borrador"

2. **Edición de Factura**

   - Editar factura en borrador
   - Intentar editar factura emitida (debe estar deshabilitado)

3. **Emisión de Factura**

   - Emitir factura desde borrador
   - Verificar cambio de estado

4. **Pagos**

   - Marcar factura como pagada
   - Verificar actualización de saldo

5. **Filtros y Búsqueda**
   - Filtrar por estado
   - Buscar por número de factura
   - Validar paginación

## Mejoras Futuras

### Funcionalidades Propuestas

1. **Pagos Parciales**

   - Formulario para registrar pagos
   - Historial de pagos
   - Métodos de pago

2. **Reportes**

   - Reporte de cuentas por cobrar
   - Facturas vencidas
   - Estadísticas de facturación

3. **Exportación**

   - Exportar facturas a PDF
   - Enviar por email
   - Exportar a Excel

4. **Notas de Crédito**

   - Crear notas de crédito
   - Vincular a facturas
   - Ajustar saldos

5. **Recordatorios**
   - Notificaciones de vencimiento
   - Alertas de facturas pendientes
   - Seguimiento automático

## Troubleshooting

### Problemas Comunes

**1. No se muestran las órdenes de trabajo**

- Verificar que existan órdenes de trabajo en el sistema
- Revisar permisos de acceso
- Verificar conexión con el backend

**2. Los totales no coinciden**

- Validar cálculos en la orden de trabajo
- Verificar configuración de impuestos
- Revisar descuentos aplicados

**3. No se puede editar la factura**

- Verificar que esté en estado "borrador"
- Solo el creador puede editar (según permisos)
- Revisar que no esté eliminada

**4. Error al emitir factura**

- Completar todos los campos obligatorios
- Verificar que la fecha de vencimiento sea válida
- Revisar que la orden de trabajo esté completa

## Changelog

### Versión 1.0.0 (2025-11-08)

**Agregado:**

- ✅ Módulo completo de facturas
- ✅ Interfaces TypeScript con mongoose-paginate-v2
- ✅ Schemas de validación Zod
- ✅ Servicio API con todos los endpoints
- ✅ Componente InvoiceList con filtros y acciones
- ✅ Componente InvoiceForm con resumen financiero
- ✅ Integración con órdenes de trabajo
- ✅ Sistema de estados y transiciones
- ✅ Formato de moneda VES
- ✅ Ruta y entrada en menú
- ✅ Documentación completa

## Soporte

Para soporte o preguntas sobre el módulo de facturas:

- Revisar esta documentación
- Consultar el código fuente en `/components/workshop/invoices/`
- Verificar las interfaces en `/libs/interfaces/workshop/invoice.interface.ts`

---

**Última actualización:** 8 de Noviembre, 2025  
**Versión del módulo:** 1.0.0  
**Mantenedor:** Equipo de Desarrollo
