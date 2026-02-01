/**
 * Service Bay (Bahía de Servicio) - Interface
 * Sistema de gestión de puestos de trabajo en el taller
 */

export type BayArea =
  | "mecanica"
  | "electricidad"
  | "pintura"
  | "latoneria"
  | "diagnostico"
  | "cambio_aceite"
  | "multiple";

export type BayStatus =
  | "disponible"
  | "ocupado"
  | "mantenimiento"
  | "fuera_servicio";

export type BayCapacity =
  | "individual" // 1 vehículo pequeño
  | "pequeña" // 1 vehículo mediano
  | "mediana" // 1 vehículo grande
  | "grande" // 2 vehículos medianos
  | "multiple"; // 3+ vehículos pequeños

export interface CurrentTechnician {
  technician: string;
  role: "principal" | "asistente";
  entryTime: Date;
}

export interface ServiceBay {
  _id: string;
  name: string;
  code: string;
  area: BayArea;
  status: BayStatus;
  capacity: BayCapacity;
  maxTechnicians: number;
  equipment: string[];
  currentWorkOrder?: string;
  currentTechnicians: CurrentTechnician[];
  occupiedSince?: Date;
  estimatedEndTime?: Date;

  order: number;
  notes?: string;
  eliminado: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceBayDto {
  name: string;
  code: string;
  area: BayArea;
  capacity: BayCapacity;
  maxTechnicians: number;
  equipment?: string[];
  notes?: string;
  order?: number;
}

export interface UpdateServiceBayDto {
  name?: string;
  code?: string;
  area?: BayArea;
  status?: BayStatus;
  capacity?: BayCapacity;
  maxTechnicians?: number;
  equipment?: string[];
  notes?: string;
  order?: number;
  isActive?: boolean;
}

export interface ServiceBayFilters {
  status?: BayStatus;
  area?: BayArea;
  isActive?: "true" | "false" | "all";
  sortBy?: "name" | "code" | "order" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Labels para UI
export const BAY_AREA_LABELS: Record<BayArea, string> = {
  mecanica: "Mecánica",
  electricidad: "Electricidad",
  pintura: "Pintura",
  latoneria: "Latonería",
  diagnostico: "Diagnóstico",
  cambio_aceite: "Cambio de Aceite",
  multiple: "Múltiple",
};

export const BAY_STATUS_LABELS: Record<BayStatus, string> = {
  disponible: "Disponible",
  ocupado: "Ocupado",
  mantenimiento: "Mantenimiento",
  fuera_servicio: "Fuera de Servicio",
};

export const BAY_CAPACITY_LABELS: Record<BayCapacity, string> = {
  individual: "Individual",
  pequeña: "Pequeña",
  mediana: "Mediana",
  grande: "Grande",
  multiple: "Múltiple",
};

// Colores para estados
export const BAY_STATUS_COLORS: Record<BayStatus, string> = {
  disponible: "success",
  ocupado: "warning",
  mantenimiento: "info",
  fuera_servicio: "danger",
};

// Iconos para áreas
export const BAY_AREA_ICONS: Record<BayArea, string> = {
  mecanica: "pi-wrench",
  electricidad: "pi-bolt",
  pintura: "pi-palette",
  latoneria: "pi-car",
  diagnostico: "pi-chart-line",
  cambio_aceite: "pi-circle-fill",
  multiple: "pi-sitemap",
};
