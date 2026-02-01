import { Router } from 'express'
import userRoutes from './users.routes.js'
import authRoutes from './auth.routes.js'

const router = Router()

router.use('/users', userRoutes)
router.use('/auth', authRoutes)
// Aquí puedes añadir más rutas, ej: router.use('/products', productRoutes);

export default router
