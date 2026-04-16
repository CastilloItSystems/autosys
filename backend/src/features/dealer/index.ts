import { Router } from 'express'
import unitsRoutes from './units/units.routes.js'
import reservationsRoutes from './reservations/reservations.routes.js'
import quotesRoutes from './quotes/quotes.routes.js'
import testDrivesRoutes from './test-drives/testDrives.routes.js'
import tradeInsRoutes from './trade-ins/tradeIns.routes.js'
import financingRoutes from './financing/financing.routes.js'
import deliveriesRoutes from './deliveries/deliveries.routes.js'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import historyRoutes from './history/history.routes.js'
import integrationsRoutes from './integrations/integrations.routes.js'
import reportsRoutes from './reports/reports.routes.js'
import automationsRoutes from './automations/automations.routes.js'
import documentsRoutes from './documents/documents.routes.js'
import approvalsRoutes from './approvals/approvals.routes.js'
import afterSalesRoutes from './after-sales/afterSales.routes.js'

const router = Router()

/**
 * Rutas del módulo Concesionario
 * Base: /api/dealer
 */
router.use('/units', unitsRoutes)
router.use('/reservations', reservationsRoutes)
router.use('/quotes', quotesRoutes)
router.use('/test-drives', testDrivesRoutes)
router.use('/trade-ins', tradeInsRoutes)
router.use('/financing', financingRoutes)
router.use('/deliveries', deliveriesRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/history', historyRoutes)
router.use('/integrations', integrationsRoutes)
router.use('/reports', reportsRoutes)
router.use('/automations', automationsRoutes)
router.use('/documents', documentsRoutes)
router.use('/approvals', approvalsRoutes)
router.use('/after-sales', afterSalesRoutes)

export default router
