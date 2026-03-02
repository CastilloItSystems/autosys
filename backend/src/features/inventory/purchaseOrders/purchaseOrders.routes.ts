// backend/src/features/inventory/purchaseOrders/purchaseOrders.routes.ts

import { Router } from 'express'
import { PurchaseOrderController } from './purchaseOrders.controller'
import { authenticate } from '../../../shared/middleware/authenticate.middleware'
import { authorize } from '../../../shared/middleware/authorize.middleware'
import { validateBody } from '../../../shared/middleware/validateRequest.middleware'
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  approvePurchaseOrderSchema,
  addPurchaseOrderItemSchema,
  receiveOrderSchema,
} from './purchaseOrders.validation'
import { PERMISSIONS } from '../../../shared/constants/permissions'

const router = Router()
const controller = new PurchaseOrderController()

/**
 * @swagger
 * /api/inventory/purchase-orders:
 *   get:
 *     tags:
 *       - Purchase Orders
 *     summary: Obtener todas las órdenes de compra
 *     description: Obtiene un listado paginado de órdenes de compra con filtros opcionales
 *     parameters:
 *       - name: page
 *         in: query
 *         type: integer
 *         default: 1
 *       - name: limit
 *         in: query
 *         type: integer
 *         default: 20
 *       - name: status
 *         in: query
 *         type: string
 *         enum: [DRAFT, SENT, PARTIAL, COMPLETED, CANCELLED]
 *       - name: supplierId
 *         in: query
 *         type: string
 *         format: uuid
 *       - name: warehouseId
 *         in: query
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Listado de órdenes de compra
 *       401:
 *         description: No autorizado
 */
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getAll
)

/**
 * @swagger
 * /api/inventory/purchase-orders:
 *   post:
 *     tags:
 *       - Purchase Orders
 *     summary: Crear nueva orden de compra
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - supplierId
 *             - warehouseId
 *           properties:
 *             supplierId:
 *               type: string
 *               format: uuid
 *             warehouseId:
 *               type: string
 *               format: uuid
 *     responses:
 *       201:
 *         description: Orden creatada
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(createPurchaseOrderSchema),
  controller.create
)

/**
 * @swagger
 * /api/inventory/purchase-orders/{id}:
 *   get:
 *     tags:
 *       - Purchase Orders
 *     summary: Obtener orden de compra
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       404:
 *         description: Orden no encontrada
 */
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getOne
)

/**
 * @swagger
 * /api/inventory/purchase-orders/{id}:
 *   put:
 *     tags:
 *       - Purchase Orders
 *     summary: Actualizar orden de compra
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [DRAFT, SENT, PARTIAL, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Orden actualizada
 */
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(updatePurchaseOrderSchema),
  controller.update
)

/**
 * @swagger
 * /api/inventory/purchase-orders/{id}/approve:
 *   patch:
 *     tags:
 *       - Purchase Orders
 *     summary: Aprobar orden de compra
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Orden aprobada
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateBody(approvePurchaseOrderSchema),
  controller.approve
)

/**
 * @swagger
 * /api/inventory/purchase-orders/{id}/cancel:
 *   patch:
 *     tags:
 *       - Purchase Orders
 *     summary: Cancelar orden de compra
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Orden cancelada
 */
router.patch(
  '/:id/cancel',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  controller.cancel
)

/**
 * @swagger
 * /api/inventory/purchase-orders/{id}/receive:
 *   post:
 *     tags:
 *       - Purchase Orders
 *     summary: Recepcionar mercancía de una orden de compra
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - items
 *           properties:
 *             warehouseId:
 *               type: string
 *               format: uuid
 *             notes:
 *               type: string
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - itemId
 *                   - quantityReceived
 *                   - unitCost
 *     responses:
 *       201:
 *         description: Recepción registrada
 */
router.post(
  '/:id/receive',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(receiveOrderSchema),
  controller.receive
)

/**
 * @swagger
 * /api/inventory/purchase-orders/{id}/items:
 *   post:
 *     tags:
 *       - Purchase Orders
 *     summary: Agregar item a orden
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - itemId
 *             - quantityOrdered
 *             - unitCost
 *     responses:
 *       201:
 *         description: Item agregado
 */
router.post(
  '/:id/items',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateBody(addPurchaseOrderItemSchema),
  controller.addItem
)

/**
 * @swagger
 * /api/inventory/purchase-orders/{id}/items:
 *   get:
 *     tags:
 *       - Purchase Orders
 *     summary: Obtener items de orden
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Items obtenidos
 */
router.get(
  '/:id/items',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getItems
)

/**
 * @swagger
 * /api/inventory/purchase-orders/{id}:
 *   delete:
 *     tags:
 *       - Purchase Orders
 *     summary: Eliminar orden de compra
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Orden eliminada
 */
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_DELETE),
  controller.delete
)

export default router
