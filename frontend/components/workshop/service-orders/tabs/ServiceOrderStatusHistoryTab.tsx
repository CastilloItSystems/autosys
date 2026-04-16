"use client";

import React, { useEffect, useState } from "react";
import { Timeline } from "primereact/timeline";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { serviceOrderService } from "@/app/api/workshop";
import type { ServiceOrderStatusHistoryEntry } from "@/libs/interfaces/workshop";

interface Props {
  serviceOrderId: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  OPEN: "Abierta",
  DIAGNOSING: "Diagnóstico",
  PENDING_APPROVAL: "Pend. Aprobación",
  APPROVED: "Aprobada",
  IN_PROGRESS: "En Proceso",
  PAUSED: "Pausada",
  WAITING_PARTS: "Esperando Repuestos",
  WAITING_AUTH: "Esperando Autorización",
  QUALITY_CHECK: "Control Calidad",
  READY: "Lista",
  DELIVERED: "Entregada",
  INVOICED: "Facturada",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
};

const terminalStatuses = new Set(["DELIVERED", "INVOICED", "CLOSED", "CANCELLED"]);

export default function ServiceOrderStatusHistoryTab({ serviceOrderId }: Props) {
  const [rows, setRows] = useState<ServiceOrderStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await serviceOrderService.getStatusHistory(serviceOrderId, {
          page: 1,
          limit: 100,
        });
        setRows(res.data ?? []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    if (serviceOrderId) {
      load();
    }
  }, [serviceOrderId]);

  const marker = (entry: ServiceOrderStatusHistoryEntry) => {
    const isTerminal = terminalStatuses.has(entry.newStatus);
    return (
      <span
        className={`flex w-2rem h-2rem align-items-center justify-content-center border-circle ${
          isTerminal ? "bg-green-100" : "bg-blue-100"
        }`}
      >
        <i className={`pi pi-arrow-right ${isTerminal ? "text-green-600" : "text-blue-600"}`} />
      </span>
    );
  };

  const content = (entry: ServiceOrderStatusHistoryEntry) => {
    const prev = entry.previousStatus ? STATUS_LABELS[entry.previousStatus] : "Sin estado";
    const next = STATUS_LABELS[entry.newStatus] ?? entry.newStatus;

    return (
      <div className="pb-3">
        <div className="flex align-items-center gap-2 flex-wrap">
          <Tag value={`${prev} -> ${next}`} severity="info" />
          <span className="text-xs text-500">
            {new Date(entry.createdAt).toLocaleString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="text-sm text-600 mt-1">
          <i className="pi pi-user mr-1" />
          {entry.userId}
        </div>
        {entry.comment && <p className="m-0 mt-2 text-sm text-700">{entry.comment}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-content-center py-5">
        <ProgressSpinner style={{ width: "2rem", height: "2rem" }} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center text-500 py-5">
        <i className="pi pi-history text-3xl mb-2 block" />
        <span>Sin cambios de estado registrados</span>
      </div>
    );
  }

  return <Timeline value={rows} marker={marker} content={content} />;
}
