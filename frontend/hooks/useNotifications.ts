import { useCallback, useEffect, useState } from "react";
import { getNotificationsByUserId } from "@/app/api/notificationService";
import { Notification } from "@/libs/interfaces";
export interface NotificationResponse {
  total: number; // Total de notificaciones
  notifications: Notification[]; // Array de notificaciones
}
export const useNotifications = (
  userId: string,
  notification?: Notification
) => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationResponse>({
    total: 0,
    notifications: [],
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const notificationData = await getNotificationsByUserId(userId);
      setNotifications(notificationData);
    } catch (error) {
      console.error("Error al obtener las notificaciones por usuario:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);
  // Efecto para manejar notificaciones modificadas
  useEffect(() => {
    if (notification) {
      setNotifications((prevNotifications) => {
        const index = prevNotifications.notifications.findIndex(
          (notif) => notif._id === notification._id
        );
        if (index !== -1) {
          // Si la notificación ya existe, actualízala
          const updatedNotifications = [...prevNotifications.notifications];
          updatedNotifications[index] = notification;
          return {
            ...prevNotifications,
            notifications: updatedNotifications,
          };
        } else {
          // Si es una nueva notificación, agrégala al estado
          return {
            ...prevNotifications,
            notifications: [notification, ...prevNotifications.notifications],
            total: prevNotifications.total + 1, // Incrementa el total
          };
        }
      });
    }
  }, [notification]);
  return {
    loading,
    notifications,
  };
};
