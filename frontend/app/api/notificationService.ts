import apiClient from "./apiClient";

export const getNotification = async (id: string) => {
  const response = await apiClient.get(`/notification/${id}`);
  return response.data;
};

export const getNotifications = async () => {
  const response = await apiClient.get("/notification");
  return response.data;
};

export const createNotification = async (data: any) => {
  const response = await apiClient.post("/notification", data);
  return response.data;
};

export const updateNotification = async (id: string, data: any) => {
  const response = await apiClient.put(`/notification/${id}`, data);
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await apiClient.delete(`/notification/${id}`);
  return response.data;
};

export const getNotificationsByUserId = async (userId: string) => {
  const response = await apiClient.get(`/notification/user/${userId}`);
  return response.data;
};
