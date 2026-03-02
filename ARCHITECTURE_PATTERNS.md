# Patrones de Arquitectura - AutoSys

Documentación de los patrones establecidos para el desarrollo de nuevas funcionalidades.

## 📋 Estructura de Catálogos (Brands, Models, Categories)

### Backend Controller Pattern

**Ubicación:** `backend/src/features/inventory/items/catalogs/[feature]/[feature].controller.ts`

**Estructura base:**

```typescript
import { Request, Response } from "express";
import { Service } from "./[feature].service";
import { DTO, ResponseDTO } from "./[feature].dto";
import { ApiResponse } from "../../../../../shared/utils/ApiResponse";
import { asyncHandler } from "../../../../../shared/middleware/asyncHandler.middleware";
import { INVENTORY_MESSAGES } from "../../../shared/constants/messages";

const service = new Service();

export class Controller {
  // GET - Lista con paginación y filtros
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, ...filters } = req.query;
    const filters: IFilters = { ...filters };
    if (search) filters.search = search as string;
    filters.page = Number(page) || 1;
    filters.limit = Number(limit) || 10;

    const result = await service.getAll(filters);
    const response = result.items.map((item) => new ResponseDTO(item));

    return ApiResponse.paginated(
      res,
      response,
      result.page,
      result.limit,
      result.total,
      "Items obtenidos exitosamente",
    );
  });

  // GET - Lista filtrada (activos, agrupados, etc)
  getActive = asyncHandler(async (req: Request, res: Response) => {
    const items = await service.getActive();
    const response = items.map((item) => new ResponseDTO(item));

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      "Items activos obtenidos exitosamente",
    );
  });

  // GET - Búsqueda
  search = asyncHandler(async (req: Request, res: Response) => {
    const { q: query } = req.query;

    if (!query || (query as string).length < 2) {
      return ApiResponse.paginated(res, [], 1, 0, 0, "Búsqueda completada");
    }

    const items = await service.search(query as string);
    const response = items.map((item) => new ResponseDTO(item));

    return ApiResponse.paginated(
      res,
      response,
      1,
      response.length,
      response.length,
      "Búsqueda completada",
    );
  });

  // GET - Por ID
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await service.getById(id);
    return ApiResponse.success(res, new ResponseDTO(item), "Item obtenido");
  });

  // POST - Crear
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = new DTO(req.body);
    const item = await service.create(dto);
    return ApiResponse.created(res, new ResponseDTO(item), MESSAGES.created);
  });

  // PUT - Actualizar
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto = new DTO(req.body);
    const item = await service.update(id, dto);
    return ApiResponse.success(res, new ResponseDTO(item), MESSAGES.updated);
  });

  // PATCH - Toggle (activar/desactivar)
  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await service.toggleActive(id);
    const message = item.isActive ? "activado" : "desactivado";
    return ApiResponse.success(res, new ResponseDTO(item), message);
  });

  // DELETE - Soft delete
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await service.delete(id);
    return ApiResponse.success(res, null, MESSAGES.deleted);
  });

  // DELETE - Hard delete
  hardDelete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await service.hardDelete(id);
    return ApiResponse.success(res, null, "Eliminado permanentemente");
  });
}

export default new Controller();
```

### Backend Routes Pattern

**Ubicación:** `backend/src/features/inventory/items/catalogs/[feature]/[feature].routes.ts`

**Orden importante (específicas antes de genéricas):**

```typescript
// RUTAS ESPECÍFICAS PRIMERO (before generic /:id routes)
router.get("/active", authenticate, controller.getActive);
router.get("/search", authenticate, controller.search);
router.get("/grouped", authenticate, controller.getGrouped);
router.get("/brand/:brandId", authenticate, controller.getByBrand);

// RUTAS GENÉRICAS
router.get("/", authenticate, controller.getAll);
router.get("/:id", authenticate, controller.getById);
router.post("/", authenticate, controller.create);
router.put("/:id", authenticate, controller.update);
router.patch("/:id/toggle", authenticate, controller.toggleActive);

// DELETE - Hard delete ANTES de soft delete
router.delete("/:id/hard", authenticate, controller.hardDelete);
router.delete("/:id", authenticate, controller.delete);
```

### Service Layer

