// backend/src/routes/companyRoles.routes.ts
import { Router } from 'express'
import {
  getCompanyRoles,
  createCompanyRole,
  updateCompanyRole,
  deleteCompanyRole,
} from '../controllers/companyRoles.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { authorize } from '../shared/middleware/authorize.middleware.js'
import { extractEmpresaFromParam } from '../shared/middleware/empresa.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const router = Router({ mergeParams: true })

router.use(authenticate)
router.use(extractEmpresaFromParam)

// CRUD de roles dinámicos por empresa
router.get('/', authorize(PERMISSIONS.COMPANY_ROLES_VIEW), getCompanyRoles)
router.post('/', authorize(PERMISSIONS.COMPANY_ROLES_CREATE), createCompanyRole)
router.put('/:roleId', authorize(PERMISSIONS.COMPANY_ROLES_UPDATE), updateCompanyRole)
router.delete(
  '/:roleId',
  authorize(PERMISSIONS.COMPANY_ROLES_DELETE),
  deleteCompanyRole
)

export default router
