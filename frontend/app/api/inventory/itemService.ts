import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

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

export interface IPriceLevel {
  id?: string;
  level: number;
  priceForeign: number;
  price: number;
  finalPrice: number;
  utility: number;
  commission: number;
}

export interface IPricing {
  id?: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  minMargin?: number;
  maxMargin?: number;
  discountPercentage?: number | null;
  costForeign?: number;
  exchangeRate?: number;
  costRef?: number;
  costPrevious?: number;
  taxRateSale?: number;
  taxRatePurchase?: number;
  isActive: boolean;
  tiers?: IPricingTier[];
  priceLevels?: IPriceLevel[];
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
  identity?: string;
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
  useStock?: boolean;
  isFractionable?: boolean;
  isComposite?: boolean;
  isInternalUse?: boolean;
  useServer?: boolean;
  suspendedForPurchase?: boolean;
  // Campos extendidos
  shortName?: string | null;
  reference?: string | null;
  contraindications?: string | null;
  warrantyDays?: number;
  packagingQty?: number;
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
// REQUEST DTOs
// ============================================
export interface GetItemParams {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  categoryId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

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
  identity?: string;
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
  useStock?: boolean;
  isFractionable?: boolean;
  isComposite?: boolean;
  isInternalUse?: boolean;
  useServer?: boolean;
  suspendedForPurchase?: boolean;
  shortName?: string | null;
  reference?: string | null;
  contraindications?: string | null;
  warrantyDays?: number;
  packagingQty?: number;
  technicalSpecs?: Record<string, any>;
  tags?: string[];
  // Pricing
  pricing?: {
    minMargin?: number;
    maxMargin?: number;
    discountPercentage?: number | null;
    costForeign?: number;
    exchangeRate?: number;
    taxRateSale?: number;
    taxRatePurchase?: number;
    priceLevels?: { level: number; priceForeign: number }[];
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
  identity?: string;
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
  useStock?: boolean;
  isFractionable?: boolean;
  isComposite?: boolean;
  isInternalUse?: boolean;
  useServer?: boolean;
  suspendedForPurchase?: boolean;
  shortName?: string | null;
  reference?: string | null;
  contraindications?: string | null;
  warrantyDays?: number;
  packagingQty?: number;
  technicalSpecs?: Record<string, any>;
  tags?: string[];
  // Pricing
  pricing?: {
    minMargin?: number;
    maxMargin?: number;
    discountPercentage?: number | null;
    costForeign?: number;
    exchangeRate?: number;
    taxRateSale?: number;
    taxRatePurchase?: number;
    priceLevels?: { level: number; priceForeign: number }[];
    tiers?: IPricingTier[];
  };
  // Images
  images?: IItemImage[];
}

// ============================================
// SERVICE
// ============================================
const BASE_ROUTE = "/inventory/items";

const itemService = {
  // GET - Lista con paginación
  getAll: async (params?: GetItemParams): Promise<PaginatedResponse<Item>> => {
    const response = await apiClient.get(BASE_ROUTE, { params });
    return response.data;
  },

  // GET - Solo activos
  getActive: async (): Promise<ApiResponse<Item[]>> => {
    const response = await apiClient.get(`${BASE_ROUTE}/active`);
    return response.data;
  },

  // GET - Búsqueda
  search: async (query: string): Promise<ApiResponse<Item[]>> => {
    const response = await apiClient.get(`${BASE_ROUTE}/search`, {
      params: { term: query },
    });
    return response.data;
  },

  // GET - Por ID
  getById: async (id: string): Promise<ApiResponse<Item>> => {
    const response = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return response.data;
  },

  // POST - Crear
  create: async (data: CreateItemRequest): Promise<ApiResponse<Item>> => {
    const response = await apiClient.post(BASE_ROUTE, data);
    return response.data;
  },

  // PUT - Actualizar
  update: async (
    id: string,
    data: UpdateItemRequest,
  ): Promise<ApiResponse<Item>> => {
    const response = await apiClient.put(`${BASE_ROUTE}/${id}`, data);
    return response.data;
  },

  // PATCH - Toggle activo/inactivo
  toggleActive: async (id: string): Promise<ApiResponse<Item>> => {
    const response = await apiClient.patch(`${BASE_ROUTE}/${id}/toggle`);
    return response.data;
  },

  // DELETE - Soft delete
  delete: async (id: string): Promise<ApiResponse<Item>> => {
    const response = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return response.data;
  },

  // DELETE - Hard delete
  deleteHard: async (id: string): Promise<ApiResponse<Item>> => {
    const response = await apiClient.delete(`${BASE_ROUTE}/${id}/hard`);
    return response.data;
  },

  // Query específicas
  getByCategory: async (categoryId: string): Promise<ApiResponse<Item[]>> => {
    const response = await apiClient.get(
      `${BASE_ROUTE}/category/${categoryId}`,
    );
    return response.data;
  },

  getLowStock: async (): Promise<ApiResponse<Item[]>> => {
    const response = await apiClient.get(`${BASE_ROUTE}/low-stock`);
    return response.data;
  },

  getOutOfStock: async (): Promise<ApiResponse<Item[]>> => {
    const response = await apiClient.get(`${BASE_ROUTE}/out-of-stock`);
    return response.data;
  },

  // IMAGES
  uploadItemImages: async (
    itemId: string,
    files: File[],
  ): Promise<ApiResponse<IItemImage[]>> => {
    const formData = new FormData();
    formData.append("itemId", itemId);
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await apiClient.post(
      `${BASE_ROUTE}/images/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  deleteItemImage: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`${BASE_ROUTE}/images/${id}`);
    return response.data;
  },

  setPrimaryImage: async (id: string): Promise<ApiResponse<IItemImage>> => {
    const response = await apiClient.patch(
      `${BASE_ROUTE}/images/${id}/primary`,
    );
    return response.data;
  },
};

export default itemService;
