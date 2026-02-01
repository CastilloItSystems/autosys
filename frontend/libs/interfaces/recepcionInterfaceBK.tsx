import { Bunkering, TanqueBK } from "./configBunkeringInterface";
import {
  HistorialCambio,
  LineaRecepcion,
  UserReference,
} from "./configRefineriaInterface";
import { ContratoBK, ContratoItemBK } from "./contratoBKInterface";

export interface RecepcionBK {
  numeroRecepcion: number;

  id: string;
  estadoCarga: string;
  estadoRecepcion: string;
  estado: string;
  eliminado: boolean;
  idContrato: ContratoBK;
  idContratoItems: ContratoItemBK;
  idLinea: LineaRecepcion;
  idBunkering: Bunkering;
  idTanque: TanqueBK | null;

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
