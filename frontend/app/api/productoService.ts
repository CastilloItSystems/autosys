import apiClient from "./apiClient";

export const getProducto = async (id: string) => {
  const response = await apiClient.get(`/producto/${id}`);
  return response.data;
};
export const getProductos = async () => {
  const response = await apiClient.get("/producto");
  return response.data;
};
export const createProducto = async (data: any) => {
  const response = await apiClient.post("/producto", data);
  return response.data;
};
export const updateProducto = async (id: string, data: any) => {
  const response = await apiClient.put(`/producto/${id}`, data);
  return response.data;
};
export const deleteProducto = async (id: string) => {
  const response = await apiClient.delete(`/producto/${id}`);
  return response.data;
};
export const obtenerProductosPorRefineria = async (idRefineria: string) => {
  const { data } = await apiClient.get(`/producto/refineria/${idRefineria}`);
  return data; // { total: number, productos: Producto[] }
};
