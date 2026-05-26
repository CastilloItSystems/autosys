// backend/src/features/system/backups/backups.controller.ts

import { Request, Response } from 'express'
import { backupsService } from './backups.service.js'
import { DatabaseBackupDTO } from './backups.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { createAuditLog } from '../../../services/audit.service.js'

function getUserId(req: Request): string {
  return req.user?.userId ?? 'system'
}

function getClientIp(req: Request): string | undefined {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string') return fwd.split(',')[0]?.trim()
  return req.ip
}

export class BackupsController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.validatedQuery ?? req.query) as Record<string, string>
    const result = await backupsService.listBackups({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
      type: query.type as any,
      status: query.status as any,
    })
    ApiResponse.paginated(
      res,
      result.data.map((b) => new DatabaseBackupDTO(b as any)),
      result.page,
      result.limit,
      result.total,
      'Respaldos obtenidos'
    )
  })

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req)
    const id = await backupsService.runBackup('MANUAL', userId)
    const backup = await backupsService.getBackup(id)
    await createAuditLog({
      entity: 'DatabaseBackup',
      entityId: id,
      action: 'CREATE',
      userId,
      empresaId: req.empresaId,
      metadata: {
        fileName: backup.fileName,
        type: backup.type,
        ip: getClientIp(req),
      },
    })
    ApiResponse.created(
      res,
      new DatabaseBackupDTO(backup as any),
      'Respaldo generado exitosamente'
    )
  })

  download = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params as { id: string }
      const { backup, stream } = await backupsService.downloadBackup(id)
      await createAuditLog({
        entity: 'DatabaseBackup',
        entityId: id,
        action: 'DOWNLOAD',
        userId: getUserId(req),
        empresaId: req.empresaId,
        metadata: { fileName: backup.fileName, ip: getClientIp(req) },
      })
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${backup.fileName}"`
      )
      if (backup.sizeBytes) {
        res.setHeader('Content-Length', String(backup.sizeBytes))
      }
      stream.pipe(res)
    }
  )

  restore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string }
    const body = (req.validatedBody ?? req.body) as { confirmFileName: string }
    const userId = getUserId(req)
    const { preRestoreBackupId } = await backupsService.restoreFromBackup(
      id,
      body.confirmFileName,
      userId
    )
    const backup = await backupsService.getBackup(id)
    await createAuditLog({
      entity: 'DatabaseBackup',
      entityId: id,
      action: 'RESTORE',
      userId,
      empresaId: req.empresaId,
      metadata: {
        fileName: backup.fileName,
        ip: getClientIp(req),
        preRestoreBackupId,
      },
    })
    ApiResponse.success(
      res,
      { preRestoreBackupId },
      'Base de datos restaurada exitosamente'
    )
  })

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string }
    const backup = await backupsService.getBackup(id)
    await backupsService.deleteBackup(id)
    await createAuditLog({
      entity: 'DatabaseBackup',
      entityId: id,
      action: 'DELETE',
      userId: getUserId(req),
      empresaId: req.empresaId,
      metadata: { fileName: backup.fileName, ip: getClientIp(req) },
    })
    ApiResponse.success(res, null, 'Respaldo eliminado')
  })
}

export const backupsController = new BackupsController()
