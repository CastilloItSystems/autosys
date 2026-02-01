import {
  HistorialCambio,
  LineaDespacho,
  Refineria,
  Tanque,
  UserReference,
} from "./configRefineriaInterface";
import { Contrato, ContratoItem } from "./contratoInterface";

export interface Despacho {
  numeroDespacho: number;
  id: string;
  estadoCarga: string;
  estadoDespacho: string;
  estado: string;
  eliminado: boolean;
  idContrato: Contrato;
  idContratoItems: ContratoItem;
  idLineaDespacho: LineaDespacho;
  idRefineria: Refineria;
  idTanque: Tanque | null;

  cantidadRecibida: number;
  cantidadEnviada: number;
  fechaInicio: string;
  fechaFin: string;
  fechaDespacho: string;
  fechaInicioDespacho: string;
  fechaFinDespacho: string;
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
