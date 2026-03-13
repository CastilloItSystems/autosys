import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";
import {
  Reservation,
  ReservationStatus,
} from "@/libs/interfaces/inventory/reservation.interface";

// ============================================================================
// SERVICE
// ============================================================================

const reservationService = {
  /**
   * Get all reservations with pagination and optional filters
   */
  async getAll(
    page = 1,
    limit = 20,
    status?: ReservationStatus,
    itemId?: string,
    warehouseId?: string,
  ): Promise<PaginatedResponse<Reservation>> {
    const params: Record<string, any> = { page, limit };
    if (status) params.status = status;
    if (itemId) params.itemId = itemId;
    if (warehouseId) params.warehouseId = warehouseId;

    const response = await apiClient.get<PaginatedResponse<Reservation>>(
      `/inventory/reservations`,
      { params },
    );
    return response.data;
  },

  /**
   * Get single reservation by ID
   */
  async getById(id: string): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.get<ApiResponse<Reservation>>(
      `/inventory/reservations/${id}`,
    );
    return response.data;
  },

  /**
   * Get active reservations only
   */
  async getActive(): Promise<PaginatedResponse<Reservation>> {
    const response = await apiClient.get<PaginatedResponse<Reservation>>(
      `/inventory/reservations/active`,
    );
    return response.data;
  },

  /**
   * Get expired reservations only
   */
  async getExpired(): Promise<PaginatedResponse<Reservation>> {
    const response = await apiClient.get<PaginatedResponse<Reservation>>(
      `/inventory/reservations/expired`,
    );
    return response.data;
  },

  /**
   * Get reservations by item
   */
  async getByItem(itemId: string): Promise<PaginatedResponse<Reservation>> {
    const response = await apiClient.get<PaginatedResponse<Reservation>>(
      `/inventory/reservations/item/${itemId}`,
    );
    return response.data;
  },

  /**
   * Get reservations by warehouse
   */
  async getByWarehouse(
    warehouseId: string,
  ): Promise<PaginatedResponse<Reservation>> {
    const response = await apiClient.get<PaginatedResponse<Reservation>>(
      `/inventory/reservations/warehouse/${warehouseId}`,
    );
    return response.data;
  },

  /**
   * Create new reservation
   */
  async create(
    data: Omit<
      Reservation,
      | "id"
      | "reservationNumber"
      | "createdAt"
      | "updatedAt"
      | "status"
      | "deliveredAt"
      | "releasedAt"
    >,
  ): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      `/inventory/reservations`,
      data,
    );
    return response.data;
  },

  /**
   * Update reservation
   */
  async update(
    id: string,
    data: Partial<
      Omit<Reservation, "id" | "reservationNumber" | "createdAt" | "updatedAt">
    >,
  ): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.put<ApiResponse<Reservation>>(
      `/inventory/reservations/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Delete reservation
   */
  async delete(id: string): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.delete<ApiResponse<Reservation>>(
      `/inventory/reservations/${id}`,
    );
    return response.data;
  },

  /**
   * Consume a reservation
   * @param id Reservation ID
   * @param quantity Optional partial quantity to consume (default = full amount)
   */
  async consume(
    id: string,
    quantity?: number,
  ): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      `/inventory/reservations/${id}/consume`,
      { quantity },
    );
    return response.data;
  },

  /**
   * Release a reservation
   */
  async release(
    id: string,
    reason?: string,
  ): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      `/inventory/reservations/${id}/release`,
      { reason },
    );
    return response.data;
  },

  /**
   * Mark a reservation as pending pickup
   */
  async markAsPendingPickup(id: string): Promise<ApiResponse<Reservation>> {
    const response = await apiClient.patch<ApiResponse<Reservation>>(
      `/inventory/reservations/${id}/pending-pickup`,
    );
    return response.data;
  },
};

export default reservationService;
