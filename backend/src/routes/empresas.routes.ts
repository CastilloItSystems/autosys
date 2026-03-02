import { Router } from 'express'
import {
  getAllEmpresas,
  createEmpresa,
  getEmpresaById,
  updateEmpresa,
  deleteEmpresa,
  getEmpresaPredeterminada,
  getAuditLogsForEmpresa,
} from '../controllers/empresas.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware'
import { authorize } from '../shared/middleware/authorize.middleware'
import { PERMISSIONS } from '../shared/constants/permissions'

const router = Router()

// GET /api/empresas
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.EMPRESA_VIEW),
  getAllEmpresas
)

// POST /api/empresas
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.EMPRESA_CREATE),
  createEmpresa
)

// GET /api/empresas/predeterminada
router.get('/predeterminada', authenticate, getEmpresaPredeterminada)

// GET /api/empresas/:id
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.EMPRESA_VIEW),
  getEmpresaById
)

// PUT /api/empresas/:id
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.EMPRESA_UPDATE),
  updateEmpresa
)

// DELETE /api/empresas/:id
router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.EMPRESA_DELETE),
  deleteEmpresa
)

// GET /api/empresas/:id/audit-logs
router.get(
  '/:id/audit-logs',
  authenticate,
  authorize(PERMISSIONS.EMPRESA_VIEW),
  getAuditLogsForEmpresa
)

export default router
