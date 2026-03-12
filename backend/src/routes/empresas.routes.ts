import { Router } from 'express'
import {
  getAllEmpresas,
  createEmpresa,
  getEmpresaById,
  updateEmpresa,
  deleteEmpresa,
  getEmpresaPredeterminada,
  getAuditLogsForEmpresa,
  seedDefaultsForEmpresa,
} from '../controllers/empresas.controller.js'
import { authorizeGlobal } from '../shared/middleware/authorizeGlobal.middleware.js'

const router = Router()

router.get('/', authorizeGlobal(), getAllEmpresas)
router.post('/', authorizeGlobal(), createEmpresa)
router.get('/predeterminada', getEmpresaPredeterminada)
router.get('/:id', authorizeGlobal(), getEmpresaById)
router.put('/:id', authorizeGlobal(), updateEmpresa)
router.delete('/:id', authorizeGlobal(), deleteEmpresa)
router.get('/:id/audit-logs', authorizeGlobal(), getAuditLogsForEmpresa)
router.post('/:id/seed-defaults', authorizeGlobal(), seedDefaultsForEmpresa)

export default router
