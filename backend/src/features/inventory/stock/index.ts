// backend/src/features/inventory/stock/index.ts

import { Router } from 'express'
import stockRoutes from './stock.routes'
import adjustmentRoutes from './adjustments/adjustments.routes'
import transferRoutes from './transfers/transfers.routes'
import countRoutes from './counts/counts.routes'
import alertRoutes from './alerts/alerts.routes'

const router = Router()

/**
 * Rutas de Stock
 * Base: /api/inventory/stock
 */

// CRUD de stock (ya manejado en stock.routes)
// Las rutas base están en el index principal

// Ajustes de inventario
// /api/inventory/stock/adjustments/*
router.use('/adjustments', adjustmentRoutes)

// Transferencias entre almacenes
// /api/inventory/stock/transfers/*
router.use('/transfers', transferRoutes)

// Conteos físicos
// /api/inventory/stock/counts/*
router.use('/counts', countRoutes)

// Alertas de stock
// /api/inventory/stock/alerts/*
router.use('/alerts', alertRoutes)

export default router
