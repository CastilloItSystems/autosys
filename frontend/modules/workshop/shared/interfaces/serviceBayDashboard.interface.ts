/**
 * Service Bay Dashboard - Interfaces
 * Interfaces para el dashboard operacional de bahías de servicio
 */

import {
  ServiceBay,
  BayArea,
  BayStatus,
  BayCapacity,
} from "./serviceBay.interface";

// ============================================
// ASIGNACIONES
// ============================================

/**
 * Técnico asignado a una bahía
 */
export interface TechnicianAssignment {
  technician: string; // ID del técnico
  name: string;
  role?: "principal" | "asistente";
  assignedAt: Date;
  removedAt?: Date;
  hoursWorked?: number;
}

/**
 * Asignación de orden de trabajo a bahía
 */
export interface ServiceBayAssignment {
  _id: string;
  bay: ServiceBay | string; // Puede venir populado o solo ID
  workOrder: any | string; // WorkOrder o ID - any por ahora para evitar dependencias circulares
  technicians: TechnicianAssignment[];
  entryTime: Date;
  exitTime?: Date;
  estimatedDuration?: number; // minutos
  actualDuration?: number; // minutos
  notes?: string;
  status: "active" | "completed" | "paused";
}

// ============================================
// BAHÍA CON DETALLES EXTENDIDOS
// ============================================

/**
 * Bahía con información adicional para el dashboard
 */
export interface BayWithDetails extends ServiceBay {
  // Asignación actual (si está ocupada)
  currentAssignment?: ServiceBayAssignment;

  // Tiempo que lleva ocupada (en minutos)
  occupancyDuration?: number;

  // Porcentaje de utilización del día actual (0-100)
  utilizationToday?: number;

  // Tiempo estimado de finalización
  estimatedCompletionTime?: Date;

  // Información del vehículo actual (si existe)
  currentVehicle?: {
    marca: string;
    modelo: string;
    placa: string;
    year?: number;
  };

  // Información de la OT actual (si existe)
  currentWorkOrderInfo?: {
    orderNumber: string;
    clientName: string;
    priority?: "baja" | "media" | "alta" | "urgente";
    services: string[];
  };
}

// ============================================
// MÉTRICAS DEL DASHBOARD
// ============================================

/**
 * Métricas generales del dashboard
 */
export interface BayDashboardMetrics {
  totalBays: number;
  availableBays: number;
  occupiedBays: number;
  maintenanceBays: number;
  outOfServiceBays: number;
  activeTechnicians: number;
  activeWorkOrders: number;
  averageOccupancyTime: number; // minutos
}

// ============================================
// CONFIGURACIONES VISUALES
// ============================================

/**
 * Configuración visual por área
 */
export interface BayAreaConfig {
  label: string;
  icon: string;
  color: string;
}

/**
 * Configuración de áreas para el dashboard
 */
export const BAY_AREA_CONFIG: Record<BayArea, BayAreaConfig> = {
  mecanica: {
    label: "Mecánica",
    icon: "pi-wrench",
    color: "#3b82f6", // Azul
  },
  electricidad: {
    label: "Eléctrica",
    icon: "pi-bolt",
    color: "#f59e0b", // Naranja
  },
  pintura: {
    label: "Pintura",
    icon: "pi-palette",
    color: "#8b5cf6", // Morado
  },
  latoneria: {
    label: "Latonería",
    icon: "pi-car",
    color: "#06b6d4", // Cyan
  },
  diagnostico: {
    label: "Diagnóstico",
    icon: "pi-chart-line",
    color: "#10b981", // Verde
  },
  cambio_aceite: {
    label: "Cambio de Aceite",
    icon: "pi-circle-fill",
    color: "#6366f1", // Indigo
  },
  multiple: {
    label: "Múltiple",
    icon: "pi-sitemap",
    color: "#6b7280", // Gris
  },
};

/**
 * Configuración visual por estado
 */
