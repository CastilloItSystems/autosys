export interface Item {
  id: string;
  sku?: string;
  codigo?: string;
  nombre: string; // required
  descripcion?: string;
  marca?: string;
  modelo?: string;
  categoria?: string;
  unidad?: string; // default: "unidad"
  precioCosto?: number; // default: 0
  precioVenta?: number; // default: 0
  stockMinimo?: number; // default: 0
  stockMaximo?: number; // default: 0
  imagenes?: string[];
  estado?: "activo" | "inactivo";
  eliminado?: boolean;
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}
