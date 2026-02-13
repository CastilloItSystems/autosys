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
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - type
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *                 pattern: '^[A-Z0-9-]+$'
 *                 example: "NK"
 *                 description: Código de la marca (mayúsculas, números y guiones)
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Nike"
 *                 description: Nombre de la marca
 *               type:
 *                 type: string
 *                 enum: [VEHICLE, PART, BOTH]
 *                 example: "BOTH"
 *                 description: Tipo de marca - VEHICLE (vehículos), PART (repuestos) o BOTH (ambos)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Marca de ropa deportiva"
 *                 description: Descripción de la marca (opcional)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Estado activo de la marca
 *     responses:
 *       201:
 *         description: Marca creada exitosamente
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
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *                 pattern: '^[A-Z0-9-]+$'
 *                 example: "NK"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Nike"
 *               type:
 *                 type: string
 *                 enum: [VEHICLE, PART, BOTH]
 *                 example: "BOTH"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Marca actualizada exitosamente
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
router.get('/active', authenticate, brandController.getActiveBrands)

// GET /api/inventory/catalogs/brands/search
router.get('/search', authenticate, brandController.searchBrands)

// GET /api/inventory/catalogs/brands/grouped
router.get(
  '/grouped',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  brandController.getBrandsGrouped
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
  brandController.getBrands
)

// GET /api/inventory/catalogs/brands/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(brandIdSchema),
  brandController.getBrandById
)

// GET /api/inventory/catalogs/brands/:id/stats
router.get(
  '/:id/stats',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  validateParams(brandIdSchema),
  brandController.getBrandStats
)

// POST /api/inventory/catalogs/brands
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createBrandSchema),
  brandController.createBrand
)

// PUT /api/inventory/catalogs/brands/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(brandIdSchema),
  validateBody(updateBrandSchema),
  brandController.updateBrand
)

// PATCH /api/inventory/catalogs/brands/:id/reactivate
router.patch(
  '/:id/reactivate',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateParams(brandIdSchema),
  brandController.reactivateBrand
)

// DELETE /api/inventory/catalogs/brands/:id (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(brandIdSchema),
  brandController.deleteBrand
)

// DELETE /api/inventory/catalogs/brands/:id/hard (hard delete)
router.delete(
  '/:id/hard',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  validateParams(brandIdSchema),
  brandController.deleteBrandPermanently
)

export default router
