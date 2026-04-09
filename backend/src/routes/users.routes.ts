import { Router, Request, Response, NextFunction } from 'express'
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  uploadProfilePicture,
} from '../controllers/users.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { authorize } from '../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'
import { extractEmpresa } from '../shared/middleware/empresa.middleware.js'
import { FileUploadHelper } from '../shared/utils/fileUpload.js'

const router = Router()

router.use(authenticate)

// Función auxiliar para permitir acceso al propio perfil o verificar permiso en la empresa activa
const checkSelfOrAuthorize = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.userId === req.params.id) {
      return next() // Es su propio perfil, dejamos pasar
    }
    // Si es otro perfil, verificamos que tenga el permiso en la empresa activa
    extractEmpresa(req, res, (err?: any) => {
      if (err) return next(err)
      authorize(permission)(req, res, next)
    })
  }
}

router.get('/', getAllUsers)
router.post(
  '/',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_CREATE),
  createUser
)

// router.get(
//   '/:id/audit-logs',
//   extractEmpresa,
//   authorize(PERMISSIONS.USERS_VIEW),
//   getAuditLogsForUser
// )

router.get('/:id', checkSelfOrAuthorize(PERMISSIONS.USERS_VIEW), getUserById)
router.put('/:id', checkSelfOrAuthorize(PERMISSIONS.USERS_UPDATE), updateUser)
router.post(
  '/:id/profile-picture',
  checkSelfOrAuthorize(PERMISSIONS.USERS_UPDATE),
  FileUploadHelper.createMemoryUploader('image'),
  uploadProfilePicture
)
router.delete(
  '/:id',
  extractEmpresa,
  authorize(PERMISSIONS.USERS_DELETE),
  deleteUser
)

export default router
