// backend/src/features/inventory/warehouses/index.ts

import { Router } from 'express'
import warehouseRoutes from './warehouses.routes'

const router = Router()

/**
 * Rutas de Almacenes
 * Base: /api/inventory/warehouses
 */

// CRUD de almacenes
// /api/inventory/warehouses/*
router.use('/', warehouseRoutes)

export default router
