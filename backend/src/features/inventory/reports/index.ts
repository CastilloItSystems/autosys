// backend/src/features/inventory/reports/index.ts

import { Router } from 'express'
import dashboardRoutes from './dashboard/dashboard.routes'
import lowStockRoutes from './lowStock/lowStock.routes'
import deadStockRoutes from './deadStock/deadStock.routes'
import stockValueRoutes from './stockValue/stockValue.routes'
import movementsRoutes from './movements/movements.routes'
import exitsWithoutInvoiceRoutes from './exitsWithoutInvoice/exitsWithoutInvoice.routes'
import kardexRoutes from '../movements/reports/kardex.routes'
import rotationRoutes from '../movements/reports/rotation.routes'
import valuationRoutes from '../movements/reports/valuation.routes'

const router = Router()

/**
 * Rutas de Reportes
 * Base: /api/inventory/reports
 */

// Dashboard
// /api/inventory/reports/dashboard
router.use('/dashboard', dashboardRoutes)

// Stock Bajo
// /api/inventory/reports/low-stock
router.use('/low-stock', lowStockRoutes)

// Stock Sin Movimiento
// /api/inventory/reports/dead-stock
router.use('/dead-stock', deadStockRoutes)

// Valorización de Stock
// /api/inventory/reports/stock-value
router.use('/stock-value', stockValueRoutes)

// Reporte de Movimientos
// /api/inventory/reports/movements
router.use('/movements', movementsRoutes)

// Salidas sin Factura
// /api/inventory/reports/exits-without-invoice
router.use('/exits-without-invoice', exitsWithoutInvoiceRoutes)

// Kardex
// /api/inventory/reports/kardex
router.use('/kardex', kardexRoutes)

// Rotación de Inventario
// /api/inventory/reports/rotation
router.use('/rotation', rotationRoutes)

// Valorización (FIFO, LIFO, Promedio)
// /api/inventory/reports/valuation
router.use('/valuation', valuationRoutes)

export default router
