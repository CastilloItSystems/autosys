// backend/src/features/system/backups/backups.interface.ts

export type BackupType = 'MANUAL' | 'DAILY' | 'WEEKLY' | 'PRE_RESTORE'
export type BackupStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export interface IDatabaseBackup {
  id: string
  type: BackupType
  status: BackupStatus
  fileKey: string
  fileUrl: string | null
  fileName: string
  sizeBytes: string | null
  startedAt: Date
  finishedAt: Date | null
  error: string | null
  triggeredBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IListBackupsQuery {
  page?: number
  limit?: number
  type?: BackupType
  status?: BackupStatus
}

export interface IRestoreBackupBody {
  confirmFileName: string
}
