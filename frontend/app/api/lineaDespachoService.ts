import apiClient from "./apiClient";

export const getLineaDespacho = async (id: string) => {
  const response = await apiClient.get(`/lineaDespacho/${id}`);
  return response.data;
};
export const getLineaDespachos = async () => {
  const response = await apiClient.get("/lineaDespacho");
  return response.data;
};
export const createLineaDespacho = async (data: any) => {
  const response = await apiClient.post("/lineaDespacho", data);
  return response.data;
};
export const updateLineaDespacho = async (id: string, data: any) => {
  const response = await apiClient.put(`/lineaDespacho/${id}`, data);
  return response.data;
};
export const deleteLineaDespacho = async (id: string) => {
  const response = await apiClient.delete(`/lineaDespacho/${id}`);
  return response.data;
};
export const obtenerLineasDespachoPorRefineria = async (
  idRefineria: string
) => {
  const { data } = await apiClient.get(
    `/lineaDespacho/refineria/${idRefineria}`
  );
  return data; // { total: number, lineaDespachos: LineaDespacho[] }
};