export interface BayStatusConfig {
  label: string;
  icon: string;
  severity: "success" | "warning" | "danger" | "info" | "secondary";
  color: string;
}

/**
 * Configuración de estados para el dashboard
 */
export const BAY_STATUS_CONFIG: Record<BayStatus, BayStatusConfig> = {
  disponible: {
    label: "Disponible",
    icon: "pi-check-circle",
    severity: "success",
    color: "#22c55e",
  },
  ocupado: {
    label: "Ocupada",
    icon: "pi-car",
    severity: "warning",
    color: "#f59e0b",
  },
  mantenimiento: {
    label: "Mantenimiento",
    icon: "pi-wrench",
    severity: "info",
    color: "#3b82f6",
  },
  fuera_servicio: {
    label: "Fuera de Servicio",
    icon: "pi-times-circle",
    severity: "danger",
    color: "#ef4444",
  },
};

/**
 * Configuración visual por capacidad
 */
export interface BayCapacityConfig {
  label: string;
  icon: string;
  color: string;
}

/**
 * Configuración de capacidades para el dashboard
 */
export const BAY_CAPACITY_CONFIG: Record<BayCapacity, BayCapacityConfig> = {
  individual: {
    label: "Individual",
    icon: "pi-car",
    color: "#8b5cf6",
  },
  pequeña: {
    label: "Pequeña",
    icon: "pi-car",
    color: "#3b82f6",
  },
  mediana: {
    label: "Mediana",
    icon: "pi-car",
    color: "#06b6d4",
  },
  grande: {
    label: "Grande",
    icon: "pi-car",
    color: "#10b981",
  },
  multiple: {
    label: "Múltiple",
    icon: "pi-car",
    color: "#f59e0b",
  },
};

// ============================================
// OPCIONES PARA DROPDOWNS
// ============================================

/**
 * Opciones de área para dropdowns
 */
export const BAY_AREA_OPTIONS = Object.entries(BAY_AREA_CONFIG).map(
  ([value, config]) => ({
    label: config.label,
    value: value as BayArea,
    icon: config.icon,
  })
);

/**
 * Opciones de estado para dropdowns
 */
export const BAY_STATUS_OPTIONS = Object.entries(BAY_STATUS_CONFIG).map(
  ([value, config]) => ({
    label: config.label,
    value: value as BayStatus,
    icon: config.icon,
  })
);

/**
 * Opciones de capacidad para dropdowns
 */
export const BAY_CAPACITY_OPTIONS = Object.entries(BAY_CAPACITY_CONFIG).map(
  ([value, config]) => ({
    label: config.label,
    value: value as BayCapacity,
    icon: config.icon,
  })
);

// ============================================
// RESPUESTAS DE API DEL DASHBOARD
// ============================================

/**
 * Respuesta del endpoint GET /api/dashboard/taller-status
 */
export interface TallerDashboardResponse {
  ok: boolean;
  timestamp: string;
  summary: TallerDashboardSummary;
  activeBays: ActiveBayInfo[];
  technicians: {
    active: number;
  };
}

/**
 * Resumen del dashboard
 */
export interface TallerDashboardSummary {
  totalBays: number;
  occupiedBays: number;
  availableBays: number;
  maintenanceBays: number;
  utilizationRate: number;
}

/**
 * Información de bahía activa en el dashboard
 */
export interface ActiveBayInfo {
  bay: {
    _id: string;
    name: string;
    code: string;
    area: BayArea;
  };
  status: BayStatus;
  workOrder: {
    _id: string;
    motivo: string;
    vehicle: string;
    customer: string;
  };
  technicians: ActiveBayTechnician[];
  occupiedSince: string;
  estimatedCompletion: string | null;
  hoursInBay: number;
}

/**
 * Técnico en bahía activa
 */
export interface ActiveBayTechnician {
  _id: string;
  name: string;
  role: "principal" | "asistente";
  entryTime: string;
}
