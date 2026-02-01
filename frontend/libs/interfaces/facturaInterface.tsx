import {
  HistorialCambio,
  Refineria,
  UserReference,
} from "./configRefineriaInterface";

export interface Factura {
  id: string;
  idRefineria: Refineria;
  idLineasFactura: LineaFactura[]; // Puedes crear una interface específica si tienes la estructura
  concepto: string;
  total: number;
  aprobada: string;
  fechaFactura: string;
  eliminado: boolean;
  estado: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: UserReference;
  modificadoPor?: UserReference;
  historial?: HistorialCambio[];
  numeroFactura?: number; // Si es necesario, puedes agregar este campo
}

export interface LineaFactura {
  id?: string;
  _id?: string;
  descripcion: string;

  subTotal: number;
  idPartida?: Partida;
  idFactura?: Factura;
  eliminado?: boolean;
  // estado: string;
  // fecha: string;
  // createdAt: string;
  // updatedAt: string;
  // createdBy: UserReference;
  // modificadoPor: UserReference;
  // historial: HistorialCambio[];
}

export interface Partida {
  idRefineria?: Refineria;
  descripcion: string;
  codigo: number;
  eliminado: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: UserReference;
  modificadoPor?: UserReference;
  historial?: HistorialCambio[];
  id: string;
  color: string; // Si es necesario, puedes agregar este campo
}
