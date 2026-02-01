import { Balance } from "./balanceInterface";
import {
  HistorialCambio,
  Producto,
  Refineria,
  UserReference,
} from "./configRefineriaInterface";
export interface ContratoItem {
  id: string | number; // ID interno del item
  _id: string;

  idContrato: string; // Referencia al contrato padre
  producto: Producto; // Producto asociado
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

export interface Abono {
  _id: string;
  idRefineria: Refineria;
  idContrato: Contrato;
  monto: number;
  fecha: string;
  tipoOperacion: string;
  referencia: string;
  numeroAbono: number;
  tipoAbono: string;
  eliminado: boolean;
  createdBy: {
    _id: string;
    nombre: string;
    correo: string;
    id: string;
  };
  historial: HistorialCambio[];
  createdAt: string;
  updatedAt: string;
  cuenta: Cuenta;
  id: string;
}

export interface Cuenta {
  _id: string;
  idContrato: Contrato;
  tipoCuenta: string;
  idContacto: Contacto;
  abonos: Abono[];
  montoTotalContrato: number;
  totalAbonado: number;
  balancePendiente: number;
  historial: HistorialCambio[];
  createdBy: {
    _id: string;
    nombre: string;
    correo: string;
    id: string;
  };
  createdAt: string;
  updatedAt: string;
  id: string;
  idRefineria: Refineria;
  numeroCuenta: number;
  fechaCuenta: string; // Fecha de la cuenta
}

export interface CondicionesPago {
  tipo: string; // Ejemplo: "Contado"
  plazo: number; // Ejemplo: 2 días
}

export interface Contrato {
  id: string;
  _id: string; // ID interno del contrato
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
  convenio?: number;
  montoTotalContrato?: number; // Monto total del contrato, calculado como suma de todos los items
  montoPagado?: number; // Monto total pagado hasta la fecha
  montoPendiente?: number; // Monto pendiente de pago
  idBalance?: string; // ID del balance asociado, si aplica
  // Referencias
  idRefineria: Refineria;
  idContacto: Contacto; // Referencia al contacto asociado

  idItems: ContratoItem[];

  // Nuevos campos
  condicionesPago?: CondicionesPago;
  abono?: Abono[];
  clausulas?: any[]; // Si las cláusulas tienen una estructura específica, ajusta el tipo
  historialModificaciones?: any[]; // Si el historial tiene una estructura específica, ajusta el tipo
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}
export interface Contacto {
  id: string;
  nombre: string;
  identificacionFiscal: string;
  correo: string;
  representanteLegal: string;
  telefono: string;
  direccion: string;
  estado: boolean;
  eliminado: boolean;
  ubicacion: string;
  material: string;
  createdAt: string;
  updatedAt: string;
  idRefineria: Refineria;
  tipo: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}
