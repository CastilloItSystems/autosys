// backend/src/features/system/backups/backups.service.ts

import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createReadStream } from 'fs'
import prisma from '../../../services/prisma.service.js'
import r2StorageService from '../../../services/r2-storage.service.js'
import { logger } from '../../../shared/utils/logger.js'
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../shared/utils/apiError.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import type {
  BackupType,
  BackupStatus,
  IListBackupsQuery,
} from './backups.interface.js'

const BACKUP_PREFIX = 'backups'
const PG_DUMP_BIN = process.env.PG_DUMP_PATH || 'pg_dump'
const PG_RESTORE_BIN = process.env.PG_RESTORE_PATH || 'pg_restore'
const DUMP_TIMEOUT_MS = Number(
  process.env.BACKUP_PROCESS_TIMEOUT_MS || 30 * 60 * 1000
)
const RESTORE_TIMEOUT_MS = Number(
  process.env.RESTORE_PROCESS_TIMEOUT_MS || 60 * 60 * 1000
)

interface ParsedDbUrl {
  host: string
  port: string
  user: string
  password: string
  database: string
}

function parseDatabaseUrl(): ParsedDbUrl {
  const raw = process.env.DATABASE_URL
  if (!raw) throw new Error('DATABASE_URL no configurada')
  const url = new URL(raw)
  return {
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  }
}

function timestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `_${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  )
}

export class BackupsService {
  /**
   * Genera dump comprimido con pg_dump y lo sube a R2.
   * Retorna el registro persistido en DB.
   */
  async runBackup(type: BackupType, triggeredBy?: string): Promise<string> {
    // Lock anti-concurrencia: rechazar si ya hay un backup en progreso
    const inProgress = await prisma.databaseBackup.findFirst({
      where: { status: 'PENDING' },
      orderBy: { startedAt: 'desc' },
    })
    if (inProgress) {
      throw new ConflictError(
        `Ya hay un respaldo en progreso (id=${inProgress.id}, tipo=${inProgress.type}). Espera a que termine.`
      )
    }

    const ts = timestamp()
    const fileName = `${type.toLowerCase()}_${ts}.dump`
    const fileKey = `${BACKUP_PREFIX}/${type.toLowerCase()}/${fileName}`
    const tmpFile = path.join(os.tmpdir(), fileName)

    const record = await prisma.databaseBackup.create({
      data: {
        type,
        status: 'PENDING',
        fileKey,
        fileName,
        triggeredBy: triggeredBy || null,
      },
    })

    try {
      const db = parseDatabaseUrl()
      await this.runPgDump(db, tmpFile)

      const stat = fs.statSync(tmpFile)
      const stream = createReadStream(tmpFile)
      const url = await r2StorageService.uploadWithKey(
        stream,
        fileKey,
        'application/octet-stream'
      )

      await prisma.databaseBackup.update({
        where: { id: record.id },
        data: {
          status: 'SUCCESS',
          fileUrl: url,
          sizeBytes: BigInt(stat.size),
          finishedAt: new Date(),
        },
      })

      logger.info('Database backup completed', {
        id: record.id,
        type,
        sizeBytes: stat.size,
      })

      return record.id
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Database backup failed', { id: record.id, type, error: msg })
      await prisma.databaseBackup.update({
        where: { id: record.id },
        data: {
          status: 'FAILED',
          error: msg.slice(0, 4000),
          finishedAt: new Date(),
        },
      })
      await this.notifyAdminsOfFailure(record.id, type, msg)
      throw error
    } finally {
      try {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
      } catch {
        /* ignore */
      }
    }
  }

  private runPgDump(db: ParsedDbUrl, outFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-Fc',
        '--no-owner',
        '--no-acl',
        '-h',
        db.host,
        '-p',
        db.port,
        '-U',
        db.user,
        '-d',
        db.database,
        '-f',
        outFile,
      ]
      const proc = spawn(PG_DUMP_BIN, args, {
        env: { ...process.env, PGPASSWORD: db.password },
      })
      let stderr = ''
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        proc.kill('SIGTERM')
        setTimeout(() => proc.kill('SIGKILL'), 5000)
      }, DUMP_TIMEOUT_MS)
      proc.stderr.on('data', (chunk) => (stderr += chunk.toString()))
      proc.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
      proc.on('close', (code) => {
        clearTimeout(timer)
        if (timedOut) {
          return reject(new Error(`pg_dump excedió timeout (${DUMP_TIMEOUT_MS}ms)`))
        }
        if (code === 0) resolve()
        else reject(new Error(`pg_dump salió con código ${code}: ${stderr}`))
      })
    })
  }

  private runPgRestore(db: ParsedDbUrl, inFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-acl',
        '-h',
        db.host,
        '-p',
        db.port,
        '-U',
        db.user,
        '-d',
        db.database,
        inFile,
      ]
      const proc = spawn(PG_RESTORE_BIN, args, {
        env: { ...process.env, PGPASSWORD: db.password },
      })
      let stderr = ''
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        proc.kill('SIGTERM')
        setTimeout(() => proc.kill('SIGKILL'), 5000)
      }, RESTORE_TIMEOUT_MS)
      proc.stderr.on('data', (chunk) => (stderr += chunk.toString()))
      proc.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
      proc.on('close', (code) => {
        clearTimeout(timer)
        if (timedOut) {
          return reject(
            new Error(`pg_restore excedió timeout (${RESTORE_TIMEOUT_MS}ms)`)
          )
        }
        // pg_restore returns non-zero with --clean even on success when DROP fails;
        // we tolerate code 1 if no fatal errors detected.
        if (code === 0) return resolve()
        if (code === 1 && !/FATAL|terminated/i.test(stderr)) {
          logger.warn('pg_restore terminó con warnings', { stderr })
          return resolve()
        }
        reject(new Error(`pg_restore salió con código ${code}: ${stderr}`))
      })
    })
  }

  private async notifyAdminsOfFailure(
    backupId: string,
    type: BackupType,
    errorMsg: string
  ): Promise<void> {
    try {
      const empresas = await prisma.empresa.findMany({
        where: { eliminado: false },
        select: { id_empresa: true },
      })
      for (const e of empresas) {
        await domainEventBus.publish(
          toDomainEvent({
            empresaId: e.id_empresa,
            eventCode: 'system.backup.failed',
            module: 'system',
            title: 'Respaldo de BD fallido',
            message: `Tipo ${type}: ${errorMsg.slice(0, 200)}`,
            severity: 'ERROR',
            priority: 'CRITICAL',
            entityType: 'DatabaseBackup',
            entityId: backupId,
            link: '/respaldos',
            source: 'system.backups',
            dedupKey: `system.backup.failed:${backupId}`,
            metadata: { backupId, type },
            createdByName: 'Sistema',
          })
        )
      }
    } catch (publishError) {
      logger.error('Error publicando notificación de backup fallido', {
        backupId,
        error: publishError,
      })
    }
  }

  async restoreFromBackup(
    id: string,
    confirmFileName: string,
    triggeredBy?: string
  ): Promise<{ preRestoreBackupId: string }> {
    const backup = await prisma.databaseBackup.findUnique({ where: { id } })
    if (!backup) throw new NotFoundError('Respaldo no encontrado')
    if (backup.status !== 'SUCCESS') {
      throw new ConflictError('Solo se pueden restaurar respaldos exitosos')
    }
    if (confirmFileName !== backup.fileName) {
      throw new BadRequestError(
        'El nombre del archivo de confirmación no coincide'
      )
    }

    // 1. Backup de salvavidas antes de restaurar (estado actual)
    logger.warn('Generating PRE_RESTORE backup before restore', { targetId: id })
    const preRestoreBackupId = await this.runBackup('PRE_RESTORE', triggeredBy)

    const tmpFile = path.join(os.tmpdir(), `restore_${backup.fileName}`)
    try {
      const stream = await r2StorageService.downloadStream(backup.fileKey)
      await new Promise<void>((resolve, reject) => {
        const out = fs.createWriteStream(tmpFile)
        stream.pipe(out)
        out.on('finish', () => resolve())
        out.on('error', reject)
        stream.on('error', reject)
      })

      const db = parseDatabaseUrl()
      await this.runPgRestore(db, tmpFile)
      logger.warn('Database restored from backup', {
        id,
        fileKey: backup.fileKey,
        preRestoreBackupId,
      })
      return { preRestoreBackupId }
    } finally {
      try {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
      } catch {
        /* ignore */
      }
    }
  }

  async listBackups(query: IListBackupsQuery) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const where: { type?: BackupType; status?: BackupStatus } = {}
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status

    const [data, total] = await Promise.all([
      prisma.databaseBackup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.databaseBackup.count({ where }),
    ])
    return { data, total, page, limit }
  }

  async getBackup(id: string) {
    const backup = await prisma.databaseBackup.findUnique({ where: { id } })
    if (!backup) throw new NotFoundError('Respaldo no encontrado')
    return backup
  }

  async deleteBackup(id: string): Promise<void> {
    const backup = await this.getBackup(id)
    await r2StorageService.deleteByKey(backup.fileKey)
    await prisma.databaseBackup.delete({ where: { id } })
  }

  async downloadBackup(id: string) {
    const backup = await this.getBackup(id)
    if (backup.status !== 'SUCCESS') {
      throw new ConflictError('El respaldo no está disponible para descarga')
    }
    const stream = await r2StorageService.downloadStream(backup.fileKey)
    return { backup, stream }
  }

  /**
   * Borra dumps fuera de la ventana de retención.
   */
  async pruneRetention(opts: {
    dailyDays: number
    weeklyWeeks: number
  }): Promise<{ deleted: number }> {
    const now = Date.now()
    const dailyCutoff = new Date(now - opts.dailyDays * 86_400_000)
    const weeklyCutoff = new Date(now - opts.weeklyWeeks * 7 * 86_400_000)

    const oldDaily = await prisma.databaseBackup.findMany({
      where: { type: 'DAILY', createdAt: { lt: dailyCutoff } },
    })
    const oldWeekly = await prisma.databaseBackup.findMany({
      where: { type: 'WEEKLY', createdAt: { lt: weeklyCutoff } },
    })
    const targets = [...oldDaily, ...oldWeekly]

    for (const b of targets) {
      try {
        await r2StorageService.deleteByKey(b.fileKey)
        await prisma.databaseBackup.delete({ where: { id: b.id } })
      } catch (err) {
        logger.error('Error pruning backup', { id: b.id, error: err })
      }
    }

    return { deleted: targets.length }
  }
}

export const backupsService = new BackupsService()
