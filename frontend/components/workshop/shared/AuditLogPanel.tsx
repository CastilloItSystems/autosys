"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Timeline } from "primereact/timeline";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  description?: string | null;
  userId?: string | null;
  createdAt: string;
  previousData?: any;
  newData?: any;
}

interface AuditLogPanelProps {
  entityType: string;
  entityId: string;
}

type TagSeverity =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "secondary"
  | "contrast"
  | undefined;

const ACTION_SEVERITY: Record<string, TagSeverity> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  APPROVE: "success",
  REJECT: "danger",
  CANCEL: "warning",
  COMPLETE: "success",
  ASSIGN: "info",
};

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Creado",
  UPDATE: "Actualizado",
  DELETE: "Eliminado",
  APPROVE: "Aprobado",
  REJECT: "Rechazado",
  CANCEL: "Cancelado",
  COMPLETE: "Completado",
  ASSIGN: "Asignado",
};

const ACTION_ICON: Record<string, string> = {
  CREATE: "pi-plus-circle",
  UPDATE: "pi-pencil",
  DELETE: "pi-trash",
  APPROVE: "pi-check-circle",
  REJECT: "pi-times-circle",
  CANCEL: "pi-ban",
  COMPLETE: "pi-check",
  ASSIGN: "pi-user",
};

export default function AuditLogPanel({ entityType, entityId }: AuditLogPanelProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const mod = await import("@/app/api/workshop").catch(() => null);
      const svc = (mod as any)?.auditLogService;
      if (svc?.getAuditLogs) {
        const data = await svc.getAuditLogs(entityType, entityId);
        setEntries(data ?? []);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) {
      loadEntries();
    }
  }, [entityId, loadEntries]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const markerTemplate = (entry: AuditEntry) => {
    const iconKey = ACTION_ICON[entry.action] ?? "pi-info-circle";
    const severity = ACTION_SEVERITY[entry.action] ?? "info";
    const bgClass =
      severity === "success"
        ? "bg-green-100"
        : severity === "danger"
          ? "bg-red-100"
          : severity === "warning"
            ? "bg-orange-100"
            : "bg-blue-100";
    const iconClass =
      severity === "success"
        ? "text-green-600"
        : severity === "danger"
          ? "text-red-600"
          : severity === "warning"
            ? "text-orange-600"
            : "text-blue-600";

    return (
      <div
        className={`flex align-items-center justify-content-center border-circle ${bgClass}`}
        style={{ width: 32, height: 32 }}
      >
        <i className={`pi ${iconKey} text-sm ${iconClass}`} />
      </div>
    );
  };

  const contentTemplate = (entry: AuditEntry) => {
    return (
      <div className="flex flex-column gap-1 pb-3">
        <div className="flex align-items-center gap-2 flex-wrap">
          <Tag
            value={ACTION_LABEL[entry.action] ?? entry.action}
            severity={ACTION_SEVERITY[entry.action]}
          />
          <span className="text-xs text-400">{formatDate(entry.createdAt)}</span>
          {entry.userId && (
            <span className="text-xs text-500">
              <i className="pi pi-user text-xs mr-1" />
              {entry.userId}
            </span>
          )}
        </div>
        {entry.description && (
          <p className="text-sm text-700 m-0">{entry.description}</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-content-center p-4">
        <ProgressSpinner style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-5 text-500">
        <i className="pi pi-history text-4xl mb-2" />
        <span className="text-sm">Sin registros de auditoría</span>
      </div>
    );
  }

  return (
    <Timeline
      value={entries}
      marker={markerTemplate}
      content={contentTemplate}
      className="w-full"
    />
  );
}
