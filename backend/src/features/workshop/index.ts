// backend/src/features/workshop/index.ts
import { Router } from 'express'
import serviceOrderRoutes from './serviceOrders/serviceOrders.routes.js'

const router = Router()

router.use('/service-orders', serviceOrderRoutes)

export default router
