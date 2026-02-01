# 🏭 Service Bays Module

> Sistema completo de gestión de puestos de servicio para talleres mecánicos

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PrimeReact](https://img.shields.io/badge/PrimeReact-007ACC?style=flat)](https://primereact.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)

## 🎯 Descripción

El módulo **Service Bays** (Puestos de Servicio) es un sistema completo para gestionar las bahías de trabajo en talleres mecánicos. Permite controlar la asignación de vehículos, técnicos, seguimiento de tiempos y generación de reportes.

## ✨ Características Principales

### 🏗️ Gestión de Bahías

- ✅ 8 áreas de especialización (mecánica, electricidad, pintura, etc.)
- ✅ 4 estados (disponible, ocupado, mantenimiento, fuera de servicio)
- ✅ 5 capacidades (individual, pequeña, mediana, grande, múltiple)
- ✅ Configuración de equipamiento por bahía
- ✅ Control de capacidad de técnicos

### 👥 Asignaciones

- ✅ Asignación de técnicos (principal/asistente)
- ✅ Registro automático de entrada/salida
- ✅ Cálculo automático de horas trabajadas
- ✅ Soporte para múltiples técnicos por bahía
- ✅ Historial completo de ocupación

### 📊 Dashboard y Reportes

- ✅ Dashboard en tiempo real
- ✅ Reportes de horas por técnico
- ✅ Análisis de utilización de bahías
- ✅ KPIs y métricas de rendimiento
- ✅ Historial detallado por bahía

## 🚀 Inicio Rápido

### 1. Navega al módulo

```bash
http://localhost:3000/autosys/operation/service-bays
```

### 2. Importa lo necesario

```typescript
import {
  ServiceBay,
  getServiceBays,
  createServiceBay,
  enterBay,
  exitBay,
} from "@/app/api/serviceBayService";
```

### 3. Crea tu primera bahía

```typescript
const nuevaBahia = await createServiceBay({
  name: "Bahía Mecánica 1",
  code: "MEC-01",
  area: "mecanica",
  capacity: "mediana",
  maxTechnicians: 2,
  equipment: ["Gato Hidráulico", "Compresor"],
});
```

### 4. Asigna un vehículo

```typescript
await enterBay(workOrderId, {
  serviceBay: bayId,
  technician: technicianId,
  role: "principal",
  estimatedHours: 2,
});
```

## 📁 Estructura del Módulo

```
taller-template-web/
├── libs/
│   ├── interfaces/workshop/
│   │   └── serviceBay.interface.ts    # Tipos e interfaces
│   └── zods/workshop/
│       └── serviceBaySchemas.ts       # Validaciones Zod
├── app/
│   ├── api/
│   │   └── serviceBayService.ts       # Servicio API
│   └── (main)/autosys/operation/
│       └── service-bays/
│           └── page.tsx               # Página principal
└── components/workshop/
    └── service-bays/
        ├── ServiceBayList.tsx         # Lista/Tabla
        └── ServiceBayForm.tsx         # Formulario CRUD
```

## 🔌 API Endpoints

| Método   | Endpoint                     | Descripción            |
| -------- | ---------------------------- | ---------------------- |
| `GET`    | `/service-bays`              | Lista todas las bahías |
| `GET`    | `/service-bays/available`    | Solo disponibles       |
| `POST`   | `/service-bays`              | Crear nueva bahía      |
| `PUT`    | `/service-bays/:id`          | Actualizar bahía       |
| `DELETE` | `/service-bays/:id`          | Eliminar bahía         |
| `POST`   | `/work-orders/:id/enter-bay` | Registrar entrada      |
| `POST`   | `/work-orders/:id/exit-bay`  | Registrar salida       |
| `GET`    | `/dashboard/service-bays`    | Dashboard              |

## 📚 Documentación

### Documentos Disponibles

| Documento                                                             | Descripción                         | Para quién                  |
| --------------------------------------------------------------------- | ----------------------------------- | --------------------------- |
| [**Índice**](../../docs/modules/SERVICE_BAYS_INDEX.md)                | Navegación de toda la documentación | Punto de entrada            |
| [**Documentación Completa**](../../docs/modules/SERVICE_BAYS.md)      | Guía exhaustiva del módulo          | Desarrolladores nuevos      |
| [**Referencia Rápida**](../../docs/modules/SERVICE_BAYS_QUICK_REF.md) | Snippets y referencia rápida        | Consulta durante desarrollo |
| [**Ejemplos Prácticos**](../../docs/modules/SERVICE_BAYS_EXAMPLES.md) | Casos de uso reales con código      | Implementación práctica     |

### Acceso Rápido

- 🆕 **Nuevo en el módulo?** → Lee el [Índice](../../docs/modules/SERVICE_BAYS_INDEX.md)
- 🔨 **Implementando?** → Usa los [Ejemplos](../../docs/modules/SERVICE_BAYS_EXAMPLES.md)
- ⚡ **Consulta rápida?** → Revisa la [Referencia](../../docs/modules/SERVICE_BAYS_QUICK_REF.md)
- 📖 **Documentación completa?** → Ve a [Docs](../../docs/modules/SERVICE_BAYS.md)

## 🛠️ Tecnologías

- **Framework:** Next.js 14 (App Router)
- **UI:** PrimeReact 10+
- **Forms:** React Hook Form + Zod
- **Animaciones:** Framer Motion
- **Type Safety:** TypeScript (strict mode)
- **HTTP Client:** Axios

## 📊 Tipos Principales

```typescript
// Áreas de especialización
type BayArea =
  | "mecanica"
  | "electricidad"
  | "pintura"
  | "latoneria"
  | "diagnostico"
  | "cambio_aceite"
  | "multiple";

// Estados
type BayStatus = "disponible" | "ocupado" | "mantenimiento" | "fuera_servicio";

// Interface principal
interface ServiceBay {
  _id: string;
  name: string;
  code: string;
  area: BayArea;
  status: BayStatus;
  capacity: BayCapacity;
  maxTechnicians: number;
  equipment: string[];
  currentWorkOrder?: string;
  currentTechnicians: CurrentTechnician[];
  isActive: boolean;
  order: number;
  // ... más campos
}
```

## 💡 Ejemplos de Uso

### Listar Bahías Disponibles

```typescript
const bays = await getAvailableServiceBays("mecanica", "mediana");
console.log(`Encontradas ${bays.bays.length} bahías disponibles`);
```

### Asignar con Múltiples Técnicos

```typescript
await enterBay(workOrderId, {
  serviceBay: bayId,
  technicians: [
    { technician: "tech1", role: "principal", estimatedHours: 3 },
    { technician: "tech2", role: "asistente", estimatedHours: 3 },
  ],
});
```

### Dashboard en Tiempo Real

```typescript
const dashboard = await getServiceBaysDashboard();

console.log(
  `Ocupadas: ${dashboard.summary.occupiedBays}/${dashboard.summary.totalBays}`
);
console.log(`Disponibles: ${dashboard.summary.availableBays}`);
console.log(`En mantenimiento: ${dashboard.summary.maintenanceBays}`);
```

### Reporte de Utilización

```typescript
const report = await getBayUtilizationReport({
  startDate: "2025-11-01",
  endDate: "2025-11-30",
});

report.report.forEach((bay) => {
  console.log(`${bay.bayName}: ${bay.utilizationPercentage}% utilización`);
});
```

## 🎨 Componentes UI

### ServiceBayList

Lista completa con DataTable, búsqueda, paginación y acciones CRUD.

```tsx
import ServiceBayList from "@/components/workshop/service-bays/ServiceBayList";

<ServiceBayList />;
```

### ServiceBayForm

Formulario con validación para crear/editar bahías.

```tsx
import ServiceBayForm from "@/components/workshop/service-bays/ServiceBayForm";

<ServiceBayForm
  serviceBay={bay || null}
  onSave={handleSave}
  onCancel={handleCancel}
  toast={toastRef}
/>;
```

## ✅ Validaciones

```typescript
// Código
- Formato: A-Z, 0-9 y guiones
- Longitud: 2-20 caracteres
- Ejemplo: "MEC-01"

// Nombre
- Longitud: 3-100 caracteres

// Técnicos
- Mínimo: 1
- Máximo: 10

// Notas
- Máximo: 500 caracteres
```

## 🔐 Autenticación

Todos los endpoints requieren token JWT:

```typescript
headers: {
  'x-token': token
}
```

## 🐛 Solución de Problemas

### Bahía no aparece disponible

**Causa:** Estado incorrecto o bahía inactiva  
**Solución:** Verificar `status === 'disponible'` y `isActive === true`

### Error al asignar

**Causa:** Bahía ya ocupada o sin capacidad  
**Solución:** Verificar disponibilidad antes de asignar

### Código duplicado

**Causa:** El código ya existe  
**Solución:** Usar códigos únicos (Ej: MEC-01, MEC-02)

## 📈 Roadmap

- [ ] Calendario de reservas
- [ ] Notificaciones push
- [ ] Mapa visual del taller
- [ ] QR codes para check-in
- [ ] App móvil para técnicos
- [ ] Análisis predictivo
- [ ] Integración con IoT

## 🤝 Contribuir

Para contribuir al módulo:

1. Revisa la [Documentación Completa](../../docs/modules/SERVICE_BAYS.md)
2. Sigue las convenciones de código
3. Agrega tests para nuevas funcionalidades
4. Actualiza la documentación

## 📝 Changelog

### v1.0.0 - 2025-11-08

- ✨ Implementación inicial
- ✅ CRUD completo de bahías
- ✅ Sistema de asignaciones
- ✅ Dashboard en tiempo real
- ✅ Reportes y análisis
- ✅ Validaciones con Zod
- ✅ Documentación completa

## 📄 Licencia

Este módulo es parte del proyecto Taller Template Web.

---

## 🔗 Enlaces Útiles

- [Documentación Backend](../../../backend-taller-template-web/docs/SERVICE_BAY_FRONTEND_INTEGRATION.md)
- [Componentes PrimeReact](https://primereact.org/)
- [Next.js Docs](https://nextjs.org/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

**Desarrollado con ❤️ para talleres mecánicos**

**Versión:** 1.0.0  
**Última actualización:** 8 de Noviembre, 2025
