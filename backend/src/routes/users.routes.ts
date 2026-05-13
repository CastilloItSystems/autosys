import { Router, Request, Response, NextFunction } from 'express'
import {
  getAllUsers,
  getCompanyUsers,
  createUser,
  createCompanyUser,
  getUserById,
  updateUser,
  updateCompanyUser,
  deleteUser,
  deleteCompanyUser,
  uploadProfilePicture,
  saveFcmToken,
} from '../controllers/users.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import {
  authorize,
  authorizeInAnyEmpresa,
} from '../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'
import { extractEmpresa } from '../shared/middleware/empresa.middleware.js'
import { FileUploadHelper } from '../shared/utils/fileUpload.js'

const router = Router()

router.use(authenticate)

// Permite acceso al propio perfil o verifica permiso de plataforma en alguna empresa activa.
const checkSelfOrAuthorize = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.userId === req.params.id) {
      return next()
    }

    authorizeInAnyEmpresa(permission)(req, res, next)
  }
}

router.post('/fcm-token', saveFcmToken)

// Usuarios de la empresa activa. Deben ir antes de /:id.
router.get(
  '/company',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_VIEW),
  getCompanyUsers
)
router.post(
  '/company',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_CREATE),
  createCompanyUser
)
router.put(
  '/company/:id',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_UPDATE),
  updateCompanyUser
)
router.delete(
  '/company/:id',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_DELETE),
  deleteCompanyUser
)

// Administración global SaaS.
router.get('/', authorizeInAnyEmpresa(PERMISSIONS.PLATFORM_USERS_VIEW), getAllUsers)
router.post(
  '/',
  authorizeInAnyEmpresa(PERMISSIONS.PLATFORM_USERS_CREATE),
  createUser
)

// router.get(
//   '/:id/audit-logs',
//   extractEmpresa,
//   authorize(PERMISSIONS.USERS_VIEW),
//   getAuditLogsForUser
// )

router.get('/:id', checkSelfOrAuthorize(PERMISSIONS.PLATFORM_USERS_VIEW), getUserById)
router.put('/:id', checkSelfOrAuthorize(PERMISSIONS.PLATFORM_USERS_UPDATE), updateUser)
router.post(
  '/:id/profile-picture',
  checkSelfOrAuthorize(PERMISSIONS.PLATFORM_USERS_UPDATE),
  FileUploadHelper.createMemoryUploader('image'),
  uploadProfilePicture
)
router.delete(
  '/:id',
  authorizeInAnyEmpresa(PERMISSIONS.PLATFORM_USERS_DELETE),
  deleteUser
)

export default router
