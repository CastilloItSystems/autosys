# Estructura del Proyecto

## Resumen

Este proyecto está construido con Next.js 14 utilizando el **App Router** y sigue una arquitectura modular basada en dominios de negocio.

## Tecnologías Principales

- **Next.js 14** - Framework de React con App Router
- **TypeScript** - Tipado estático
- **React 18** - Biblioteca de UI
- **PrimeReact** - Biblioteca de componentes UI
- **Axios** - Cliente HTTP
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Framer Motion** - Animaciones

## Estructura de Carpetas

```
taller-template-web/
├── app/                          # Next.js App Router
│   ├── (autosys)/                # Route group para módulo autosys
│   ├── (bunkering)/              # Route group para módulo bunkering
│   ├── (full-page)/              # Route group para páginas completas
│   ├── (landing)/                # Route group para landing pages
│   ├── (main)/                   # Route group principal
│   ├── (refineria)/              # Route group para refinería
│   ├── (workshop)/               # Route group para taller
│   ├── api/                      # API routes y servicios
│   │   ├── crm/                  # Servicios CRM
│   │   └── inventory/            # Servicios Inventario
│   ├── layout.tsx                # Layout raíz
│   └── not-found.tsx             # Página 404
│
├── components/                   # Componentes React reutilizables
│   ├── authComponents/           # Componentes de autenticación
│   ├── autosys/                  # Componentes del módulo autosys
│   ├── common/                   # Componentes comunes
│   ├── crm/                      # Componentes CRM
│   │   ├── vehicles/             # Componentes de vehículos
│   │   ├── vehicle-brands/       # Componentes de marcas
│   │   └── vehicle-models/       # Componentes de modelos
│   ├── inventory/                # Componentes de inventario
│   │   ├── brands/               # Componentes de marcas de productos
│   │   ├── itemModels/           # Componentes de modelos de productos
│   │   └── ...
│   └── ...
│
├── layout/                       # Componentes de layout
│   ├── AppMenu.tsx               # Menú principal
│   ├── AppMenuAutoSys.tsx        # Menú para autosys
│   ├── AppMenuWorkshop.tsx       # Menú para taller
│   ├── AppTopbar.tsx             # Barra superior
│   ├── AppSidebar.tsx            # Barra lateral
│   └── context/                  # Context providers
│
├── libs/                         # Bibliotecas compartidas
│   ├── interfaces/               # Definiciones de TypeScript
│   │   ├── inventory/            # Interfaces de inventario
│   │   └── ...
│   ├── zods/                     # Esquemas de validación Zod
│   │   ├── inventory/            # Validaciones de inventario
│   │   └── ...
│   ├── roles.ts                  # Definición de roles
│   └── utils.ts                  # Utilidades generales
│
├── hooks/                        # Custom React hooks
│   ├── useAutoSysDataFull.ts
│   ├── useRefineryData.ts
│   ├── useSocket.ts
│   └── ...
│
├── store/                        # State management (Zustand)
│   ├── autoSysStore.ts
│   ├── refineriaStore.ts
│   └── workshopStore.ts
│
├── utils/                        # Funciones utilitarias
│   ├── dateUtils.ts
│   ├── errorHandlers.ts
│   └── funcionesUtiles.ts
│
├── types/                        # Type definitions globales
│   ├── index.d.ts
│   └── ...
│
├── styles/                       # Estilos globales
│   └── globals.css
│
├── public/                       # Archivos estáticos
│   ├── demo/
│   ├── fonts/
│   ├── layout/
│   └── theme/
│
└── docs/                         # Documentación
    ├── architecture/             # Documentación de arquitectura
    ├── modules/                  # Documentación de módulos
    ├── api/                      # Documentación de APIs
    └── guides/                   # Guías de uso
```

## Conceptos Clave

### 1. Route Groups

Next.js 14 utiliza **route groups** (carpetas entre paréntesis) para organizar rutas sin afectar la URL:

```
app/
├── (autosys)/autosys/           → /autosys/*
├── (main)/dashboard/            → /dashboard
└── (full-page)/auth/login/      → /auth/login
```

**Beneficios:**

- Organización lógica sin afectar URLs
- Layouts específicos por grupo
- Separación de contextos (main, autosys, landing, etc.)

### 2. Separación de Módulos

El proyecto mantiene una **separación estricta** entre módulos de negocio:

#### Módulo de Inventario

- **Ubicación:** `/components/inventory`, `/app/api/inventory`
- **Propósito:** Gestión de productos, marcas de productos, modelos de productos
- **Entidades:** Item, Brand (producto), Model (producto), Category

#### Módulo de CRM

