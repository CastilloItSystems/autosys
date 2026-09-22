// backend/src/features/system/backups/backups.controller.ts

import { Request, Response } from 'express'
import { backupsService } from './backups.service.js'
import { DatabaseBackupDTO } from './backups.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { createAuditLog } from '../../../services/audit.service.js'
import { getRestoreJob } from './restoreJobs.js'
import { NotFoundError } from '../../../shared/utils/apiError.js'

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

  importBackup = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = getUserId(req)
      const file = (req as Request & { file?: Express.Multer.File }).file
      const id = await backupsService.importBackup(
        file as unknown as { path: string; originalname: string; size: number },
        userId
      )
      const backup = await backupsService.getBackup(id)
      await createAuditLog({
        entity: 'DatabaseBackup',
        entityId: id,
        action: 'IMPORT',
        userId,
        empresaId: req.empresaId,
        metadata: {
          fileName: backup.fileName,
          originalName: file?.originalname,
          ip: getClientIp(req),
        },
      })
      ApiResponse.created(
        res,
        new DatabaseBackupDTO(backup as any),
        'Respaldo importado exitosamente'
      )
    }
  )

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

    // Devuelve en cuanto el trabajo queda encolado: la restauracion tarda
    // minutos y Heroku corta la peticion a los 30s (H12).
    const job = await backupsService.startRestore(
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
        restoreJobId: job.id,
      },
    })
    ApiResponse.success(
      res,
      job,
      'Restauración iniciada. Consulta su estado para seguir el progreso.',
      202
    )
  })

  restoreStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params as { jobId: string }
    const job = getRestoreJob(jobId)
    if (!job) {
      throw new NotFoundError(
        'Restauración no encontrada. Si el servidor se reinició, revisa los ' +
          'logs para conocer el resultado.'
      )
    }
    ApiResponse.success(res, job)
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
