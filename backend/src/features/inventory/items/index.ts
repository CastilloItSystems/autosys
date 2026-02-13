// backend/src/features/inventory/items/index.ts

import { Router } from 'express'
import itemRoutes from './items.routes'

const router = Router()

/**
 * Rutas de Items (Artículos)
 * Base: /api/inventory/items
 */

// CRUD de items + sub-módulos (images, pricing, search, bulk)
// /api/inventory/items/*
router.use('/', itemRoutes)

export default router
