// backend/src/features/workshop/index.ts
import { Router } from 'express'
import serviceOrderRoutes from './serviceOrders/serviceOrders.routes.js'
import serviceTypeRoutes from './serviceTypes/serviceTypes.routes.js'
import workshopBayRoutes from './workshopBays/workshopBays.routes.js'
import workshopOperationRoutes from './workshopOperations/workshopOperations.routes.js'
import appointmentRoutes from './appointments/appointments.routes.js'
import receptionRoutes from './receptions/receptions.routes.js'
import laborTimeRoutes from './laborTimes/laborTimes.routes.js'
import qualityCheckRoutes from './qualityChecks/qualityChecks.routes.js'
import warrantyRoutes from './workshopWarranties/workshopWarranties.routes.js'

const router = Router()

// Catálogos
router.use('/service-types', serviceTypeRoutes)
router.use('/bays', workshopBayRoutes)
router.use('/operations', workshopOperationRoutes)

// Flujo operativo
router.use('/appointments', appointmentRoutes)
router.use('/receptions', receptionRoutes)
router.use('/service-orders', serviceOrderRoutes)

// Control operativo
router.use('/labor-times', laborTimeRoutes)
router.use('/quality-checks', qualityCheckRoutes)
router.use('/warranties', warrantyRoutes)

export default router
