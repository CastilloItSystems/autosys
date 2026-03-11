import { Router } from 'express'
import userRoutes from './users.routes.js'
import authRoutes from './auth.routes.js'
import empresaRoutes from './empresas.routes.js'
import companyRoleRoutes from './companyRoles.routes.js'
import { saveToken } from '../controllers/users.controller.js'

// Módulos
import inventoryRoutes from '../features/inventory/index.js'
import salesRoutes from '../features/sales/index.js'

// Middlewares
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { extractEmpresa } from '../shared/middleware/empresa.middleware.js'

const router = Router()

// Públicas
router.use('/auth', authRoutes)

// Privadas (ajusta según tu negocio)
router.use('/users', authenticate, userRoutes)

// Roles dinámicos: antes de /empresas general
router.use('/empresas/:id/roles', authenticate, companyRoleRoutes)
router.use('/empresas', authenticate, empresaRoutes)

// Token de notificaciones (usuario autenticado)
router.post('/save-token', authenticate, extractEmpresa, saveToken)

// Módulo Inventario
router.use('/inventory', authenticate, extractEmpresa, inventoryRoutes)

// Módulo Ventas
router.use('/sales', authenticate, extractEmpresa, salesRoutes)

export default router
