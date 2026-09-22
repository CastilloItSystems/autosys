export type BackupType = "MANUAL" | "DAILY" | "WEEKLY" | "PRE_RESTORE";
export type BackupStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface DatabaseBackup {
  id: string;
  type: BackupType;
  status: BackupStatus;
  fileKey: string;
  fileUrl: string | null;
  fileName: string;
  sizeBytes: string | null;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  triggeredBy: string | null;
  createdAt: string;
}

export interface ListBackupsParams {
  page?: number;
  limit?: number;
  type?: BackupType;
  status?: BackupStatus;
}

export type RestoreJobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface RestoreJob {
  id: string;
  backupId: string;
  fileName: string;
  status: RestoreJobStatus;
  /** Paso actual, ya redactado en español por el backend. */
  step: string;
  preRestoreBackupId: string | null;
  /** Avisos de pg_restore que no abortaron la operación. */
  warnings: string[];
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  triggeredBy: string | null;
}