**Métodos esperados:**

- `getAll(filters)` - Lista con filtros
- `getActive()`- Solo activos
- `search(query)`- Búsqueda
- `getById(id)` - Por ID
- `create(dto)` - Crear
- `update(id, dto)` - Actualizar
- `toggleActive(id)` - Cambiar estado
- `delete(id)` - Soft delete
- `hardDelete(id)` - Eliminar permanentemente

---

## 🎨 Frontend Service Pattern

**Ubicación:** `frontend/app/api/inventory/[feature]Service.ts`

**Estructura base:**

```typescript
import apiClient from "../apiClient";

// Tipos
export type ItemType = "TYPE1" | "TYPE2";

export interface Item {
  id: string;
  code: string;
  name: string;
  type: ItemType;
  isActive: boolean;
  // ... otros campos
}

// Response con paginación estándar
export interface ItemsResponse {
  data: Item[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Single item response
interface ItemResponse {
  data: Item;
}

// DTOs
interface CreateItemRequest {
  code: string;
  name: string;
  // ... otros campos
}

interface UpdateItemRequest {
  // campos opcionales
}

// Métodos estándar
export const getItems = async (
  page = 1,
  limit = 20,
  search?: string,
  ...filters
): Promise<ItemsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.append("search", search);

  const response = await apiClient.get(`/inventory/catalogs/items?${params}`);
  return response.data;
};

export const getActiveItems = async (): Promise<ItemsResponse> => {
  const response = await apiClient.get("/inventory/catalogs/items/active");
  return response.data;
};

export const searchItems = async (query: string): Promise<ItemsResponse> => {
  const response = await apiClient.get(
    `/inventory/catalogs/items/search?q=${encodeURIComponent(query)}`,
  );
  return response.data;
};

export const getItem = async (id: string): Promise<ItemResponse> => {
  const response = await apiClient.get(`/inventory/catalogs/items/${id}`);
  return response.data;
};

export const createItem = async (
  data: CreateItemRequest,
): Promise<ItemResponse> => {
  const response = await apiClient.post("/inventory/catalogs/items", data);
  return response.data;
};

export const updateItem = async (
  id: string,
  data: UpdateItemRequest,
): Promise<ItemResponse> => {
  const response = await apiClient.put(`/inventory/catalogs/items/${id}`, data);
  return response.data;
};

export const toggleItem = async (id: string): Promise<ItemResponse> => {
  const response = await apiClient.patch(
    `/inventory/catalogs/items/${id}/toggle`,
  );
  return response.data;
};

export const deleteItem = async (id: string): Promise<ItemResponse> => {
  const response = await apiClient.delete(`/inventory/catalogs/items/${id}`);
  return response.data;
};

export const deleteItemPermanently = async (
  id: string,
): Promise<ItemResponse> => {
  const response = await apiClient.delete(
    `/inventory/catalogs/items/${id}/hard`,
  );
  return response.data;
};
```

---

## ⚛️ Frontend Component Pattern

### List Component

**Ubicación:** `frontend/components/inventory/[feature]/[Feature]List.tsx`

**Características:**

- Paginación
- Búsqueda
- Filtro activos/todos
- Toggle y delete actions
- Animations con Framer Motion
- Status badges
- DataTable con PrimeReact

**Estructura simplificada:**

```typescript
export default function ItemList() {
  const [items, setItems] = useState<Item[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(10)
  const [showActive, setShowActive] = useState(true)

  const [loading, setLoading] = useState(false)
  const [formDialog, setFormDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const toast = useRef<Toast>(null)

  useEffect(() => {
    loadItems()
  }, [page, rows, searchQuery, showActive])

  const loadItems = async () => {
    try {
      setLoading(true)
      let response

      if (showActive) {
        response = await getActiveItems()
      } else {
        response = await getItems(page + 1, rows, searchQuery || undefined)
      }

      // Estructura estándar
      const data = response.data || []
      const total = response.pagination?.total || 0

      setItems(Array.isArray(data) ? data : [])
      setTotalRecords(total)
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar items",
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  // ... handlers y renderizado
```

### Form Component

**Ubicación:** `frontend/components/inventory/[feature]/[Feature]Form.tsx`

**Usa:**

