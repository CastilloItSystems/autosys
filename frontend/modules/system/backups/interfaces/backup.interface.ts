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
