// Service Interface
// Import category interfaces from dedicated file
import {
  ServiceCategory,
  ServiceSubcategory,
} from "./serviceCategoryMain.interface";

export type { ServiceCategory, ServiceSubcategory };

export interface Service {
  _id?: string;
  id?: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  categoria: ServiceCategory | string;
  subcategoria?: ServiceSubcategory | string;
  precioBase: number;
  tiempoEstimadoMinutos: number;
  unidadTiempo: "minutos" | "horas" | "dias";
  costoHoraAdicional: number;
  requiereEspecialista: boolean;
  dificultad: "baja" | "media" | "alta" | "experto";
  herramientasRequeridas: string[];
  garantiaMeses: number;
  activo: boolean;
  eliminado?: boolean;
  piezasComunes: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  __v?: number;
}

export interface ServiceFilters {
  categoria?: string;
  subcategoria?: string;
  activo?: boolean;
  dificultad?: string;
  requiereEspecialista?: boolean;
}

export interface ServiceResponse {
  success: boolean;
  data: Service[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