- **Ubicación:** `/components/crm`, `/app/api/crm`
- **Propósito:** Gestión de clientes, vehículos, marcas de vehículos, modelos de vehículos
- **Entidades:** Customer, Vehicle, VehicleBrand, VehicleModel

> **⚠️ Importante:** Las entidades `Brand` y `Model` existen en AMBOS módulos pero son completamente diferentes:
>
> - **Inventory**: Marcas y modelos de productos (ej: Samsung Galaxy S23)
> - **CRM**: Marcas y modelos de vehículos (ej: Toyota Corolla)

### 3. Capas de la Aplicación

#### Capa de Presentación (Components)

```
components/
├── [módulo]/                    # Componentes por módulo
│   ├── [entidad]/               # Componentes por entidad
│   │   ├── [Entidad]List.tsx    # Vista de lista con DataTable
│   │   └── [Entidad]Form.tsx    # Formulario CRUD
```

**Ejemplo:**

```
components/crm/vehicles/
├── VehicleList.tsx              # DataTable de vehículos
└── VehicleForm.tsx              # Formulario de vehículo
```

#### Capa de Servicio (API Services)

```
app/api/
├── [módulo]/                    # Servicios por módulo
│   └── [entidad]Service.ts      # Cliente HTTP para la entidad
```

**Ejemplo:**

```typescript
// app/api/crm/vehicleService.ts
import { apiClient } from "../apiClient";

const BASE_URL = "/api/vehicles";

export const getVehicles = () => {
  return apiClient.get<Vehicle[]>(BASE_URL);
};

export const createVehicle = (data: VehicleFormData) => {
  return apiClient.post<Vehicle>(BASE_URL, data);
};
```

#### Capa de Validación (Zod Schemas)

```
libs/zods/
├── [módulo]/                    # Schemas por módulo
│   └── [entidad]Zod.tsx         # Validaciones Zod
```

**Ejemplo:**

```typescript
// libs/zods/inventory/vehicleZod.tsx
import { z } from "zod";

export const vehicleSchema = z.object({
  customer: z.union([z.string(), z.object({ ... })]),
  model: z.union([z.string(), z.object({ ... })]),
  year: z.number().min(1900).max(2100),
  placa: z.string().min(1),
  vin: z.string().min(1),
  color: z.string().min(1),
  kilometraje: z.number().min(0).optional(),
  estado: z.enum(["activo", "inactivo"]).optional()
});
```

#### Capa de Tipos (Interfaces)

```
libs/interfaces/
├── [módulo]/                    # Interfaces por módulo
│   └── [entidad].interface.ts   # Definiciones TypeScript
```

### 4. Patrón de Componentes CRUD

Todos los módulos siguen el mismo patrón:

```
1. List Component (DataTable)
   - Muestra datos en tabla
   - Búsqueda global
   - Paginación
   - Acciones (editar, eliminar)
   - Abre Form en Dialog

2. Form Component (Dialog)
   - React Hook Form + Zod
   - Modo crear/editar
   - Validación en tiempo real
   - Submit al servicio

3. Service (HTTP Client)
   - CRUD operations
   - Error handling
   - Type safety

4. Page (Route)
   - Renderiza List
   - Proporciona contexto
```

## Flujo de Datos

```
Usuario → Page → List Component → Service → Backend API
                      ↓
                Form Component → Service → Backend API
                      ↓
              Zod Validation
```

## Autenticación y Autorización

- **JWT** requerido para todas las operaciones
- **SuperAdmin** requerido para operaciones POST/PUT/DELETE
- Roles manejados en `/lib/roles.ts`
- Hook personalizado: `useUserRoles()`

## Convenciones de Nombres

### Archivos

- Componentes: PascalCase (`VehicleList.tsx`)
- Servicios: camelCase (`vehicleService.ts`)
- Interfaces: camelCase con `.interface.ts` (`vehicle.interface.ts`)
- Schemas: camelCase con `Zod.tsx` (`vehicleZod.tsx`)

### Variables y Funciones

- camelCase para variables y funciones
- PascalCase para componentes y tipos
- UPPER_CASE para constantes

### Tipos TypeScript

```typescript
// Interfaces de DB (con _id)
interface Vehicle {
  _id?: string;
  customer: Customer | string;
  model: VehicleModel | string;
  // ...
}

// Tipos para formularios (sin _id)
type VehicleFormData = z.infer<typeof vehicleSchema>;
```

## Estado Global

- **Zustand** para estado global
- Stores por módulo: `autoSysStore`, `refineriaStore`, `workshopStore`
- SWR para cache de datos del servidor

## Próximos Pasos

Ver documentación específica de cada módulo en `/docs/modules/`
