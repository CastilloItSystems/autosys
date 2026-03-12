import { Router } from 'express'
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getAuditLogsForUser,
} from '../controllers/users.controller.js'
import {
  getUserPermissions,
  setUserPermissions,
} from '../controllers/userPermissions.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { authorize } from '../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Usuarios
router.get('/', authorize(PERMISSIONS.USERS_VIEW), getAllUsers)
router.post('/', authorize(PERMISSIONS.USERS_CREATE), createUser)

// Rutas específicas ANTES de /:id genérica
// Auditoría
router.get(
  '/:id/audit-logs',
  authorize(PERMISSIONS.AUDIT_VIEW),
  getAuditLogsForUser
)

// Overrides de permisos por usuario
router.get(
  '/:id/permissions',
  authorize(PERMISSIONS.USER_PERMISSIONS_VIEW),
  getUserPermissions
)

router.put(
  '/:id/permissions',
  authorize(PERMISSIONS.USER_PERMISSIONS_UPDATE),
  setUserPermissions
)

// Ruta genérica /:id DESPUÉS de rutas específicas
router.get('/:id', authorize(PERMISSIONS.USERS_VIEW), getUserById)
router.put('/:id', authorize(PERMISSIONS.USERS_UPDATE), updateUser)
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), deleteUser)

export default router
