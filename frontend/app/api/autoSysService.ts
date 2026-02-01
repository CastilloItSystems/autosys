import apiClient from "./apiClient";

export const getAutoSys = async (id: string) => {
  const response = await apiClient.get(`/autoSys/${id}`);
  return response.data;
};

export const getAutoSyss = async () => {
  const response = await apiClient.get("/autoSys");
  return response.data;
};

export const createAutoSys = async (data: any) => {
  const response = await apiClient.post("/autoSys", data);
  return response.data;
};

export const updateAutoSys = async (id: string, data: any) => {
  const response = await apiClient.put(`/autoSys/${id}`, data);
  return response.data;
};

export const deleteAutoSys = async (id: string) => {
  const response = await apiClient.delete(`/autoSys/${id}`);
  return response.data;
};
