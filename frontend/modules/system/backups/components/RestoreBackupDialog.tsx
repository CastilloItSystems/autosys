"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import type {
  DatabaseBackup,
  RestoreJob,
} from "../interfaces/backup.interface";
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
  const [job, setJob] = useState<RestoreJob | null>(null);
  const toast = useRef<Toast>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (visible) {
      setConfirmText("");
      setJob(null);
    }
  }, [visible]);

  // Cortar el sondeo si el componente se desmonta a mitad de una restauración.
  useEffect(() => stopPolling, []);

  const inProgress =
    job !== null && (job.status === "PENDING" || job.status === "RUNNING");

  const canSubmit =
    backup && confirmText === backup.fileName && !submitting && !inProgress;

  const handleRestore = async () => {
    if (!backup) return;
    try {
      setSubmitting(true);
      // Responde 202 enseguida: a partir de aquí seguimos el trabajo por sondeo,
      // porque una restauración tarda minutos y ninguna petición HTTP aguanta eso.
      const started = await backupService.restore(backup.id, confirmText);
      setJob(started);

      pollRef.current = setInterval(async () => {
        try {
          const current = await backupService.getRestoreJob(started.id);
          setJob(current);
          if (current.status === "SUCCESS" || current.status === "FAILED") {
            stopPolling();
            setSubmitting(false);
            if (current.status === "SUCCESS") {
              toast.current?.show({
                severity: current.warnings.length ? "warn" : "success",
                summary: "Restauración completada",
                detail: current.warnings.length
                  ? `Terminó con ${current.warnings.length} aviso(s). Revísalos antes de continuar.`
                  : "La base de datos fue restaurada desde el respaldo.",
                life: current.warnings.length ? 10000 : 4000,
              });
              onSuccess();
            } else {
              toast.current?.show({
                severity: "error",
                summary: "Error al restaurar",
                detail: current.error ?? "No se pudo restaurar el respaldo.",
                life: 10000,
              });
            }
          }
        } catch (err: any) {
          stopPolling();
          setSubmitting(false);
          toast.current?.show({
            severity: "warn",
            summary: "Se perdió el seguimiento",
            detail:
              "No se pudo consultar el estado de la restauración. Revisa los logs del servidor para conocer el resultado.",
            life: 10000,
          });
        }
      }, 2000);
    } catch (err: any) {
      setSubmitting(false);
      toast.current?.show({
        severity: "error",
        summary: "Error al restaurar",
        detail:
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo restaurar el respaldo.",
        life: 6000,
      });
    }
  };

  const footer = (
    <div className="flex w-full gap-2">
      <Button
        label={job?.status === "SUCCESS" ? "Cerrar" : "Cancelar"}
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={onHide}
        // Cerrar durante la restauración corta el sondeo, no el proceso: el
        // servidor sigue restaurando y el usuario se queda sin saber cómo acabó.
        disabled={inProgress}
        className="flex-1"
      />
      {job?.status !== "SUCCESS" && (
        <Button
          label={inProgress ? "Restaurando..." : "Restaurar"}
          icon="pi pi-history"
          severity="danger"
          onClick={handleRestore}
          loading={submitting}
          disabled={!canSubmit}
          className="flex-1"
        />
      )}
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
        // Durante la restauración también se bloquean la X y Escape, no solo el
        // botón Cancelar: cerrar aquí sólo cortaría el sondeo del estado.
        closable={!inProgress}
        closeOnEscape={!inProgress}
        footer={footer}
      >
        {job ? (
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-2">
              <i
                className={
                  job.status === "SUCCESS"
                    ? "pi pi-check-circle text-green-500"
                    : job.status === "FAILED"
                    ? "pi pi-times-circle text-red-500"
                    : "pi pi-spin pi-spinner text-primary"
                }
              />
              <span className="font-semibold">{job.step}</span>
            </div>

            {inProgress && (
              <>
                <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
                <div className="text-sm text-color-secondary">
                  Puede tardar varios minutos. No cierres esta ventana ni
                  recargues la página.
                </div>
              </>
            )}

            {job.preRestoreBackupId && (
              <div className="text-sm text-color-secondary">
                Se generó un respaldo de seguridad con el estado anterior, por
                si necesitas volver atrás.
              </div>
            )}

            {job.status === "FAILED" && job.error && (
              <div className="p-3 border-round bg-red-50 text-red-900 text-sm white-space-pre-wrap">
                {job.error}
              </div>
            )}

            {job.status === "SUCCESS" && job.warnings.length > 0 && (
              <div className="p-3 border-round bg-yellow-50 text-yellow-900 text-sm">
                <strong>
                  La restauración terminó con {job.warnings.length} aviso(s):
                </strong>
                <ul className="mt-2 mb-0 pl-3">
                  {job.warnings.slice(0, 10).map((w, i) => (
                    <li key={i} className="font-mono text-xs">
                      {w}
                    </li>
                  ))}
                </ul>
                {job.warnings.length > 10 && (
                  <div className="mt-2">
                    …y {job.warnings.length - 10} más. Revisa los logs del
                    servidor para verlos todos.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          backup && (
            <div className="flex flex-column gap-3">
              <div className="p-3 border-round bg-red-50 text-red-900">
                <strong>Operación destructiva e irreversible.</strong> Esta
                acción reemplazará todos los datos actuales de la base de datos
                con el contenido del respaldo. Se perderán los cambios
                realizados después de la fecha del respaldo.
              </div>
              <div>
                <div className="text-sm text-color-secondary">Archivo</div>
                <div className="font-mono">{backup.fileName}</div>
                <div className="text-sm text-color-secondary mt-2">
                  Generado
                </div>
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
          )
        )}
      </Dialog>
    </>
  );
};

export default RestoreBackupDialog;
