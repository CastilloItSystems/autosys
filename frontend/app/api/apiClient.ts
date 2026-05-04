import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import { useEmpresasStore } from "@/store/empresasStore";

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

// guard to prevent multiple logout alerts
let logoutAlertShown = false;

// 2) Interceptor de respuesta: captura logout o 401
apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.logout) {
      if (!logoutAlertShown) {
        logoutAlertShown = true;
        window.alert(
          "Sesión expirada. Por favor inicie sesión nuevamente este? .",
        );
      }
      signOut({ callbackUrl: "/auth/login" });
      return Promise.reject(new Error("Logout triggered"));
    }
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
      if (!logoutAlertShown) {
        logoutAlertShown = true;
        window.alert(
          "Su sesión ha finalizado. Por favor inicie sesión nuevamente.",
        );
      }
      signOut({ callbackUrl: "/auth/login" });
      return Promise.reject(new Error("Unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
