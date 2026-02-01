# Módulo CRM (Customer Relationship Management)

## Descripción General

El módulo CRM gestiona las relaciones con clientes y sus vehículos, incluyendo:

- Clientes
- Vehículos de clientes
- Marcas de vehículos
- Modelos de vehículos

## Entidades del Módulo

### 1. Customer (Cliente)

Información de clientes del taller.

**Campos:**

- `nombre` (string): Nombre completo
- `email` (string, opcional): Correo electrónico
- `telefono` (string, opcional): Teléfono de contacto
- `direccion` (string, opcional): Dirección física
- `ruc` (string, opcional): RUC para facturación
- `estado` ("activo" | "inactivo"): Estado del cliente

### 2. VehicleBrand (Marca de Vehículo)

Marcas de vehículos (Toyota, Honda, Ford, etc.)

**Campos:**

- `nombre` (string, requerido): Nombre de la marca
- `paisOrigen` (string, opcional): País de origen
- `logo` (string, opcional): URL del logo
- `estado` ("activo" | "inactivo"): Estado de la marca

### 3. VehicleModel (Modelo de Vehículo)

Modelos específicos de vehículos vinculados a una marca.

**Campos:**

- `brand` (VehicleBrand | string, requerido): Marca del vehículo
- `nombre` (string, requerido): Nombre del modelo (ej: "Corolla")
- `tipo` (enum, requerido): Tipo de vehículo
  - sedan
  - suv
  - pickup
  - hatchback
  - coupe
  - convertible
  - wagon
  - van
- `motor` (enum, requerido): Tipo de motor
  - gasolina
  - diesel
  - electrico
  - hibrido
- `yearInicio` (number, opcional): Año de inicio de producción
- `yearFin` (number, opcional): Año de fin de producción
- `estado` ("activo" | "inactivo"): Estado del modelo

### 4. Vehicle (Vehículo)

Vehículos específicos de clientes.

**Campos:**

- `customer` (Customer | string, requerido): Cliente propietario
- `model` (VehicleModel | string, requerido): Modelo del vehículo
- `year` (number, requerido): Año del vehículo (1900-2100)
- `placa` (string, requerido): Placa de identificación
- `vin` (string, requerido): Número VIN
- `color` (string, requerido): Color del vehículo
- `kilometraje` (number, opcional): Kilometraje actual
- `estado` ("activo" | "inactivo"): Estado del vehículo

## Estructura de Archivos

```
# Servicios API
app/api/crm/
├── vehicleService.ts         # CRUD de vehículos
├── vehicleBrandService.ts    # CRUD de marcas de vehículos
└── vehicleModelService.ts    # CRUD de modelos de vehículos

# Componentes
components/crm/
├── vehicles/
│   ├── VehicleList.tsx       # Lista de vehículos
│   └── VehicleForm.tsx       # Formulario de vehículos
├── vehicle-brands/
│   ├── VehicleBrandList.tsx  # Lista de marcas
│   └── VehicleBrandForm.tsx  # Formulario de marcas
└── vehicle-models/
    ├── VehicleModelList.tsx  # Lista de modelos
    └── VehicleModelForm.tsx  # Formulario de modelos

# Páginas (Routes)
app/(autosys)/autosys/crm/vehiculos/
├── page.tsx                  # /autosys/crm/vehiculos
├── marcas/
│   └── page.tsx              # /autosys/crm/vehiculos/marcas
└── modelos/
    └── page.tsx              # /autosys/crm/vehiculos/modelos

# Interfaces y Validaciones
libs/interfaces/inventory/
└── vehicle.interface.ts      # Interfaces TypeScript

libs/zods/inventory/
└── vehicleZod.tsx            # Schemas Zod
```

## Relaciones entre Entidades

```
Customer (Cliente)
    ↓ tiene muchos
Vehicle (Vehículo)
    ↓ pertenece a
VehicleModel (Modelo)
    ↓ pertenece a
VehicleBrand (Marca)
```

## API Endpoints

### Vehicles

#### `GET /api/vehicles`

Obtiene todos los vehículos.

**Response:**

```typescript
Vehicle[]
```

#### `GET /api/vehicles/:id`

Obtiene un vehículo por ID.

**Response:**

```typescript
Vehicle;
```

#### `GET /api/vehicles/placa/:placa`

Busca un vehículo por su placa.

**Params:**

- `placa` (string): Placa del vehículo

**Response:**

```typescript
Vehicle | null;
```

#### `GET /api/vehicles/vin/:vin`

Busca un vehículo por su VIN.

**Params:**

- `vin` (string): Número VIN del vehículo

**Response:**

```typescript
Vehicle | null;
```

#### `POST /api/vehicles`

Crea un nuevo vehículo.

**Auth:** JWT + SuperAdmin

**Body:**

```typescript
{
  customer: string,      // ID del cliente
  model: string,         // ID del modelo
  year: number,
  placa: string,
  vin: string,
  color: string,
  kilometraje?: number,
  estado?: "activo" | "inactivo"
}
```

**Response:**

```typescript
Vehicle;
```

#### `PUT /api/vehicles/:id`

Actualiza un vehículo existente.

