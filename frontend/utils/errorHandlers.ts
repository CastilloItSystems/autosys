// utils/errorHandlers.ts
import { AxiosError } from "axios";
import { Toast } from "primereact/toast";

const stripTechnicalDetails = (message: string): string => {
  if (!message) return message;
  return message
    .replace(/\s*Detalle t[eé]cnico:.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const getUserFriendlySummary = (
  message: string,
  status?: number,
): string => {
  if (/stock insuficiente/i.test(message)) return "Stock insuficiente";
  if (/no autorizado|token/i.test(message) || status === 401)
    return "No autorizado";
  if (/acceso denegado/i.test(message) || status === 403)
    return "Acceso denegado";
  if (status === 404) return "No encontrado";
  if (status === 409) return "Conflicto";
  if (status === 422) return "Error de validación";
  if (status === 500) return "Error interno";
  return "Error";
};

export const handleFormError = (
  error: unknown,
  toastRef: React.RefObject<Toast | null> | Toast | null,
) => {
  const axiosError = error as AxiosError<{
    message?: string;
    error?: string;
    errors?: any[];
  }>;

  let errorMessage = "Ocurrió un error al procesar la solicitud";
  let rawBackendMessage = "";
  let errorDetails: string[] = [];
  let summary = "Error";
  // Manejo estructurado de diferentes tipos de errores
  if (axiosError.response) {
    // Errores de validación con múltiples mensajes
    if (Array.isArray(axiosError.response.data?.errors)) {
      errorDetails = axiosError.response.data.errors.map((err) => {
        if (typeof err === "string") return err;
        if (typeof err === "object" && err !== null && err.message) {
          return err.message;
        }
        return String(err);
      }).map(stripTechnicalDetails);
      errorMessage = "Errores de validación";
    }
    // Mensaje de error específico del backend
    else if (axiosError.response.data?.error) {
      errorMessage = axiosError.response.data.error;
    }
    // Mensaje general de error
    else if (axiosError.response.data?.message) {
      errorMessage = axiosError.response.data.message;
    }

    rawBackendMessage =
      axiosError.response.data?.message ||
      axiosError.response.data?.error ||
      errorMessage;
    errorMessage = stripTechnicalDetails(errorMessage);

    // // Errores HTTP específicos
    // switch (axiosError.response.status) {
    //   case 400:
    //     errorMessage = errorMessage || "Solicitud inválida";
    //     break;
    //   case 401:
    //     errorMessage = "No autorizado";
    //     break;
    //   case 409:
    //     errorMessage = "Conflicto: el recurso ya existe";
    //     break;
    //   case 500:
    //     errorMessage = "Error interno del servidor";
    //     break;
    // }
  } else if (axiosError.request) {
    errorMessage = "No se recibió respuesta del servidor";
  } else {
    errorMessage = `Error de configuración: ${axiosError.message}`;
  }
  summary = getUserFriendlySummary(
    rawBackendMessage || errorMessage,
    axiosError.response?.status,
  );
  const toastInstance =
    toastRef && "current" in toastRef ? toastRef.current : toastRef;

  if (toastInstance) {
    toastInstance.show({
      severity: "error",
      summary,
      detail: errorDetails.length > 0 ? errorDetails.join(", ") : errorMessage,
      life: 5000,
    });
  }

  // Log detallado para desarrollo
  if (process.env.NODE_ENV === "development") {
    console.error("Error detallado:", {
      message: errorMessage,
      rawBackendMessage,
      details: errorDetails,
      fullError: axiosError,
    });
  }
};
