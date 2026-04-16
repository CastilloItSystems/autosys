import { Router } from 'express'
import userRoutes from './users.routes.js'
import authRoutes from './auth.routes.js'
import empresaRoutes from './empresas.routes.js'
import companyRoleRoutes from './companyRoles.routes.js'
import membershipRoutes from './memberships.routes.js'
// import { saveToken } from '../controllers/users.controller.js'

// Módulos
import inventoryRoutes from '../features/inventory/index.js'
import salesRoutes from '../features/sales/index.js'
import crmRoutes from '../features/crm/index.js'
import workshopRoutes from '../features/workshop/index.js'
import dealerRoutes from '../features/dealer/index.js'

// Middlewares
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { extractEmpresa } from '../shared/middleware/empresa.middleware.js'

const router = Router()

// Públicas
router.use('/auth', authRoutes)

// Usuarios globales del SaaS
router.use('/users', authenticate, userRoutes)

// Memberships por empresa
router.use('/memberships', authenticate, extractEmpresa, membershipRoutes)

// Roles dinámicos por empresa
router.use('/empresas/:id/roles', authenticate, companyRoleRoutes)

// Empresas (entidad global del SaaS — no requiere extractEmpresa)
router.use('/empresas', authenticate, empresaRoutes)

// Token de notificaciones
// router.post('/save-token', authenticate, saveToken)

// Módulo Inventario
router.use('/inventory', authenticate, extractEmpresa, inventoryRoutes)

// Módulo Ventas
router.use('/sales', authenticate, extractEmpresa, salesRoutes)

// Módulo CRM
router.use('/crm', authenticate, extractEmpresa, crmRoutes)

// Módulo Taller (Workshop)
router.use('/workshop', authenticate, extractEmpresa, workshopRoutes)

// Módulo Concesionario
router.use('/dealer', authenticate, extractEmpresa, dealerRoutes)

export default router
