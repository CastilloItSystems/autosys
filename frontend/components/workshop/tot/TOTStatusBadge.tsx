"use client";
import { Tag } from "primereact/tag";
import type { TOTStatus } from "@/libs/interfaces/workshop";

type TagSeverity =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "secondary"
  | "contrast"
  | undefined;

export const TOT_STATUS_LABELS: Record<TOTStatus, string> = {
  REQUESTED: "Solicitado",
  APPROVED: "Aprobado",
  DEPARTED: "Salió",
  IN_PROGRESS: "En proceso",
  RETURNED: "Reingresó",
  INVOICED: "Facturado",
  CANCELLED: "Cancelado",
};

export const TOT_STATUS_SEVERITY: Record<TOTStatus, TagSeverity> = {
  REQUESTED: "info",
  APPROVED: "warning",
  DEPARTED: "warning",
  IN_PROGRESS: "warning",
  RETURNED: "success",
  INVOICED: "success",
  CANCELLED: "danger",
};

interface Props {
  status: TOTStatus;
}

export default function TOTStatusBadge({ status }: Props) {
  return (
    <Tag
      value={TOT_STATUS_LABELS[status]}
      severity={TOT_STATUS_SEVERITY[status]}
      rounded
    />
  );
}
