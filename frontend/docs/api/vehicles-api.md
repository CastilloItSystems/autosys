# API de Vehículos - Documentación Completa

## Información General

- **Base URL:** `/api/vehicles`
- **Autenticación:** JWT Token requerido en header `Authorization: Bearer <token>`
- **Permisos de Escritura:** Rol SuperAdmin requerido para POST, PUT, DELETE

## Entidades

### Vehicle (Vehículo)

```typescript
interface Vehicle {
  _id?: string;
  customer: Customer | string;
  model: VehicleModel | string;
  year: number;
  placa: string;
  vin: string;
  color: string;
  kilometraje?: number;
  estado?: "activo" | "inactivo";
  createdAt?: Date;
  updatedAt?: Date;
}
```

### VehicleBrand (Marca)

```typescript
interface VehicleBrand {
  _id?: string;
  nombre: string;
  paisOrigen?: string;
  logo?: string;
  estado?: "activo" | "inactivo";
  createdAt?: Date;
  updatedAt?: Date;
}
```

### VehicleModel (Modelo)

```typescript
interface VehicleModel {
  _id?: string;
  brand: VehicleBrand | string;
  nombre: string;
  tipo:
    | "sedan"
    | "suv"
    | "pickup"
    | "hatchback"
    | "coupe"
    | "convertible"
    | "wagon"
    | "van";
  motor: "gasolina" | "diesel" | "electrico" | "hibrido";
  yearInicio?: number;
  yearFin?: number;
  estado?: "activo" | "inactivo";
  createdAt?: Date;
  updatedAt?: Date;
}
```

---

## Endpoints de Vehículos

### GET /api/vehicles

Obtiene la lista completa de vehículos.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Response 200:**

