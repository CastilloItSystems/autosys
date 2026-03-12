// backend/src/features/inventory/items/catalogs/brands/brands.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Catalogs - Brands
 *     description: Gestión de marcas en el inventario
 *
 * /inventory/catalogs/brands:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de marcas obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
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
 *             $ref: '#/components/schemas/BrandCreateRequest'
 *     responses:
 *       201:
 *         description: Marca creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandResponse'
 *       400:
 *         description: Datos inválidos - Verifique que code, name y type sean válidos
 *       409:
 *         description: El código de marca ya existe
 *
 * /inventory/catalogs/brands/{id}:
 *   get:
 *     summary: Obtener una marca por ID
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marca obtenida exitosamente
 *       404:
 *         description: Marca no encontrada
 *
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
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BrandUpdateRequest'
 *     responses:
 *       200:
 *         description: Marca actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BrandResponse'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Marca no encontrada
 *
 *   delete:
 *     summary: Eliminar marca (soft delete)
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marca eliminada exitosamente
 *       404:
 *         description: Marca no encontrada
 *
 * /inventory/catalogs/brands/active:
 *   get:
 *     summary: Obtener solo marcas activas
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de marcas activas
 *
 * /inventory/catalogs/brands/search:
 *   get:
 *     summary: Buscar marcas
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *
 * /inventory/catalogs/brands/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas de una marca
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas de la marca
 *
 * /inventory/catalogs/brands/{id}/toggle:
 *   patch:
 *     summary: Activar/Desactivar marca
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de marca actualizado
 *
 * /inventory/catalogs/brands/{id}/hard:
 *   delete:
 *     summary: Eliminar marca permanentemente (hard delete)
 *     tags: [Inventory - Catalogs - Brands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marca eliminada permanentemente
 *       404:
 *         description: Marca no encontrada
 */
// backend/src/features/inventory/items/catalogs/brands/brands.routes.ts

import { Router } from 'express'
import controller from './brands.controller.js'
import { authorize } from '../../../../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../../../../shared/middleware/validateRequest.middleware.js'
import {
  createBrandSchema,
  updateBrandSchema,
  brandIdSchema,
  getBrandsQuerySchema,
} from './brands.validation.js'
import { PERMISSIONS } from '../../../../../shared/constants/permissions.js'

const router = Router()

// ---------------------------------------------------------------------------
// Rutas específicas ANTES de /:id
// ---------------------------------------------------------------------------
router.get(
  '/active',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getActive
)
router.get('/search', authorize(PERMISSIONS.INVENTORY_VIEW), controller.search)
router.get(
  '/grouped',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getGrouped
)

// ---------------------------------------------------------------------------
// CRUD base
// ---------------------------------------------------------------------------
router.get(
  '/',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(getBrandsQuerySchema, 'query'),
  controller.getAll
)

router.post(
  '/',
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateRequest(createBrandSchema, 'body'),
  controller.create
)

// ---------------------------------------------------------------------------
// Rutas con :id (después de rutas específicas)
// ---------------------------------------------------------------------------
router.get(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(brandIdSchema, 'params'),
  controller.getById
)

router.get(
  '/:id/stats',
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateRequest(brandIdSchema, 'params'),
  controller.getStats
)

router.put(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(brandIdSchema, 'params'),
  validateRequest(updateBrandSchema, 'body'),
  controller.update
)

router.patch(
  '/:id/toggle',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(brandIdSchema, 'params'),
  controller.toggleActive
)

router.patch(
  '/:id/reactivate',
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(brandIdSchema, 'params'),
  controller.reactivate
)

router.delete(
  '/:id/hard',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateRequest(brandIdSchema, 'params'),
  controller.hardDelete
)

router.delete(
  '/:id',
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateRequest(brandIdSchema, 'params'),
  controller.delete
)

export default router
