// backend/src/features/inventory/items/catalogs/index.ts

import { Router } from 'express'
import brandRoutes from './brands/brands.routes.js'
import categoryRoutes from './categories/categories.routes.js'
import unitRoutes from './units/units.routes.js'
import modelRoutes from './models/models.routes.js'
import modelCompatibilityRoutes from './model-compatibility/model-compatibility.routes.js'

const router = Router()

// Marcas — /api/inventory/catalogs/brands/*
router.use('/brands', brandRoutes)

// Categorías — /api/inventory/catalogs/categories/*
router.use('/categories', categoryRoutes)

// Unidades de Medida — /api/inventory/catalogs/units/*
router.use('/units', unitRoutes)

// Modelos de Vehículos — /api/inventory/catalogs/models/*
router.use('/models', modelRoutes)

// Compatibilidad de Modelos — /api/inventory/catalogs/model-compatibility/*
router.use('/model-compatibility', modelCompatibilityRoutes)

export default router
