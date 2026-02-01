import apiClient from "./apiClient";

export const getPartida = async (id: string) => {
  const response = await apiClient.get(`/partida/${id}`);
  return response.data;
};
export const getPartidas = async () => {
  const response = await apiClient.get("/partida");
  return response.data;
};
export const createPartida = async (data: any) => {
  const response = await apiClient.post("/partida", data);
  return response.data;
};
export const updatePartida = async (id: string, data: any) => {
  const response = await apiClient.put(`/partida/${id}`, data);
  return response.data;
};
export const deletePartida = async (id: string) => {
  const response = await apiClient.delete(`/partida/${id}`);
  return response.data;
};

export const obtenerPartidasPorRefineria = async (idRefineria: string) => {
  const { data } = await apiClient.get(`/partida/refineria/${idRefineria}`);
  return data; // { total: number, partidas: Partida[] }
};
