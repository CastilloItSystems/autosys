import axios from "axios";
import { getSession } from "next-auth/react";
import { useEmpresasStore } from "@/store/empresasStore";
import { notifySessionExpired } from "@/lib/sessionExpiration";

interface ExtendedUser {
  token: string;
}

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api-autosys.castilloitsystems.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token a cada solicitud
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    const token = (session?.user as ExtendedUser)?.token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Inyectar empresaId si está disponible en el store (Zustand)
    const activeEmpresa = useEmpresasStore.getState().activeEmpresa;
    if (activeEmpresa?.id_empresa) {
      config.headers["X-Empresa-Id"] = activeEmpresa.id_empresa;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Evita mostrar el diálogo muchas veces cuando varias solicitudes fallan juntas.
let sessionExpiredNoticeShown = false;

function showSessionExpiredNotice() {
  if (sessionExpiredNoticeShown) {
    return;
  }

  sessionExpiredNoticeShown = true;
  notifySessionExpired();
}

// 2) Interceptor de respuesta: captura logout o 401
apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.logout) {
      showSessionExpiredNotice();
      return Promise.reject(new Error("Logout triggered"));
    }

    sessionExpiredNoticeShown = false;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const session = await getSession();
      const token = (session?.user as ExtendedUser)?.token;

      if (token) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return apiClient(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      showSessionExpiredNotice();
      return Promise.reject(new Error("Unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
