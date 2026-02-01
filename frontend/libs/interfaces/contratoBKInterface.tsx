import { Bunkering, ProductoBK } from "./configBunkeringInterface";
import { HistorialCambio, UserReference } from "./configRefineriaInterface";
export interface ContratoItemBK {
  id: string | number; // ID interno del item
  _id: string;

  idContrato: string; // Referencia al contrato padre
  producto: ProductoBK; // Producto asociado
  cantidad?: number;
  precioUnitario?: number;
  brent?: number;
  convenio?: number;
  montoTransporte?: number;

  // Datos de calidad del producto
  idTipoProducto?: {
    _id: string;
    nombre: string;
    id: string;
  };
  clasificacion?: string;
  gravedadAPI?: number;
  azufre?: number;
  contenidoAgua?: number;
  puntoDeInflamacion?: number;

  // Estado y lógica de eliminado
  estado?: string;
  eliminado?: boolean;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface AbonoBK {
  monto: number;
  fecha: string;
  _id: string;
}

export interface CondicionesPagoBK {
  tipo: string; // Ejemplo: "Contado"
  plazo: number; // Ejemplo: 2 días
}

export interface ContratoBK {
  id: string;
  numeroContrato: string;
  descripcion: string;
  tipoContrato: string; // Ejemplo: "Compra"
  estadoContrato: string; // Ejemplo: "Adjudicado"
  estadoEntrega: string; // Ejemplo: "Pendiente"
  eliminado: boolean;
  fechaInicio: string;
  fechaFin: string;
  createdAt: string;
  updatedAt: string;
  brent?: number;
  montoTotal?: number;
  montoTransporte?: number;

  // Referencias
  idBunkering: Bunkering;
  idContacto: {
    id: string;
    nombre: string;
  };
  idItems: ContratoItemBK[];

  // Nuevos campos
  condicionesPago?: CondicionesPagoBK;
  abono?: AbonoBK[];
  clausulas?: any[]; // Si las cláusulas tienen una estructura específica, ajusta el tipo
  historialModificaciones?: any[]; // Si el historial tiene una estructura específica, ajusta el tipo
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}
export interface ContactoBK {
  id: string;
  nombre: string;
  estado: boolean;
  eliminado: boolean;
  ubicacion: string;
  material: string;
  createdAt: string;
  updatedAt: string;
  idBunkering: Bunkering;
  tipo: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}
