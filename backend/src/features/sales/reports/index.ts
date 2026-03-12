// backend/src/features/sales/reports/index.ts

import { Router } from 'express'
// import salesReportRoutes from './sales.routes.js'
// import byPeriodRoutes from './byPeriod.routes.js'
// import byCustomerRoutes from './byCustomer.routes.js'
// import byProductRoutes from './byProduct.routes.js'

const router = Router()

/**
 * Rutas de Reportes de Ventas
 * Base: /api/sales/reports
 */

// Reporte general de ventas
// // /api/sales/reports/sales
// router.use('/sales', salesReportRoutes)

// // Por período
// // /api/sales/reports/by-period
// router.use('/by-period', byPeriodRoutes)

// // Por cliente
// // /api/sales/reports/by-customer
// router.use('/by-customer', byCustomerRoutes)

// // Por producto
// // /api/sales/reports/by-product
// router.use('/by-product', byProductRoutes)

export default router
