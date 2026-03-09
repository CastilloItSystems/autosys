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
import {
  authenticateToken,
  requireRole,
} from '../middleware/auth.middleware.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas que requieren rol admin o superior
router.get('/', requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']), getAllUsers)
router.post('/', requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']), createUser)
router.put('/:id', requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']), updateUser)
router.delete('/:id', requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']), deleteUser)

// Obtener usuario por ID (cualquier usuario autenticado puede ver su propio perfil)
router.get('/:id', getUserById)

// Obtener logs de auditoría de un usuario
router.get(
  '/:id/audit-logs',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  getAuditLogsForUser
)

// ── Permisos individuales por usuario ──────────────────────────────────────
// GET  /users/:id/permissions  → Ver overrides + efectivos del usuario
// PUT  /users/:id/permissions  → Reemplazar overrides del usuario
router.get(
  '/:id/permissions',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  getUserPermissions
)
router.put(
  '/:id/permissions',
  requireRole(['admin', 'superAdmin', 'ADMIN', 'SUPER_ADMIN']),
  setUserPermissions
)

export default router
