// backend/src/features/system/backups/backups.dto.ts

import type { IDatabaseBackup } from './backups.interface.js'

export class DatabaseBackupDTO {
  id: string
  type: string
  status: string
  fileKey: string
  fileUrl: string | null
  fileName: string
  sizeBytes: string | null
  startedAt: string
  finishedAt: string | null
  error: string | null
  triggeredBy: string | null
  createdAt: string

  constructor(b: IDatabaseBackup) {
    this.id = b.id
    this.type = b.type
    this.status = b.status
    this.fileKey = b.fileKey
    this.fileUrl = b.fileUrl
    this.fileName = b.fileName
    this.sizeBytes = b.sizeBytes ? String(b.sizeBytes) : null
    this.startedAt = b.startedAt.toISOString()
    this.finishedAt = b.finishedAt ? b.finishedAt.toISOString() : null
    this.error = b.error
    this.triggeredBy = b.triggeredBy
    this.createdAt = b.createdAt.toISOString()
  }
}