```json
[
  {
    "_id": "65abc123...",
    "customer": {
      "_id": "65abc456...",
      "nombre": "Juan Pérez",
      "email": "juan@example.com"
    },
    "model": {
      "_id": "65abc789...",
      "nombre": "Corolla",
      "brand": {
        "_id": "65abc012...",
        "nombre": "Toyota"
      }
    },
    "year": 2022,
    "placa": "ABC-1234",
    "vin": "1HGBH41JXMN109186",
    "color": "Blanco",
    "kilometraje": 15000,
    "estado": "activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Response 401 (No autenticado):**

```json
{
  "error": "No autorizado",
  "message": "Token no proporcionado o inválido"
}
```

---

### GET /api/vehicles/:id

Obtiene un vehículo específico por su ID.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Parameters:**

- `id` (string, required): ID del vehículo

**Response 200:**

```json
{
  "_id": "65abc123...",
  "customer": {
    "_id": "65abc456...",
    "nombre": "Juan Pérez"
  },
  "model": {
    "_id": "65abc789...",
    "nombre": "Corolla"
  },
  "year": 2022,
  "placa": "ABC-1234",
  "vin": "1HGBH41JXMN109186",
  "color": "Blanco",
  "kilometraje": 15000,
  "estado": "activo"
}
```

**Response 404:**

```json
{
  "error": "No encontrado",
  "message": "Vehículo no encontrado"
}
```

---

### GET /api/vehicles/placa/:placa

Busca un vehículo por su placa.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Parameters:**

- `placa` (string, required): Placa del vehículo (ej: "ABC-1234")

**Response 200:**

```json
{
  "_id": "65abc123...",
  "customer": { ... },
  "model": { ... },
  "placa": "ABC-1234",
  ...
}
```

**Response 404:**

```json
{
  "error": "No encontrado",
  "message": "Vehículo con placa 'ABC-1234' no encontrado"
}
```

---

### GET /api/vehicles/vin/:vin

Busca un vehículo por su número VIN.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Parameters:**

- `vin` (string, required): Número VIN del vehículo

**Response 200:**

```json
{
  "_id": "65abc123...",
  "vin": "1HGBH41JXMN109186",
  ...
}
```

---

### POST /api/vehicles

Crea un nuevo vehículo.

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Permisos:** SuperAdmin

**Request Body:**

```json
{
  "customer": "65abc456...",
  "model": "65abc789...",
  "year": 2022,
  "placa": "ABC-1234",
  "vin": "1HGBH41JXMN109186",
  "color": "Blanco",
  "kilometraje": 0,
  "estado": "activo"
}
```

**Validaciones:**

- `customer` (required): ID de cliente válido
- `model` (required): ID de modelo válido
- `year` (required): Número entre 1900 y 2100
- `placa` (required): String no vacío
- `vin` (required): String no vacío
- `color` (required): String no vacío
- `kilometraje` (optional): Número >= 0
- `estado` (optional): "activo" | "inactivo"

**Response 201:**

```json
{
  "_id": "65abc123...",
  "customer": "65abc456...",
  "model": "65abc789...",
  "year": 2022,
  "placa": "ABC-1234",
  "vin": "1HGBH41JXMN109186",
  "color": "Blanco",
  "kilometraje": 0,
  "estado": "activo",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Response 400 (Validación):**

```json
{
  "error": "Validación fallida",
  "details": [
    {
      "field": "placa",
      "message": "La placa es requerida"
    }
  ]
}
```

**Response 403 (Permisos):**

```json
{
  "error": "Acceso denegado",
  "message": "Se requiere rol SuperAdmin"
}
```

---

### PUT /api/vehicles/:id

Actualiza un vehículo existente.

**Headers:**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Permisos:** SuperAdmin

**Parameters:**

- `id` (string, required): ID del vehículo a actualizar

**Request Body:**

```json
{
  "customer": "65abc456...",
  "model": "65abc789...",
  "year": 2022,
  "placa": "ABC-1234",
  "vin": "1HGBH41JXMN109186",
  "color": "Blanco",
  "kilometraje": 15000,
  "estado": "activo"
}
```

**Response 200:**

```json
{
  "_id": "65abc123...",
  "customer": "65abc456...",
  "kilometraje": 15000,
  "updatedAt": "2024-01-20T15:45:00.000Z",
  ...
}
```

---

### DELETE /api/vehicles/:id

Elimina un vehículo.

**Headers:**

```http
Authorization: Bearer <jwt_token>
```

**Permisos:** SuperAdmin

**Parameters:**

- `id` (string, required): ID del vehículo a eliminar

**Response 200:**

```json
{
  "message": "Vehículo eliminado correctamente",
  "deletedId": "65abc123..."
}
```

**Response 403:**

```json
{
  "error": "Acceso denegado",
  "message": "Se requiere rol SuperAdmin"
}
```

---

## Endpoints de Marcas

### GET /api/vehicles/brands

Obtiene todas las marcas de vehículos.

**Response 200:**

```json
[
  {
    "_id": "65abc012...",
    "nombre": "Toyota",
    "paisOrigen": "Japón",
    "logo": "https://example.com/toyota-logo.png",
    "estado": "activo"
  },
  {
    "_id": "65abc013...",
    "nombre": "Ford",
    "paisOrigen": "Estados Unidos",
    "logo": "https://example.com/ford-logo.png",
    "estado": "activo"
  }
]
```

---

### GET /api/vehicles/brands/:id

Obtiene una marca específica por ID.

---

### POST /api/vehicles/brands

Crea una nueva marca de vehículo.

**Permisos:** SuperAdmin

**Request Body:**

```json
{
  "nombre": "Toyota",
  "paisOrigen": "Japón",
  "logo": "https://example.com/logo.png",
  "estado": "activo"
}
```

**Validaciones:**

- `nombre` (required): String no vacío
- `paisOrigen` (optional): String
- `logo` (optional): String (URL)
- `estado` (optional): "activo" | "inactivo"

---

### PUT /api/vehicles/brands/:id

Actualiza una marca existente.

**Permisos:** SuperAdmin

---

### DELETE /api/vehicles/brands/:id

Elimina una marca.

**Permisos:** SuperAdmin

---

## Endpoints de Modelos

### GET /api/vehicles/models

Obtiene todos los modelos de vehículos.

**Response 200:**

```json
[
  {
    "_id": "65abc789...",
    "brand": {
      "_id": "65abc012...",
      "nombre": "Toyota"
    },
    "nombre": "Corolla",
    "tipo": "sedan",
    "motor": "gasolina",
    "yearInicio": 2010,
    "yearFin": 2024,
    "estado": "activo"
  }
]
```

---

### GET /api/vehicles/models/:id

Obtiene un modelo específico por ID.

---

### POST /api/vehicles/models

Crea un nuevo modelo de vehículo.

**Permisos:** SuperAdmin

**Request Body:**

```json
{
  "brand": "65abc012...",
  "nombre": "Corolla",
  "tipo": "sedan",
  "motor": "gasolina",
  "yearInicio": 2010,
  "yearFin": 2024,
  "estado": "activo"
}
```

**Validaciones:**

- `brand` (required): ID de marca válido
- `nombre` (required): String no vacío
- `tipo` (required): "sedan" | "suv" | "pickup" | "hatchback" | "coupe" | "convertible" | "wagon" | "van"
- `motor` (required): "gasolina" | "diesel" | "electrico" | "hibrido"
- `yearInicio` (optional): Número >= 1900
- `yearFin` (optional): Número <= 2100
- `estado` (optional): "activo" | "inactivo"

---

### PUT /api/vehicles/models/:id

Actualiza un modelo existente.

**Permisos:** SuperAdmin

---

### DELETE /api/vehicles/models/:id

Elimina un modelo.

**Permisos:** SuperAdmin

---

## Códigos de Estado HTTP

| Código | Significado                                        |
| ------ | -------------------------------------------------- |
| 200    | OK - Solicitud exitosa                             |
| 201    | Created - Recurso creado exitosamente              |
| 400    | Bad Request - Datos inválidos o validación fallida |
| 401    | Unauthorized - Token no proporcionado o inválido   |
| 403    | Forbidden - Sin permisos suficientes               |
| 404    | Not Found - Recurso no encontrado                  |
| 500    | Internal Server Error - Error del servidor         |

## Manejo de Errores

Todas las respuestas de error siguen este formato:

```json
{
  "error": "Tipo de error",
  "message": "Descripción detallada del error",
  "details": [
    /* opcional */
  ]
}
```

## Ejemplos de Uso

### JavaScript/TypeScript (con axios)

```typescript
import axios from "axios";

const API_BASE = "https://api.example.com";
const token = "your-jwt-token";

// Obtener todos los vehículos
const getVehicles = async () => {
  const response = await axios.get(`${API_BASE}/api/vehicles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Crear un vehículo
const createVehicle = async (data) => {
  const response = await axios.post(`${API_BASE}/api/vehicles`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

// Buscar por placa
const getVehicleByPlaca = async (placa) => {
  const response = await axios.get(`${API_BASE}/api/vehicles/placa/${placa}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
```

### cURL

```bash
# GET - Obtener todos los vehículos
curl -X GET "https://api.example.com/api/vehicles" \
  -H "Authorization: Bearer your-jwt-token"

# POST - Crear un vehículo
curl -X POST "https://api.example.com/api/vehicles" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "65abc456...",
    "model": "65abc789...",
    "year": 2022,
    "placa": "ABC-1234",
    "vin": "1HGBH41JXMN109186",
    "color": "Blanco"
  }'

# GET - Buscar por placa
curl -X GET "https://api.example.com/api/vehicles/placa/ABC-1234" \
  -H "Authorization: Bearer your-jwt-token"
```

## Notas Importantes

1. **Autenticación:** Todas las peticiones requieren un JWT token válido
2. **Permisos:** Las operaciones de escritura (POST, PUT, DELETE) requieren rol SuperAdmin
3. **Poblado (Populate):** Los endpoints GET devuelven las relaciones populadas (customer, model, brand)
4. **Validación:** Todos los datos son validados antes de ser procesados
5. **Soft Delete:** El campo `estado` permite desactivar registros sin eliminarlos físicamente

## Soporte

Para reportar problemas o solicitar nuevas funcionalidades, contacta al equipo de desarrollo.
