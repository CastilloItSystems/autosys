import { Router } from 'express'
import {
  getAllEmpresas,
  createEmpresa,
  getEmpresaById,
  updateEmpresa,
  deleteEmpresa,
  getEmpresaPredeterminada,
} from '../controllers/empresas.controller.js'
import {
  authenticateToken,
  requireRole,
} from '../middleware/auth.middleware.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas que requieren rol admin o superior
router.get('/', requireRole(['admin', 'superAdmin']), getAllEmpresas)
router.post('/', requireRole(['admin', 'superAdmin']), createEmpresa)
router.put('/:id', requireRole(['admin', 'superAdmin']), updateEmpresa)
router.delete('/:id', requireRole(['admin', 'superAdmin']), deleteEmpresa)

// Rutas accesibles para usuarios autenticados
router.get('/predeterminada', getEmpresaPredeterminada)
router.get('/:id', getEmpresaById)

export default router
