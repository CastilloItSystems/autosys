// libs/interfaces/crm/lead.interface.ts

export enum LeadSource {
  WALK_IN = "WALK_IN",
  REFERRAL = "REFERRAL",
  PHONE = "PHONE",
  WHATSAPP = "WHATSAPP",
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
  WEBSITE = "WEBSITE",
  EMAIL = "EMAIL",
  OTHER = "OTHER",
}

export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION",
  WON = "WON",
  LOST = "LOST",
}

export enum LeadChannel {
  REPUESTOS = "REPUESTOS",
  TALLER = "TALLER",
  VEHICULOS = "VEHICULOS",
}

export interface Lead {
  id: string;
  empresaId: string;
  customerId?: string | null;
  customer?: {
    id: string;
    name: string;
    code: string;
    taxId?: string | null;
  } | null;
  channel: LeadChannel | string;
  source: LeadSource | string;
  status: LeadStatus | string;
  title: string;
  description?: string | null;
  estimatedValue?: number | null;
  currency: string;
  assignedTo?: string | null;
  expectedCloseAt?: string | null;
  closedAt?: string | null;
  lostReason?: string | null;
  orderId?: string | null;
  interactions?: { id: string; type: string; createdAt: string }[];
  activities?: { id: string; title: string; status: string; dueAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadListResponse {
  data: Lead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeadResponse {
  data: Lead;
}

// ── Config de UI ──────────────────────────────────────────────────────────────

export const LEAD_STATUS_CONFIG = {
  NEW: {
    label: "Nuevo",
    icon: "pi pi-sparkles",
    severity: "info" as const,
    color: "#3B82F6",
  },
  CONTACTED: {
    label: "Contactado",
    icon: "pi pi-phone",
    severity: "warning" as const,
    color: "#F59E0B",
  },
  QUALIFIED: {
    label: "Calificado",
    icon: "pi pi-check",
    severity: "secondary" as const,
    color: "#8B5CF6",
  },
  PROPOSAL: {
    label: "Propuesta",
    icon: "pi pi-file",
    severity: "warning" as const,
    color: "#F97316",
  },
  NEGOTIATION: {
    label: "Negociación",
    icon: "pi pi-sync",
    severity: "warning" as const,
    color: "#EAB308",
  },
  WON: {
    label: "Ganado",
    icon: "pi pi-trophy",
    severity: "success" as const,
    color: "#22C55E",
  },
  LOST: {
    label: "Perdido",
    icon: "pi pi-times-circle",
    severity: "danger" as const,
    color: "#EF4444",
  },
} as const;

export const LEAD_CHANNEL_CONFIG = {
  REPUESTOS: {
    label: "Repuestos",
    icon: "pi pi-cog",
    severity: "info" as const,
  },
  TALLER: {
    label: "Taller",
    icon: "pi pi-wrench",
    severity: "warning" as const,
  },
  VEHICULOS: {
    label: "Vehículos",
    icon: "pi pi-car",
    severity: "success" as const,
  },
} as const;

export const LEAD_SOURCE_CONFIG = {
  WALK_IN: { label: "Visita espontánea", icon: "pi pi-map-marker" },
  REFERRAL: { label: "Referido", icon: "pi pi-users" },
  PHONE: { label: "Llamada", icon: "pi pi-phone" },
  WHATSAPP: { label: "WhatsApp", icon: "pi pi-comments" },
  SOCIAL_MEDIA: { label: "Redes Sociales", icon: "pi pi-globe" },
  WEBSITE: { label: "Página Web", icon: "pi pi-desktop" },
  EMAIL: { label: "Correo", icon: "pi pi-envelope" },
  OTHER: { label: "Otro", icon: "pi pi-ellipsis-h" },
} as const;

// Etiquetas de etapa por canal — mismos statuses, nombres distintos según el negocio
export const CHANNEL_STAGE_LABELS: Record<string, Partial<Record<string, string>>> = {
  TALLER: {
    NEW: "Solicitado",
    CONTACTED: "Diagnosticado",
    QUALIFIED: "Valorado",
    PROPOSAL: "Presupuestado",
    NEGOTIATION: "Aprobado",
    WON: "Cerrado",
    LOST: "Cancelado",
  },
  REPUESTOS: {
    NEW: "Nuevo",
    CONTACTED: "Contactado",
    QUALIFIED: "Interesado",
    PROPOSAL: "Cotizado",
    NEGOTIATION: "Confirmado",
    WON: "Surtido",
    LOST: "Cancelado",
  },
  VEHICULOS: {
    NEW: "Interesado",
    CONTACTED: "Contactado",
    QUALIFIED: "Prueba de manejo",
    PROPOSAL: "Propuesta",
    NEGOTIATION: "Negociación",
    WON: "Cerrado",
    LOST: "Cancelado",
  },
}

/** Devuelve la etiqueta de etapa según el canal del lead */
export function getStageLabel(status: string, channel?: string | null): string {
  if (channel && CHANNEL_STAGE_LABELS[channel]?.[status]) {
    return CHANNEL_STAGE_LABELS[channel][status]!
  }
  return LEAD_STATUS_CONFIG[status as LeadStatus]?.label ?? status
}

// Orden del pipeline para el Kanban
export const LEAD_PIPELINE_ORDER: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL,
  LeadStatus.NEGOTIATION,
  LeadStatus.WON,
  LeadStatus.LOST,
];

export const LEAD_SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_CONFIG).map(
  ([value, cfg]) => ({ label: cfg.label, value })
);

export const LEAD_CHANNEL_OPTIONS = Object.entries(LEAD_CHANNEL_CONFIG).map(
  ([value, cfg]) => ({ label: cfg.label, value })
);
