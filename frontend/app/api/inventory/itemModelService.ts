import apiClient from "../apiClient";

const itemModelService = {
  async getById(id: string) {
    const res = await apiClient.get(`/inventory/catalogs/models/${id}`);
    return res.data;
  },

  async getAll() {
    const res = await apiClient.get("/inventory/catalogs/models");
    return res.data;
  },

  async create(data: any) {
    const res = await apiClient.post("/inventory/catalogs/models", data);
    return res.data;
  },

  async update(id: string, data: any) {
    const res = await apiClient.put(`/inventory/catalogs/models/${id}`, data);
    return res.data;
  },

  async delete(id: string) {
    const res = await apiClient.delete(`/inventory/catalogs/models/${id}`);
    return res.data;
  },
};

export default itemModelService;
