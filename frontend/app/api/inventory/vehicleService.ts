import apiClient from "../apiClient";

export const getVehicle = async (id: string) => {
  const response = await apiClient.get(`/inventory/vehicles/${id}`);
  return response.data;
};

export const getVehicles = async () => {
  const response = await apiClient.get("/inventory/vehicles");
  return response.data;
};

export const createVehicle = async (data: any) => {
  const response = await apiClient.post("/inventory/vehicles", data);
  return response.data;
};

export const updateVehicle = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/vehicles/${id}`, data);
  return response.data;
};

export const deleteVehicle = async (id: string) => {
  const response = await apiClient.delete(`/inventory/vehicles/${id}`);
  return response.data;
};

// Búsqueda de vehicles
export const searchVehicles = async (query: string) => {
  const response = await apiClient.get(`/inventory/vehicles/search?q=${query}`);
  return response.data;
};

// Obtener vehicles por customer
export const getVehiclesByCustomer = async (customerId: string) => {
  const response = await apiClient.get(
    `/inventory/vehicles/customer/${customerId}`
  );
  return response.data;
};

// Obtener vehicles por model
export const getVehiclesByModel = async (modelId: string) => {
  const response = await apiClient.get(`/inventory/vehicles/model/${modelId}`);
  return response.data;
};
