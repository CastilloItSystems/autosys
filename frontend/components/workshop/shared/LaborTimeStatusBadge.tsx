"use client";
import React from "react";
import { Tag } from "primereact/tag";
import type { LaborTimeStatus } from "@/libs/interfaces/workshop";

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

export const LABOR_STATUS_LABELS: Record<LaborTimeStatus, string> = {
  ACTIVE: "En curso",
  PAUSED: "Pausado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export const LABOR_STATUS_SEVERITY: Record<LaborTimeStatus, TagSeverity> = {
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "info",
  CANCELLED: "secondary",
};

interface LaborTimeStatusBadgeProps {
  status: LaborTimeStatus;
  rounded?: boolean;
}

export function LaborTimeStatusBadge({ status, rounded = true }: LaborTimeStatusBadgeProps) {
  return (
    <Tag
      value={LABOR_STATUS_LABELS[status] ?? status}
      severity={LABOR_STATUS_SEVERITY[status]}
      rounded={rounded}
    />
  );
}
