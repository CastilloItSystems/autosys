import apiClient from "./apiClient";
import {
  ServiceBay,
  CreateServiceBayDto,
  UpdateServiceBayDto,
  ServiceBayFilters,
} from "@/libs/interfaces/workshop/serviceBay.interface";

/**
 * Service Bay API Service
 * Servicio para gestionar bahías de servicio del taller
 */

// ==================== CRUD de Bahías ====================

/**
 * Obtener todas las bahías con filtros opcionales
 */
export const getServiceBays = async (filters?: ServiceBayFilters) => {
  const params = new URLSearchParams();

  if (filters?.status) params.append("status", filters.status);
  if (filters?.area) params.append("area", filters.area);
  if (filters?.isActive) params.append("isActive", filters.isActive);
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const queryString = params.toString();
  const url = queryString ? `/service-bays?${queryString}` : "/service-bays";

  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Obtener solo bahías disponibles
 */
export const getAvailableServiceBays = async (
  area?: string,
  capacity?: string
) => {
  const params = new URLSearchParams();

  if (area) params.append("area", area);
  if (capacity) params.append("capacity", capacity);

  const queryString = params.toString();
  const url = queryString
    ? `/service-bays/available?${queryString}`
    : "/service-bays/available";

  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Obtener una bahía por ID
 */
export const getServiceBay = async (id: string) => {
  const response = await apiClient.get(`/service-bays/${id}`);
  return response.data;
};

/**
 * Crear nueva bahía de servicio
 */
export const createServiceBay = async (data: CreateServiceBayDto) => {
  const response = await apiClient.post("/service-bays", data);
  return response.data;
};

/**
 * Actualizar bahía existente
 */
export const updateServiceBay = async (
  id: string,
  data: UpdateServiceBayDto
) => {
  const response = await apiClient.put(`/service-bays/${id}`, data);
  return response.data;
};

/**
 * Eliminar bahía (soft delete)
 */
export const deleteServiceBay = async (id: string) => {
  const response = await apiClient.delete(`/service-bays/${id}`);
  return response.data;
};

// ==================== Asignaciones (Entrada/Salida) ====================

/**
 * Registrar entrada de técnico(s) a una bahía
 */
export interface EnterBayData {
  serviceBay: string;
  technician?: string;
  technicians?: Array<{
    technician: string;
    role: "principal" | "asistente";
    estimatedHours?: number;
  }>;
  role?: "principal" | "asistente";
  estimatedHours?: number;
  notes?: string;
}

export const enterBay = async (workOrderId: string, data: EnterBayData) => {
  const response = await apiClient.post(
    `/work-orders/${workOrderId}/enter-bay`,
    data
  );
  return response.data;
};

/**
 * Registrar salida de técnico(s) de una bahía
 */
export interface ExitBayData {
  technician?: string;
  technicians?: string[];
  notes?: string;
}

export const exitBay = async (workOrderId: string, data: ExitBayData) => {
  const response = await apiClient.post(
    `/work-orders/${workOrderId}/exit-bay`,
    data
  );
  return response.data;
};

/**
 * Obtener asignaciones de una orden de trabajo
 */
export const getWorkOrderAssignments = async (
  workOrderId: string,
  status?: string
) => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);

  const queryString = params.toString();
  const url = queryString
    ? `/work-orders/${workOrderId}/assignments?${queryString}`
    : `/work-orders/${workOrderId}/assignments`;

  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Obtener asignaciones de un técnico
 */
export const getTechnicianAssignments = async (technicianId: string) => {
  const response = await apiClient.get(
    `/work-orders/technician/${technicianId}/assignments`
  );
  return response.data;
};

// ==================== Dashboard y Reportes ====================

/**
 * Obtener dashboard con estado en tiempo real del taller
 */
export const getTallerDashboard = async () => {
  const response = await apiClient.get("/dashboard/taller-status");
  return response.data;
};

/**
 * @deprecated Usar getTallerDashboard() en su lugar
 * Obtener dashboard con estado en tiempo real
 */
export const getServiceBaysDashboard = async () => {
  return getTallerDashboard();
};

/**
 * Reporte de horas trabajadas por técnico
 */
export interface TechnicianReportParams {
  startDate: string;
  endDate: string;
  technicianId?: string;
}

export const getTechnicianHoursReport = async (
  params: TechnicianReportParams
) => {
  const queryParams = new URLSearchParams();
  queryParams.append("startDate", params.startDate);
  queryParams.append("endDate", params.endDate);
  if (params.technicianId)
    queryParams.append("technicianId", params.technicianId);

  const response = await apiClient.get(
    `/reports/technician-hours?${queryParams}`
  );
  return response.data;
};

/**
 * Reporte de utilización de bahías
 */
export interface BayUtilizationParams {
  startDate: string;
  endDate: string;
  area?: string;
}

export const getBayUtilizationReport = async (params: BayUtilizationParams) => {
  const queryParams = new URLSearchParams();
  queryParams.append("startDate", params.startDate);
  queryParams.append("endDate", params.endDate);
  if (params.area) queryParams.append("area", params.area);

  const response = await apiClient.get(
    `/reports/bay-utilization?${queryParams}`
  );
  return response.data;
};

/**
 * Historial de una bahía específica
 */
export const getBayHistory = async (bayId: string, limit: number = 50) => {
  const response = await apiClient.get(
    `/dashboard/bays/${bayId}/history?limit=${limit}`
  );
  return response.data;
};

// ==================== Funciones Helper ====================

/**
 * Verificar si una bahía está disponible
 */
export const isBayAvailable = (bay: ServiceBay): boolean => {
  return bay.status === "disponible" && !bay.eliminado;
};

/**
 * Verificar si una bahía puede aceptar más técnicos
 */
export const canAcceptMoreTechnicians = (bay: ServiceBay): boolean => {
  return bay.currentTechnicians.length < bay.maxTechnicians;
};

/**
 * Obtener bahías disponibles para un área específica
 */
export const getAvailableBaysByArea = async (area: string) => {
  return getAvailableServiceBays(area);
};
