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

router.get('/', authorize(PERMISSIONS.EMPRESAS_READ), getAllEmpresas)
router.post('/', authorize(PERMISSIONS.EMPRESAS_CREATE), createEmpresa)
router.get('/predeterminada', getEmpresaPredeterminada)
router.get('/:id', authorize(PERMISSIONS.EMPRESAS_READ), getEmpresaById)
router.put('/:id', authorize(PERMISSIONS.EMPRESAS_UPDATE), updateEmpresa)
router.delete('/:id', authorize(PERMISSIONS.EMPRESAS_DELETE), deleteEmpresa)
router.get(
  '/:id/audit-logs',
  authorize(PERMISSIONS.EMPRESAS_READ),
  getAuditLogsForEmpresa
)

export default router
