import apiClient from "./apiClient";

export const getTipoProducto = async (id: string) => {
  const response = await apiClient.get(`/tipoProducto/${id}`);
  return response.data;
};
export const getTipoProductos = async () => {
  const response = await apiClient.get("/tipoProducto");
  return response.data;
};
export const createTipoProducto = async (data: any) => {
  const response = await apiClient.post("/tipoProducto", data);
  return response.data;
};
export const updateTipoProducto = async (id: string, data: any) => {
  const response = await apiClient.put(`/tipoProducto/${id}`, data);
  return response.data;
};
export const deleteTipoProducto = async (id: string) => {
  const response = await apiClient.delete(`/tipoProducto/${id}`);
  return response.data;
};
export const obtenerTiposProductoPorRefineria = async (idRefineria: string) => {
  const { data } = await apiClient.get(
    `/tipoProducto/refineria/${idRefineria}`
  );
  return data; // { total: number, tipos: TipoProducto[] }
};
