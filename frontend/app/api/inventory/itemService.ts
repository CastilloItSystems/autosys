import apiClient from "../apiClient";

// ============================================
// PRICING INTERFACES
// ============================================
export interface IPricingTier {
  id?: string;
  minQuantity: number;
  maxQuantity?: number | null;
  tierPrice: number;
  discountPercentage?: number | null;
}

export interface IPricing {
  id?: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  minMargin: number;
  maxMargin: number;
  discountPercentage?: number | null;
  isActive: boolean;
  tiers?: IPricingTier[];
}

// ============================================
// IMAGE INTERFACES
// ============================================
export interface IItemImage {
  id?: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

// ============================================
// ITEM INTERFACES
// ============================================
export interface Item {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  unitId?: string;
  sku?: string;
  barcode?: string;
  quantity?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  // Precios base del item
  costPrice?: number;
  salePrice?: number; // Renamed from price
  wholesalePrice?: number;
  // Relaciones
  category?: any;
  brand?: any;
  model?: any;
  unit?: any;
  // Pricing y pricing tiers
  pricing?: IPricing;
  // Images
  images?: IItemImage[];
  primaryImage?: string;
  // Flags
  isActive: boolean;
  isSerialized?: boolean;
  hasBatch?: boolean;
  hasExpiry?: boolean;
  allowNegativeStock?: boolean;
  // Additional
  location?: string;
  technicalSpecs?: Record<string, any>;
  tags?: string[];
  margin?: number; // Calculated margin
  // Counts
  _count?: {
    stocks?: number;
    movements?: number;
    images?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// RESPONSE INTERFACES
// ============================================
export interface ItemsResponse {
  success: boolean;
  message: string;
  data: Item[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

interface ItemResponse {
  success: boolean;
  message: string;
  data: Item;
  timestamp: string;
}

// ============================================
// REQUEST DTOs
// ============================================
export interface CreateItemRequest {
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  unitId?: string;
  sku?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  location?: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  isActive?: boolean;
  isSerialized?: boolean;
  hasBatch?: boolean;
  hasExpiry?: boolean;
  allowNegativeStock?: boolean;
  technicalSpecs?: Record<string, any>;
  tags?: string[];
  // Pricing
  pricing?: {
    minMargin: number;
    maxMargin: number;
    discountPercentage?: number | null;
    tiers?: IPricingTier[];
  };
  // Images
  images?: IItemImage[];
}

export interface UpdateItemRequest {
  code?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  unitId?: string;
  sku?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  location?: string;
  costPrice?: number;
  salePrice?: number;
  wholesalePrice?: number | null;
  isActive?: boolean;
  isSerialized?: boolean;
  hasBatch?: boolean;
  hasExpiry?: boolean;
  allowNegativeStock?: boolean;
  technicalSpecs?: Record<string, any>;
  tags?: string[];
  // Pricing
  pricing?: {
    minMargin?: number;
    maxMargin?: number;
    discountPercentage?: number | null;
    tiers?: IPricingTier[];
  };
  // Images
  images?: IItemImage[];
}

// Métodos estándar
const itemService = {
  // GET - Lista con paginación
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    brandId?: string,
    categoryId?: string,
    isActive?: boolean,
  ): Promise<ItemsResponse> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    if (brandId) params.append("brandId", brandId);
    if (categoryId) params.append("categoryId", categoryId);
    if (isActive !== undefined) params.append("isActive", String(isActive));

    const response = await apiClient.get(`/inventory/items?${params}`);
    return response.data;
  },

  // GET - Solo activos
  getActive: async (): Promise<ItemsResponse> => {
    const response = await apiClient.get("/inventory/items/active");
    return response.data;
  },

  // GET - Búsqueda
  search: async (query: string): Promise<ItemsResponse> => {
    const response = await apiClient.get(
      `/inventory/items/search?term=${encodeURIComponent(query)}`,
    );
    return response.data;
  },

  // GET - Por ID
  getById: async (id: string): Promise<ItemResponse> => {
    const response = await apiClient.get(`/inventory/items/${id}`);
    return response.data;
  },

  // POST - Crear
  create: async (data: CreateItemRequest): Promise<ItemResponse> => {
    const response = await apiClient.post("/inventory/items", data);
    return response.data;
  },

  // PUT - Actualizar
  update: async (
    id: string,
    data: UpdateItemRequest,
  ): Promise<ItemResponse> => {
    const response = await apiClient.put(`/inventory/items/${id}`, data);
    return response.data;
  },

  // PATCH - Toggle activo/inactivo
  toggleActive: async (id: string): Promise<ItemResponse> => {
    const response = await apiClient.patch(`/inventory/items/${id}/toggle`);
    return response.data;
  },

  // DELETE - Soft delete
  delete: async (id: string): Promise<ItemResponse> => {
    const response = await apiClient.delete(`/inventory/items/${id}`);
    return response.data;
  },

  // DELETE - Hard delete
  deleteHard: async (id: string): Promise<ItemResponse> => {
    const response = await apiClient.delete(`/inventory/items/${id}/hard`);
    return response.data;
  },

  // Query específicas
  getByCategory: async (categor: string) => {
    const response = await apiClient.get(
      `/inventory/items/category/${categor}`,
    );
    return response.data;
  },

  getLowStock: async () => {
    const response = await apiClient.get("/inventory/items/low-stock");
    return response.data;
  },

  getOutOfStock: async () => {
    const response = await apiClient.get("/inventory/items/out-of-stock");
    return response.data;
  },
};

export default itemService;

// Export individual functions for backward compatibility
export const createItem = (data: CreateItemRequest) => itemService.create(data);
export const updateItem = (id: string, data: UpdateItemRequest) =>
  itemService.update(id, data);
export const deleteItem = (id: string) => itemService.delete(id);
export const getItems = (
  page = 1,
  limit = 10,
  search?: string,
  brandId?: string,
  categoryId?: string,
  isActive?: boolean,
) => itemService.getAll(page, limit, search, brandId, categoryId, isActive);
export const getActiveItems = () => itemService.getActive();
export const searchItems = (query: string) => itemService.search(query);
export const getItemsByCategory = (categoryId: string) =>
  itemService.getByCategory(categoryId);
export const getLowStockItems = () => itemService.getLowStock();
export const getOutOfStockItems = () => itemService.getOutOfStock();
