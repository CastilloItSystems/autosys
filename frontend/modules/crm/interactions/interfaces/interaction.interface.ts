// libs/interfaces/crm/interaction.interface.ts

export enum InteractionType {
  CALL = "CALL",
  WHATSAPP = "WHATSAPP",
  EMAIL = "EMAIL",
  VISIT = "VISIT",
  NOTE = "NOTE",
  QUOTE = "QUOTE",
  FOLLOW_UP = "FOLLOW_UP",
  MEETING = "MEETING",
}

export enum InteractionChannel {
  REPUESTOS = "REPUESTOS",
  TALLER = "TALLER",
  VEHICULOS = "VEHICULOS",
  GENERAL = "GENERAL",
}

export enum InteractionDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

export interface Interaction {
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
  type: InteractionType | string;
  channel: InteractionChannel | string;
  direction: InteractionDirection | string;
  subject?: string | null;
  notes: string;
  outcome?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InteractionListResponse {
  data: Interaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InteractionResponse {
  data: Interaction;
}

// ── Config de UI ──────────────────────────────────────────────────────────────

export const INTERACTION_TYPE_CONFIG = {
  CALL: {
    label: "Llamada",
    icon: "pi pi-phone",
    severity: "info" as const,
  },
  WHATSAPP: {
    label: "WhatsApp",
    icon: "pi pi-comments",
    severity: "success" as const,
  },
  EMAIL: {
    label: "Correo",
    icon: "pi pi-envelope",
    severity: "info" as const,
  },
  VISIT: {
    label: "Visita",
    icon: "pi pi-map-marker",
    severity: "warning" as const,
  },
  NOTE: {
    label: "Nota",
    icon: "pi pi-pencil",
    severity: "secondary" as const,
  },
  QUOTE: {
    label: "Cotización",
    icon: "pi pi-file",
    severity: "warning" as const,
  },
  FOLLOW_UP: {
    label: "Seguimiento",
    icon: "pi pi-sync",
    severity: "warning" as const,
  },
  MEETING: {
    label: "Reunión",
    icon: "pi pi-calendar",
    severity: "success" as const,
  },
} as const;

export const INTERACTION_CHANNEL_CONFIG = {
  REPUESTOS: { label: "Repuestos", severity: "info" as const },
  TALLER: { label: "Taller", severity: "warning" as const },
  VEHICULOS: { label: "Vehículos", severity: "success" as const },
  GENERAL: { label: "General", severity: "secondary" as const },
} as const;

export const INTERACTION_DIRECTION_CONFIG = {
  INBOUND: { label: "Entrante", icon: "pi pi-arrow-down", severity: "success" as const },
  OUTBOUND: { label: "Saliente", icon: "pi pi-arrow-up", severity: "info" as const },
} as const;

export const INTERACTION_TYPE_OPTIONS = Object.entries(
  INTERACTION_TYPE_CONFIG
).map(([value, cfg]) => ({ label: cfg.label, value }));

export const INTERACTION_CHANNEL_OPTIONS = Object.entries(
  INTERACTION_CHANNEL_CONFIG
).map(([value, cfg]) => ({ label: cfg.label, value }));
