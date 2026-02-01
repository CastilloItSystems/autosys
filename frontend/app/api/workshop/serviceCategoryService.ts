import apiClient from "../apiClient";
import {
  ServiceCategory,
  ServiceCategoryFilters,
  ServiceCategoryResponse,
  ServiceSubcategory,
  ServiceSubcategoryFilters,
  ServiceSubcategoryResponse,
} from "@/libs/interfaces/workshop";

const BASE_URL = "/service-categories";
const SUBCATEGORIES_BASE_URL = "/service-subcategories";

// Get all service categories with optional filters
export const getServiceCategories = async (
  filters?: ServiceCategoryFilters
): Promise<ServiceCategoryResponse> => {
  const response = await apiClient.get<ServiceCategoryResponse>(BASE_URL, {
    params: filters,
  });
  return response.data;
};

// Get a single service category by ID
export const getServiceCategory = async (
  id: string
): Promise<ServiceCategory> => {
  const response = await apiClient.get<{
    success: boolean;
    data: ServiceCategory;
  }>(`${BASE_URL}/${id}`);
  return response.data.data;
};

// Create a new service category
export const createServiceCategory = async (
  data: Partial<ServiceCategory>
): Promise<ServiceCategory> => {
  const response = await apiClient.post<{
    success: boolean;
    data: ServiceCategory;
  }>(BASE_URL, data);
  return response.data.data;
};

// Update an existing service category
export const updateServiceCategory = async (
  id: string,
  data: Partial<ServiceCategory>
): Promise<ServiceCategory> => {
  const response = await apiClient.put<{
    success: boolean;
    data: ServiceCategory;
  }>(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

// Delete a service category
export const deleteServiceCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

// Get all subcategories with optional filters
export const getServiceSubcategories = async (
  filters?: ServiceSubcategoryFilters
): Promise<ServiceSubcategoryResponse> => {
  const response = await apiClient.get<ServiceSubcategoryResponse>(
    SUBCATEGORIES_BASE_URL,
    {
      params: filters,
    }
  );
  return response.data;
};

// Get a single subcategory by ID
export const getServiceSubcategory = async (
  id: string
): Promise<ServiceSubcategory> => {
  const response = await apiClient.get<{
    success: boolean;
    data: ServiceSubcategory;
  }>(`${SUBCATEGORIES_BASE_URL}/${id}`);
  return response.data.data;
};

// Create a new subcategory
export const createServiceSubcategory = async (
  data: Partial<ServiceSubcategory>
): Promise<ServiceSubcategory> => {
  const response = await apiClient.post<{
    success: boolean;
    data: ServiceSubcategory;
  }>(SUBCATEGORIES_BASE_URL, data);
  return response.data.data;
};

// Update an existing subcategory
export const updateServiceSubcategory = async (
  id: string,
  data: Partial<ServiceSubcategory>
): Promise<ServiceSubcategory> => {
  const response = await apiClient.put<{
    success: boolean;
    data: ServiceSubcategory;
  }>(`${SUBCATEGORIES_BASE_URL}/${id}`, data);
  return response.data.data;
};

// Delete a subcategory
export const deleteServiceSubcategory = async (id: string): Promise<void> => {
  await apiClient.delete(`${SUBCATEGORIES_BASE_URL}/${id}`);
};
