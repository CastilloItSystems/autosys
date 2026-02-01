import apiClient from "./apiClient";

export const getRefineria = async (id: string) => {
  const response = await apiClient.get(`/refinerias/${id}`);
  return response.data;
};

export const getRefinerias = async () => {
  const response = await apiClient.get("/refinerias");
  return response.data;
};

export const createRefineria = async (data: any) => {
  const response = await apiClient.post("/refinerias", data);
  return response.data;
};

export const updateRefineria = async (id: string, data: any) => {
  const response = await apiClient.put(`/refinerias/${id}`, data);
  return response.data;
};

export const deleteRefineria = async (id: string) => {
  const response = await apiClient.delete(`/refinerias/${id}`);
  return response.data;
};
