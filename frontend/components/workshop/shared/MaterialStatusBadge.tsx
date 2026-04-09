"use client";
import React from "react";
import { Tag } from "primereact/tag";

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

interface StatusDef {
  label: string;
  severity: TagSeverity;
  icon: string;
}

const STATUS_MAP: Record<string, StatusDef> = {
  REQUESTED: { label: "Solicitado", severity: "info", icon: "pi pi-send" },
  RESERVED:  { label: "Reservado",  severity: "warning", icon: "pi pi-lock" },
  DISPATCHED:{ label: "Despachado", severity: "contrast", icon: "pi pi-box" },
  CONSUMED:  { label: "Consumido",  severity: "success", icon: "pi pi-check" },
  RETURNED:  { label: "Devuelto",   severity: "secondary", icon: "pi pi-replay" },
  CANCELLED: { label: "Cancelado",  severity: "danger", icon: "pi pi-times" },
};

interface MaterialStatusBadgeProps {
  status: string;
}

export default function MaterialStatusBadge({ status }: MaterialStatusBadgeProps) {
  const def = STATUS_MAP[status] ?? { label: status, severity: "secondary" as TagSeverity, icon: "pi pi-question" };
  return (
    <Tag
      value={def.label}
      severity={def.severity}
      icon={def.icon}
      rounded
    />
  );
}
