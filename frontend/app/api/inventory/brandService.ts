import apiClient from "../apiClient";

// Tipos
export type BrandType = "VEHICLE" | "PART" | "BOTH";

export const BRAND_TYPE_LABELS: Record<BrandType, string> = {
  VEHICLE: "Vehículo",
  PART: "Producto/Repuesto",
  BOTH: "Ambos",
};

export interface Brand {
  id: string;
  code: string;
  name: string;
  type: BrandType;
  typeLabel: string;
  isActive: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    itemsCount: number;
    modelsCount: number;
  };
}

interface CreateBrandRequest {
  code: string;
  name: string;
  type: BrandType;
  description?: string;
}

interface UpdateBrandRequest {
  code?: string;
  name?: string;
  type?: BrandType;
  isActive?: boolean;
  description?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BrandsResponse {
  success: boolean;
  message: string;
  data: Brand[];
  meta: PaginationInfo;
}

interface BrandResponse {
  data: Brand;
}

interface BrandStatsResponse {
  data: {
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
  };
}

// GET /api/inventory/catalogs/brands - Obtener todas las marcas con paginación
export const getBrands = async (
  page = 1,
  limit = 20,
  search?: string,
): Promise<BrandsResponse> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);

    const response = await apiClient.get(
      `/inventory/catalogs/brands?${params}`,
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw new Error("Error al obtener marcas");
  }
};

// GET /api/inventory/catalogs/brands/active - Obtener solo marcas activas
export const getActiveBrands = async (): Promise<BrandsResponse> => {
  try {
    const response = await apiClient.get("/inventory/catalogs/brands/active");
    return response.data;
  } catch (error) {
    console.error("Error fetching active brands:", error);
    throw new Error("Error al obtener marcas activas");
  }
};

// GET /api/inventory/catalogs/brands/grouped - Obtener marcas agrupadas
export const getBrandsGrouped = async () => {
  try {
    const response = await apiClient.get("/inventory/catalogs/brands/grouped");
    return response.data;
  } catch (error) {
    console.error("Error fetching grouped brands:", error);
    throw new Error("Error al obtener marcas agrupadas");
  }
};

// GET /api/inventory/catalogs/brands/search - Buscar marcas
export const searchBrands = async (query: string): Promise<BrandsResponse> => {
  try {
    const response = await apiClient.get(
      `/inventory/catalogs/brands/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error searching brands:", error);
    throw new Error("Error al buscar marcas");
  }
};

// GET /api/inventory/catalogs/brands/:id - Obtener marca por ID
export const getBrand = async (id: string): Promise<BrandResponse> => {
  try {
    const response = await apiClient.get(`/inventory/catalogs/brands/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching brand:", error);
    throw new Error("Error al obtener la marca");
  }
};

// GET /api/inventory/catalogs/brands/:id/stats - Obtener estadísticas de una marca
export const getBrandStats = async (
  id: string,
): Promise<BrandStatsResponse> => {
  try {
    const response = await apiClient.get(
      `/inventory/catalogs/brands/${id}/stats`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching brand stats:", error);
    throw new Error("Error al obtener estadísticas de la marca");
  }
};

// POST /api/inventory/catalogs/brands - Crear una nueva marca
export const createBrand = async (
  data: CreateBrandRequest,
): Promise<BrandResponse> => {
  try {
    const response = await apiClient.post("/inventory/catalogs/brands", data);
    return response.data;
  } catch (error) {
    console.error("Error creating brand:", error);
    throw new Error("Error al crear la marca");
  }
};

// PUT /api/inventory/catalogs/brands/:id - Actualizar una marca
export const updateBrand = async (
  id: string,
  data: UpdateBrandRequest,
): Promise<BrandResponse> => {
  try {
    const response = await apiClient.put(
      `/inventory/catalogs/brands/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating brand:", error);
    throw new Error("Error al actualizar la marca");
  }
};

// PATCH /api/inventory/catalogs/brands/:id/reactivate - Reactivar marca
export const reactivateBrand = async (id: string): Promise<BrandResponse> => {
  try {
    const response = await apiClient.patch(
      `/inventory/catalogs/brands/${id}/reactivate`,
    );
    return response.data;
  } catch (error) {
    console.error("Error reactivating brand:", error);
    throw new Error("Error al reactivar la marca");
  }
};

// PATCH /api/inventory/catalogs/brands/:id/toggle - Activar/Desactivar marca
export const toggleBrand = async (id: string): Promise<BrandResponse> => {
  try {
    const response = await apiClient.patch(
      `/inventory/catalogs/brands/${id}/toggle`,
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling brand:", error);
    throw new Error("Error al cambiar estado de la marca");
  }
};

// DELETE /api/inventory/catalogs/brands/:id - Eliminar marca (soft delete)
export const deleteBrand = async (id: string): Promise<BrandResponse> => {
  try {
    const response = await apiClient.delete(`/inventory/catalogs/brands/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting brand:", error);
    throw new Error("Error al eliminar la marca");
  }
};

// DELETE /api/inventory/catalogs/brands/:id/hard - Eliminar marca permanentemente
export const deleteBrandPermanently = async (
  id: string,
): Promise<BrandResponse> => {
  try {
    const response = await apiClient.delete(
      `/inventory/catalogs/brands/${id}/hard`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting brand permanently:", error);
    throw new Error("Error al eliminar permanentemente la marca");
  }
};
