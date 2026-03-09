import { Router } from 'express'
import userRoutes from './users.routes.js'
import authRoutes from './auth.routes.js'
import empresaRoutes from './empresas.routes.js'
import companyRoleRoutes from './companyRoles.routes.js'
import { saveToken } from '../controllers/users.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

router.use('/users', userRoutes)
router.use('/auth', authRoutes)
// Roles dinámicos: ANTES del mount general de /empresas para que Express los priorice
router.use('/empresas/:id/roles', companyRoleRoutes)
router.use('/empresas', empresaRoutes)

// Ruta para guardar token de notificaciones Firebase
router.post('/save-token', authenticateToken, saveToken)

export default router
