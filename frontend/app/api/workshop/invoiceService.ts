import apiClient from "../apiClient";
import {
  Invoice,
  InvoiceFilters,
  InvoiceResponse,
} from "@/libs/interfaces/workshop";

const BASE_URL = "/invoices";

// Invoices CRUD
export const getInvoices = async (
  filters?: InvoiceFilters & { page?: number; limit?: number }
) => {
  const response = await apiClient.get<InvoiceResponse>(BASE_URL, {
    params: filters,
  });
  return response.data;
};

export const getInvoice = async (id: string) => {
  const response = await apiClient.get<{ success: boolean; data: Invoice }>(
    `${BASE_URL}/${id}`
  );
  return response.data.data;
};

export const createInvoice = async (data: Partial<Invoice>) => {
  const response = await apiClient.post<{ success: boolean; data: Invoice }>(
    BASE_URL,
    data
  );
  return response.data.data;
};

export const updateInvoice = async (id: string, data: Partial<Invoice>) => {
  const response = await apiClient.put<{ success: boolean; data: Invoice }>(
    `${BASE_URL}/${id}`,
    data
  );
  return response.data.data;
};

export const deleteInvoice = async (id: string) => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

// Invoice Actions
export const emitInvoice = async (id: string) => {
  const response = await apiClient.post<{ success: boolean; data: Invoice }>(
    `${BASE_URL}/${id}/emit`
  );
  return response.data.data;
};

export const createInvoiceFromWorkOrder = async (workOrderId: string) => {
  const response = await apiClient.post<{ success: boolean; data: Invoice }>(
    `${BASE_URL}/from-work-order/${workOrderId}`
  );
  return response.data.data;
};

// Mark invoice as paid
export const markInvoiceAsPaid = async (id: string, amount: number) => {
  const response = await apiClient.post<{ success: boolean; data: Invoice }>(
    `${BASE_URL}/${id}/mark-paid`,
    { amount }
  );
  return response.data.data;
};
