export interface Refineria {
  id: string | undefined;
  nombre: string;
  correo: string;
  rol: string;
  acceso: string;
  estado: string;
  procesamientoDia: number;
  createdAt: string;
  updatedAt: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
  nit: string;
  img: string;
  ubicacion: string;
}

// Definir tipo de usuario para auditoría
export interface UserReference {
  _id: string;
  id: string;
  nombre: string;
  correo: string;
}

export interface LineaRecepcion {
  id: string;
  nombre: string;
  estado: boolean;
  eliminado: boolean;
  ubicacion: string;
  material: string;
  createdAt: string;
  updatedAt: string;
  idRefineria: Refineria;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}
export interface LineaDespacho {
  id: string;
  nombre: string;
  estado: boolean;
  eliminado: boolean;
  ubicacion: string;
  material: string;
  createdAt: string;
  updatedAt: string;
  idRefineria: Refineria;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}

export interface HistorialCambio {
  _id: string;
  fecha: string;
  modificadoPor: UserReference;
  cambios: Record<string, { from: any; to: any }>;
}

export interface TorreDestilacion {
  // datos Mongo
  _id: string;
  id: string;

  nombre: string;
  estado: boolean;
  eliminado: boolean;
  ubicacion: string;
  material: Material[];
  capacidad: number;

  idRefineria: Refineria;

  // metadatos
  createdAt: string;
  createdBy: UserReference;
  updatedAt: string;
  fecha: string;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}

export interface Material {
  idProducto?: {
    _id: string;
    nombre: string;
    posicion: number;
    color: string;
    id: string;
  };
  porcentaje: number;

  estadoMaterial: string;
  _id?: string;
}

export interface Tanque {
  id: string;
  nombre: string;
  estado: boolean;
  eliminado: boolean;
  ubicacion: string;
  createdAt: string;
  updatedAt: string;
  idRefineria: Refineria;
  almacenamientoMateriaPrimaria: boolean;
  idProducto: Producto;
  almacenamiento: number;
  capacidad: number;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}

export interface Producto {
  idRefineria: {
    nombre: string;
    id: string;
  };
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

export interface Notification {
  _id: string;
  userId: UserReference;
  title: string;
  message: string;
  type: "in-app" | "email" | "sms"; // Tipos de notificación posibles
  read: boolean;
  link?: string; // Enlace opcional asociado a la notificación
  eliminado: boolean;
  createdBy: UserReference;
  historial: HistorialCambio[];
  createdAt: string;
  updatedAt: string;
}