- React Hook Form + Zod
- Controller para manejo de campos
- Validación en tiempo real
- ProgressSpinner mientras carga
- Botones Cancel/Save

---

## 🎯 Diferencias de Operaciones

| Operación       | Método | Endpoint          | Qué Hace                         | Estado Final      |
| --------------- | ------ | ----------------- | -------------------------------- | ----------------- |
| **Toggle**      | PATCH  | `/:id/toggle`     | Invierte estado                  | true ↔ false      |
| **Soft Delete** | DELETE | `/:id`            | Desactiva (marca como eliminado) | `isActive: false` |
| **Reactivate**  | PATCH  | `/:id/reactivate` | Solo activa                      | `isActive: true`  |
| **Hard Delete** | DELETE | `/:id/hard`       | Elimina del BD                   | ❌ no existe      |

---

## 🔄 Flujo de Datos

```
Backend              Frontend
=========            ========

Service              Service API
  ↓                    ↓
Controller          Component (List)
  ↓                    ↓
ApiResponse ----→ Parse Response
  ↓                    ↓
JSON Response    setState(data)
                    ↓
                Form Component
                    ↓
                submit → Service → Controller → Response
```

---

## ✅ Checklist para Nuevo Catálogo

1. **Backend:**
   - [ ] Controller con todos los métodos
   - [ ] Routes con orden correcto (específicas primero)
   - [ ] Service con lógica
   - [ ] DTOs con validaciones
   - [ ] Mensajes en INVENTORY_MESSAGES

2. **Frontend Service:**
   - [ ] Tipos e interfaces
   - [ ] Response con estructura estándar
   - [ ] Métodos getAll, getActive, search, getById, create, update, toggle, delete
   - [ ] Manejo de errores try-catch

3. **Frontend Components:**
   - [ ] ListComponent con paginación y búsqueda
   - [ ] FormComponent con validación Zod
   - [ ] Delete dialog
   - [ ] Toast messages
   - [ ] Animaciones Framer Motion

---

## 📚 Referencias

- **Backend Categories:** `backend/src/features/inventory/items/catalogs/categories/`
- **Backend Brands:** `backend/src/features/inventory/items/catalogs/brands/`
- **Backend Units:** `backend/src/features/inventory/items/catalogs/units/`
- **Frontend Brands:** `frontend/components/inventory/brands/`
- **Frontend Models:** `frontend/components/inventory/itemModels/`
- **Frontend Units:** `frontend/components/inventory/units/`

:::**UNITS MODULE UPDATE SECTION**:::

### Units Module (Diciembre 2024)

**Status:** ✅ Completamente actualizado con patrones estandarizados

**Cambios aplicados:**

**Backend - units.controller.ts:**

- ✅ Método `getAll`: Corregido filtro `isActive` para evitar valores `undefined`
- ✅ Método `getActive`: Cambiado de `ApiResponse.success()` a `ApiResponse.paginated()`
- ✅ Método `search`: Cambiado de `ApiResponse.success()` a `ApiResponse.paginated()`

**Backend - units.routes.ts:**

- ✅ Reordenadas rutas: específicas (GET /active, /grouped, /search, /type/:type) ANTES que genéricas
- ✅ POST routes agrupadas: POST / y POST /bulk juntas
- ✅ Movido DELETE /:id/hard ANTES de DELETE /:id (hard delete antes que soft delete)

**Frontend - unitService.ts:**

- ✅ Actualizado endpoint: `/inventory/units` → `/inventory/catalogs/units`
- ✅ Implementados todos los métodos
- ✅ Agregadas interfaces de tipos correctas
- ✅ Mantiene funciones legacy para backward compatibility

**Frontend - UnitList.tsx:**

- ✅ Activa paginación y búsqueda
- ✅ `loadUnits()` como método único para cargar datos
- ✅ Dependencies array: `[page, rows, searchQuery, showActive]`

**Frontend - UnitForm.tsx:**

- ✅ Nombres de campos alineados con backend
- ✅ Dropdown para seleccionar tipo
- ✅ Callback `onSuccess()` para refrescar

**Frontend - unitZod.tsx:**

- ✅ Actualizado schema con campos en inglés del backend
- ✅ Agregados campos: `code`, `type`, `isActive`
