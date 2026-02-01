import axios from "axios";
import { getSession, signIn, signOut } from "next-auth/react";

interface ExtendedUser {
  token: string;
}
// asdlasd
const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://app-taller-97d415ecb8bf.herokuapp.com/api",
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
      config.headers["x-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// guard to prevent multiple logout alerts
let logoutAlertShown = false;

// 2) Interceptor de respuesta: captura logout o 401
apiClient.interceptors.response.use(
  async (response) => {
    // log full response and headers for debugging
    // console.log("API Response headers:", response);
    // log x-new-token if present
    const newToken =
      response.headers["x-new-token"] || response.headers["X-New-Token"];
    // dentro de tu interceptor, tras leer newToken:
    if (newToken) {
      // Actualiza la sesión con el nuevo token y propiedades personalizadas
      const session = await getSession();
      const updatedSession = {
        ...session,
        user: {
          ...session?.user,
          tokenNuevo: newToken,
          token: " Nuevo Nombre", // ejemplo: actualizamos el nombre de usuario
          name: "Nuevo Nombre", // ejemplo: actualizamos el nombre de usuario
        },
      };
    }
    if (response.data?.logout) {
      if (!logoutAlertShown) {
        logoutAlertShown = true;
        window.alert(
          "Sesión expirada. Por favor inicie sesión nuevamente este? ."
        );
      }
      signOut({ callbackUrl: "/auth/login" });
      return Promise.reject(new Error("Logout triggered"));
    }
    return response;
  },
  (error) => {
    console.log("API Error response:", error.response);
    if (error.response?.status === 401) {
      if (error.response.data?.logout === true) {
        if (!logoutAlertShown) {
          logoutAlertShown = true;
          window.alert(
            "Su sesión ha finalizado. Por favor inicie sesión nuevamente."
          );
        }
        // use signOut without redirect and manual navigation
        signOut({ callbackUrl: "/auth/login" });
      }
      return Promise.reject(new Error("Unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
