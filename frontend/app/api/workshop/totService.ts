// app/api/workshop/totService.ts
import apiClient from "../apiClient";
import type {
  WorkshopTOT,
  TOTFilters,
  CreateTOTInput,
  UpdateTOTInput,
  AddTOTDocumentInput,
  TOTStatus,
  TOTPagedResponse,
  TOTResponse,
} from "@/libs/interfaces/workshop";

const TOT_BASE = "/workshop/tot";

const totService = {
  async getAll(filters?: TOTFilters): Promise<TOTPagedResponse> {
    const res = await apiClient.get(TOT_BASE, { params: filters });
    return res.data;
  },

  async getById(id: string): Promise<TOTResponse> {
    const res = await apiClient.get(`${TOT_BASE}/${id}`);
    return res.data;
  },

  async create(data: CreateTOTInput): Promise<TOTResponse> {
    const res = await apiClient.post(TOT_BASE, data);
    return res.data;
  },

  async update(id: string, data: UpdateTOTInput): Promise<TOTResponse> {
    const res = await apiClient.put(`${TOT_BASE}/${id}`, data);
    return res.data;
  },

  async updateStatus(id: string, status: TOTStatus): Promise<TOTResponse> {
    const res = await apiClient.patch(`${TOT_BASE}/${id}/status`, { status });
    return res.data;
  },

  async addDocument(
    id: string,
    data: AddTOTDocumentInput,
  ): Promise<TOTResponse> {
    const res = await apiClient.post(`${TOT_BASE}/${id}/documents`, data);
    return res.data;
  },

  async removeDocument(id: string, docId: string): Promise<void> {
    await apiClient.delete(`${TOT_BASE}/${id}/documents/${docId}`);
  },

  async uploadPhoto(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post(`${TOT_BASE}/${id}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${TOT_BASE}/${id}`);
  },
};

export default totService;
