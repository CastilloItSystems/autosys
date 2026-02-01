import { Bunkering } from "./configBunkeringInterface";
import {
  HistorialCambio,
  Producto,
  Refineria,
  UserReference,
} from "./configRefineriaInterface";

export interface ChequeoCalidad {
  aplicar: {
    tipo: string;
    idReferencia: {
      idGuia?: number;
      _id?: string;
      nombre?: string;
      id: string;
      numeroDespacho?: string;
      [key: string]: any;
    };
  };
  _id: string;
  idRefineria: Refineria;
  idProducto: Producto;
  fechaChequeo: string;
  gravedadAPI: number;
  azufre: number;
  contenidoAgua: number;
  puntoDeInflamacion: number;
  cetano: number;
  idOperador: {
    nombre: string;
    id: string;
    _id: string;
  };
  estado: string;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  numeroChequeoCalidad: number;
  id: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}

export interface ChequeoCantidad {
  aplicar: {
    tipo: string;
    idReferencia: {
      idGuia?: number;
      _id?: string;
      nombre?: string;
      id: string;
      nombreChofer?: string;
      placa?: string;
      numeroRecepcion?: string;
      cantidadRecibida?: number;
      cantidadEnviada?: number;
      numeroDespacho?: string;
      [key: string]: any;
    };
  };
  _id: string;
  idRefineria: Refineria;

  idProducto: Producto;
  fechaChequeo: string;
  cantidad: number;
  idOperador: {
    nombre: string;
    id: string;
    _id: string;
  };
  estado: string;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  numeroChequeoCantidad: number;
  id: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}
