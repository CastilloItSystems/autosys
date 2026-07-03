"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { Message } from "primereact/message";
import CreateButton from "@/shared/components/CreateButton";
import DeleteConfirmDialog from "@/shared/components/DeleteConfirmDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import backupService from "../services/backupService";
import RestoreBackupDialog from "./RestoreBackupDialog";
import type {
  DatabaseBackup,
  BackupStatus,
  BackupType,
} from "../interfaces/backup.interface";

const TYPE_LABEL: Record<BackupType, { label: string; severity: any }> = {
  MANUAL: { label: "Manual", severity: "info" },
  DAILY: { label: "Diario", severity: "success" },
  WEEKLY: { label: "Semanal", severity: "warning" },
  PRE_RESTORE: { label: "Pre-restore", severity: "danger" },
};

const STATUS_LABEL: Record<BackupStatus, { label: string; severity: any }> = {
  PENDING: { label: "En progreso", severity: "warning" },
  SUCCESS: { label: "Completado", severity: "success" },
  FAILED: { label: "Fallido", severity: "danger" },
};

function formatBytes(raw: string | null): string {
  if (!raw) return "—";
  const bytes = Number(raw);
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

const BackupList = () => {
  const { hasPermission } = useUserPermissions();
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const [selectedRow, setSelectedRow] = useState<DatabaseBackup | null>(null);

  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(20);

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<DatabaseBackup | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DatabaseBackup | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileUploadRef = useRef<FileUpload>(null);

  const canCreate = hasPermission("backups.create");
  const canRestore = hasPermission("backups.restore");
  const canDelete = hasPermission("backups.delete");

  const load = useCallback(async (p: number, l: number) => {
    setLoading(true);
    try {
      const res = await backupService.list({ page: p, limit: l });
      setBackups(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err?.response?.data?.message ||
          "No se pudieron cargar los respaldos.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, rows);
  }, [load, page, rows]);

  const onPage = (e: DataTablePageEvent) => {
    setPage((e.page ?? 0) + 1);
    setRows(e.rows ?? 20);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await backupService.triggerManual();
      toast.current?.show({
        severity: "success",
        summary: "Respaldo generado",
        detail: "El respaldo se creó y subió al almacenamiento.",
      });
      await load(page, rows);
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err?.response?.data?.message ||
          "No se pudo generar el respaldo.",
        life: 6000,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async (e: FileUploadHandlerEvent) => {
    const file = e.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await backupService.importFile(file);
      toast.current?.show({
        severity: "success",
        summary: "Respaldo importado",
        detail: "El archivo se subió y quedó disponible para restaurar.",
      });
      setImportOpen(false);
      fileUploadRef.current?.clear();
      await load(page, rows);
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err?.response?.data?.message || "No se pudo importar el respaldo.",
        life: 6000,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownload = async (b: DatabaseBackup) => {
    try {
      await backupService.download(b.id, b.fileName);
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err?.response?.data?.message ||
          "No se pudo descargar el respaldo.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await backupService.delete(deleteTarget.id);
      toast.current?.show({
        severity: "success",
        summary: "Respaldo eliminado",
      });
      setDeleteOpen(false);
      setDeleteTarget(null);
      await load(page, rows);
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err?.response?.data?.message ||
          "No se pudo eliminar el respaldo.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const menuItems = (() => {
    if (!selectedRow) return [];
    const items: any[] = [
      {
        label: "Descargar",
        icon: "pi pi-download",
        disabled: selectedRow.status !== "SUCCESS",
        command: () => handleDownload(selectedRow),
      },
    ];
    if (canRestore) {
      items.push({
        label: "Restaurar",
        icon: "pi pi-history",
        disabled: selectedRow.status !== "SUCCESS",
        command: () => {
          setRestoreTarget(selectedRow);
          setRestoreOpen(true);
        },
      });
    }
    if (canDelete) {
      items.push({ separator: true });
      items.push({
        label: "Eliminar",
        icon: "pi pi-trash",
        command: () => {
          setDeleteTarget(selectedRow);
          setDeleteOpen(true);
        },
      });
    }
    return items;
  })();

  const typeBody = (b: DatabaseBackup) => {
    const t = TYPE_LABEL[b.type];
    return <Tag value={t.label} severity={t.severity} />;
  };

  const statusBody = (b: DatabaseBackup) => {
    const s = STATUS_LABEL[b.status];
    return <Tag value={s.label} severity={s.severity} />;
  };

  const sizeBody = (b: DatabaseBackup) => formatBytes(b.sizeBytes);

  const dateBody = (b: DatabaseBackup) =>
    new Date(b.createdAt).toLocaleString();

  const actionsBody = (b: DatabaseBackup) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      size="small"
      onClick={(e) => {
        setSelectedRow(b);
        menuRef.current?.toggle(e);
      }}
    />
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <Menu ref={menuRef} model={menuItems} popup />

      <div className="flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="m-0">Respaldos de Base de Datos</h2>
          <p className="text-color-secondary m-0 mt-1">
            Genera, descarga y restaura respaldos del sistema.
          </p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Button
              label="Importar respaldo"
              icon="pi pi-upload"
              outlined
              onClick={() => setImportOpen(true)}
            />
            <CreateButton
              label={creating ? "Generando..." : "Generar respaldo ahora"}
              icon="pi pi-database"
              onClick={handleCreate}
              disabled={creating}
              permission="backups.create"
            />
          </div>
        )}
      </div>

      <DataTable
        value={backups}
        lazy
        paginator
        first={(page - 1) * rows}
        rows={rows}
        totalRecords={total}
        onPage={onPage}
        loading={loading}
        rowsPerPageOptions={[10, 20, 50]}
        emptyMessage="No hay respaldos registrados."
      >
        <Column field="fileName" header="Archivo" body={(b) => (
          <span className="font-mono text-sm">{b.fileName}</span>
        )} />
        <Column field="type" header="Tipo" body={typeBody} />
        <Column field="status" header="Estado" body={statusBody} />
        <Column field="sizeBytes" header="Tamaño" body={sizeBody} />
        <Column field="createdAt" header="Fecha" body={dateBody} />
        <Column header="Acciones" body={actionsBody} style={{ width: "5rem" }} />
      </DataTable>

      <RestoreBackupDialog
        visible={restoreOpen}
        backup={restoreTarget}
        onHide={() => setRestoreOpen(false)}
        onSuccess={() => load(page, rows)}
      />

      <DeleteConfirmDialog
        visible={deleteOpen}
        onHide={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.fileName || ""}
        isDeleting={deleting}
      />

      <Dialog
        visible={importOpen}
        onHide={() => !importing && setImportOpen(false)}
        style={{ width: "480px" }}
        header={
          <div className="border-bottom-2 border-primary pb-2">
            <span className="text-xl font-bold flex align-items-center gap-2">
              <i className="pi pi-upload text-primary" />
              Importar respaldo
            </span>
          </div>
        }
        modal
      >
        <div className="flex flex-column gap-3 pt-2">
          <Message
            severity="info"
            text="Sube un archivo .dump generado por este sistema (o con pg_dump -Fc). Quedará disponible en la lista para restaurar."
          />
          <FileUpload
            ref={fileUploadRef}
            name="file"
            accept=".dump,.backup,application/octet-stream"
            mode="basic"
            customUpload
            auto
            chooseLabel="Seleccionar archivo .dump"
            uploadHandler={handleImport}
            disabled={importing}
          />
          {importing && (
            <div className="flex align-items-center gap-2 text-color-secondary">
              <i className="pi pi-spin pi-spinner" />
              Subiendo respaldo...
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default BackupList;
