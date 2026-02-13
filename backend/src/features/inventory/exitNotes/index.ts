// backend/src/features/inventory/exitNotes/index.ts

import { Router } from 'express'
import exitNoteRoutes from './exitNotes.routes'
import preparationRoutes from './preparation/preparation.routes'
import deliveryRoutes from './delivery/delivery.routes'
import specialRoutes from './special/index'

const router = Router()

/**
 * Rutas de Notas de Salida
 * Base: /api/inventory/exit-notes
 */

// CRUD de notas de salida (ya manejado en exitNotes.routes)
// Las rutas base están en el index principal

// Preparación de mercancía
// /api/inventory/exit-notes/:id/preparation/*
router.use('/:id/preparation', preparationRoutes)

// Entrega
// /api/inventory/exit-notes/:id/delivery/*
router.use('/:id/delivery', deliveryRoutes)

// Salidas especiales (warranty, loan, etc)
// /api/inventory/exit-notes/special/*
router.use('/special', specialRoutes)

export default router
