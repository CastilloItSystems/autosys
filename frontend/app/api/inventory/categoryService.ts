import apiClient from "../apiClient";

/**
 * Category API Response Interfaces
 */
export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string | null;
  level?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Relations
  parent?: Category | null;
  children?: Category[];
  itemsCount?: number;
  childrenCount?: number;
  _count?: {
    items: number;
    children: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface CategoryResponse {
  data: Category;
}

/**
 * Categories Service
 * Handles all API calls related to categories catalog management
 */

const BASE_ROUTE = "/inventory/catalogs/categories";

class CategoriesService {
  /**
   * Get all categories with pagination and filters
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string;
    parentId?: string;
  }): Promise<CategoriesResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}`, { params });
    return res.data;
  }

  /**
   * Get only active categories
   */
  async getActive(): Promise<CategoriesResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/active`);
    return res.data;
  }

  /**
   * Get root categories (without parent)
   */
  async getRootCategories(): Promise<CategoriesResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/root`);
    return res.data;
  }

  /**
   * Get complete category tree
   */
  async getTree(): Promise<any> {
    const res = await apiClient.get(`${BASE_ROUTE}/tree`);
    return res.data;
  }

  /**
   * Search categories by term
   */
  async search(term: string): Promise<CategoriesResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/search`, {
      params: { q: term },
    });
    return res.data;
  }

  /**
   * Get single category by ID
   */
  async getById(id: string): Promise<CategoryResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}`);
    return res.data;
  }

  /**
   * Get subcategories of a category
   */
  async getChildren(id: string): Promise<CategoriesResponse> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}/children`);
    return res.data;
  }

  /**
   * Get subtree of a category
   */
  async getSubTree(id: string): Promise<any> {
    const res = await apiClient.get(`${BASE_ROUTE}/${id}/tree`);
    return res.data;
  }

  /**
   * Create a new category
   */
  async create(payload: Partial<Category>): Promise<CategoryResponse> {
    const res = await apiClient.post(`${BASE_ROUTE}`, payload);
    return res.data;
  }

  /**
   * Create multiple categories (bulk import)
   */
  async bulkCreate(categories: Partial<Category>[]): Promise<any> {
    const res = await apiClient.post(`${BASE_ROUTE}/bulk`, { categories });
    return res.data;
  }

  /**
   * Update a category
   */
  async update(
    id: string,
    payload: Partial<Category>,
  ): Promise<CategoryResponse> {
    const res = await apiClient.put(`${BASE_ROUTE}/${id}`, payload);
    return res.data;
  }

  /**
   * Move category to another parent
   */
  async move(id: string, parentId: string | null): Promise<CategoryResponse> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/move`, { parentId });
    return res.data;
  }

  /**
   * Toggle category active status
   */
  async toggleActive(id: string): Promise<CategoryResponse> {
    const res = await apiClient.patch(`${BASE_ROUTE}/${id}/toggle`);
    return res.data;
  }

  /**
   * Soft delete a category (sets isActive to false)
   */
  async delete(id: string): Promise<any> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}`);
    return res.data;
  }

  /**
   * Hard delete a category (permanent deletion)
   */
  async hardDelete(id: string): Promise<any> {
    const res = await apiClient.delete(`${BASE_ROUTE}/${id}/hard`);
    return res.data;
  }
}

export default new CategoriesService();

/**
 * Legacy function exports for backward compatibility
 */
export async function getCategory(id: string) {
  const res = await CategoriesService.prototype.getById(id);
  return res.data;
}

export async function getCategories(params?: any) {
  return CategoriesService.prototype.getAll(params);
}

export async function createCategory(payload: Partial<Category>) {
  const res = await CategoriesService.prototype.create(payload);
  return res.data;
}

export async function updateCategory(id: string, payload: Partial<Category>) {
  const res = await CategoriesService.prototype.update(id, payload);
  return res.data;
}

export async function deleteCategory(id: string) {
  return CategoriesService.prototype.delete(id);
}
