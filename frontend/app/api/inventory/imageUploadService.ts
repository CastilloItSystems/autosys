// ===== INTERFACES =====

import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

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

// Eliminar IImageUploadResponse - usar ApiResponse<IItemImage[]> en su lugar

// ===== Service =====

const imageUploadService = {
  async upload(
    itemId: string,
    files: File[],
  ): Promise<ApiResponse<IItemImage[]>> {
    const formData = new FormData();
    formData.append("itemId", itemId);

    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await apiClient.post<ApiResponse<IItemImage[]>>(
      "/api/inventory/items/images/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  async getByItem(itemId: string): Promise<ApiResponse<IItemImage[]>> {
    const response = await apiClient.get<ApiResponse<IItemImage[]>>(
      `/api/inventory/items/images/item/${itemId}`,
    );
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<IItemImage>> {
    const response = await apiClient.get<ApiResponse<IItemImage>>(
      `/api/inventory/items/images/${id}`,
    );
    return response.data;
  },

  async update(
    id: string,
    data: IImageUpdateRequest,
  ): Promise<ApiResponse<IItemImage>> {
    const response = await apiClient.put<ApiResponse<IItemImage>>(
      `/api/inventory/items/images/${id}`,
      data,
    );
    return response.data;
  },

  async setPrimary(id: string): Promise<ApiResponse<IItemImage>> {
    const response = await apiClient.patch<ApiResponse<IItemImage>>(
      `/api/inventory/items/images/${id}/primary`,
      {},
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/inventory/items/images/${id}`);
  },

  async getAll(
    page = 1,
    limit = 10,
    itemId?: string,
  ): Promise<PaginatedResponse<IItemImage>> {
    const response = await apiClient.get<PaginatedResponse<IItemImage>>(
      "/api/inventory/items/images",
      {
        params: {
          page,
          limit,
          itemId,
        },
      },
    );
    return response.data;
  },

  async reorder(images: Array<{ id: string; order: number }>): Promise<void> {
    await Promise.all(
      images.map((img) => this.update(img.id, { order: img.order })),
    );
  },

  validate(file: File): { valid: boolean; error?: string } {
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
  },
};

export default imageUploadService;
