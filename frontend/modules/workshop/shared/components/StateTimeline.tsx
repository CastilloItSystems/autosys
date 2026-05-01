"use client";
import React from "react";

export interface StateStep {
  key: string;
  label: string;
  icon?: string;
}

interface StateTimelineProps {
  steps: StateStep[];
  currentStep: string;
  completedSteps?: string[];
}

export default function StateTimeline({
  steps,
  currentStep,
  completedSteps = [],
}: StateTimelineProps) {
  const getStepStatus = (
    key: string
  ): "completed" | "current" | "future" => {
    if (completedSteps.includes(key)) return "completed";
    if (key === currentStep) return "current";
    return "future";
  };

  return (
    <>
      {/* Desktop: horizontal */}
      <div className="hidden md:flex align-items-center w-full">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          return (
            <React.Fragment key={step.key}>
              {/* Step node */}
              <div className="flex flex-column align-items-center gap-1" style={{ minWidth: 72 }}>
                {/* Circle */}
                <div
                  className={`flex align-items-center justify-content-center border-circle transition-all transition-duration-300${
                    status === "completed"
                      ? " bg-primary border-primary"
                      : status === "current"
                        ? " bg-primary border-primary"
                        : " bg-surface-100 border-300"
                  }`}
                  style={{
                    width: 36,
                    height: 36,
                    border: `2px solid`,
                    boxShadow:
                      status === "current"
                        ? "0 0 0 4px var(--primary-100)"
                        : undefined,
                  }}
                >
                  {status === "completed" ? (
                    <i className="pi pi-check text-white text-sm" />
                  ) : status === "current" ? (
                    <i
                      className={`pi ${step.icon ?? "pi-circle-fill"} text-white text-sm`}
                    />
                  ) : (
                    <i
                      className={`pi ${step.icon ?? "pi-circle"} text-400 text-sm`}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs text-center font-medium${
                    status === "future" ? " text-400" : " text-900"
                  }`}
                  style={{ maxWidth: 72 }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className="flex-1"
                  style={{
                    height: 2,
                    background:
                      getStepStatus(steps[index + 1].key) !== "future" ||
                      completedSteps.includes(step.key)
                        ? "var(--primary-color)"
                        : "var(--surface-300)",
                    marginBottom: 20,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: vertical list */}
      <div className="flex md:hidden flex-column gap-2">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          return (
            <div key={step.key} className="flex align-items-center gap-3">
              {/* Circle */}
              <div
                className={`flex align-items-center justify-content-center border-circle flex-shrink-0${
                  status === "completed"
                    ? " bg-primary"
                    : status === "current"
                      ? " bg-primary"
                      : " bg-surface-100"
                }`}
                style={{
                  width: 32,
                  height: 32,
                  border: `2px solid ${status === "future" ? "var(--surface-300)" : "var(--primary-color)"}`,
                  boxShadow:
                    status === "current"
                      ? "0 0 0 4px var(--primary-100)"
                      : undefined,
                }}
              >
                {status === "completed" ? (
                  <i className="pi pi-check text-white text-xs" />
                ) : status === "current" ? (
                  <i
                    className={`pi ${step.icon ?? "pi-circle-fill"} text-white text-xs`}
                  />
                ) : (
                  <i
                    className={`pi ${step.icon ?? "pi-circle"} text-400 text-xs`}
                  />
                )}
              </div>

              {/* Label + step number */}
              <div className="flex flex-column">
                <span
                  className={`text-sm font-medium${status === "future" ? " text-400" : " text-900"}`}
                >
                  {step.label}
                </span>
                <span className="text-xs text-500">
                  Paso {index + 1} de {steps.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
