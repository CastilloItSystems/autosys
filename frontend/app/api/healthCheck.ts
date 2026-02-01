import apiClient from "./apiClient";

/**
 * Health Check - Verificar estado del backend
 */
export const checkBackendHealth = async () => {
  try {
    // Intentar conectar con un endpoint básico
    const response = await apiClient.get("/health");
    return {
      ok: true,
      status: "connected",
      baseURL: apiClient.defaults.baseURL,
      message: "Backend conectado correctamente",
    };
  } catch (error: any) {
    return {
      ok: false,
      status: "error",
      baseURL: apiClient.defaults.baseURL,
      error: {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
      },
      message: "No se pudo conectar con el backend",
    };
  }
};

/**
 * Verificar si un endpoint específico existe
 */
export const checkEndpoint = async (endpoint: string) => {
  try {
    const response = await apiClient.get(endpoint);
    return {
      ok: true,
      endpoint,
      status: response.status,
      message: "Endpoint disponible",
    };
  } catch (error: any) {
    return {
      ok: false,
      endpoint,
      status: error?.response?.status,
      message:
        error?.response?.status === 404
          ? "Endpoint no encontrado (404)"
          : `Error: ${error?.message}`,
    };
  }
};

/**
 * Diagnóstico completo del sistema
 */
export const runDiagnostics = async () => {
  console.log("🔍 Ejecutando diagnóstico del sistema...");
  console.log("📍 Base URL:", apiClient.defaults.baseURL);

  const results = {
    baseURL: apiClient.defaults.baseURL,
    endpoints: {} as Record<string, any>,
  };

  // Probar endpoints críticos
  const endpoints = [
    "/service-bays",
    "/dashboard/taller-status",
    "/work-orders",
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔗 Probando: ${endpoint}`);
    const result = await checkEndpoint(endpoint);
    results.endpoints[endpoint] = result;
    console.log(result.ok ? "✅" : "❌", result.message);
  }

  console.log("\n📊 Resumen del diagnóstico:", results);
  return results;
};
