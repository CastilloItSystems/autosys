import apiClient from "../apiClient";

export const getWorkshop = async (id: string) => {
  const response = await apiClient.get(`/workshop/${id}`);
  return response.data;
};

export const getWorkshops = async () => {
  const response = await apiClient.get("/workshop");
  return response.data;
};

export const createWorkshop = async (data: any) => {
  const response = await apiClient.post("/workshop", data);
  return response.data;
};

export const updateWorkshop = async (id: string, data: any) => {
  const response = await apiClient.put(`/workshop/${id}`, data);
  return response.data;
};

export const deleteWorkshop = async (id: string) => {
  const response = await apiClient.delete(`/workshop/${id}`);
  return response.data;
};
