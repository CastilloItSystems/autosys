"use client";
import React from "react";
import { Tag } from "primereact/tag";
import DiagnosisSeverityBadge from "@/components/workshop/shared/DiagnosisSeverityBadge";
import type { Diagnosis, DiagnosisStatus } from "@/libs/interfaces/workshop";

interface ProgressItem {
  label: string;
  completed: boolean;
}

interface Props {
  diagnosis: Diagnosis | null;
  progressItems?: ProgressItem[];
}

const STATUS_CONFIG: Record<DiagnosisStatus, { label: string; classes: string }> = {
  DRAFT: { label: "Borrador", classes: "bg-surface-100 text-500 border-surface-300" },
  COMPLETED: { label: "Completado", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  APPROVED_INTERNAL: { label: "Aprobado", classes: "bg-green-50 text-green-700 border-green-200" },
};

export default function DiagnosisHeader({ diagnosis, progressItems = [] }: Props) {
  const statusCfg = diagnosis?.status ? STATUS_CONFIG[diagnosis.status] : null;

  return (
    <div className="surface-0 border-bottom-1 border-200 px-3 py-2 flex align-items-center justify-content-between gap-3 flex-shrink-0">
      {/* Left: datos clave */}
      <div className="flex align-items-center gap-3 min-w-0 flex-wrap">
        {diagnosis?.id ? (
          <>
            <span className="font-bold text-900 text-base white-space-nowrap">
              {diagnosis.serviceOrder?.folio ?? diagnosis.reception?.code ?? diagnosis.id.slice(0, 8)}
            </span>
            {statusCfg && (
              <span className={`text-xs font-semibold px-2 py-1 border-round border-1 white-space-nowrap ${statusCfg.classes}`}>
                {statusCfg.label}
              </span>
            )}
            {diagnosis.severity && (
              <DiagnosisSeverityBadge severity={diagnosis.severity} />
            )}
            {diagnosis.technician?.name && (
              <span className="text-sm text-600 hidden md:inline white-space-nowrap">
                <i className="pi pi-user mr-1 text-400" />
                {diagnosis.technician.name}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-500 font-medium">Nuevo diagnóstico</span>
        )}
      </div>

      {/* Right: mini stepper de progreso */}
      {progressItems.length > 0 && (
        <div className="align-items-center gap-1 hidden lg:flex flex-shrink-0">
          {progressItems.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div
                  className={`border-top-1 ${item.completed ? "border-green-400" : "border-200"}`}
                  style={{ width: 16 }}
                />
              )}
              <div className="flex align-items-center gap-1">
                <div
                  className={`flex align-items-center justify-content-center border-circle font-bold ${
                    item.completed
                      ? "bg-green-500 text-white"
                      : "surface-200 text-500"
                  }`}
                  style={{ width: 18, height: 18, fontSize: 9 }}
                >
                  {item.completed ? (
                    <i className="pi pi-check" style={{ fontSize: 8 }} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs white-space-nowrap ${item.completed ? "text-green-600 font-medium" : "text-400"}`}>
                  {item.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
