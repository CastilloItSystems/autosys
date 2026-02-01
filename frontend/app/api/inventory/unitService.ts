import apiClient from "../apiClient";
import { Unit } from "../../../libs/interfaces/inventory/unit.interface";

const base = "/inventory/units";

export async function getUnits(params?: any) {
  const res = await apiClient.get(base, { params });
  return res.data;
}

export async function getUnit(id: string) {
  const res = await apiClient.get(`${base}/${id}`);
  return res.data;
}

export async function createUnit(payload: Unit) {
  const res = await apiClient.post(base, payload);
  return res.data;
}

export async function updateUnit(id: string, payload: Unit) {
  const res = await apiClient.put(`${base}/${id}`, payload);
  return res.data;
}

export async function deleteUnit(id: string) {
  const res = await apiClient.delete(`${base}/${id}`);
  return res.data;
}
