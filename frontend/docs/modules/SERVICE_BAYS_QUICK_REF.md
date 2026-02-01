# 🚀 Quick Reference - Puestos de Servicio

## Importaciones Rápidas

```typescript
// Interfaces
import {
  ServiceBay,
  BayArea,
  BayStatus,
  BayCapacity,
  CreateServiceBayDto,
  UpdateServiceBayDto,
} from "@/libs/interfaces/workshop/serviceBay.interface";

// Servicio API
import {
  getServiceBays,
  getAvailableServiceBays,
  createServiceBay,
  updateServiceBay,
  deleteServiceBay,
  enterBay,
  exitBay,
} from "@/app/api/serviceBayService";

// Schemas de validación
import {
  createServiceBaySchema,
  updateServiceBaySchema,
} from "@/libs/zods/workshop/serviceBaySchemas";
```

## Operaciones Comunes

### 1. Listar Bahías Disponibles

```typescript
const bays = await getAvailableServiceBays("mecanica", "mediana");
```

### 2. Crear Bahía

```typescript
await createServiceBay({
  name: "Bahía Mecánica 1",
  code: "MEC-01",
  area: "mecanica",
  capacity: "mediana",
  maxTechnicians: 2,
  equipment: ["Gato", "Compresor"],
  order: 1,
});
```

### 3. Asignar Técnico

```typescript
await enterBay(workOrderId, {
  serviceBay: bayId,
  technician: technicianId,
  role: "principal",
  estimatedHours: 3,
});
```

### 4. Liberar Bahía

```typescript
await exitBay(workOrderId, {
  technician: technicianId,
  notes: "Trabajo completado",
});
```

### 5. Dashboard

```typescript
const dashboard = await getServiceBaysDashboard();
console.log(dashboard.summary.occupiedBays);
```

## Tipos Disponibles

### Áreas (BayArea)

- `mecanica` - Mecánica
- `electricidad` - Electricidad
- `pintura` - Pintura
- `latoneria` - Latonería
- `diagnostico` - Diagnóstico
- `cambio_aceite` - Cambio de Aceite
- `multiple` - Múltiple

### Estados (BayStatus)

- `disponible` 🟢
- `ocupado` 🟡
- `mantenimiento` 🔵
- `fuera_servicio` 🔴

### Capacidades (BayCapacity)

- `individual` - 1 vehículo pequeño
- `pequeña` - 1 vehículo mediano
- `mediana` - 1 vehículo grande
- `grande` - 2 vehículos medianos
- `multiple` - 3+ vehículos

## Validaciones

```typescript
// Código
- Solo A-Z, 0-9 y guiones
- 2-20 caracteres
- Ejemplo: "MEC-01"

// Nombre
- 3-100 caracteres

// Técnicos
- 1-10 técnicos máximo

// Notas
- Máximo 500 caracteres
```

## Endpoints

```
GET    /service-bays                      Lista todas
GET    /service-bays/available            Solo disponibles
POST   /service-bays                      Crear
PUT    /service-bays/:id                  Actualizar
DELETE /service-bays/:id                  Eliminar
POST   /work-orders/:id/enter-bay         Entrada
POST   /work-orders/:id/exit-bay          Salida
GET    /dashboard/service-bays            Dashboard
```

## Rutas Frontend

```
/autosys/operation/service-bays  →  Gestión de bahías
```

## Componentes

```tsx
// Lista completa
<ServiceBayList />

// Formulario
<ServiceBayForm
  serviceBay={bay || null}
  onSave={handleSave}
  onCancel={handleCancel}
  toast={toastRef}
/>
```

## Errores Comunes

| Error                   | Causa            | Solución            |
| ----------------------- | ---------------- | ------------------- |
| Bay not found           | ID inválido      | Verificar ID existe |
| Bay code already exists | Código duplicado | Usar código único   |
| Bay is already occupied | Ya ocupada       | Verificar estado    |
| Bay at maximum capacity | Sin espacio      | Reducir técnicos    |

## Labels para UI

```typescript
import {
  BAY_AREA_LABELS,
  BAY_STATUS_LABELS,
  BAY_CAPACITY_LABELS,
  BAY_STATUS_COLORS,
  BAY_AREA_ICONS,
} from "@/libs/interfaces/workshop/serviceBay.interface";
```

---

📖 **Documentación completa:** `docs/modules/SERVICE_BAYS.md`
