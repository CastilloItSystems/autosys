import apiClient from "./apiClient";

export const getLineaRecepcion = async (id: string) => {
  const response = await apiClient.get(`/lineaCarga/${id}`);
  return response.data;
};
export const getLineaRecepcions = async () => {
  const response = await apiClient.get("/lineaCarga");
  return response.data;
};
export const createLineaRecepcion = async (data: any) => {
  const response = await apiClient.post("/lineaCarga", data);
  return response.data;
};
export const updateLineaRecepcion = async (id: string, data: any) => {
  const response = await apiClient.put(`/lineaCarga/${id}`, data);
  return response.data;
};
export const deleteLineaRecepcion = async (id: string) => {
  const response = await apiClient.delete(`/lineaCarga/${id}`);
  return response.data;
};
export const obtenerLineasRecepcionPorRefineria = async (
  idRefineria: string
) => {
  const { data } = await apiClient.get(`/lineaCarga/refineria/${idRefineria}`);
  return data; // { total: number, lineaCargas: LineaCarga[] }
};
