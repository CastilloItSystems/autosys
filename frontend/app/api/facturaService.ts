import apiClient from "./apiClient";

export const getFactura = async (id: string) => {
  const response = await apiClient.get(`/factura/${id}`);
  return response.data;
};
export const getFacturas = async () => {
  const response = await apiClient.get("/factura");
  return response.data;
};
export const createFactura = async (data: any) => {
  const response = await apiClient.post("/factura", data);
  return response.data;
};
export const updateFactura = async (id: string, data: any) => {
  console.log("Updating factura with ID:", id, "and data:", data);

  const response = await apiClient.put(`/factura/${id}`, data);
  return response.data;
};
export const deleteFactura = async (id: string) => {
  const response = await apiClient.delete(`/factura/${id}`);
  return response.data;
};

export const obtenerFacturasPorRefineria = async (refineriaId: string) => {
  const response = await apiClient.get(`/factura/refineria/${refineriaId}`);
  return response.data;
};
