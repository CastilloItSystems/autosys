import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listNotifications,
  NotificationItem,
  NotificationListResponse,
} from "@/shared/services/notificationService";
import { useEmpresasStore } from "@/store/empresasStore";

const EMPTY_STATE: NotificationListResponse = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
};

export const useNotifications = (
  userId: string,
  incomingNotification?: NotificationItem,
) => {
  const activeEmpresa = useEmpresasStore((state) => state.activeEmpresa);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] =
    useState<NotificationListResponse>(EMPTY_STATE);

  const fetchNotifications = useCallback(async () => {
    if (!activeEmpresa?.id_empresa || !userId) {
      setNotifications(EMPTY_STATE);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const notificationData = await listNotifications({ page: 1, limit: 50 });
      const filteredItems = (notificationData.items || []).filter(
        (item) => item.empresaId === activeEmpresa.id_empresa,
      );
      setNotifications({
        ...notificationData,
        items: filteredItems,
        meta: {
          ...notificationData.meta,
          total: filteredItems.length,
          totalPages: Math.max(
            1,
            Math.ceil(
              filteredItems.length /
                Math.max(1, Number(notificationData.meta?.limit || 20)),
            ),
          ),
        },
      });
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      setNotifications(EMPTY_STATE);
    } finally {
      setLoading(false);
    }
  }, [userId, activeEmpresa?.id_empresa]);

  useEffect(() => {
    if (userId && activeEmpresa?.id_empresa) {
      setNotifications(EMPTY_STATE);
      fetchNotifications();
    } else {
      setLoading(false);
      setNotifications(EMPTY_STATE);
    }
  }, [userId, activeEmpresa?.id_empresa, fetchNotifications]);

  useEffect(() => {
    if (!incomingNotification) return;
    if (!activeEmpresa?.id_empresa) return;
    if (incomingNotification.empresaId !== activeEmpresa.id_empresa) return;

    setNotifications((previous) => {
      const currentItems = previous.items || [];
      const index = currentItems.findIndex(
        (item) => item.id === incomingNotification.id,
      );

      if (index !== -1) {
        const updatedItems = [...currentItems];
        updatedItems[index] = {
          ...updatedItems[index],
          ...incomingNotification,
        };

        return {
          ...previous,
          items: updatedItems,
        };
      }

      return {
        ...previous,
        items: [incomingNotification, ...currentItems],
        meta: {
          ...previous.meta,
          total: previous.meta.total + 1,
        },
      };
    });
  }, [incomingNotification, activeEmpresa?.id_empresa]);

  const markAsReadLocally = useCallback((notificationId: string) => {
    setNotifications((previous) => {
      const updatedItems = previous.items.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      );

      return {
        ...previous,
        items: updatedItems,
      };
    });
  }, []);

  const markAllAsReadLocally = useCallback(() => {
    setNotifications((previous) => ({
      ...previous,
      items: previous.items.map((item) => ({ ...item, read: true })),
    }));
  }, []);

  const unreadCount = useMemo(
    () => notifications.items.filter((item) => !item.read).length,
    [notifications.items],
  );

  return {
    loading,
    notifications,
    unreadCount,
    markAsReadLocally,
    markAllAsReadLocally,
    refresh: fetchNotifications,
  };
};
