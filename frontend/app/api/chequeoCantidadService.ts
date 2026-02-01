import apiClient from "./apiClient";

export const getChequeoCantidad = async (id: string) => {
  const response = await apiClient.get(`/chequeoCantidad/${id}`);
  return response.data;
};
export const getChequeoCantidads = async () => {
  const response = await apiClient.get("/chequeoCantidad");
  return response.data;
};
export const createChequeoCantidad = async (data: any) => {
  const response = await apiClient.post("/chequeoCantidad", data);
  return response.data;
};
export const updateChequeoCantidad = async (id: string, data: any) => {
  const response = await apiClient.put(`/chequeoCantidad/${id}`, data);
  return response.data;
};
export const deleteChequeoCantidad = async (id: string) => {
  const response = await apiClient.delete(`/chequeoCantidad/${id}`);
  return response.data;
};
export const obtenerChequeosCantidadPorRefineria = async (
  idRefineria: string
) => {
  const { data } = await apiClient.get(
    `/chequeoCantidad/refineria/${idRefineria}`
  );
  return data; // { total: number, chequeos: ChequeoCantidad[] }
};
