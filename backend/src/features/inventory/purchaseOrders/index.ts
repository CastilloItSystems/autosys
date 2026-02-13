// backend/src/features/inventory/purchaseOrders/index.ts

import { Router } from 'express'
import purchaseOrderRoutes from './purchaseOrders.routes'
import receiveRoutes from './receives/receives.routes'
import supplierRoutes from './suppliers/suppliers.routes'
import returnRoutes from './returns/returns.routes'

const router = Router()

/**
 * Rutas de Órdenes de Compra
 * Base: /api/inventory/purchase-orders
 */

// CRUD de órdenes de compra (ya manejado en purchaseOrders.routes)
// Las rutas base están en el index principal

// Recepciones
// /api/inventory/purchase-orders/:id/receives/*
router.use('/:id/receives', receiveRoutes)

// Proveedores
// /api/inventory/purchase-orders/suppliers/*
router.use('/suppliers', supplierRoutes)

// Devoluciones a proveedor
// /api/inventory/purchase-orders/returns/*
router.use('/returns', returnRoutes)

export default router
