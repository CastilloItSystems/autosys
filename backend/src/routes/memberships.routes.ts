import { Router } from 'express'
import {
  getMembershipsByEmpresa,
  getMembershipsByUser,
  getMembershipsByUserPlatform,
  createMembership,
  createMembershipPlatform,
  updateMembership,
  updateMembershipPlatform,
  deleteMembership,
  deleteMembershipPlatform,
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

// Router de PLATAFORMA: se monta SIN extractEmpresa (área global, sin empresa
// activa). La autorización se hace con authorizeInAnyEmpresa(PLATFORM_USERS_*).
export const membershipPlatformRouter = Router()
membershipPlatformRouter.use(authenticate)

membershipPlatformRouter.post(
  '/platform',
  authorizeInAnyEmpresa(PERMISSIONS.PLATFORM_USERS_UPDATE),
  createMembershipPlatform
)
membershipPlatformRouter.get(
  '/platform/user/:id',
  authorizeInAnyEmpresa(PERMISSIONS.PLATFORM_USERS_VIEW),
  getMembershipsByUserPlatform
)
membershipPlatformRouter.put(
  '/platform/:id',
  authorizeInAnyEmpresa(PERMISSIONS.PLATFORM_USERS_UPDATE),
  updateMembershipPlatform
)
membershipPlatformRouter.delete(
  '/platform/:id',
  authorizeInAnyEmpresa(PERMISSIONS.PLATFORM_USERS_DELETE),
  deleteMembershipPlatform
)

// Router empresa-scoped: se monta detrás de extractEmpresa (requiere X-Empresa-Id).
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
