# Swagger Documentation Guide

## Overview

Este proyecto usa **Swagger/OpenAPI 3.0** con **swagger-jsdoc** para generar documentación automática de la API REST.

## Acceso a la Documentación

- **UI Interactiva**: `http://localhost:4000/api/docs`
- **Especificación JSON**: `http://localhost:4000/api/docs/json`
- **Especificación YAML**: `http://localhost:4000/api/docs/yaml`

## Cómo Documentar Endpoints

### Ubicaciones de archivos

La configuración de Swagger busca comentarios JSDoc en:

- `src/controllers/**/*.ts`
- `src/routes/**/*.ts`
- `src/features/**/*.routes.ts`

### Estructura básica

```typescript
/**
 * @swagger
 * /ruta:
 *   get:
 *     summary: Descripción breve
 *     tags: [TagName]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/ruta', handler)
```

### Ejemplo Completo: GET con Paginación

```typescript
/**
 * @swagger
 * /api/inventory/catalogs/brands:
 *   get:
 *     summary: Obtener todas las marcas
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de marcas obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                 data:
 *                   type: array
 *       401:
 *         description: No autorizado
 */
router.get('/catalogs/brands', authenticate, getBrands)
```

### Ejemplo: POST con RequestBody

```typescript
/**
 * @swagger
 * /api/inventory/catalogs/brands:
 *   post:
 *     summary: Crear una nueva marca
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - codigo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Nike"
 *               codigo:
 *                 type: string
 *                 example: "NK"
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Marca creada
 *       400:
 *         description: Datos inválidos
 */
router.post('/catalogs/brands', authenticate, createBrand)
```

### Ejemplo: PUT con PathParameter

```typescript
/**
 * @swagger
 * /api/inventory/catalogs/brands/{id}:
 *   put:
 *     summary: Actualizar una marca
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la marca
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Marca actualizada
 *       404:
 *         description: Marca no encontrada
 */
router.put('/catalogs/brands/:id', authenticate, updateBrand)
```

## Tipos de Parámetros

```typescript
// Query Parameter
parameters:
  - in: query
    name: search
    schema:
      type: string

// Path Parameter
parameters:
  - in: path
    name: id
    required: true
    schema:
      type: string

// Header Parameter
parameters:
  - in: header
    name: X-Custom-Header
    schema:
      type: string

// Cookie Parameter
parameters:
  - in: cookie
    name: sessionId
    schema:
      type: string
```

## Respuestas Comunes

```typescript
responses:
  200:
    description: Success
    content:
      application/json:
        schema:
          type: object
          properties:
            statusCode:
              type: number
            message:
              type: string
            data:
              type: object

  201:
    description: Created

  400:
    description: Bad Request

  401:
    description: Unauthorized

  404:
    description: Not Found

  409:
    description: Conflict

  500:
    description: Internal Server Error
```

## Tags Recomendadas

Usa tags consistentes para agrupar endpoints relacionados:

- `Authentication`
- `Users`
- `Inventory - Catalogs - Brands`
- `Inventory - Catalogs - Categories`
- `Inventory - Catalogs - Units`
- `Inventory - Items`
- `Inventory - Stock`
- `Inventory - Movements`
- `Inventory - Warehouses`
- `Sales - Customers`
- `Sales - Orders`
- `Sales - Invoices`
- `Sales - Payments`
- `Sales - Quotes`

## Autenticación

Todos los endpoints protegidos deben incluir:

```typescript
security:
  - BearerAuth: []
```

## Esquemas Reutilizables

Se pueden definir en `swagger.config.ts` bajo `components.schemas`:

```typescript
components: {
  schemas: {
    Error: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
        errors: { type: 'array' }
      }
    }
  }
}
```

Luego usarlos en respuestas:

```typescript
responses:
  400:
    description: Error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

## Regenerar Documentación

La documentación se regenera automáticamente en:

- ✅ Inicio del servidor
- ✅ Deployment en producción
- ✅ Cambios en comentarios JSDoc

## Exportar para Postman/Insomnia

1. Ir a `http://localhost:4000/api/docs/json`
2. Copiar todo el JSON
3. Importar en Postman/Insomnia: `Import > Paste Raw Data`

## Recursos

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1990/swagger-ui-express)
