import apiClient from "../apiClient";
import { Customer } from "@/libs/interfaces/inventory";
import { CustomerFormData } from "@/libs/zods/inventory/customerZod";

interface CustomerResponse {
  msg: string;
  customer: Customer;
}

interface CustomersResponse {
  customers: Customer[];
}

interface SearchResponse {
  customers: Customer[];
}

export const getCustomer = async (id: string): Promise<Customer> => {
  const response = await apiClient.get(`/customers/${id}`);
  return response.data;
};

export const getCustomers = async (): Promise<CustomersResponse> => {
  const response = await apiClient.get("/customers");
  return response.data;
};

export const createCustomer = async (
  data: CustomerFormData
): Promise<CustomerResponse> => {
  const response = await apiClient.post("/customers", data);
  return response.data;
};

export const updateCustomer = async (
  id: string,
  data: CustomerFormData
): Promise<CustomerResponse> => {
  const response = await apiClient.put(`/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await apiClient.delete(`/customers/${id}`);
};

// Búsqueda de customers
export const searchCustomers = async (
  query: string
): Promise<SearchResponse> => {
  const response = await apiClient.get(`/customers/search?q=${query}`);
  return response.data;
};

// Obtener customers por tipo
export const getCustomersByType = async (
  tipo: "persona" | "empresa"
): Promise<CustomersResponse> => {
  const response = await apiClient.get(`/customers/type/${tipo}`);
  return response.data;
};
