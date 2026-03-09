// backend/src/features/inventory/analytics/index.ts

import { Router } from 'express'
import abcRoutes from './abc/abc.routes'
import forecastingRoutes from './forecasting/forecasting.routes'
import turnoverRoutes from './turnover/turnover.routes'
import discrepancyRoutes from './discrepancies/discrepancies.routes'

const router = Router()

/**
 * Rutas de Analíticas
 * Base: /api/inventory/analytics
 */

// Discrepancias
router.use('/discrepancies', discrepancyRoutes)

// Análisis ABC
// /api/inventory/analytics/abc
router.use('/abc', abcRoutes)

// Pronóstico de Demanda
// /api/inventory/analytics/forecasting
router.use('/forecasting', forecastingRoutes)

// Rotación de Inventario
// /api/inventory/analytics/turnover
router.use('/turnover', turnoverRoutes)

export default router
