import apiClient from "../apiClient";

// Tipos
export type ModelType = "VEHICLE" | "PART";

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  VEHICLE: "Vehículo",
  PART: "Producto/Repuesto",
};

export interface Model {
  id: string;
  code: string;
  name: string;
  type: ModelType;
  typeLabel: string;
  brandId: string;
  brand?: {
    id: string;
    code: string;
    name: string;
  };
  year?: number;
  isActive: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    itemsCount: number;
  };
}

interface CreateModelRequest {
  code: string;
  name: string;
  type: ModelType;
  brandId: string;
  year?: number;
  description?: string;
}

interface UpdateModelRequest {
  code?: string;
  name?: string;
  type?: ModelType;
  year?: number;
  isActive?: boolean;
  description?: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ModelsResponse {
  success: boolean;
  message: string;
  data: Model[];
  meta: PaginationInfo;
}

interface ModelResponse {
  data: Model;
}

interface ModelStatsResponse {
  data: {
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
  };
}

// GET /api/inventory/catalogs/models - Obtener todos los modelos con paginación
export const getModels = async (
  page = 1,
  limit = 20,
  search?: string,
  brandId?: string,
  year?: number,
  type?: ModelType,
): Promise<ModelsResponse> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    if (brandId) params.append("brandId", brandId);
    if (year) params.append("year", String(year));
    if (type) params.append("type", type);

    const response = await apiClient.get(
      `/inventory/catalogs/models?${params}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw new Error("Error al obtener modelos");
  }
};

// GET /api/inventory/catalogs/models/active - Obtener solo modelos activos
export const getActiveModels = async (): Promise<ModelsResponse> => {
  try {
    const response = await apiClient.get("/inventory/catalogs/models/active");
    return response.data;
  } catch (error) {
    console.error("Error fetching active models:", error);
    throw new Error("Error al obtener modelos activos");
  }
};

// GET /api/inventory/catalogs/models/grouped - Obtener modelos agrupados por marca
export const getModelsGrouped = async () => {
  try {
    const response = await apiClient.get("/inventory/catalogs/models/grouped");
    return response.data;
  } catch (error) {
    console.error("Error fetching grouped models:", error);
    throw new Error("Error al obtener modelos agrupados");
  }
};

// GET /api/inventory/catalogs/models/years - Obtener años disponibles
export const getAvailableYears = async (): Promise<any> => {
  try {
    const response = await apiClient.get("/inventory/catalogs/models/years");
    return response.data;
  } catch (error) {
    console.error("Error fetching available years:", error);
    throw new Error("Error al obtener años disponibles");
  }
};

// GET /api/inventory/catalogs/models/search - Buscar modelos
export const searchModels = async (query: string): Promise<ModelsResponse> => {
  try {
    const response = await apiClient.get(
      `/inventory/catalogs/models/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error searching models:", error);
    throw new Error("Error al buscar modelos");
  }
};

// GET /api/inventory/catalogs/models/:id - Obtener modelo por ID
export const getModel = async (id: string): Promise<ModelResponse> => {
  try {
    const response = await apiClient.get(`/inventory/catalogs/models/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching model:", error);
    throw new Error("Error al obtener el modelo");
  }
};

// GET /api/inventory/catalogs/models/brand/:brandId - Obtener modelos por marca
export const getModelsByBrand = async (
  brandId: string,
): Promise<ModelsResponse> => {
  try {
    const response = await apiClient.get(
      `/inventory/catalogs/models/brand/${brandId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching models by brand:", error);
    throw new Error("Error al obtener modelos por marca");
  }
};

// GET /api/inventory/catalogs/models/year/:year - Obtener modelos por año
export const getModelsByYear = async (
  year: number,
): Promise<ModelsResponse> => {
  try {
    const response = await apiClient.get(
      `/inventory/catalogs/models/year/${year}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching models by year:", error);
    throw new Error("Error al obtener modelos por año");
  }
};

// POST /api/inventory/catalogs/models - Crear un nuevo modelo
export const createModel = async (
  data: CreateModelRequest,
): Promise<ModelResponse> => {
  try {
    const response = await apiClient.post("/inventory/catalogs/models", data);
    return response.data;
  } catch (error) {
    console.error("Error creating model:", error);
    throw new Error("Error al crear el modelo");
  }
};

// POST /api/inventory/catalogs/models/bulk - Crear múltiples modelos
export const createModelsBulk = async (
  models: CreateModelRequest[],
): Promise<any> => {
  try {
    const response = await apiClient.post("/inventory/catalogs/models/bulk", {
      models,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating models in bulk:", error);
    throw new Error("Error al crear modelos en lote");
  }
};

// PUT /api/inventory/catalogs/models/:id - Actualizar un modelo
export const updateModel = async (
  id: string,
  data: UpdateModelRequest,
): Promise<ModelResponse> => {
  try {
    const response = await apiClient.put(
      `/inventory/catalogs/models/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating model:", error);
    throw new Error("Error al actualizar el modelo");
  }
};

// PATCH /api/inventory/catalogs/models/:id/toggle - Activar/Desactivar modelo
export const toggleModel = async (id: string): Promise<ModelResponse> => {
  try {
    const response = await apiClient.patch(
      `/inventory/catalogs/models/${id}/toggle`,
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling model:", error);
    throw new Error("Error al cambiar estado del modelo");
  }
};

// DELETE /api/inventory/catalogs/models/:id - Eliminar modelo (soft delete)
export const deleteModel = async (id: string): Promise<ModelResponse> => {
  try {
    const response = await apiClient.delete(`/inventory/catalogs/models/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting model:", error);
    throw new Error("Error al eliminar el modelo");
  }
};

// DELETE /api/inventory/catalogs/models/:id/hard - Eliminar modelo permanentemente
export const deleteModelPermanently = async (
  id: string,
): Promise<ModelResponse> => {
  try {
    const response = await apiClient.delete(
      `/inventory/catalogs/models/${id}/hard`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting model permanently:", error);
    throw new Error("Error al eliminar permanentemente el modelo");
  }
};
