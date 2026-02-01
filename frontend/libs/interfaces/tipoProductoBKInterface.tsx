import { Bunkering } from "./configBunkeringInterface";
import {
  HistorialCambio,
  Producto,
  Refineria,
  UserReference,
} from "./configRefineriaInterface";

export interface TipoProductoBK {
  id: string; // ID único del producto
  idBunkering: Bunkering; // Relación con la refinería
  idProducto: Producto; // Relación con el modelo Producto
  nombre: string; // Nombre del producto
  procedencia: string; // Procedencia del producto
  clasificacion: string;
  gravedadAPI: number; // Gravedad API del producto
  azufre: number; // Porcentaje de azufre en el producto
  contenidoAgua: number; // Contenido de agua en el producto
  puntoDeInflamacion: number; // Punto de inflamación (Flashpoint) del producto
  rendimientos: RendimientoBK[]; // Lista de rendimientos asociados al producto
  costoOperacional?: number; // Costo operativo del producto
  transporte?: number; // Costo de transporte del producto
  convenio?: number; // Costo de convenio del producto
  estado: string; // Estado del producto (Activo o Inactivo)
  eliminado: boolean; // Indica si el producto ha sido eliminado (eliminación lógica)
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de última actualización
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}

// Interfaz para los rendimientos asociados al producto
export interface RendimientoBK {
  idProducto: Producto; // Relación con el modelo Producto
  transporte?: number; // Costo de transporte
  bunker?: number; // Costo de bunker
  costoVenta?: number; // Costo de venta
  convenio?: number; // Costo de convenio
  porcentaje?: number; // Porcentaje de rendimiento
}
