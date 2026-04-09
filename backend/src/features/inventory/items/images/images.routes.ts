// backend/src/features/inventory/items/images/images.routes.ts

/**
 * @swagger
 * tags:
 *   - name: Inventory - Items - Images
 *     description: Gestión de imágenes de artículos del inventario
 *
 * /inventory/items/images:
 *   get:
 *     summary: Listar imágenes de artículos
 *     tags: [Inventory - Items - Images]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID del artículo
 *       - in: query
 *         name: isPrimary
 *         schema:
 *           type: boolean
 *         description: Filtrar por imagen primaria
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por activas/inactivas
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Imágenes obtenidas exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   post:
 *     summary: Crear nueva imagen de artículo
 *     tags: [Inventory - Items - Images]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImageCreateRequest'
 *     responses:
 *       201:
 *         description: Imagen creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageResponse'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Artículo no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/images/{id}:
 *   get:
 *     summary: Obtener imagen por ID
 *     tags: [Inventory - Items - Images]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Imagen obtenida exitosamente
 *       404:
 *         description: Imagen no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   put:
 *     summary: Actualizar imagen
 *     tags: [Inventory - Items - Images]
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
 *             $ref: '#/components/schemas/ImageUpdateRequest'
 *     responses:
 *       200:
 *         description: Imagen actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageResponse'
 *       404:
 *         description: Imagen no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *   delete:
 *     summary: Eliminar imagen
 *     tags: [Inventory - Items - Images]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente
 *       404:
 *         description: Imagen no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/images/item/{itemId}:
 *   get:
 *     summary: Obtener imágenes de un artículo
 *     tags: [Inventory - Items - Images]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Imágenes del artículo obtenidas exitosamente
 *       404:
 *         description: Artículo no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 *
 * /inventory/items/images/{id}/primary:
 *   patch:
 *     summary: Marcar imagen como primaria
 *     tags: [Inventory - Items - Images]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Imagen marcada como primaria exitosamente
 *       404:
 *         description: Imagen no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos
 */

import { Router } from 'express'
import { ImageController } from './images.controller.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../../shared/middleware/validateRequest.middleware.js'
import { authenticate } from '../../../../shared/middleware/authenticate.middleware.js'
import { authorize } from '../../../../shared/middleware/authorize.middleware.js'
import { FileUploadHelper } from '../../../../shared/utils/fileUpload.js'
import {
  createImageSchema,
  updateImageSchema,
  imageIdSchema,
  itemIdSchema,
  getImageFiltersSchema,
} from './images.validation.js'
import { PERMISSIONS } from '../../../../shared/constants/permissions.js'

const router = Router({ mergeParams: true })
const controller = new ImageController()

/**
 * Gestión de imágenes de artículos
 */

// GET /api/inventory/items/images
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateQuery(getImageFiltersSchema),
  controller.getAll
)

// POST /api/inventory/items/images
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  validateBody(createImageSchema),
  controller.create
)

// GET /api/inventory/items/images/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(imageIdSchema),
  controller.getById
)

// PUT /api/inventory/items/images/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(imageIdSchema),
  validateBody(updateImageSchema),
  controller.update
)

// DELETE /api/inventory/items/images/:id
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ITEMS_DELETE),
  validateParams(imageIdSchema),
  controller.delete
)

// GET /api/inventory/items/images/item/:itemId
router.get(
  '/item/:itemId',
  authenticate,
  authorize(PERMISSIONS.ITEMS_VIEW),
  validateParams(itemIdSchema),
  controller.getByItem
)

// PATCH /api/inventory/items/images/:id/primary
router.patch(
  '/:id/primary',
  authenticate,
  authorize(PERMISSIONS.ITEMS_UPDATE),
  validateParams(imageIdSchema),
  controller.setPrimary
)

// POST /api/inventory/items/images/upload (file upload)
router.post(
  '/upload',
  authenticate,
  authorize(PERMISSIONS.ITEMS_CREATE),
  FileUploadHelper.createMemoryArrayUploader('images', 10),
  controller.upload
)

export default router
