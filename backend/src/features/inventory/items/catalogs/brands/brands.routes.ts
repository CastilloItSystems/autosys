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

import { Router } from 'express'
import { BrandController } from './brands.controller'
import { authenticate } from '../../../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../../../shared/middleware/authorize.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../../shared/middleware/validateRequest.middleware'
import {
  createBrandSchema,
  updateBrandSchema,
  brandIdSchema,
  getBrandsQuerySchema,
} from './brands.validation'
import { PERMISSIONS } from '../../../../../shared/constants/permissions'

const router = Router()
const brandController = new BrandController()

/**
 * Rutas públicas (o con autenticación básica)
 */

// GET /api/inventory/catalogs/brands/active
router.get('/active', authenticate, brandController.getActive)

// GET /api/inventory/catalogs/brands/search
router.get('/search', authenticate, brandController.search)

// GET /api/inventory/catalogs/brands/grouped
router.get(
  '/grouped',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  brandController.getGrouped
)

/**
 * Rutas protegidas - Requieren autenticación y permisos
 */

// GET /api/inventory/catalogs/brands
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateQuery(getBrandsQuerySchema),
  brandController.getAll
)

// GET /api/inventory/catalogs/brands/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(brandIdSchema),
  brandController.getById
)

// GET /api/inventory/catalogs/brands/:id/stats
router.get(
  '/:id/stats',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(brandIdSchema),
  brandController.getStats
)

// POST /api/inventory/catalogs/brands
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createBrandSchema),
  brandController.create
)

// PUT /api/inventory/catalogs/brands/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(brandIdSchema),
  validateBody(updateBrandSchema),
  brandController.update
)

// PATCH /api/inventory/catalogs/brands/:id/toggle
router.patch(
  '/:id/toggle',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(brandIdSchema),
  brandController.toggleActive
)

// PATCH /api/inventory/catalogs/brands/:id/reactivate
router.patch(
  '/:id/reactivate',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(brandIdSchema),
  brandController.reactivate
)

// DELETE /api/inventory/catalogs/brands/:id/hard (DEBE IR ANTES DE /:id DELETE)
router.delete(
  '/:id/hard',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(brandIdSchema),
  brandController.hardDelete
)

// DELETE /api/inventory/catalogs/brands/:id (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(brandIdSchema),
  brandController.delete
)

export default router
