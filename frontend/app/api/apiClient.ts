import axios, { type InternalAxiosRequestConfig } from "axios";
import { useEmpresasStore } from "@/store/empresasStore";
import {
  expireBackendSession,
  getValidBackendSession,
} from "@/lib/backendAuthSession";

type AuthRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const AUTHLESS_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh"];

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api-autosys.castilloitsystems.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

function isAuthlessRequest(config: InternalAxiosRequestConfig) {
  const url = config.url ?? "";
  return AUTHLESS_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function setRequestHeader(
  config: InternalAxiosRequestConfig,
  name: string,
  value: string,
) {
  config.headers = config.headers || {};

  if (typeof (config.headers as any).set === "function") {
    (config.headers as any).set(name, value);
    return;
  }

  (config.headers as Record<string, string>)[name] = value;
}

// Interceptor para agregar un access token valido a cada solicitud protegida.
apiClient.interceptors.request.use(
  async (config) => {
    if (!isAuthlessRequest(config)) {
      const session = await getValidBackendSession();
      const token = session?.user?.token;
      if (token) {
        setRequestHeader(config, "Authorization", `Bearer ${token}`);
      }
    }

    // Inyectar empresaId si está disponible en el store (Zustand)
    const activeEmpresa = useEmpresasStore.getState().activeEmpresa;
    if (activeEmpresa?.id_empresa) {
      setRequestHeader(config, "X-Empresa-Id", activeEmpresa.id_empresa);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Evita mostrar el diálogo muchas veces cuando varias solicitudes fallan juntas.
let sessionExpiredNoticeShown = false;

async function showSessionExpiredNotice() {
  if (sessionExpiredNoticeShown) {
    return;
  }

  sessionExpiredNoticeShown = true;
  await expireBackendSession();
}

// 2) Interceptor de respuesta: captura logout o 401
apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.logout) {
      void showSessionExpiredNotice();
      return Promise.reject(new Error("Logout triggered"));
    }

    sessionExpiredNoticeShown = false;
    return response;
  },
  async (error) => {
    const originalRequest = error.config as AuthRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthlessRequest(originalRequest)
    ) {
      originalRequest._retry = true;
      const session = await getValidBackendSession({ forceRefresh: true });
      const token = session?.user?.token;

      if (token) {
        setRequestHeader(originalRequest, "Authorization", `Bearer ${token}`);
        return apiClient(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      await showSessionExpiredNotice();
      return Promise.reject(new Error("Unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
