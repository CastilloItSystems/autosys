/**
 * Payment Service
 * Servicio para gestionar pagos de facturas
 */

import apiClient from "../apiClient";
import {
  Payment,
  PaymentResponse,
  PaymentFilters,
  CreatePaymentData,
  UpdatePaymentData,
  PaymentSummary,
} from "@/libs/interfaces/workshop/payment.interface";

const BASE_URL = "/payments";

/**
 * Obtiene lista paginada de pagos con filtros opcionales
 */
export const getPayments = async (
  filters?: PaymentFilters
): Promise<PaymentResponse> => {
  const response = await apiClient.get<PaymentResponse>(BASE_URL, {
    params: filters,
  });
  return response.data;
};

/**
 * Obtiene todos los pagos de una factura específica
 */
export const getPaymentsByInvoice = async (
  invoiceId: string
): Promise<PaymentSummary> => {
  const response = await apiClient.get<{
    success: boolean;
    data: Payment[];
  }>(`${BASE_URL}/invoice/${invoiceId}`);

  const payments = response.data.data;
  const totalAmount = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  return {
    payments: payments,
    totalAmount: totalAmount,
    totalPayments: payments.length,
  };
};

/**
 * Obtiene un pago por su ID
 */
export const getPayment = async (id: string): Promise<Payment> => {
  const response = await apiClient.get<{ success: boolean; payment: Payment }>(
    `${BASE_URL}/${id}`
  );
  return response.data.payment;
};

/**
 * Crea un nuevo pago
 */
export const createPayment = async (
  data: CreatePaymentData
): Promise<Payment> => {
  const response = await apiClient.post<{ success: boolean; payment: Payment }>(
    BASE_URL,
    data
  );
  return response.data.payment;
};

/**
 * Actualiza un pago existente
 */
export const updatePayment = async (
  id: string,
  data: UpdatePaymentData
): Promise<Payment> => {
  const response = await apiClient.put<{ success: boolean; payment: Payment }>(
    `${BASE_URL}/${id}`,
    data
  );
  return response.data.payment;
};

/**
 * Elimina lógicamente un pago (soft delete)
 */
export const deletePayment = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

/**
 * Confirma un pago pendiente
 */
export const confirmPayment = async (id: string): Promise<Payment> => {
  const response = await apiClient.patch<{
    success: boolean;
    payment: Payment;
  }>(`${BASE_URL}/${id}/confirm`);
  return response.data.payment;
};

/**
 * Cancela/rechaza un pago
 */
export const cancelPayment = async (
  id: string,
  reason?: string
): Promise<Payment> => {
  const response = await apiClient.patch<{
    success: boolean;
    payment: Payment;
  }>(`${BASE_URL}/${id}/cancel`, { reason });
  return response.data.payment;
};
