/**
 * Payment Interfaces
 * Sistema de gestión de pagos asociados a facturas
 */

import { UserReference } from "./invoice.interface";

/**
 * Referencia a factura (puede venir populated o como string)
 */
export interface InvoiceReference {
  _id: string;
  invoiceNumber: string;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
  id?: string;
}

/**
 * Detalles específicos según método de pago
 */
export interface PaymentDetails {
  bankName?: string; // Para transferencias
  accountNumber?: string; // Para transferencias
  cardLastFour?: string; // Para tarjetas (últimos 4 dígitos)
  cardType?: string; // visa, mastercard, amex, etc.
  checkNumber?: string; // Número de cheque
  cryptoCurrency?: string; // Tipo de criptomoneda
  walletAddress?: string; // Dirección de wallet cripto
  otherDetails?: string; // Otros detalles
}

/**
 * Métodos de pago disponibles
 */
export type PaymentMethod =
  | "efectivo"
  | "transferencia"
  | "tarjeta_credito"
  | "tarjeta_debito"
  | "cheque"
  | "cripto"
  | "otro";

/**
 * Estados de pago
 */
export type PaymentStatus =
  | "pendiente"
  | "confirmado"
  | "rechazado"
  | "reembolsado";

/**
 * Interface principal de Payment
 */
export interface Payment {
  _id: string;
  invoice: InvoiceReference | string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  status: PaymentStatus;
  paymentDetails?: PaymentDetails;
  recordedBy: UserReference | string;
  eliminado: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  __v?: number;
}

/**
 * Filtros para consultar pagos
 */
export interface PaymentFilters {
  invoice?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  minAmount?: number;
  maxAmount?: number;
  eliminado?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Respuesta de la API con paginación (mongoose-paginate-v2)
 */
export interface PaymentResponse {
  success: boolean;
  data: {
    docs: Payment[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

/**
 * Datos para crear pago
 */
export interface CreatePaymentData {
  invoice: string;
  amount: number;
  paymentDate?: Date | string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  status?: PaymentStatus;
  paymentDetails?: PaymentDetails;
}

/**
 * Datos para actualizar pago
 */
export interface UpdatePaymentData {
  amount?: number;
  paymentDate?: Date | string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  status?: PaymentStatus;
  paymentDetails?: PaymentDetails;
}

/**
 * Resumen de pagos por factura
 */
export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  payments: Payment[];
}
