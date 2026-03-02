import apiClient from "../apiClient";
import {
  Reservation,
  ReservationsResponse,
  ReservationResponse,
  ReservationStatus,
} from "@/libs/interfaces/inventory/reservation.interface";

/**
 * Get all reservations with pagination and optional filters
 * @param page Page number (1-indexed)
 * @param limit Items per page
 * @param status Filter by ReservationStatus
 * @param itemId Filter by item ID
 * @param warehouseId Filter by warehouse ID
 */
export const getReservations = async (
  page = 1,
  limit = 20,
  status?: ReservationStatus,
  itemId?: string,
  warehouseId?: string,
): Promise<ReservationsResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) params.append("status", status);
  if (itemId) params.append("itemId", itemId);
  if (warehouseId) params.append("warehouseId", warehouseId);

  const response = await apiClient.get(`/inventory/reservations?${params}`);
  // Backend returns: { success, data: Reservation[], meta: {page, limit, total, totalPages}, message }
  return {
    data: response.data.data || [],
    meta: response.data.meta || { page, limit, total: 0, totalPages: 0 },
  };
};

/**
 * Get single reservation by ID
 */
export const getReservation = async (
  id: string,
): Promise<ReservationResponse> => {
  const response = await apiClient.get(`/inventory/reservations/${id}`);
  return { data: response.data.data };
};

/**
 * Get active reservations only
 */
export const getActiveReservations =
  async (): Promise<ReservationsResponse> => {
    const response = await apiClient.get("/inventory/reservations/active");
    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
      },
    };
  };

/**
 * Get expired reservations only
 */
export const getExpiredReservations =
  async (): Promise<ReservationsResponse> => {
    const response = await apiClient.get("/inventory/reservations/expired");
    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
      },
    };
  };

/**
 * Get reservations by item
 */
export const getReservationsByItem = async (
  itemId: string,
): Promise<ReservationsResponse> => {
  const response = await apiClient.get(
    `/inventory/reservations/item/${itemId}`,
  );
  return {
    data: response.data.data || [],
    meta: response.data.meta || {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
    },
  };
};

/**
 * Get reservations by warehouse
 */
export const getReservationsByWarehouse = async (
  warehouseId: string,
): Promise<ReservationsResponse> => {
  const response = await apiClient.get(
    `/inventory/reservations/warehouse/${warehouseId}`,
  );
  return {
    data: response.data.data || [],
    meta: response.data.meta || {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
    },
  };
};

/**
 * Create new reservation
 */
export const createReservation = async (
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
): Promise<ReservationResponse> => {
  const response = await apiClient.post("/inventory/reservations", data);
  return { data: response.data.data };
};

/**
 * Update reservation
 */
export const updateReservation = async (
  id: string,
  data: Partial<
    Omit<Reservation, "id" | "reservationNumber" | "createdAt" | "updatedAt">
  >,
): Promise<ReservationResponse> => {
  const response = await apiClient.put(`/inventory/reservations/${id}`, data);
  return { data: response.data.data };
};

/**
 * Delete reservation
 */
export const deleteReservation = async (
  id: string,
): Promise<ReservationResponse> => {
  const response = await apiClient.delete(`/inventory/reservations/${id}`);
  return { data: response.data.data };
};

/**
 * Consume a reservation
 * @Bug FIX: Was sending { cantidad } but backend expects { quantity }
 * @param id Reservation ID
 * @param quantity Optional partial quantity to consume (default = full amount)
 */
export const consumeReservation = async (
  id: string,
  quantity?: number,
): Promise<ReservationResponse> => {
  const response = await apiClient.post(
    `/inventory/reservations/${id}/consume`,
    { quantity },
  );
  return { data: response.data.data };
};

/**
 * Release a reservation
 * @param id Reservation ID
 * @param reason Optional reason for release
 */
export const releaseReservation = async (
  id: string,
  reason?: string,
): Promise<ReservationResponse> => {
  const response = await apiClient.post(
    `/inventory/reservations/${id}/release`,
    { reason },
  );
  return { data: response.data.data };
};

/**
 * Mark a reservation as pending pickup
 */
export const markAsPendingPickup = async (
  id: string,
): Promise<ReservationResponse> => {
  const response = await apiClient.patch(
    `/inventory/reservations/${id}/pending-pickup`,
  );
  return { data: response.data.data };
};
