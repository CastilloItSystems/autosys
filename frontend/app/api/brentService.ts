import axios from "axios";

const apiBrent = axios.create({
  baseURL: "https://oil.sygem.net",
  timeout: 5000, // Tiempo de espera en milisegundos
  headers: {
    "Content-Type": "application/json", // Tipo de contenido
    Accept: "application/json", // Aceptar JSON como respuesta
  },
  withCredentials: false, // Cambiar a true si el servidor requiere cookies
});

export const getBrent = async () => {
  try {
    const response = await apiBrent.get(`/brent`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error de Axios:", error.message);
      if (error.response) {
        console.error("Respuesta del servidor:", error.response.data);
      } else if (error.request) {
        console.error("No se recibió respuesta del servidor:", error.request);
      } else {
        console.error("Error al configurar la solicitud:", error.message);
      }
    } else {
      console.error("Error desconocido:", error);
    }
    throw error;
  }
};
