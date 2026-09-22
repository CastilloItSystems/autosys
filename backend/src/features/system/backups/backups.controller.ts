// backend/src/features/system/backups/backups.controller.ts

import { Request, Response } from 'express'
import { backupsService } from './backups.service.js'
import { DatabaseBackupDTO } from './backups.dto.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { createAuditLog } from '../../../services/audit.service.js'
import { getRestoreJob } from './restoreJobs.js'
import {
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/utils/apiError.js'
import {
  verifyToken,
  extractTokenFromHeader,
} from '../../../services/jwt.service.js'

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

  /**
   * Estado de una restauración. Deliberadamente NO usa authenticate ni
   * authorizeInAnyEmpresa: ambos consultan la base (tablas `User`,
   * `permissions`, `memberships`) y pg_restore --clean las borra para
   * recrearlas. Consultarlas aquí es preguntarle a la casa que se está
   * demoliendo si sigue en pie: en la primera restauración real este endpoint
   * devolvió 500 justo a mitad del proceso y el usuario perdió el seguimiento.
   *
   * La autorización que queda es estricta y sin base de datos: firma del token
   * válida, y el usuario debe ser el mismo que inició la restauración. El id
   * del trabajo es un UUID no adivinable.
   */
  restoreStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params as { jobId: string }

    const token = extractTokenFromHeader(req.headers.authorization)
    const decoded = token ? verifyToken(token) : null
    if (!decoded?.userId) {
      throw new UnauthorizedError('Token inválido o expirado')
    }

    const job = getRestoreJob(jobId)
    // Mismo error para "no existe" y "no es tuyo": no revelamos cuáles existen.
    if (!job || job.triggeredBy !== decoded.userId) {
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
