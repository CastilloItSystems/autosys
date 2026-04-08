"use client";
import React from "react";
import type { ServiceOrderStatus } from "@/libs/interfaces/workshop";
import {
  SO_STATUS_LABELS,
} from "@/components/workshop/shared/ServiceOrderStatusBadge";

interface ServiceOrderStepperProps {
  currentStatus: ServiceOrderStatus;
}

// Flujo lineal principal
const SO_STATUS_STEPS: ServiceOrderStatus[] = [
  "DRAFT",
  "OPEN",
  "DIAGNOSING",
  "APPROVED",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "READY",
  "DELIVERED",
  "CLOSED",
];

const SO_STATUS_ICONS: Record<ServiceOrderStatus, string> = {
  DRAFT: "pi pi-file",
  OPEN: "pi pi-folder-open",
  DIAGNOSING: "pi pi-search",
  PENDING_APPROVAL: "pi pi-clock",
  APPROVED: "pi pi-thumbs-up",
  IN_PROGRESS: "pi pi-wrench",
  PAUSED: "pi pi-pause",
  WAITING_PARTS: "pi pi-box",
  WAITING_AUTH: "pi pi-lock",
  QUALITY_CHECK: "pi pi-verified",
  READY: "pi pi-check-circle",
  DELIVERED: "pi pi-car",
  INVOICED: "pi pi-receipt",
  CLOSED: "pi pi-lock",
  CANCELLED: "pi pi-times-circle",
};

const WAITING_STATES: ServiceOrderStatus[] = [
  "PAUSED",
  "WAITING_PARTS",
  "WAITING_AUTH",
  "PENDING_APPROVAL",
];

export default function ServiceOrderStepper({
  currentStatus,
}: ServiceOrderStepperProps) {
  const isCancelled = currentStatus === "CANCELLED";
  const isWaiting = WAITING_STATES.includes(currentStatus);

  // Para estados de espera, el paso activo sigue siendo IN_PROGRESS
  const effectiveStatus: ServiceOrderStatus = isWaiting
    ? "IN_PROGRESS"
    : currentStatus;

  const currentIdx = SO_STATUS_STEPS.indexOf(effectiveStatus);

  if (isCancelled) {
    return (
      <div className="flex align-items-center justify-content-center py-2">
        <div className="flex align-items-center gap-2 px-3 py-2 border-round bg-red-50 border-1 border-red-200">
          <i className="pi pi-times-circle text-red-500 text-xl" />
          <span className="text-red-700 font-semibold">Orden Cancelada</span>
        </div>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="flex flex-column align-items-center gap-2 py-2">
        <div className="flex align-items-center gap-2 px-3 py-2 border-round bg-orange-50 border-1 border-orange-200">
          <i
            className={`${SO_STATUS_ICONS[currentStatus]} text-orange-500 text-xl`}
          />
          <span className="text-orange-700 font-semibold">
            {SO_STATUS_LABELS[currentStatus]}
          </span>
        </div>
        <span className="text-xs text-500">
          (la OT retomará desde "En Proceso" al reactivarse)
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex align-items-center justify-content-center py-2 gap-0"
      style={{ overflowX: "auto" }}
    >
      {SO_STATUS_STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;
        const icon = SO_STATUS_ICONS[step];

        return (
          <React.Fragment key={step}>
            <div
              className="flex flex-column align-items-center"
              style={{ minWidth: "72px" }}
            >
              <div
                className={`flex align-items-center justify-content-center border-circle ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-primary text-white"
                    : "surface-200 text-500"
                }`}
                style={{ width: "36px", height: "36px", flexShrink: 0 }}
              >
                {isCompleted ? (
                  <i className="pi pi-check text-sm" />
                ) : (
                  <i className={`${icon} text-sm`} />
                )}
              </div>
              <span
                className={`text-xs mt-1 text-center font-medium ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-green-600"
                    : "text-500"
                }`}
                style={{ lineHeight: "1.2" }}
              >
                {SO_STATUS_LABELS[step]}
              </span>
            </div>

            {idx < SO_STATUS_STEPS.length - 1 && (
              <div
                className={idx < currentIdx ? "bg-green-500" : "surface-300"}
                style={{
                  height: "3px",
                  minWidth: "28px",
                  flex: "1 1 0",
                  marginTop: "-14px",
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
