// backend/src/features/inventory/reports/index.ts

import { Router } from 'express'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import lowStockRoutes from './lowStock/lowStock.routes.js'
import deadStockRoutes from './deadStock/deadStock.routes.js'
import stockValueRoutes from './stockValue/stockValue.routes.js'
import movementsRoutes from './movements/movements.routes.js'
import exitsWithoutInvoiceRoutes from './exitsWithoutInvoice/exitsWithoutInvoice.routes.js'
import exportRoutes from './exports/export.routes.js'
import agingRoutes from './aging/aging.routes.js'
import batchExpiryRoutes from './batchExpiry/batchExpiry.routes.js'
import supplierPerformanceRoutes from './supplierPerformance/supplierPerformance.routes.js'
import kardexRoutes from '../movements/reports/kardex.routes.js'
import rotationRoutes from '../movements/reports/rotation.routes.js'
import valuationRoutes from '../movements/reports/valuation.routes.js'

const router = Router()

/**
 * Rutas de Reportes
 * Base: /api/inventory/reports
 */

// Exports
// /api/inventory/reports/export/:reportType?format=csv|excel|pdf
router.use('/export', exportRoutes)

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

// Envejecimiento de Inventario
// /api/inventory/reports/aging
router.use('/aging', agingRoutes)

// Vencimiento de Lotes
// /api/inventory/reports/batch-expiry
router.use('/batch-expiry', batchExpiryRoutes)

// Rendimiento de Proveedores
// /api/inventory/reports/supplier-performance
router.use('/supplier-performance', supplierPerformanceRoutes)

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
