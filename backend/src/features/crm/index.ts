// backend/src/features/crm/index.ts

import { Router } from 'express'
import dashboardRoutes from './dashboard/crm.dashboard.routes.js'
import customerRoutes from './customers/customers.routes.js'
import customerVehicleRoutes from './customerVehicles/customerVehicles.routes.js'
import leadRoutes from './leads/leads.routes.js'
import interactionRoutes from './interactions/interactions.routes.js'
import activityRoutes from './activities/activities.routes.js'
import quoteRoutes from './quotes/quotes.routes.js'
import caseRoutes from './cases/cases.routes.js'
import opportunityRoutes from './opportunities/opportunities.routes.js'
import campaignRoutes from './campaigns/campaigns.routes.js'
import loyaltyRoutes from './loyalty/loyalty.routes.js'
import automationRoutes from './automations/index.js'

const router = Router()

/**
 * Rutas del módulo CRM
 * Base: /api/crm
 */

// Dashboard CRM
router.use('/dashboard', dashboardRoutes)

// Clientes (hub central del CRM)
router.use('/customers', customerRoutes)

// Vehículos del cliente (nested bajo /customers/:customerId/vehicles)
router.use('/customers/:customerId/vehicles', customerVehicleRoutes)

// Pipeline de oportunidades
router.use('/leads', leadRoutes)

// Historial de comunicaciones
router.use('/interactions', interactionRoutes)

// Tareas de seguimiento
router.use('/activities', activityRoutes)

// Cotizaciones
router.use('/quotes', quoteRoutes)

// Casos / Reclamos / PQRS
router.use('/cases', caseRoutes)

// Oportunidades
router.use('/opportunities', opportunityRoutes)

// Campañas
router.use('/campaigns', campaignRoutes)

// Fidelización / postventa
router.use('/loyalty', loyaltyRoutes)

// Automatizaciones y alertas CRM
router.use('/automations', automationRoutes)

export default router
