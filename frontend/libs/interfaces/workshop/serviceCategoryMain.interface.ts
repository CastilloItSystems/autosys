// Service Category interfaces
export interface ServiceCategory {
  _id?: string;
  nombre: string;
  descripcion?: string;
  codigo: string;
  color?: string;
  icono?: string;
  orden?: number;
  activo: boolean;
  eliminado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  subcategories?: ServiceSubcategoryPopulated[];
  servicesCount?: number;
}

// Service Subcategory interface (populated in category list)
export interface ServiceSubcategoryPopulated {
  _id: string;
  categoria: string;
  nombre: string;
  descripcion?: string;
  codigo: string;
  activo: boolean;
  eliminado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// Category Reference (when subcategory is populated)
export interface ServiceCategoryReference {
  _id: string;
  nombre: string;
  codigo: string;
  color?: string;
}

// Service Subcategory main interface
export interface ServiceSubcategory {
  _id?: string;
  categoria: ServiceCategoryReference | string;
  nombre: string;
  descripcion?: string;
  codigo: string;
  activo: boolean;
  eliminado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// Filters for service categories
export interface ServiceCategoryFilters {
  activo?: boolean;
  eliminado?: boolean;
  search?: string;
}

// Filters for service subcategories
export interface ServiceSubcategoryFilters {
  categoria?: string;
  activo?: boolean;
  eliminado?: boolean;
  search?: string;
}

// Response structure for service categories
export interface ServiceCategoryResponse {
  success: boolean;
  data: ServiceCategory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Response structure for service subcategories
export interface ServiceSubcategoryResponse {
  success: boolean;
  data: ServiceSubcategory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
