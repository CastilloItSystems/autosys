import apiClient from "./apiClient";

export const getRefinacion = async (id: string) => {
  const response = await apiClient.get(`/refinacion/${id}`);
  return response.data;
};
export const getRefinacions = async () => {
  const response = await apiClient.get("/refinacion");
  return response.data;
};
export const createRefinacion = async (data: any) => {
  console.log("data", data);

  const response = await apiClient.post("/refinacion", data);
  return response.data;
};
export const updateRefinacion = async (id: string, data: any) => {
  const response = await apiClient.put(`/refinacion/${id}`, data);
  return response.data;
};
export const deleteRefinacion = async (id: string) => {
  const response = await apiClient.delete(`/refinacion/${id}`);
  return response.data;
};
