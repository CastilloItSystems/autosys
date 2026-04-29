// modules/crm/cases/utils/case.utils.ts

import {
  CASE_STATUS_OPTIONS,
  CASE_TYPE_OPTIONS,
  CASE_PRIORITY_OPTIONS,
} from "../interfaces/case.interface";

export const CASE_REF_DOC_TYPE_OPTIONS = [
  { label: "Factura", value: "invoice" },
  { label: "Orden de Taller", value: "service_order" },
  { label: "Pedido", value: "order" },
  { label: "Otro", value: "other" },
];

export const CASE_TYPE_FILTER_OPTIONS = [
  { label: "Todos los tipos", value: "" },
  ...CASE_TYPE_OPTIONS,
];

export const CASE_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estados", value: "" },
  ...CASE_STATUS_OPTIONS,
];

export const CASE_PRIORITY_FILTER_OPTIONS = [
  { label: "Todas las prioridades", value: "" },
  ...CASE_PRIORITY_OPTIONS,
];

export const CASE_TERMINAL_STATUSES = ["CLOSED", "REJECTED"];

export const CASE_KANBAN_STATUSES = [
  "OPEN",
  "IN_ANALYSIS",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "ESCALATED",
  "RESOLVED",
] as const;

export type CaseKanbanStatus = (typeof CASE_KANBAN_STATUSES)[number];

export const CASE_STATUS_COLORS: Record<string, string> = {
  OPEN: "#3B82F6",
  IN_ANALYSIS: "#6366F1",
  IN_PROGRESS: "#F97316",
  WAITING_CLIENT: "#EAB308",
  ESCALATED: "#EF4444",
  RESOLVED: "#22C55E",
};

export const CASE_DIALOG_REQUIRED_STATUSES = ["RESOLVED", "CLOSED", "REJECTED"];

export const CASE_PRIORITY_KANBAN_OPTIONS = [
  { label: "Todas las prioridades", value: "" },
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
  { label: "Crítica", value: "CRITICAL" },
];
