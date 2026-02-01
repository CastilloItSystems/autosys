import { Bunkering, ProductoBK } from "./configBunkeringInterface";
import { HistorialCambio, UserReference } from "./configRefineriaInterface";

export interface ChequeoCalidadBK {
  aplicar: {
    tipo: string;
    idReferencia: {
      idGuia?: number;
      _id?: string;
      nombre?: string;
      id: string;
      [key: string]: any;
    };
  };
  _id: string;
  idBunkering: Bunkering;
  idProducto: ProductoBK;
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

export interface ChequeoCantidadBK {
  aplicar: {
    tipo: string;
    idReferencia: {
      idGuia?: number;
      _id?: string;
      nombre?: string;
      id: string;
      [key: string]: any;
    };
  };
  _id: string;
  idBunkering: Bunkering;

  idProducto: {
    _id: string;
    nombre: string;
    id: string;
  };
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
