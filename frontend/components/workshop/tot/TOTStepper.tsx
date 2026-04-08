"use client";
import React from "react";
import type { TOTStatus } from "@/libs/interfaces/workshop";
import { TOT_STATUS_LABELS } from "./TOTStatusBadge";

interface TOTStepperProps {
  currentStatus: TOTStatus;
}

// Flujo lineal principal para T.O.T.
const TOT_STATUS_STEPS: TOTStatus[] = [
  "REQUESTED",
  "APPROVED",
  "DEPARTED",
  "IN_PROGRESS",
  "RETURNED",
  "INVOICED",
];

const TOT_STATUS_ICONS: Record<TOTStatus, string> = {
  REQUESTED: "pi pi-send",
  APPROVED: "pi pi-thumbs-up",
  DEPARTED: "pi pi-arrow-right",
  IN_PROGRESS: "pi pi-wrench",
  RETURNED: "pi pi-arrow-left",
  INVOICED: "pi pi-file",
  CANCELLED: "pi pi-times-circle",
};

export default function TOTStepper({ currentStatus }: TOTStepperProps) {
  const isCancelled = currentStatus === "CANCELLED";
  const currentIdx = TOT_STATUS_STEPS.indexOf(currentStatus);

  if (isCancelled) {
    return (
      <div className="flex align-items-center justify-content-center py-2">
        <div className="flex align-items-center gap-2 px-3 py-2 border-round bg-red-50 border-1 border-red-200">
          <i className="pi pi-times-circle text-red-500 text-xl" />
          <span className="text-red-700 font-semibold">T.O.T. Cancelado</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex align-items-center justify-content-center py-2 gap-0"
      style={{ overflowX: "auto" }}
    >
      {TOT_STATUS_STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;
        const icon = TOT_STATUS_ICONS[step];

        return (
          <React.Fragment key={step}>
            {/* Conectador anterior */}
            {idx > 0 && (
              <div
                style={{
                  width: "2rem",
                  height: "2px",
                  backgroundColor: isCompleted ? "#10b981" : "#e5e7eb",
                  flexShrink: 0,
                }}
              />
            )}

            {/* Paso */}
            <div
              className="flex flex-column align-items-center gap-1"
              style={{ flexShrink: 0 }}
            >
              <div
                className={`flex align-items-center justify-content-center border-circle ${
                  isActive
                    ? "bg-primary border-2 border-primary text-white"
                    : isCompleted
                    ? "bg-green-500 border-2 border-green-500 text-white"
                    : "bg-surface-200 border-2 border-surface-300 text-600"
                }`}
                style={{ width: "2.5rem", height: "2.5rem" }}
              >
                <i className={`${icon} text-lg`} />
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-green-600"
                    : "text-500"
                }`}
                style={{ maxWidth: "4rem", textAlign: "center" }}
              >
                {TOT_STATUS_LABELS[step]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
