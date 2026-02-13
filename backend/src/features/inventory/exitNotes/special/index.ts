// backend/src/features/inventory/exitNotes/special/index.ts

import { Router } from 'express'
import warrantyRoutes from './warranty.routes'
import loanRoutes from './loan.routes'
import internalRoutes from './internal.routes'
import sampleRoutes from './sample.routes'
import donationRoutes from './donation.routes'
import ownerPickupRoutes from './ownerPickup.routes'

const router = Router()

/**
 * Rutas de Salidas Especiales
 * Base: /api/inventory/exit-notes/special
 */

// Garantía
// /api/inventory/exit-notes/special/warranty/*
router.use('/warranty', warrantyRoutes)

// Préstamo
// /api/inventory/exit-notes/special/loan/*
router.use('/loan', loanRoutes)

// Uso Interno
// /api/inventory/exit-notes/special/internal/*
router.use('/internal', internalRoutes)

// Muestra
// /api/inventory/exit-notes/special/sample/*
router.use('/sample', sampleRoutes)

// Donación
// /api/inventory/exit-notes/special/donation/*
router.use('/donation', donationRoutes)

// Retiro del dueño
// /api/inventory/exit-notes/special/owner-pickup/*
router.use('/owner-pickup', ownerPickupRoutes)

export default router
