import apiClient from "../apiClient";
import {
  Service,
  ServiceFilters,
  ServiceResponse,
} from "@/libs/interfaces/workshop";

const BASE_URL = "/services";

// Services CRUD
export const getServices = async (filters?: ServiceFilters) => {
  const response = await apiClient.get<ServiceResponse>(BASE_URL, {
    params: filters,
  });
  return response.data;
};

export const getService = async (id: string) => {
  const response = await apiClient.get<{ success: boolean; data: Service }>(
    `${BASE_URL}/${id}`
  );
  return response.data.data;
};

export const createService = async (data: Partial<Service>) => {
  const response = await apiClient.post<{ success: boolean; data: Service }>(
    BASE_URL,
    data
  );
  return response.data.data;
};

export const updateService = async (id: string, data: Partial<Service>) => {
  const response = await apiClient.put<{ success: boolean; data: Service }>(
    `${BASE_URL}/${id}`,
    data
  );
  return response.data.data;
};

export const deleteService = async (id: string) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
  }>(`${BASE_URL}/${id}`);
  return response.data;
};
