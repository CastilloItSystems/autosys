import apiClient from "./apiClient";

export const getRecepcion = async (id: string) => {
  const response = await apiClient.get(`/recepcion/${id}`);
  return response.data;
};
export const getRecepcions = async () => {
  const response = await apiClient.get("/recepcion");
  return response.data;
};

export async function getRecepcionsFechas(params?: any) {
  console.log(params);
  const res = await apiClient.get("/recepcion/rango-fechas", { params });
  return res.data;
}
export const createRecepcion = async (data: any) => {
  console.log(data);
  const response = await apiClient.post("/recepcion", data);
  return response.data;
};
export const updateRecepcion = async (id: string, data: any) => {
  const response = await apiClient.put(`/recepcion/${id}`, data);
  return response.data;
};
export const deleteRecepcion = async (id: string) => {
  const response = await apiClient.delete(`/recepcion/${id}`);
  return response.data;
};

export const obtenerRecepcionesPorRefineria = async (idRefineria: string) => {
  const { data } = await apiClient.get(`/recepcion/refineria/${idRefineria}`);
  return data; // { total: number, recepciones: Recepcion[] }
};
