import {
  HistorialCambio,
  LineaRecepcion,
  Producto,
  Refineria,
  Tanque,
  UserReference,
} from "./configRefineriaInterface";
import { Contrato, ContratoItem } from "./contratoInterface";

export interface Recepcion {
  numeroRecepcion: number;

  id: string;
  estadoCarga: string;
  estadoRecepcion: string;
  estado: string;
  eliminado: boolean;
  idContrato: Contrato;
  idContratoItems: ContratoItem;
  idLinea: LineaRecepcion;
  idRefineria: Refineria;
  idTanque: Tanque | null;

  cantidadRecibida: number;
  cantidadEnviada: number;
  fechaInicio: string;
  fechaFin: string;
  fechaDespacho: string;
  fechaInicioRecepcion: string;
  fechaFinRecepcion: string;
  fechaSalida: string;
  fechaLlegada: string;
  idGuia: number;
  placa: string;
  nombreChofer: string;
  apellidoChofer: string;
  createdAt: string;
  updatedAt: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
}
