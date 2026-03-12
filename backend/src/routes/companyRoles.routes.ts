// backend/src/routes/companyRoles.routes.ts
import { Router } from 'express'
import {
  getCompanyRoles,
  createCompanyRole,
  updateCompanyRole,
  deleteCompanyRole,
} from '../controllers/companyRoles.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { authorizeGlobal } from '../shared/middleware/authorizeGlobal.middleware.js'

const router = Router({ mergeParams: true })

router.use(authenticate)

// CRUD de roles dinámicos por empresa
router.get('/', authorizeGlobal(), getCompanyRoles)
router.post('/', authorizeGlobal(), createCompanyRole)
router.put('/:roleId', authorizeGlobal(), updateCompanyRole)
router.delete('/:roleId', authorizeGlobal(), deleteCompanyRole)

export default router
