// backend/src/routes/companyRoles.routes.ts
// Rutas para gestión de roles dinámicos por empresa
// Montado en: /api/empresas/:id/roles

import { Router } from 'express'
import {
  getCompanyRoles,
  createCompanyRole,
  updateCompanyRole,
  deleteCompanyRole,
  assignUserRole,
  removeUserRole,
} from '../controllers/companyRoles.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { authorize } from '../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const router = Router({ mergeParams: true }) // mergeParams para acceder a :id del padre

router.use(authenticateToken)

// CRUD de roles de empresa — requiere permiso de actualizar empresa o ser admin
router.get(
  '/',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  getCompanyRoles
)

router.post(
  '/',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  createCompanyRole
)

router.put(
  '/:roleId',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  updateCompanyRole
)

router.delete(
  '/:roleId',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  deleteCompanyRole
)

// Asignación de roles a usuarios dentro de la empresa
router.put(
  '/users/:userId/role',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  assignUserRole
)

router.delete(
  '/users/:userId/role',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  removeUserRole
)

export default router
