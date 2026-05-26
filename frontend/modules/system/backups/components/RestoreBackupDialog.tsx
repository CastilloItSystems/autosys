"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import type { DatabaseBackup } from "../interfaces/backup.interface";
import backupService from "../services/backupService";

interface Props {
  visible: boolean;
  backup: DatabaseBackup | null;
  onHide: () => void;
  onSuccess: () => void;
}

const RestoreBackupDialog = ({ visible, backup, onHide, onSuccess }: Props) => {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (visible) setConfirmText("");
  }, [visible]);

  const canSubmit = backup && confirmText === backup.fileName && !submitting;

  const handleRestore = async () => {
    if (!backup) return;
    try {
      setSubmitting(true);
      await backupService.restore(backup.id, confirmText);
      toast.current?.show({
        severity: "success",
        summary: "Restauración completada",
        detail: "La base de datos fue restaurada desde el respaldo.",
      });
      onSuccess();
      onHide();
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error al restaurar",
        detail:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo restaurar el respaldo.",
        life: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex w-full gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={onHide}
        disabled={submitting}
        className="flex-1"
      />
      <Button
        label="Restaurar"
        icon="pi pi-history"
        severity="danger"
        onClick={handleRestore}
        loading={submitting}
        disabled={!canSubmit}
        className="flex-1"
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        style={{ width: "520px" }}
        header={
          <div className="flex align-items-center gap-2 border-bottom-2 border-red-500 pb-2 w-full">
            <i className="pi pi-exclamation-triangle text-red-500" />
            <span>Restaurar respaldo</span>
          </div>
        }
        modal
        footer={footer}
      >
        {backup && (
          <div className="flex flex-column gap-3">
            <div className="p-3 border-round bg-red-50 text-red-900">
              <strong>Operación destructiva e irreversible.</strong> Esta acción
              reemplazará todos los datos actuales de la base de datos con el
              contenido del respaldo. Se perderán los cambios realizados
              después de la fecha del respaldo.
            </div>
            <div>
              <div className="text-sm text-color-secondary">Archivo</div>
              <div className="font-mono">{backup.fileName}</div>
              <div className="text-sm text-color-secondary mt-2">Generado</div>
              <div>{new Date(backup.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <label htmlFor="confirmName" className="block mb-2">
                Escribe el nombre exacto del archivo para confirmar:
              </label>
              <InputText
                id="confirmName"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={backup.fileName}
                className="w-full"
                autoComplete="off"
              />
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default RestoreBackupDialog;
