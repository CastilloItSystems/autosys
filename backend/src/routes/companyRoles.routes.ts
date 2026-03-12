// backend/src/routes/companyRoles.routes.ts
import { Router } from 'express'
import {
  getCompanyRoles,
  createCompanyRole,
  updateCompanyRole,
  deleteCompanyRole,
  assignUserRole,
  removeUserRole,
} from '../controllers/companyRoles.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { authorize } from '../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const router = Router({ mergeParams: true })

// Si ya autenticas en api.routes para /empresas/:id/roles, esto es opcional.
// Déjalo si quieres que el router sea autónomo.
router.use(authenticate)

// CRUD de roles dinámicos por empresa
router.get('/', authorize(PERMISSIONS.EMPRESAS_READ), getCompanyRoles)
router.post('/', authorize(PERMISSIONS.EMPRESAS_CREATE), createCompanyRole)
router.put(
  '/:roleId',
  authorize(PERMISSIONS.EMPRESAS_UPDATE),
  updateCompanyRole
)
router.delete(
  '/:roleId',
  authorize(PERMISSIONS.EMPRESAS_DELETE),
  deleteCompanyRole
)

// Asignación de roles a usuarios dentro de la empresa
router.put(
  '/users/:userId/role',
  authorize(PERMISSIONS.EMPRESAS_UPDATE),
  assignUserRole
)

router.delete(
  '/users/:userId/role',
  authorize(PERMISSIONS.EMPRESAS_UPDATE),
  removeUserRole
)

export default router
