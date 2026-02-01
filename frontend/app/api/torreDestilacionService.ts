import apiClient from "./apiClient";

export const getTorreDestilacion = async (id: string) => {
  const response = await apiClient.get(`/torre/${id}`);
  if (response.data?.logout) {
    // Handle logout logic here
    // For example, redirect to login page or show a message
    return null; // or throw an error
  }
  return response.data;
};
export const getTorresDestilacion = async () => {
  const response = await apiClient.get("/torre");
  if (response.data?.logout) {
    // Handle logout logic here
    // For example, redirect to login page or show a message
    return null; // or throw an error
  }
  return response.data;
};
export const createTorreDestilacion = async (data: any) => {
  const response = await apiClient.post("/torre", data);
  return response.data;
};
export const updateTorreDestilacion = async (id: string, data: any) => {
  const response = await apiClient.put(`/torre/${id}`, data);
  return response.data;
};
export const deleteTorreDestilacion = async (id: string) => {
  const response = await apiClient.delete(`/torre/${id}`);
  return response.data;
};

export const obtenerTorresPorRefineria = async (idRefineria: string) => {
  const response = await apiClient.get(`/torre/refineria/${idRefineria}`);
  return response.data; // { total, torres }
};
