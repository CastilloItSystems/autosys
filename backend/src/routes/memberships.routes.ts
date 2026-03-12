import { Router } from 'express'
import {
  getMembershipsByEmpresa,
  getMembershipsByUser,
  createMembership,
  updateMembership,
  deleteMembership,
  getMembershipPermissions,
  setMembershipPermissions,
} from '../controllers/memberships.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { extractEmpresa } from '../shared/middleware/empresa.middleware.js'
import {
  authorize,
  authorizeRoles,
} from '../shared/middleware/authorize.middleware.js'
import { authorizeGlobal } from '../shared/middleware/authorizeGlobal.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const router = Router()

router.use(authenticate)

// memberships de la empresa actual
router.get(
  '/',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_VIEW),
  getMembershipsByEmpresa
)

router.post(
  '/',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_UPDATE),
  createMembership
)

router.put(
  '/:id',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_UPDATE),
  updateMembership
)

router.delete(
  '/:id',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_DELETE),
  deleteMembership
)

// memberships de un usuario global
router.get('/user/:id', authorizeRoles('OWNER', 'ADMIN'), getMembershipsByUser)

// Permisos override por membership
router.get('/:id/permissions', authorizeGlobal(), getMembershipPermissions)
router.put('/:id/permissions', authorizeGlobal(), setMembershipPermissions)

export default router
