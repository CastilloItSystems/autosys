import { Router } from 'express'
import {
  getAllEmpresas,
  getMyEmpresas,
  createEmpresa,
  getEmpresaById,
  updateEmpresa,
  deleteEmpresa,
  getEmpresaPredeterminada,
  getAuditLogsForEmpresa,
  seedDefaultsForEmpresa,
  uploadLogo,
} from '../controllers/empresas.controller.js'
import {
  authorize,
  authorizeInAnyEmpresa,
} from '../shared/middleware/authorize.middleware.js'
import { extractEmpresaFromParam } from '../shared/middleware/empresa.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'
import { FileUploadHelper } from '../shared/utils/fileUpload.js'

const router = Router()

router.get('/', authorizeInAnyEmpresa(PERMISSIONS.COMPANIES_VIEW), getAllEmpresas)
router.get('/my', getMyEmpresas)
router.post('/', authorizeInAnyEmpresa(PERMISSIONS.COMPANIES_CREATE), createEmpresa)
router.post(
  '/:id/logo',
  extractEmpresaFromParam,
  authorize(PERMISSIONS.COMPANIES_UPDATE),
  FileUploadHelper.createMemoryUploader('image'),
  uploadLogo
)
router.get('/predeterminada', getEmpresaPredeterminada)
router.get(
  '/:id',
  extractEmpresaFromParam,
  authorize(PERMISSIONS.COMPANIES_VIEW),
  getEmpresaById
)
router.put(
  '/:id',
  extractEmpresaFromParam,
  authorize(PERMISSIONS.COMPANIES_UPDATE),
  updateEmpresa
)
router.delete(
  '/:id',
  extractEmpresaFromParam,
  authorize(PERMISSIONS.COMPANIES_DELETE),
  deleteEmpresa
)
router.get(
  '/:id/audit-logs',
  extractEmpresaFromParam,
  authorize(PERMISSIONS.AUDIT_VIEW),
  getAuditLogsForEmpresa
)
router.post(
  '/:id/seed-defaults',
  extractEmpresaFromParam,
  authorize(PERMISSIONS.COMPANIES_UPDATE),
  seedDefaultsForEmpresa
)

export default router
