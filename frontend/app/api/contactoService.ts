import apiClient from "./apiClient";

export const getContacto = async (id: string) => {
  const response = await apiClient.get(`/contacto/${id}`);
  return response.data;
};
export const getContactos = async () => {
  const response = await apiClient.get("/contacto");
  return response.data;
};
export const createContacto = async (data: any) => {
  const response = await apiClient.post("/contacto", data);
  return response.data;
};
export const updateContacto = async (id: string, data: any) => {
  const response = await apiClient.put(`/contacto/${id}`, data);
  return response.data;
};
export const deleteContacto = async (id: string) => {
  const response = await apiClient.delete(`/contacto/${id}`);
  return response.data;
};
export const obtenerContactosPorRefineria = async (idRefineria: string) => {
  const { data } = await apiClient.get(`/contacto/refineria/${idRefineria}`);
  return data; // { total, contactos }
};
