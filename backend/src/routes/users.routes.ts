import { Router } from 'express'
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getAuditLogsForUser,
} from '../controllers/users.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { extractEmpresa } from '../shared/middleware/empresa.middleware.js'
import { authorize } from '../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const router = Router()

// Todas las rutas requieren autenticación + empresa activa
router.use(authenticate)
router.use(extractEmpresa)

// Usuarios
router.get('/', authorize(PERMISSIONS.USERS_VIEW), getAllUsers)
router.post('/', authorize(PERMISSIONS.USERS_CREATE), createUser)

// Auditoría
router.get(
  '/:id/audit-logs',
  authorize(PERMISSIONS.AUDIT_VIEW),
  getAuditLogsForUser
)

// Ruta genérica /:id DESPUÉS de rutas específicas
router.get('/:id', authorize(PERMISSIONS.USERS_VIEW), getUserById)
router.put('/:id', authorize(PERMISSIONS.USERS_UPDATE), updateUser)
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), deleteUser)

export default router
