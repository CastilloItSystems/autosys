import {
  HistorialCambio,
  Refineria,
  UserReference,
} from "./configRefineriaInterface";
import { Contrato } from "./contratoInterface";
import { Factura } from "./facturaInterface";

export interface Balance {
  _id: string;
  idRefineria: Refineria;
  numeroBalance: number;
  fechaInicio: string;
  fechaFin: string;
  contratosCompras: Contrato[];
  contratosVentas: Contrato[];
  facturas: Factura[];
  totalCompras: number;
  totalVentas: number;
  ganancia: number;
  perdida: number;
  eliminado: boolean;
  createdBy: UserReference;
  creadoEn: string;
  historial: HistorialCambio[];
  createdAt: string;
  updatedAt: string;
  id: string;
  totalBarrilesCompra: number;
  totalBarrilesVenta: number;
}
