import apiClient from "@/app/api/apiClient";
import type {
  DatabaseBackup,
  ListBackupsParams,
  RestoreJob,
} from "../interfaces/backup.interface";

interface PaginatedBackupsResponse {
  success: boolean;
  data: DatabaseBackup[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class BackupService {
  private base = "/system/backups";

  async list(
    params: ListBackupsParams = {}
  ): Promise<PaginatedBackupsResponse> {
    const { data } = await apiClient.get<PaginatedBackupsResponse>(this.base, {
      params,
    });
    return data;
  }

  async triggerManual(): Promise<DatabaseBackup> {
    const { data } = await apiClient.post<{ data: DatabaseBackup }>(this.base);
    return data.data;
  }

  async importFile(file: File): Promise<DatabaseBackup> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<{ data: DatabaseBackup }>(
      `${this.base}/import`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data.data;
  }

  async download(id: string, fileName: string): Promise<void> {
    const response = await apiClient.get(`${this.base}/${id}/download`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Inicia la restauración. Responde 202 de inmediato: el trabajo real corre en
   * segundo plano y se sigue con getRestoreJob().
   */
  async restore(id: string, confirmFileName: string): Promise<RestoreJob> {
    const { data } = await apiClient.post(`${this.base}/${id}/restore`, {
      confirmFileName,
    });
    return data.data as RestoreJob;
  }

  async getRestoreJob(jobId: string): Promise<RestoreJob> {
    const { data } = await apiClient.get(`${this.base}/restore-jobs/${jobId}`);
    return data.data as RestoreJob;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.base}/${id}`);
  }
}

export default new BackupService();
