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
import { authorize } from '../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const router = Router()

router.get('/', authorize(PERMISSIONS.EMPRESA_VIEW), getAllEmpresas)
router.post('/', authorize(PERMISSIONS.EMPRESA_CREATE), createEmpresa)
router.get('/predeterminada', getEmpresaPredeterminada)
router.get('/:id', authorize(PERMISSIONS.EMPRESA_VIEW), getEmpresaById)
router.put('/:id', authorize(PERMISSIONS.EMPRESA_UPDATE), updateEmpresa)
router.delete('/:id', authorize(PERMISSIONS.EMPRESA_DELETE), deleteEmpresa)
router.get(
  '/:id/audit-logs',
  authorize(PERMISSIONS.EMPRESA_VIEW),
  getAuditLogsForEmpresa
)

export default router
