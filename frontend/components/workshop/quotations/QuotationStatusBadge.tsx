"use client";
import { Tag } from "primereact/tag";
import type { QuotationStatus, QuotationItemType } from "@/libs/interfaces/workshop";

type Severity = "success" | "info" | "warning" | "danger" | "secondary";

const STATUS_CONFIG: Record<QuotationStatus, { label: string; severity: Severity; icon: string }> = {
  DRAFT:            { label: "Borrador",          severity: "secondary", icon: "pi pi-file-edit" },
  ISSUED:           { label: "Emitida",            severity: "info",      icon: "pi pi-file" },
  SENT:             { label: "Enviada",             severity: "info",      icon: "pi pi-send" },
  PENDING_APPROVAL: { label: "Pend. aprobación",   severity: "warning",   icon: "pi pi-clock" },
  APPROVED_TOTAL:   { label: "Aprobada total",      severity: "success",   icon: "pi pi-check-circle" },
  APPROVED_PARTIAL: { label: "Aprobada parcial",    severity: "success",   icon: "pi pi-check" },
  REJECTED:         { label: "Rechazada",           severity: "danger",    icon: "pi pi-times-circle" },
  EXPIRED:          { label: "Vencida",             severity: "danger",    icon: "pi pi-calendar-times" },
  CONVERTED:        { label: "Convertida en OS",    severity: "success",   icon: "pi pi-arrow-right" },
};

export const QUOTATION_STATUS_OPTIONS = (Object.entries(STATUS_CONFIG) as [QuotationStatus, typeof STATUS_CONFIG[QuotationStatus]][]).map(
  ([value, { label }]) => ({ label, value })
);

export const QUOTATION_ITEM_TYPE_OPTIONS: { label: string; value: QuotationItemType }[] = [
  { label: "Mano de obra",        value: "LABOR" },
  { label: "Repuesto",            value: "PART" },
  { label: "Insumo / Lubricante", value: "CONSUMABLE" },
  { label: "Servicio externo (T.O.T.)", value: "EXTERNAL_SERVICE" },
  { label: "Cortesía",            value: "COURTESY" },
];

export const QUOTATION_ITEM_TYPE_LABELS: Record<QuotationItemType, string> = {
  LABOR:            "Mano de obra",
  PART:             "Repuesto",
  CONSUMABLE:       "Insumo",
  EXTERNAL_SERVICE: "T.O.T.",
  COURTESY:         "Cortesía",
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Tag value={cfg?.label ?? status} severity={cfg?.severity ?? "info"} icon={cfg?.icon} rounded />;
}
