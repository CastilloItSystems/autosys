// backend/src/features/system/backups/restoreJobs.ts

/**
 * Seguimiento en memoria de las restauraciones en curso.
 *
 * ¿Por que no una tabla? Porque pg_restore corre con --clean: borra y recrea
 * todo el esquema. Una fila de estado guardada en esa misma base se destruiria
 * a si misma a mitad del proceso, y al terminar quedaria el estado que tenia el
 * respaldo, no el real. La memoria del proceso es el unico lugar que sobrevive
 * a la restauracion.
 *
 * Limitacion conocida: si el dyno se reinicia durante una restauracion, se
 * pierde el seguimiento (el pg_restore muere con el proceso de todos modos).
 * El resultado final siempre queda en los logs y en la auditoria.
 */

import { randomUUID } from 'crypto'

export type RestoreJobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

export interface RestoreJob {
  id: string
  backupId: string
  fileName: string
  status: RestoreJobStatus
  /** Paso actual, en español, para mostrarlo tal cual en la UI. */
  step: string
  preRestoreBackupId: string | null
  /** Mensajes de pg_restore que no abortaron la operación pero conviene revisar. */
  warnings: string[]
  error: string | null
  startedAt: string
  finishedAt: string | null
  triggeredBy: string | null
}

/** Cuánto se conserva un trabajo terminado antes de descartarlo. */
const JOB_TTL_MS = 24 * 60 * 60 * 1000

const jobs = new Map<string, RestoreJob>()

function purgeExpired(): void {
  const cutoff = Date.now() - JOB_TTL_MS
  for (const [id, job] of jobs) {
    if (job.finishedAt && new Date(job.finishedAt).getTime() < cutoff) {
      jobs.delete(id)
    }
  }
}

export function createRestoreJob(
  backupId: string,
  fileName: string,
  triggeredBy?: string
): RestoreJob {
  purgeExpired()
  const job: RestoreJob = {
    id: randomUUID(),
    backupId,
    fileName,
    status: 'PENDING',
    step: 'En cola',
    preRestoreBackupId: null,
    warnings: [],
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    triggeredBy: triggeredBy ?? null,
  }
  jobs.set(job.id, job)
  return job
}

export function updateRestoreJob(
  id: string,
  patch: Partial<Omit<RestoreJob, 'id'>>
): void {
  const job = jobs.get(id)
  if (!job) return
  Object.assign(job, patch)
}

export function getRestoreJob(id: string): RestoreJob | undefined {
  return jobs.get(id)
}

/** Restauración en curso, si la hay. Sirve para impedir dos a la vez. */
export function getActiveRestoreJob(): RestoreJob | undefined {
  for (const job of jobs.values()) {
    if (job.status === 'PENDING' || job.status === 'RUNNING') return job
  }
  return undefined
}
