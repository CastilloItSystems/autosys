"use client";
import React from "react";
import {
  ExitNoteStatus,
  EXIT_NOTE_STATUS_CONFIG,
  EXIT_NOTE_STATUS_STEPS,
} from "@/libs/interfaces/inventory/exitNote.interface";

interface ExitNoteStepperProps {
  currentStatus: ExitNoteStatus;
}

const ExitNoteStepper = ({ currentStatus }: ExitNoteStepperProps) => {
  const isCancelled = currentStatus === ExitNoteStatus.CANCELLED;
  const currentIdx = EXIT_NOTE_STATUS_STEPS.indexOf(currentStatus);

  if (isCancelled) {
    return (
      <div className="flex align-items-center justify-content-center py-2">
        <div className="flex align-items-center gap-2 px-3 py-2 border-round bg-red-50 border-1 border-red-200">
          <i className="pi pi-times-circle text-red-500 text-xl"></i>
          <span className="text-red-700 font-semibold">Nota Cancelada</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex align-items-center justify-content-center py-2 gap-0">
      {EXIT_NOTE_STATUS_STEPS.map((step, idx) => {
        const config = EXIT_NOTE_STATUS_CONFIG[step];
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;
        const isPending = idx > currentIdx;

        return (
          <React.Fragment key={step}>
            {/* Step circle */}
            <div
              className="flex flex-column align-items-center"
              style={{ minWidth: "80px" }}
            >
              <div
                className={`flex align-items-center justify-content-center border-circle ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-primary text-white"
                    : "surface-200 text-500"
                }`}
                style={{ width: "36px", height: "36px" }}
              >
                {isCompleted ? (
                  <i className="pi pi-check text-sm"></i>
                ) : (
                  <i className={`${config.icon} text-sm`}></i>
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
              >
                {config.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < EXIT_NOTE_STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 ${
                  idx < currentIdx ? "bg-green-500" : "surface-300"
                }`}
                style={{ height: "3px", minWidth: "40px", marginTop: "-12px" }}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ExitNoteStepper;
