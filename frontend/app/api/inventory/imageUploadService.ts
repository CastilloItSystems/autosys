// ===== INTERFACES =====

import apiClient from "../apiClient";

export interface IItemImage {
  id: string;
  itemId: string;
  url: string;
  isPrimary: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IImageUploadRequest {
  itemId: string;
  files: File[];
}

export interface IImageUploadResponse {
  id: string;
  itemId: string;
  url: string;
  isPrimary: boolean;
}

export interface IImageUpdateRequest {
  url?: string;
  isPrimary?: boolean;
  order?: number;
}

// ===== IMAGE FUNCTIONS =====

/**
 * Upload multiple images for an item
 */
export const uploadImages = async (
  itemId: string,
  files: File[],
): Promise<IImageUploadResponse[]> => {
  const formData = new FormData();
  formData.append("itemId", itemId);

  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await apiClient.post<IImageUploadResponse[]>(
    "/api/inventory/items/images/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

/**
 * Get images for an item
 */
export const getItemImages = async (itemId: string): Promise<IItemImage[]> => {
  const response = await apiClient.get<IItemImage[]>(
    `/api/inventory/items/images/item/${itemId}`,
  );
  return response.data;
};

/**
 * Get image by ID
 */
export const getImageById = async (id: string): Promise<IItemImage> => {
  const response = await apiClient.get<IItemImage>(
    `/api/inventory/items/images/${id}`,
  );
  return response.data;
};

/**
 * Update image details
 */
export const updateImage = async (
  id: string,
  data: IImageUpdateRequest,
): Promise<IItemImage> => {
  const response = await apiClient.put<IItemImage>(
    `/api/inventory/items/images/${id}`,
    data,
  );
  return response.data;
};

/**
 * Set image as primary
 */
export const setPrimaryImage = async (id: string): Promise<IItemImage> => {
  const response = await apiClient.patch<IItemImage>(
    `/api/inventory/items/images/${id}/primary`,
    {},
  );
  return response.data;
};

/**
 * Delete image
 */
export const deleteImage = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/inventory/items/images/${id}`);
};

/**
 * Get all images with pagination
 */
export const getAllImages = async (
  page = 1,
  limit = 10,
  itemId?: string,
): Promise<{ data: IItemImage[]; total: number }> => {
  const response = await apiClient.get<any>("/api/inventory/items/images", {
    params: {
      page,
      limit,
      itemId,
    },
  });
  return {
    data: response.data.data || [],
    total: response.data.total || 0,
  };
};

/**
 * Reorder images by updating order field
 */
export const reorderImages = async (
  images: Array<{ id: string; order: number }>,
): Promise<void> => {
  await Promise.all(
    images.map((img) => updateImage(img.id, { order: img.order })),
  );
};

/**
 * Validate image file before upload
 */
export const validateImageFile = (
  file: File,
): { valid: boolean; error?: string } => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Archivo no permitido. Solo se aceptan JPEG, PNG o WebP",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Archivo muy grande. Máximo 5MB",
    };
  }

  return { valid: true };
};

export default {
  uploadImages,
  getItemImages,
  getImageById,
  updateImage,
  setPrimaryImage,
  deleteImage,
  getAllImages,
  reorderImages,
  validateImageFile,
};
