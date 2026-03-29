"use client";
import React from "react";
import { Tag } from "primereact/tag";
import type { WarrantyStatus, WarrantyType } from "@/libs/interfaces/workshop";

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

export const WARRANTY_STATUS_LABELS: Record<WarrantyStatus, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En proceso",
  RESOLVED: "Resuelta",
  REJECTED: "Rechazada",
  CLOSED: "Cerrada",
};

export const WARRANTY_STATUS_SEVERITY: Record<WarrantyStatus, TagSeverity> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  REJECTED: "danger",
  CLOSED: "secondary",
};

export const WARRANTY_TYPE_LABELS: Record<WarrantyType, string> = {
  LABOR: "Mano de obra",
  PARTS: "Refacciones",
  MIXED: "Mixta",
  COMMERCIAL: "Comercial",
};

interface WarrantyStatusBadgeProps {
  status: WarrantyStatus;
  rounded?: boolean;
}

export function WarrantyStatusBadge({ status, rounded = true }: WarrantyStatusBadgeProps) {
  return (
    <Tag
      value={WARRANTY_STATUS_LABELS[status] ?? status}
      severity={WARRANTY_STATUS_SEVERITY[status]}
      rounded={rounded}
    />
  );
}

export const WARRANTY_STATUS_OPTIONS = (Object.keys(WARRANTY_STATUS_LABELS) as WarrantyStatus[]).map((v) => ({
  label: WARRANTY_STATUS_LABELS[v],
  value: v,
}));

export const WARRANTY_TYPE_OPTIONS = (Object.keys(WARRANTY_TYPE_LABELS) as WarrantyType[]).map((v) => ({
  label: WARRANTY_TYPE_LABELS[v],
  value: v,
}));
