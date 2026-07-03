// backend/src/features/system/backups/backups.routes.ts

import { Router } from 'express'
import { backupsController } from './backups.controller.js'
import { authenticate } from '../../../shared/middleware/authenticate.middleware.js'
import { authorizeInAnyEmpresa } from '../../../shared/middleware/authorize.middleware.js'
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../../../shared/middleware/validateRequest.middleware.js'
import {
  listBackupsSchema,
  backupIdParamsSchema,
  restoreBackupSchema,
} from './backups.validation.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { FileUploadHelper } from '../../../shared/utils/fileUpload.js'

const router = Router()

// Respaldos son recursos GLOBALES (toda la BD). No requieren empresa activa
// — basta con tener el permiso en cualquier empresa del usuario.
router.use(authenticate)

// GET /api/system/backups
router.get(
  '/',
  authorizeInAnyEmpresa(PERMISSIONS.BACKUPS_VIEW),
  validateQuery(listBackupsSchema),
  backupsController.list
)

// POST /api/system/backups (disparar manual)
router.post(
  '/',
  authorizeInAnyEmpresa(PERMISSIONS.BACKUPS_CREATE),
  backupsController.create
)

// POST /api/system/backups/import (subir un .dump externo) — ruta estática antes de /:id
router.post(
  '/import',
  authorizeInAnyEmpresa(PERMISSIONS.BACKUPS_CREATE),
  FileUploadHelper.createBackupUploader('file'),
  backupsController.importBackup
)

// GET /api/system/backups/:id/download
router.get(
  '/:id/download',
  authorizeInAnyEmpresa(PERMISSIONS.BACKUPS_VIEW),
  validateParams(backupIdParamsSchema),
  backupsController.download
)

// POST /api/system/backups/:id/restore
router.post(
  '/:id/restore',
  authorizeInAnyEmpresa(PERMISSIONS.BACKUPS_RESTORE),
  validateParams(backupIdParamsSchema),
  validateBody(restoreBackupSchema),
  backupsController.restore
)

// DELETE /api/system/backups/:id
router.delete(
  '/:id',
  authorizeInAnyEmpresa(PERMISSIONS.BACKUPS_DELETE),
  validateParams(backupIdParamsSchema),
  backupsController.delete
)

export default router
