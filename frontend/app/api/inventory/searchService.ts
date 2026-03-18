import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

export interface ISearchItem {
  id: string;
  sku: string;
  code?: string;
  identity?: string;
  name: string;
  description?: string;
  categoryName: string;
  brandName?: string;
  modelName?: string;
  salePrice: number;
  costPrice?: number;
  minStock?: number;
  reorderPoint?: number;
  quantity?: number;
  tags?: string[];
  images?: { url: string; isPrimary: boolean }[];
  isActive: boolean;
  score?: number;
}

export interface ISearchAggregation {
  name: string;
  count: number;
  value: string;
}

export interface ISearchAggregations {
  categories: ISearchAggregation[];
  brands: ISearchAggregation[];
  priceRanges: ISearchAggregation[];
  tags: ISearchAggregation[];
}

export interface ISearchSuggestion {
  text: string;
  count: number;
}

export interface ISearchFilters {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
  tags?: string[];
}

export interface ISearchRequest {
  query: string;
  filters?: ISearchFilters;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface IAdvancedSearchRequest extends ISearchRequest {
  filters?: ISearchFilters;
}

export interface ISearchResponse {
  success: boolean;
  message?: string;
  data: ISearchItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== SEARCH SERVICE =====

const searchService = {
  /**
   * Basic search - find items by query
   */
  async search(request: ISearchRequest): Promise<ISearchResponse> {
    const response = await apiClient.post<ISearchResponse>(
      "/inventory/items/search",
      {
        query: request.query,
        filters: request.filters,
        sortBy: request.sortBy || "relevance",
        sortOrder: request.sortOrder || "desc",
        page: request.page || 1,
        limit: request.limit || 10,
      },
    );
    return response.data;
  },

  /**
   * Advanced search - with complex filters
   */
  async advancedSearch(
    request: IAdvancedSearchRequest,
  ): Promise<ISearchResponse> {
    const response = await apiClient.post<ISearchResponse>(
      "/inventory/items/search/advanced",
      {
        query: request.query,
        filters: request.filters,
        sortBy: request.sortBy || "relevance",
        sortOrder: request.sortOrder || "desc",
        page: request.page || 1,
        limit: request.limit || 10,
      },
    );
    return response.data;
  },

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(
    query: string,
    limit = 10,
  ): Promise<ISearchSuggestion[]> {
    const response = await apiClient.get<ISearchSuggestion[]>(
      "/inventory/items/search/suggestions",
      {
        params: {
          query,
          limit,
        },
      },
    );
    return response.data;
  },

  /**
   * Get aggregations for faceted search
   */
  async getAggregations(query?: string): Promise<ISearchAggregations> {
    const response = await apiClient.get<ISearchAggregations>(
      "/inventory/items/search/aggregations",
      {
        params: {
          query: query || "",
        },
      },
    );
    return response.data;
  },

  /**
   * Enhanced search with full text and suggestions
   */
  async globalSearch(query: string, limit = 20): Promise<ISearchItem[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const response = await this.search({
        query: query.trim(),
        limit,
        page: 1,
      });
      return response.data;
    } catch (error) {
      console.error("Global search error:", error);
      return [];
    }
  },

  /**
   * Get price range analysis
   */
  async getPriceAnalysis(query?: string): Promise<{
    min: number;
    max: number;
    average: number;
    ranges: ISearchAggregation[];
  }> {
    const aggregations = await this.getAggregations(query);
    const priceRanges = aggregations.priceRanges || [];

    return {
      min: 0,
      max: 10000,
      average: 0,
      ranges: priceRanges,
    };
  },

  /**
   * Get related items by category
   */
  async getRelatedItems(categoryId: string, limit = 5): Promise<ISearchItem[]> {
    try {
      const response = await this.advancedSearch({
        query: "",
        filters: {
          categoryId,
        },
        limit,
        page: 1,
      });
      return response.data;
    } catch (error) {
      console.error("Related items error:", error);
      return [];
    }
  },

  /**
   * Get items by brand
   */
  async getByBrand(
    brandId: string,
    page = 1,
    limit = 10,
  ): Promise<ISearchResponse> {
    return this.advancedSearch({
      query: "",
      filters: {
        brandId,
      },
      page,
      limit,
    });
  },

  /**
   * Get items by category
   */
  async getByCategory(
    categoryId: string,
    page = 1,
    limit = 10,
  ): Promise<ISearchResponse> {
    return this.advancedSearch({
      query: "",
      filters: {
        categoryId,
      },
      page,
      limit,
    });
  },

  /**
   * Get items with custom filters
   */
  async getFiltered(
    filters: ISearchFilters,
    page = 1,
    limit = 10,
    sortBy?: "price" | "name",
  ): Promise<ISearchResponse> {
    return this.advancedSearch({
      query: "",
      filters,
      sortBy,
      page,
      limit,
    });
  },
};

export default searchService;
