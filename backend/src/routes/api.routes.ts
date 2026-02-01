import { Router } from 'express'
import userRoutes from './users.routes.js'

const router = Router()

router.use('/users', userRoutes)
// Aquí puedes añadir más rutas, ej: router.use('/products', productRoutes);

export default router
