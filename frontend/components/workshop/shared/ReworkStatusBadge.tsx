"use client";
import React from "react";
import { Tag } from "primereact/tag";
import type { ReworkStatus } from "@/libs/interfaces/workshop";

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

export const REWORK_STATUS_LABELS: Record<ReworkStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En proceso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export const REWORK_STATUS_SEVERITY: Record<ReworkStatus, TagSeverity> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "secondary",
};

interface ReworkStatusBadgeProps {
  status: ReworkStatus;
  rounded?: boolean;
}

export function ReworkStatusBadge({ status, rounded = true }: ReworkStatusBadgeProps) {
  return (
    <Tag
      value={REWORK_STATUS_LABELS[status] ?? status}
      severity={REWORK_STATUS_SEVERITY[status]}
      rounded={rounded}
    />
  );
}

export const REWORK_STATUS_OPTIONS = (Object.keys(REWORK_STATUS_LABELS) as ReworkStatus[]).map(
  (v) => ({
    label: REWORK_STATUS_LABELS[v],
    value: v,
  })
);

/** Allowed next statuses for a given current status */
export const REWORK_STATUS_TRANSITIONS: Record<ReworkStatus, ReworkStatus[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export default ReworkStatusBadge;
