"use client";

import { useEffect, useState } from "react";
import { Timeline } from "primereact/timeline";
import { ProgressSpinner } from "primereact/progressspinner";
import auditService, {
  AuditLogEntry,
  actionLabel,
} from "../services/auditService";

interface Props {
  entity: "Order" | "PreInvoice" | "Invoice";
  entityId: string;
}

const ACTION_ICONS: Record<string, string> = {
  CREATE: "pi pi-plus-circle text-green-500",
  UPDATE: "pi pi-pencil text-blue-500",
  APPROVE: "pi pi-check-circle text-green-600",
  DELETE: "pi pi-trash text-red-500",
  CANCEL: "pi pi-ban text-red-600",
  PAYMENT: "pi pi-credit-card text-purple-500",
};

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditTimeline({ entity, entityId }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService
      .getHistory(entity, entityId)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [entity, entityId]);

  if (loading) {
    return (
      <div className="flex justify-content-center p-4">
        <ProgressSpinner style={{ width: "32px", height: "32px" }} />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center text-500 text-sm p-4">
        Sin historial registrado.
      </div>
    );
  }

  return (
    <Timeline
      value={logs}
      opposite={(item: AuditLogEntry) => (
        <span className="text-xs text-500">{formatDateTime(item.createdAt)}</span>
      )}
      content={(item: AuditLogEntry) => (
        <div className="mb-3">
          <div className="font-semibold text-sm">{actionLabel(item.action)}</div>
          {item.userName && (
            <div className="text-xs text-600">por {item.userName}</div>
          )}
        </div>
      )}
      marker={(item: AuditLogEntry) => (
        <i
          className={`${ACTION_ICONS[item.action] ?? "pi pi-circle text-primary"}`}
          style={{ fontSize: "1rem" }}
        />
      )}
    />
  );
}
