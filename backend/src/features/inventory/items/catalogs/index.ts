// backend/src/features/inventory/items/catalogs/index.ts

import { Router } from 'express'
import brandRoutes from './brands/brands.routes'
import categoryRoutes from './categories/categories.routes'
import unitRoutes from './units/units.routes'
import modelRoutes from './models/models.routes'
import { modelCompatibilityRoutes } from './model-compatibility/model-compatibility.routes'

const router = Router()

/**
 * Rutas de Catálogos
 * Base: /api/inventory/catalogs
 */

// Marcas
// /api/inventory/catalogs/brands/*
router.use('/brands', brandRoutes)

// Categorías
// /api/inventory/catalogs/categories/*
router.use('/categories', categoryRoutes)

// Unidades de Medida
// /api/inventory/catalogs/units/*
router.use('/units', unitRoutes)

// Modelos de Vehículos
// /api/inventory/catalogs/models/*
router.use('/models', modelRoutes)

// Compatibilidad de Modelos
// /api/inventory/catalogs/model-compatibility/*
router.use('/model-compatibility', modelCompatibilityRoutes)

export default router
