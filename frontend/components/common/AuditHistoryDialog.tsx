"use client";
import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Divider } from "primereact/divider";
import { formatDateFH } from "@/utils/dateUtils";
import { ProgressSpinner } from "primereact/progressspinner";

interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId?: string;
  user?: {
    id: string;
    nombre: string;
    correo: string;
  };
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  createdAt: string;
}

interface AuditHistoryDialogProps {
  visible: boolean;
  onHide: () => void;
  title: React.ReactNode;
  auditLogs?: AuditLog[];
  loading?: boolean;
}

const AuditHistoryDialog: React.FC<AuditHistoryDialogProps> = ({
  visible,
  onHide,
  title,
  auditLogs = [],
  loading = false,
}) => {
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: "Creación",
      UPDATE: "Modificación",
      DELETE: "Eliminación",
      LOGIN: "Inicio de Sesión",
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      CREATE: "pi pi-plus text-green-500",
      UPDATE: "pi pi-pencil text-blue-500",
      DELETE: "pi pi-trash text-red-500",
      LOGIN: "pi pi-sign-in text-purple-500",
    };
    return icons[action] || "pi pi-check text-gray-500";
  };

  const compareChanges = (
    before: Record<string, any>,
    after: Record<string, any>,
  ) => {
    const changes: Record<string, { antes: any; despues: any }> = {};

    const allKeys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    allKeys.forEach((key) => {
      if (before?.[key] !== after?.[key]) {
        changes[key] = {
          antes: before?.[key] ?? "—",
          despues: after?.[key] ?? "—",
        };
      }
    });

    return changes;
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: "700px" }}
      header={title}
      contentClassName="p-0"
      modal
      draggable={false}
      onHide={onHide}
      footer={
        <div className="col-12 flex justify-content-end align-items-center mt-3">
          <Button
            type="button"
            label="Cerrar"
            className="w-auto"
            severity="secondary"
            onClick={onHide}
          />
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-content-center align-items-center p-6">
          <ProgressSpinner />
        </div>
      ) : auditLogs.length > 0 ? (
        <div className="m-3 p-3 border-round surface-50 border-left-3 border-primary">
          <Accordion multiple>
            {auditLogs.map((log, idx) => {
              const changes = compareChanges(
                log.changes.before,
                log.changes.after,
              );
              const changeCount = Object.keys(changes).length;

              return (
                <AccordionTab
                  key={log.id || idx}
                  header={
                    <div className="flex align-items-center gap-3 w-full">
                      <i className={`pi ${getActionIcon(log.action)}`}></i>
                      <div className="flex-1">
                        <div className="font-medium">
                          {formatDateFH(log.createdAt)}
                        </div>
                        <div className="text-sm text-600">
                          {log.user?.nombre || "Sistema"} (
                          {getActionLabel(log.action)})
                        </div>
                      </div>
                      {changeCount > 0 && (
                        <span className="text-xs surface-primary text-primary-color px-2 py-1 border-round">
                          {changeCount} cambios
                        </span>
                      )}
                    </div>
                  }
                >
                  <div className="m-2 p-3 surface-50 border-round">
                    <div className="grid">
                      <div className="col-12 md:col-6">
                        <span className="font-medium">Usuario:</span>{" "}
                        {log.user?.nombre || "Sistema"}
                      </div>
                      <div className="col-12 md:col-6">
                        <span className="font-medium">Email:</span>{" "}
                        {log.user?.correo || "—"}
                      </div>
                      <div className="col-12 md:col-6">
                        <span className="font-medium">Acción:</span>{" "}
                        {getActionLabel(log.action)}
                      </div>
                      <div className="col-12 md:col-6">
                        <span className="font-medium">Fecha:</span>{" "}
                        {formatDateFH(log.createdAt)}
                      </div>
                    </div>

                    {changeCount > 0 && (
                      <>
                        <Divider className="my-3" />
                        <div className="text-lg font-medium mb-3">
                          Cambios Realizados:
                        </div>
                        <div className="grid gap-3">
                          {Object.entries(changes).map(
                            ([field, { antes, despues }], i) => (
                              <div
                                key={`${log.id}-${field}-${i}`}
                                className="col-12 border-1 border-surface-300 p-3 border-round"
                              >
                                <div className="font-medium text-primary mb-2">
                                  {field}
                                </div>
                                <div className="grid gap-2">
                                  <div>
                                    <span className="text-sm text-600">
                                      Antes:
                                    </span>
                                    <div className="text-sm font-mono bg-red-50 p-2 border-round mt-1">
                                      {typeof antes === "string" ||
                                      typeof antes === "number"
                                        ? antes
                                        : JSON.stringify(antes)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm text-600">
                                      Después:
                                    </span>
                                    <div className="text-sm font-mono bg-green-50 p-2 border-round mt-1">
                                      {typeof despues === "string" ||
                                      typeof despues === "number"
                                        ? despues
                                        : JSON.stringify(despues)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </>
                    )}

                    {changeCount === 0 && (
                      <div className="text-center text-600 mt-3">
                        <i className="pi pi-info-circle mr-2"></i>
                        No hay cambios visibles en este evento
                      </div>
                    )}
                  </div>
                </AccordionTab>
              );
            })}
          </Accordion>
        </div>
      ) : (
        <div className="m-3 p-3 border-round surface-50 text-center text-600">
          <i className="pi pi-inbox mr-2"></i>
          No hay registros de auditoría disponibles
        </div>
      )}
    </Dialog>
  );
};

export default AuditHistoryDialog;
