import { HistorialCambio, UserReference } from "./configRefineriaInterface";

export interface Bunkering {
  id: string | undefined;
  nombre: string;
  correo: string;
  img: string;
  ubicacion: string;
  nit: string;
  rol: string;
  acceso: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}

export interface Muelle {
  _id: string;
  ubicacion: string;
  correo: string;
  telefono: string;
  nombre: string;
  nit: string;
  legal: string;
  img: string;
  estado: string;
  idBunkering: Bunkering;
  eliminado: boolean;
  createdBy: UserReference;
  historial: HistorialCambio[];
  createdAt: string;
  updatedAt: string;
  id: string;
}
export interface LineaRecepcionBK {
  id: string;
  nombre: string;
  estado: boolean;
  eliminado: boolean;
  ubicacion: string;
  material: string;
  createdAt: string;
  updatedAt: string;
  idBunkering: Bunkering;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
  idMuelle: Muelle;
}
export interface LineaDespachoBK {
  id: string;
  nombre: string;
  estado: boolean;
  eliminado: boolean;
  ubicacion: string;
  material: string;
  createdAt: string;
  updatedAt: string;
  idBunkering: Bunkering;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
  idMuelle: Muelle;
}

export interface ProductoBK {
  idBunkering: Bunkering;
  idTipoProducto: [
    {
      nombre: string;
      id: string;
    }
  ];
  nombre: string;
  posicion: number;
  color: string;
  estado: boolean;
  eliminado: boolean;
  tipoMaterial: string;
  createdAt: string;
  updatedAt: string;
  id: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}

export interface Embarcacion {
  _id: string;
  idBunkering: Bunkering;
  capacidad: number;
  nombre: string;
  imo: string;
  tipo: string;
  tanques: TanqueBK[];
  estado: string;
  eliminado: boolean;
  createdBy: UserReference;
  historial: HistorialCambio[];
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface TanqueBK {
  _id: string;
  idBunkering: Bunkering;
  idProducto: ProductoBK;
  idEmbarcacion: Embarcacion;
  capacidad: number;
  almacenamiento: number;
  nombre: string;
  ubicacion: string;
  estado: string;
  eliminado: boolean;
  createdBy: UserReference;
  historial: HistorialCambio[];
  createdAt: string;
  updatedAt: string;
  id: string;
}
