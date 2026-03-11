// backend/src/features/inventory/items/index.ts
import { Router } from 'express'
import itemRoutes from './items.routes.js'

const router = Router()

/**
 * Rutas de Items
 * Base: /api/inventory/items
 */
router.use(itemRoutes)

export default router
