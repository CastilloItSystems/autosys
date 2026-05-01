"use client";
import React from "react";
import { Tag } from "primereact/tag";

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

interface StatusDef {
  label: string;
  severity: TagSeverity;
}

const STATUS_MAP: Record<string, StatusDef> = {
  PROPOSED: { label: "Propuesto", severity: "info" },
  QUOTED:   { label: "Cotizado",  severity: "warning" },
  APPROVED: { label: "Aprobado",  severity: "success" },
  EXECUTED: { label: "Ejecutado", severity: "success" },
  REJECTED: { label: "Rechazado", severity: "danger" },
};

interface AdditionalStatusBadgeProps {
  status: string;
}

export default function AdditionalStatusBadge({ status }: AdditionalStatusBadgeProps) {
  const def = STATUS_MAP[status] ?? { label: status, severity: "secondary" as TagSeverity };
  return (
    <Tag
      value={def.label}
      severity={def.severity}
      rounded
    />
  );
}
