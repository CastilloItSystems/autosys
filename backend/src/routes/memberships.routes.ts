import { Router } from 'express'
import {
  getMembershipsByEmpresa,
  getMembershipsByUser,
  createMembership,
  createMembershipPlatform,
  updateMembership,
  deleteMembership,
  getMembershipPermissions,
  setMembershipPermissions,
} from '../controllers/memberships.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { extractEmpresa } from '../shared/middleware/empresa.middleware.js'
import {
  authorize,
  authorizeInAnyEmpresa,
} from '../shared/middleware/authorize.middleware.js'
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

// Plataforma: admin global asigna usuario a cualquier empresa (empresaId en el body).
router.post(
  '/platform',
  authorizeInAnyEmpresa(PERMISSIONS.PLATFORM_USERS_UPDATE),
  createMembershipPlatform
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

// memberships de un usuario dentro de la empresa activa
router.get(
  '/user/:id',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_VIEW),
  getMembershipsByUser
)

// Permisos override por membership
router.get(
  '/:id/permissions',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_VIEW),
  getMembershipPermissions
)
router.put(
  '/:id/permissions',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_UPDATE),
  setMembershipPermissions
)

export default router
