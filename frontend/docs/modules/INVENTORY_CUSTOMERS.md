# Submódulo de Clientes (Customers)

## Descripción General

El submódulo de Clientes permite gestionar toda la información relacionada con los clientes del taller. Es el punto central para mantener datos actualizados de personas y empresas que utilizan los servicios del taller.

## Características Principales

- ✅ **Registro completo de clientes**: Información personal, fiscal y de contacto
- ✅ **Clasificación por tipo**: Personas naturales y empresas
- ✅ **Estado activo/inactivo**: Control de clientes activos en el sistema
- ✅ **Integración con vehículos**: Asociación automática de flota de vehículos
- ✅ **Validaciones fiscales**: RIF y datos requeridos para facturación
- ✅ **Búsqueda avanzada**: Localización rápida por múltiples criterios

## Estructura Técnica

### Interfaces

**Ubicación:** `/libs/interfaces/inventory/customer.interface.ts`

```typescript
interface Customer {
  _id?: string;
  nombre: string; // Nombre completo o razón social
  tipo: "persona" | "empresa"; // Tipo de cliente
  rif?: string; // Registro de Información Fiscal (Venezuela)
  telefono?: string; // Teléfono de contacto
  email?: string; // Correo electrónico
  direccion?: string; // Dirección completa
  estado: "activo" | "inactivo"; // Estado del cliente
  vehicles?: Vehicle[]; // Vehículos asociados (opcional)
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Esquema de Validación

**Ubicación:** `/libs/zods/inventory/customerZod.ts`

```typescript
import { z } from "zod";

export const customerSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.enum(["persona", "empresa"]),
  rif: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
});
```

### Servicio API

**Ubicación:** `/app/api/inventory/customerService.ts`

#### Funciones principales

- `getCustomers()` - Obtener lista de clientes
- `createCustomer(data)` - Crear nuevo cliente
- `updateCustomer(id, data)` - Actualizar cliente existente
- `deleteCustomer(id)` - Eliminar cliente

### Componentes

#### CustomerList.tsx

**Ubicación:** `/components/inventory/customers/CustomerList.tsx`

**Características:**

- **DataTable** con paginación y filtros
- **Columnas principales:**
  - Nombre del cliente
  - Tipo (Persona/Empresa)
  - RIF
  - Teléfono
  - Email
  - Estado (con badge de color)
  - Cantidad de vehículos asociados
- **Acciones:** Editar, Eliminar con confirmación
- **Búsqueda global** por cualquier campo
- **Filtros** por estado y tipo

#### CustomerForm.tsx

**Ubicación:** `/components/inventory/customers/CustomerForm.tsx`

**Características:**

- **Campos del formulario:**
  - Nombre/Razón Social (requerido)
  - Tipo (Persona/Empresa) - requerido
  - RIF (con validación de formato venezolano)
  - Teléfono (con máscara internacional)
  - Email (con validación)
  - Dirección (textarea)
  - Estado (Activo/Inactivo)
- **Validación en tiempo real** con mensajes de error
- **Modo creación y edición**
- **Callback opcional** `onCustomerCreated` para integración con otros módulos

## Funcionalidades Detalladas

### Gestión de Tipos de Cliente

#### Persona Natural

- Campos estándar: nombre, teléfono, email, dirección
- RIF opcional
- Validación básica de formato

#### Empresa

- Razón social como nombre
- RIF obligatorio con formato específico
- Información de contacto adicional
- Posibilidad de múltiples teléfonos/emails

### Validaciones Especiales

#### RIF Venezolano

- Formato: `V/J/G/E-XXXXXXXXX`
- Validación de dígito verificador
- Componente `RifInput` personalizado

#### Teléfono Internacional

- Componente `PhoneInput` con máscara
- Soporte para códigos de país
- Formato automático durante escritura

### Estados del Cliente

#### Activo

- Cliente puede crear órdenes de trabajo
- Aparece en listas de selección
- Puede recibir facturación

#### Inactivo

- Cliente no aparece en selecciones nuevas
- Historial permanece accesible
- No puede crear nuevas órdenes

### Integración con Vehículos

- **Asociación automática**: Los vehículos se asignan a clientes específicos
- **Conteo en lista**: Muestra cantidad de vehículos por cliente
- **Filtrado**: Las órdenes de trabajo filtran vehículos por cliente seleccionado
- **Navegación**: Enlaces directos a gestión de vehículos del cliente

## API Endpoints

```typescript
// Listar clientes con filtros
GET /api/customers?page=1&limit=10&estado=activo&tipo=persona

// Crear cliente
POST /api/customers
{
  "nombre": "Juan Pérez",
  "tipo": "persona",
  "rif": "V-12345678-9",
  "telefono": "+58-412-1234567",
  "email": "juan@email.com",
  "direccion": "Caracas, Venezuela",
  "estado": "activo"
}

// Actualizar cliente
PUT /api/customers/:id
{
  "nombre": "Juan Pérez García",
  "telefono": "+58-412-1234568"
}

// Eliminar cliente
DELETE /api/customers/:id
```

## Casos de Uso

### 1. Registro de Nuevo Cliente

1. Acceder al módulo de Clientes
2. Hacer clic en "Nuevo Cliente"
3. Completar formulario con información básica
4. Sistema valida RIF y formato de email
5. Guardar y confirmar creación

### 2. Actualización de Datos

1. Buscar cliente en la lista
2. Hacer clic en "Editar"
3. Modificar información necesaria
4. Sistema valida cambios
5. Guardar actualizaciones

### 3. Gestión de Estado

1. Identificar cliente inactivo
2. Cambiar estado a activo/inactivo
3. Sistema actualiza automáticamente las asociaciones

## Validaciones de Negocio

- **Nombre único**: No se permiten clientes con el mismo nombre
- **RIF único**: Validación de RIF duplicado en el sistema
- **Email válido**: Formato correcto cuando se proporciona
- **Dependencias**: No se puede eliminar cliente con órdenes de trabajo activas

## Reportes y Analytics

- **Clientes por tipo**: Distribución persona vs empresa
- **Clientes activos**: Porcentaje de clientes activos vs total
- **Vehículos por cliente**: Análisis de flota promedio
- **Frecuencia de servicio**: Historial de visitas al taller

## Próximas Mejoras

- **Importación masiva**: Carga de clientes desde Excel/CSV
- **Integración con APIs**: Sincronización con sistemas externos
- **Historial de cambios**: Auditoría completa de modificaciones
- **Segmentación**: Etiquetas y categorías personalizadas
- **Comunicaciones**: Sistema de notificaciones y recordatorios
