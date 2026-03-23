// backend/src/features/sales/reports/index.ts

import { Router } from 'express'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import byPeriodRoutes from './byPeriod/byPeriod.routes.js'
import byCustomerRoutes from './byCustomer/byCustomer.routes.js'
import byProductRoutes from './byProduct/byProduct.routes.js'
import orderPipelineRoutes from './orderPipeline/orderPipeline.routes.js'
import paymentMethodsRoutes from './paymentMethods/paymentMethods.routes.js'
import pendingInvoicesRoutes from './pendingInvoices/pendingInvoices.routes.js'
import exportRoutes from './exports/export.routes.js'

const router = Router()

/**
 * Rutas de Reportes de Ventas
 * Base: /api/sales/reports
 */

// GET /api/sales/reports/dashboard
router.use('/dashboard', dashboardRoutes)

// GET /api/sales/reports/by-period
router.use('/by-period', byPeriodRoutes)

// GET /api/sales/reports/by-customer
router.use('/by-customer', byCustomerRoutes)

// GET /api/sales/reports/by-product
router.use('/by-product', byProductRoutes)

// GET /api/sales/reports/order-pipeline
router.use('/order-pipeline', orderPipelineRoutes)

// GET /api/sales/reports/payment-methods
router.use('/payment-methods', paymentMethodsRoutes)

// GET /api/sales/reports/pending-invoices
router.use('/pending-invoices', pendingInvoicesRoutes)

// GET /api/sales/reports/export/:reportType?format=csv|excel|pdf
router.use('/export', exportRoutes)

export default router
