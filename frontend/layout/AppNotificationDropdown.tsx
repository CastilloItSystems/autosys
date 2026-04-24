import React, { useRef } from "react";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";
import { StyleClass } from "primereact/styleclass";
import { Ripple } from "primereact/ripple";
import { Badge } from "primereact/badge";
import { timeAgo } from "../utils/dateUtils";
import { Avatar } from "primereact/avatar";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { useSocket } from "@/hooks/useSocket";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/app/api/notificationService";

interface AppNotificationDropdownProps {
  session: any;
}

const AppNotificationDropdown = ({ session }: AppNotificationDropdownProps) => {
  const { notification } = useSocket();
  const {
    notifications,
    loading,
    unreadCount,
    markAsReadLocally,
    markAllAsReadLocally,
  } = useNotifications(session?.user?.id, notification || undefined);

  const notificationRef = useRef(null);
  const notificaciones = notifications?.items || [];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return "pi pi-info-circle text-blue-500";
      case "warning":
        return "pi pi-exclamation-triangle text-yellow-500";
      case "error":
        return "pi pi-times-circle text-red-500";
      case "success":
        return "pi pi-check-circle text-green-500";
      default:
        return "pi pi-bell text-primary";
    }
  };

  const getTagSeverity = (type: string) => {
    switch (type) {
      case "info":
        return "info";
      case "warning":
        return "warning";
      case "error":
        return "danger";
      case "success":
        return "success";
      default:
        return null;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      markAllAsReadLocally();
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leidas:", error);
    }
  };

  return (
    <div className="topbar-notifications">
      <StyleClass
        nodeRef={notificationRef}
        selector="@next"
        enterClassName="hidden"
        enterActiveClassName="scalein"
        leaveToClassName="hidden"
        leaveActiveClassName="fadeout"
        hideOnOutsideClick
      >
        <button
          ref={notificationRef}
          className="topbar-notifications-button p-link p-ripple relative"
          type="button"
        >
          <div className="flex align-items-center justify-content-center border-circle w-3rem h-3rem bg-indigo-50 hover:bg-indigo-100 transition-colors transition-duration-150">
            <i
              className="pi pi-bell text-indigo-700"
              style={{ fontSize: "1.5rem" }}
            ></i>
            {unreadCount > 0 && (
              <Badge
                value={unreadCount}
                severity="danger"
                className="absolute top-0 right-0 -mt-1 -mr-1"
              ></Badge>
            )}
          </div>
        </button>
      </StyleClass>

      <div
        className="list-none p-0 m-0 border-round shadow-4 hidden absolute surface-overlay origin-top w-full sm:w-30rem mt-2 top-auto"
        style={{ right: "0", zIndex: 1000 }}
      >
        <div className="surface-section border-round border-bottom-1 surface-border p-3">
          <div className="flex align-items-center justify-content-between mb-3">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-bell text-indigo-700" />
              <span className="font-semibold">Notificaciones ({unreadCount})</span>
            </div>
            <div className="flex align-items-center gap-2">
              <button
                className="p-button p-button-text p-button-sm"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                type="button"
              >
                Marcar todas
              </button>
              <Link
                href="/empresa/configuracion/notificaciones"
                className="p-button p-button-text p-button-sm"
              >
                Configurar
              </Link>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
            {loading ? (
              <div className="p-5 flex flex-column align-items-center justify-content-center">
                <ProgressSpinner
                  style={{ width: "50px", height: "50px" }}
                  strokeWidth="4"
                  animationDuration=".5s"
                />
                <span className="mt-3 text-600">Cargando notificaciones...</span>
              </div>
            ) : notificaciones.length > 0 ? (
              notificaciones.map((notificationItem) => (
                <div
                  key={notificationItem.id}
                  className="p-ripple border-bottom-1 surface-border p-3 flex flex-column align-items-start hover:surface-hover transition-colors transition-duration-150 cursor-pointer"
                  onClick={async () => {
                    if (!notificationItem.read) {
                      try {
                        await markNotificationAsRead(notificationItem.id);
                        markAsReadLocally(notificationItem.id);
                      } catch (error) {
                        console.error(
                          "Error al marcar notificacion como leida:",
                          error,
                        );
                      }
                    }
                  }}
                >
                  <div className="flex align-items-start w-full">
                    <div className="mr-3 flex-shrink-0 flex flex-column align-items-center gap-2">
                      <Avatar
                        icon={getNotificationIcon(notificationItem.type || "info")}
                        size="large"
                        shape="circle"
                        className={`bg-indigo-100 ${notificationItem.read ? "opacity-50" : ""}`}
                      />
                      <span
                        className="mt-1"
                        title={notificationItem.read ? "Leida" : "No leida"}
                      >
                        {notificationItem.read ? (
                          <i className="pi pi-eye text-green-500" />
                        ) : (
                          <i className="pi pi-eye-slash text-gray-400" />
                        )}
                      </span>
                    </div>

                    <div className="flex flex-column flex-grow-1">
                      <div className="flex align-items-center justify-content-between mb-1 gap-2">
                        <span
                          className={`font-bold text-900 ${notificationItem.read ? "text-400" : ""}`}
                        >
                          {notificationItem.title}
                        </span>
                        {notificationItem.type && (
                          <Tag
                            value={notificationItem.type}
                            severity={getTagSeverity(notificationItem.type)}
                            className="py-1 capitalize"
                          />
                        )}
                      </div>

                      <div className="mb-2">
                        <span className="text-700">{notificationItem.message}</span>
                      </div>

                      <div className="flex align-items-center text-sm text-600 gap-3">
                        <div className="flex align-items-center">
                          <i className="pi pi-user mr-1"></i>
                          <span>{notificationItem.createdBy?.nombre || "Sistema"}</span>
                        </div>
                        <div className="flex align-items-center">
                          <i className="pi pi-clock mr-1"></i>
                          <span>{timeAgo(notificationItem.createdAt)}</span>
                        </div>
                      </div>

                      {notificationItem.link && (
                        <a
                          href={notificationItem.link}
                          className="mt-2 text-primary-700 hover:underline flex align-items-center"
                        >
                          <i className="pi pi-external-link mr-2"></i>
                          Ver detalles
                        </a>
                      )}
                    </div>
                  </div>

                  <Ripple />
                </div>
              ))
            ) : (
              <div className="p-5 flex flex-column align-items-center justify-content-center">
                <i className="pi pi-inbox text-400" style={{ fontSize: "3rem" }}></i>
                <span className="text-600 mt-2">No hay notificaciones</span>
                <p className="text-500 text-center mt-1">
                  Cuando tengas nuevas notificaciones apareceran aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppNotificationDropdown;
