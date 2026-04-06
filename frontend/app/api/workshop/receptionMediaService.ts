// app/api/workshop/receptionMediaService.ts
import apiClient from "../apiClient";
import type { WorkshopResponse } from "@/libs/interfaces/workshop";

export type DamageSeverity = "MINOR" | "MODERATE" | "SEVERE";
export type PhotoType =
  | "FRONTAL"
  | "REAR"
  | "LEFT"
  | "RIGHT"
  | "INTERIOR"
  | "DAMAGE"
  | "DOCUMENT"
  | "OTHER";

export interface ReceptionDamage {
  id: string;
  receptionId: string;
  zone: string;
  description: string;
  severity: DamageSeverity;
  photoUrl?: string | null;
  createdAt: string;
}

export interface ReceptionPhoto {
  id: string;
  receptionId: string;
  url: string;
  type: PhotoType;
  description?: string | null;
  createdAt: string;
}

export interface CreateDamageInput {
  zone: string;
  description: string;
  severity?: DamageSeverity;
  photoUrl?: string;
}

export interface UpdateDamageInput {
  zone?: string;
  description?: string;
  severity?: DamageSeverity;
  photoUrl?: string;
}

export interface CreatePhotoInput {
  url: string;
  type?: PhotoType;
  description?: string;
}

const base = (receptionId: string) => `/workshop/receptions/${receptionId}`;

const receptionMediaService = {
  // Upload
  async uploadMedia(receptionId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post<{ data: { url: string } }>(
      `${base(receptionId)}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data.data;
  },

  // Damages
  async getDamages(
    receptionId: string,
  ): Promise<WorkshopResponse<ReceptionDamage[]>> {
    const res = await apiClient.get(`${base(receptionId)}/damages`);
    return res.data;
  },

  async addDamage(
    receptionId: string,
    data: CreateDamageInput,
  ): Promise<WorkshopResponse<ReceptionDamage>> {
    const res = await apiClient.post(`${base(receptionId)}/damages`, data);
    return res.data;
  },

  async editDamage(
    receptionId: string,
    damageId: string,
    data: UpdateDamageInput,
  ): Promise<WorkshopResponse<ReceptionDamage>> {
    const res = await apiClient.put(
      `${base(receptionId)}/damages/${damageId}`,
      data,
    );
    return res.data;
  },

  async removeDamage(
    receptionId: string,
    damageId: string,
  ): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(
      `${base(receptionId)}/damages/${damageId}`,
    );
    return res.data;
  },

  // Photos
  async getPhotos(
    receptionId: string,
  ): Promise<WorkshopResponse<ReceptionPhoto[]>> {
    const res = await apiClient.get(`${base(receptionId)}/photos`);
    return res.data;
  },

  async addPhoto(
    receptionId: string,
    data: CreatePhotoInput,
  ): Promise<WorkshopResponse<ReceptionPhoto>> {
    const res = await apiClient.post(`${base(receptionId)}/photos`, data);
    return res.data;
  },

  async removePhoto(
    receptionId: string,
    photoId: string,
  ): Promise<WorkshopResponse<null>> {
    const res = await apiClient.delete(
      `${base(receptionId)}/photos/${photoId}`,
    );
    return res.data;
  },
};

export default receptionMediaService;
