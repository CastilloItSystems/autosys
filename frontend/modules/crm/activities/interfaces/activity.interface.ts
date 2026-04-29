// libs/interfaces/crm/activity.interface.ts

export enum ActivityType {
  CALL = "CALL",
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  MEETING = "MEETING",
  QUOTE = "QUOTE",
  TASK = "TASK",
}

export enum ActivityStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

export interface Activity {
  id: string;
  empresaId: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    code: string;
  } | null;
  leadId?: string | null;
  lead?: {
    id: string;
    title: string;
    channel: string;
  } | null;
  type: ActivityType | string;
  status: ActivityStatus | string;
  title: string;
  description?: string | null;
  assignedTo: string;
  dueAt: string;
  completedAt?: string | null;
  completedBy?: string | null;
  outcome?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityListResponse {
  data: Activity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityResponse {
  data: Activity;
}

// ── Config de UI ──────────────────────────────────────────────────────────────

export const ACTIVITY_TYPE_CONFIG = {
  CALL: {
    label: "Llamada",
    icon: "pi pi-phone",
    severity: "info" as const,
  },
  EMAIL: {
    label: "Correo",
    icon: "pi pi-envelope",
    severity: "info" as const,
  },
  WHATSAPP: {
    label: "WhatsApp",
    icon: "pi pi-comments",
    severity: "success" as const,
  },
  MEETING: {
    label: "Reunión",
    icon: "pi pi-calendar",
    severity: "success" as const,
  },
  QUOTE: {
    label: "Cotización",
    icon: "pi pi-file",
    severity: "warning" as const,
  },
  TASK: {
    label: "Tarea",
    icon: "pi pi-check-square",
    severity: "secondary" as const,
  },
} as const;

export const ACTIVITY_STATUS_CONFIG = {
  PENDING: {
    label: "Pendiente",
    icon: "pi pi-clock",
    severity: "warning" as const,
  },
  IN_PROGRESS: {
    label: "En Progreso",
    icon: "pi pi-spin pi-spinner",
    severity: "info" as const,
  },
  DONE: {
    label: "Completada",
    icon: "pi pi-check-circle",
    severity: "success" as const,
  },
  CANCELLED: {
    label: "Cancelada",
    icon: "pi pi-times-circle",
    severity: "danger" as const,
  },
} as const;

export const ACTIVITY_TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_CONFIG).map(
  ([value, cfg]) => ({ label: cfg.label, value })
);

export const ACTIVITY_STATUS_OPTIONS = Object.entries(
  ACTIVITY_STATUS_CONFIG
).map(([value, cfg]) => ({ label: cfg.label, value }));