**Auth:** JWT + SuperAdmin

**Body:** Igual que POST

**Response:**

```typescript
Vehicle;
```

#### `DELETE /api/vehicles/:id`

Elimina un vehículo.

**Auth:** JWT + SuperAdmin

**Response:**

```typescript
{
  message: string;
}
```

### Vehicle Brands

#### `GET /api/vehicles/brands`

Obtiene todas las marcas de vehículos.

#### `GET /api/vehicles/brands/:id`

Obtiene una marca por ID.

#### `POST /api/vehicles/brands`

Crea una nueva marca.

**Auth:** JWT + SuperAdmin

**Body:**

```typescript
{
  nombre: string,
  paisOrigen?: string,
  logo?: string,
  estado?: "activo" | "inactivo"
}
```

#### `PUT /api/vehicles/brands/:id`

Actualiza una marca existente.

**Auth:** JWT + SuperAdmin

#### `DELETE /api/vehicles/brands/:id`

Elimina una marca.

**Auth:** JWT + SuperAdmin

### Vehicle Models

#### `GET /api/vehicles/models`

Obtiene todos los modelos de vehículos.

#### `GET /api/vehicles/models/:id`

Obtiene un modelo por ID.

#### `POST /api/vehicles/models`

Crea un nuevo modelo.

**Auth:** JWT + SuperAdmin

**Body:**

```typescript
{
  brand: string,        // ID de la marca
  nombre: string,
  tipo: "sedan" | "suv" | "pickup" | "hatchback" | "coupe" | "convertible" | "wagon" | "van",
  motor: "gasolina" | "diesel" | "electrico" | "hibrido",
  yearInicio?: number,
  yearFin?: number,
  estado?: "activo" | "inactivo"
}
```

#### `PUT /api/vehicles/models/:id`

Actualiza un modelo existente.

**Auth:** JWT + SuperAdmin

#### `DELETE /api/vehicles/models/:id`

Elimina un modelo.

**Auth:** JWT + SuperAdmin

## Uso en Código

### Importar Servicios

```typescript
// Servicios de vehículos
import {
  getVehicles,
  getVehicle,
  getVehicleByPlaca,
  getVehicleByVin,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/app/api/crm/vehicleService";

// Servicios de marcas
import {
  getVehicleBrands,
  getVehicleBrand,
  createVehicleBrand,
  updateVehicleBrand,
  deleteVehicleBrand,
} from "@/app/api/crm/vehicleBrandService";

// Servicios de modelos
import {
  getVehicleModels,
  getVehicleModel,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
} from "@/app/api/crm/vehicleModelService";
```

### Usar en Componentes

```typescript
"use client";

import { useEffect, useState } from "react";
import { getVehicles } from "@/app/api/crm/vehicleService";
import { Vehicle } from "@/libs/interfaces/inventory/vehicle.interface";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await getVehicles();
        setVehicles(data);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Vehículos</h1>
      {/* Render vehicles */}
    </div>
  );
}
```

### Crear un Vehículo

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vehicleSchema,
  VehicleFormData,
} from "@/libs/zods/inventory/vehicleZod";
import { createVehicle } from "@/app/api/crm/vehicleService";

export function CreateVehicleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  const onSubmit = async (data: VehicleFormData) => {
    try {
      const newVehicle = await createVehicle(data);
      console.log("Vehículo creado:", newVehicle);
      // Mostrar notificación de éxito
    } catch (error) {
      console.error("Error al crear vehículo:", error);
      // Mostrar notificación de error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>{/* Campos del formulario */}</form>
  );
}
```

## Validación con Zod

### Esquema de Vehículo

```typescript
import { z } from "zod";

export const vehicleSchema = z.object({
  customer: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      nombre: z.string(),
    }),
  ]),
  model: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      nombre: z.string(),
    }),
  ]),
  year: z.number().min(1900).max(2100),
  placa: z.string().min(1, "La placa es requerida"),
  vin: z.string().min(1, "El VIN es requerido"),
  color: z.string().min(1, "El color es requerido"),
  kilometraje: z.number().min(0).optional(),
  estado: z.enum(["activo", "inactivo"]).optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
```

## Navegación del Módulo

El módulo CRM está disponible en el menú principal bajo la sección "CRM":

```
CRM
├── Vehículos (/autosys/crm/vehiculos)
├── Marcas (/autosys/crm/vehiculos/marcas)
└── Modelos (/autosys/crm/vehiculos/modelos)
```

## Permisos Requeridos

- **Lectura (GET):** Usuario autenticado con JWT
- **Escritura (POST/PUT/DELETE):** SuperAdmin

Para verificar permisos, usar el hook `useUserRoles()`:

```typescript
import { useUserRoles } from "@/hooks/useUserRoles";

export function VehicleActions() {
  const { isSuperAdmin } = useUserRoles();

  return <div>{isSuperAdmin && <button>Crear Vehículo</button>}</div>;
}
```

## Próximos Pasos

- Ver guía de creación de módulos: `/docs/guides/creating-modules.md`
- Ver ejemplos de componentes: `/docs/guides/component-patterns.md`
- Ver API completa: `/docs/api/vehicles-api.md`
