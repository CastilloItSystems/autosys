"use client";
import React from "react";
import {
  QuotationStatus,
  QUOTATION_STATUS_STEPS,
} from "@/libs/interfaces/workshop/quotation.interface";

type Severity = "success" | "info" | "warning" | "danger" | "secondary";

const STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; severity: Severity; icon: string }
> = {
  DRAFT: { label: "Borrador", severity: "secondary", icon: "pi pi-file-edit" },
  ISSUED: { label: "Emitida", severity: "info", icon: "pi pi-file" },
  SENT: { label: "Enviada", severity: "info", icon: "pi pi-send" },
  PENDING_APPROVAL: {
    label: "Pend. aprobación",
    severity: "warning",
    icon: "pi pi-clock",
  },
  APPROVED_TOTAL: {
    label: "Aprobada",
    severity: "success",
    icon: "pi pi-check-circle",
  },
  APPROVED_PARTIAL: {
    label: "Aprobada",
    severity: "success",
    icon: "pi pi-check",
  },
  REJECTED: {
    label: "Rechazada",
    severity: "danger",
    icon: "pi pi-times-circle",
  },
  EXPIRED: {
    label: "Vencida",
    severity: "danger",
    icon: "pi pi-calendar-times",
  },
  CONVERTED: {
    label: "Orden de Servicio",
    severity: "success",
    icon: "pi pi-arrow-right",
  },
};

interface QuotationStepperProps {
  currentStatus: QuotationStatus;
}

const QuotationStepper = ({ currentStatus }: QuotationStepperProps) => {
  const isRejected = currentStatus === "REJECTED";
  const isExpired = currentStatus === "EXPIRED";

  // Map APPROVED_PARTIAL to APPROVED_TOTAL for the stepper index calculation
  let effectiveStatus = currentStatus;
  if (currentStatus === "APPROVED_PARTIAL") effectiveStatus = "APPROVED_TOTAL";

  const currentIdx = QUOTATION_STATUS_STEPS.indexOf(effectiveStatus as any);

  if (isRejected || isExpired) {
    const config = STATUS_CONFIG[currentStatus];
    return (
      <div className="flex align-items-center justify-content-center py-2">
        <div
          className={`flex align-items-center gap-2 px-3 py-2 border-round bg-${
            config.severity === "danger" ? "red" : "gray"
          }-50 border-1 border-${
            config.severity === "danger" ? "red" : "gray"
          }-200`}
        >
          <i
            className={`${config.icon} text-${
              config.severity === "danger" ? "red" : "gray"
            }-500 text-xl`}
          ></i>
          <span
            className={`text-${
              config.severity === "danger" ? "red" : "gray"
            }-700 font-semibold`}
          >
            Cotización {config.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex align-items-center justify-content-center py-4 gap-0 overflow-x-auto">
      {QUOTATION_STATUS_STEPS.map((step, idx) => {
        const config = STATUS_CONFIG[step];
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx || currentStatus === "CONVERTED";
        const isPending = idx > currentIdx && currentStatus !== "CONVERTED";

        return (
          <React.Fragment key={step}>
            {/* Step circle */}
            <div
              className="flex flex-column align-items-center"
              style={{ minWidth: "100px" }}
            >
              <div
                className={`flex align-items-center justify-content-center border-circle transition-all transition-duration-300 ${
                  isCompleted
                    ? "bg-green-500 text-white shadow-2"
                    : isActive
                    ? "bg-primary text-white shadow-3 scale-110"
                    : "surface-200 text-500"
                }`}
                style={{ width: "40px", height: "40px", zIndex: 1 }}
              >
                {isCompleted ? (
                  <i className="pi pi-check text-sm font-bold"></i>
                ) : (
                  <i className={`${config.icon} text-sm`}></i>
                )}
              </div>
              <span
                className={`text-xs mt-2 text-center font-bold px-2 ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-green-600"
                    : "text-500"
                }`}
                style={{ whiteSpace: "nowrap" }}
              >
                {config.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < QUOTATION_STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 transition-all transition-duration-500 ${
                  idx < currentIdx || currentStatus === "CONVERTED"
                    ? "bg-green-500"
                    : "surface-300"
                }`}
                style={{
                  height: "3px",
                  minWidth: "30px",
                  marginTop: "-20px",
                  marginLeft: "-10px",
                  marginRight: "-10px",
                }}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default QuotationStepper;
