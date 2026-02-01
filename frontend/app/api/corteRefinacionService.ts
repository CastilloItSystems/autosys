import apiClient from "./apiClient";

export const getCorteRefinacion = async (id: string) => {
  const response = await apiClient.get(`/corteRefinacion/${id}`);
  return response.data;
};
export const getCorteRefinacions = async () => {
  const response = await apiClient.get("/corteRefinacion");
  return response.data;
};
export const createCorteRefinacion = async (data: any) => {
  console.log("data", data);

  const response = await apiClient.post("/corteRefinacion", data);
  return response.data;
};
export const updateCorteRefinacion = async (id: string, data: any) => {
  const response = await apiClient.put(`/corteRefinacion/${id}`, data);
  return response.data;
};
export const deleteCorteRefinacion = async (id: string) => {
  const response = await apiClient.delete(`/corteRefinacion/${id}`);
  return response.data;
};
export const obtenerCortesRefinacionPorRefineria = async (
  idRefineria: string
) => {
  const { data } = await apiClient.get(
    `/corteRefinacion/refineria/${idRefineria}`
  );
  return data; // { total: number, cortes: CorteRefinacion[] }
};
