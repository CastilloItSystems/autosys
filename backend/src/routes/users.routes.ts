import { Router } from 'express'
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/users.controller.js'
import {
  authenticateToken,
  requireRole,
} from '../middleware/auth.middleware.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas que requieren rol admin o superior
router.get('/', requireRole(['admin', 'superAdmin']), getAllUsers)
router.post('/', requireRole(['admin', 'superAdmin']), createUser)
router.put('/:id', requireRole(['admin', 'superAdmin']), updateUser)
router.delete('/:id', requireRole(['admin', 'superAdmin']), deleteUser)

// Obtener usuario por ID (cualquier usuario autenticado puede ver su propio perfil)
router.get('/:id', getUserById)

export default router
