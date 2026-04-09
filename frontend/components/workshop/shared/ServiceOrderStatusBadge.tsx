"use client";
import React from "react";
import { Tag } from "primereact/tag";
import type { ServiceOrderStatus, ServiceOrderPriority } from "@/libs/interfaces/workshop";

// ─── Status ───────────────────────────────────────────────────────────────────

export const SO_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  DRAFT: "Borrador",
  OPEN: "Abierta",
  DIAGNOSING: "Diagnóstico",
  PENDING_APPROVAL: "Pend. aprobación",
  APPROVED: "Aprobada",
  IN_PROGRESS: "En proceso",
  PAUSED: "Pausada",
  WAITING_PARTS: "Esp. refacciones",
  WAITING_AUTH: "Esp. autorización",
  QUALITY_CHECK: "Control calidad",
  READY: "Lista",
  DELIVERED: "Entregada",
  INVOICED: "Facturada",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
};

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

export const SO_STATUS_SEVERITY: Record<ServiceOrderStatus, TagSeverity> = {
  DRAFT: "secondary",
  OPEN: "info",
  DIAGNOSING: "info",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  IN_PROGRESS: "warning",
  PAUSED: "warning",
  WAITING_PARTS: "warning",
  WAITING_AUTH: "warning",
  QUALITY_CHECK: "contrast",
  READY: "success",
  DELIVERED: "success",
  INVOICED: "success",
  CLOSED: "secondary",
  CANCELLED: "danger",
};

interface ServiceOrderStatusBadgeProps {
  status: ServiceOrderStatus;
  rounded?: boolean;
}

export function ServiceOrderStatusBadge({ status, rounded = true }: ServiceOrderStatusBadgeProps) {
  return (
    <Tag
      value={SO_STATUS_LABELS[status] ?? status}
      severity={SO_STATUS_SEVERITY[status]}
      rounded={rounded}
    />
  );
}

// ─── Priority ─────────────────────────────────────────────────────────────────

export const SO_PRIORITY_LABELS: Record<ServiceOrderPriority, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  ASAP: "Urgente",
};

export const SO_PRIORITY_SEVERITY: Record<ServiceOrderPriority, TagSeverity> = {
  LOW: "secondary",
  NORMAL: "info",
  HIGH: "warning",
  ASAP: "danger",
};

interface ServiceOrderPriorityBadgeProps {
  priority: ServiceOrderPriority;
  rounded?: boolean;
}

export function ServiceOrderPriorityBadge({ priority, rounded = true }: ServiceOrderPriorityBadgeProps) {
  return (
    <Tag
      value={SO_PRIORITY_LABELS[priority] ?? priority}
      severity={SO_PRIORITY_SEVERITY[priority]}
      rounded={rounded}
    />
  );
}

// ─── Dropdown options ─────────────────────────────────────────────────────────

export const SO_STATUS_OPTIONS = (Object.keys(SO_STATUS_LABELS) as ServiceOrderStatus[]).map((v) => ({
  label: SO_STATUS_LABELS[v],
  value: v,
}));

export const SO_PRIORITY_OPTIONS = (Object.keys(SO_PRIORITY_LABELS) as ServiceOrderPriority[]).map((v) => ({
  label: SO_PRIORITY_LABELS[v],
  value: v,
}));
