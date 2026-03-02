/**
 * Integrations Routes Index
 */

import { Router } from 'express'
import accountingRoutes from './accounting/accountingIntegration.routes'
import salesRoutes from './sales/salesIntegration.routes'
import workshopRoutes from './workshop/workshopIntegration.routes'

const router = Router()

/**
 * Rutas de Integraciones
 * Base: /api/inventory/integrations
 */

// Contabilidad
// /api/inventory/integrations/accounting/*
router.use('/accounting', accountingRoutes)

// Ventas
// /api/inventory/integrations/sales/*
router.use('/sales', salesRoutes)

// Taller
// /api/inventory/integrations/workshop/*
router.use('/workshop', workshopRoutes)

export default router
