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
  uploadLogo,
} from '../controllers/empresas.controller.js'
import { authorizeGlobal } from '../shared/middleware/authorizeGlobal.middleware.js'
import { FileUploadHelper } from '../shared/utils/fileUpload.js'

const router = Router()

router.get('/', authorizeGlobal(), getAllEmpresas)
router.post('/', authorizeGlobal(), createEmpresa)
router.post(
  '/:id/logo',
  authorizeGlobal(),
  FileUploadHelper.createMemoryUploader('image'),
  uploadLogo
)
router.get('/predeterminada', getEmpresaPredeterminada)
router.get('/:id', authorizeGlobal(), getEmpresaById)
router.put('/:id', authorizeGlobal(), updateEmpresa)
router.delete('/:id', authorizeGlobal(), deleteEmpresa)
router.get('/:id/audit-logs', authorizeGlobal(), getAuditLogsForEmpresa)
router.post('/:id/seed-defaults', authorizeGlobal(), seedDefaultsForEmpresa)

export default router
