export interface Brand {
  id: string;
  nombre: string;
  eliminado?: boolean;
}

export interface Category {
  id: string;
  nombre: string;
  eliminado?: boolean;
}

export interface ItemModel {
  id: string;
  nombre: string;
  marca?: string | Brand;
  eliminado?: boolean;
}

export interface Item {
  _id?: string;
  id?: string; // For backward compatibility
  sku?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  marca?: string | Brand;
  modelo?: string | ItemModel;
  categoria?: string | Category;
  unidad?: string;
  precioCosto?: number;
  precioVenta?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  imagenes?: string[];
  estado?: "activo" | "inactivo";
  eliminado?: boolean;
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}
