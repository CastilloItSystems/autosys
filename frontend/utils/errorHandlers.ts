// utils/errorHandlers.ts
import { AxiosError } from "axios";
import { Toast } from "primereact/toast";

export const handleFormError = (
  error: unknown,
  toastRef: React.RefObject<Toast> | null
) => {
  const axiosError = error as AxiosError<{
    message?: string;
    error?: string;
    errors?: string[];
  }>;

  let errorMessage = "Ocurrió un error al procesar la solicitud";
  let errorDetails: string[] = [];
  let summary = "Error";
  // Manejo estructurado de diferentes tipos de errores
  if (axiosError.response) {
    // Errores de validación con múltiples mensajes
    if (axiosError.response.data?.errors) {
      errorDetails = axiosError.response.data.errors;
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
  if (axiosError.response?.data?.message) {
    summary = axiosError.response.data.message;
  }
  if (toastRef?.current) {
    toastRef.current.show({
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
      details: errorDetails,
      fullError: axiosError,
    });
  }
};
