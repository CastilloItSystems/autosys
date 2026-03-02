import React, { useRef, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useStockAlerts } from "@/hooks/useStockAlerts";
import { StyleClass } from "primereact/styleclass";
import { Ripple } from "primereact/ripple";
import { Badge } from "primereact/badge";
import { timeAgo } from "../utils/dateUtils";
import { Avatar } from "primereact/avatar";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { TabView, TabPanel } from "primereact/tabview";
import { useSocket } from "@/hooks/useSocket";
import { marcarNotificacionLeida } from "@/app/api/notificacionService";

interface AppNotificationDropdownProps {
  session: any;
}

const AppNotificationDropdown = ({ session }: AppNotificationDropdownProps) => {
  const { notification } = useSocket();
  const { notifications, loading } = useNotifications(
    session?.user?.id,
    notification || undefined,
  );
  const { alerts: stockAlerts, loading: stockLoading } = useStockAlerts(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  const { total = 0, notifications: notificaciones = [] } = notifications || {};
  const notificationRef = useRef(null);

  // Función para determinar el ícono según el tipo de notificación
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

  // Función para determinar la severidad según el tipo
  const getNotificationSeverity = (type: string) => {
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

  const unreadCount = notificaciones.filter((n) => !n.read).length;
  const totalUnread = unreadCount + stockAlerts.total;

  return (
    <div className="topbar-notifications ">
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
            {totalUnread > 0 && (
              <Badge
                value={totalUnread}
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
        <div className="surface-section border-round border-bottom-1 surface-border">
          <TabView
            activeIndex={activeTab}
            onTabChange={(e) => setActiveTab(e.index)}
            className="p-0"
          >
            <TabPanel
              header={`Notificaciones (${unreadCount})`}
              leftIcon="pi pi-bell"
            >
              <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
                {loading ? (
                  <div className="p-5 flex flex-column align-items-center justify-content-center">
                    <ProgressSpinner
                      style={{ width: "50px", height: "50px" }}
                      strokeWidth="4"
                      animationDuration=".5s"
                    />
                    <span className="mt-3 text-600">
                      Cargando notificaciones...
                    </span>
                  </div>
                ) : notificaciones.length > 0 ? (
                  notificaciones.map((notification, index) => (
                    <div
                      key={index}
                      className="p-ripple border-bottom-1 surface-border p-3 flex flex-column align-items-start hover:surface-hover transition-colors transition-duration-150 cursor-pointer"
                      onClick={async () => {
                        if (!notification.read) {
                          // Llama a tu API para marcar como leída
                          await marcarNotificacionLeida(notification._id);
                          // Opcional: actualiza el estado local para reflejar el cambio sin recargar
                          notification.read = true;
                          // Si usas setState, haz una copia del array y actualiza
                          // setNotifications([...notificaciones]);
                        }
                      }}
                    >
                      <div className="flex align-items-start w-full">
                        <div className="mr-3 flex-shrink-0 flex flex-column align-items-center gap-2">
                          <Avatar
                            icon={getNotificationIcon(
                              notification.type || "info",
                            )}
                            size="large"
                            shape="circle"
                            className={`bg-indigo-100 ${
                              notification.read ? "opacity-50" : ""
                            }`}
                          />
                          <span
                            className="mt-1 cursor-pointer"
                            title={notification.read ? "Leída" : "No leída"}
                            data-pr-tooltip={
                              notification.read ? "Leída" : "No leída"
                            }
                            data-pr-position="right"
                          >
                            {notification.read ? (
                              <i className="pi pi-eye text-green-500" />
                            ) : (
                              <i className="pi pi-eye-slash text-gray-400" />
                            )}
                          </span>
                        </div>
                        <div className="flex flex-column flex-grow-1">
                          <div className="flex align-items-center justify-content-between mb-1">
                            <span
                              className={`font-bold text-900 ${
                                notification.read ? "text-400" : ""
                              }`}
                            >
                              {notification.title}
                            </span>
                            {notification.type && (
                              <Tag
                                value={notification.type}
                                severity={getNotificationSeverity(
                                  notification.type,
                                )}
                                className="py-1 capitalize"
                              />
                            )}
                          </div>
                          <div className="mb-2">
                            <span className="text-700">
                              {notification.message}
                            </span>
                          </div>
                          <div className="flex align-items-center text-sm text-600 gap-3">
                            <div className="flex align-items-center">
                              <i className="pi pi-user mr-1"></i>
                              <span>
                                {notification.createdBy?.nombre || "Sistema"}
                              </span>
                            </div>
                            <div className="flex align-items-center">
                              <i className="pi pi-clock mr-1"></i>
                              <span>{timeAgo(notification.createdAt)}</span>
                            </div>
                          </div>
                          {notification.link && (
                            <a
                              href={notification.link}
                              target="_blank"
                              rel="noopener noreferrer"
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
                    <i
                      className="pi pi-inbox text-400"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <span className="text-600 mt-2">No hay notificaciones</span>
                    <p className="text-500 text-center mt-1">
                      Cuando tengas nuevas notificaciones, aparecerán aquí.
                    </p>
                  </div>
                )}
              </div>
            </TabPanel>

            <TabPanel
              header={`Stock Alerts (${stockAlerts.total})`}
              leftIcon="pi pi-exclamation-circle"
            >
              <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
                {stockLoading ? (
                  <div className="p-5 flex flex-column align-items-center justify-content-center">
                    <ProgressSpinner
                      style={{ width: "50px", height: "50px" }}
                      strokeWidth="4"
                      animationDuration=".5s"
                    />
                    <span className="mt-3 text-600">Cargando alertas...</span>
                  </div>
                ) : stockAlerts.alerts.length > 0 ? (
                  stockAlerts.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="p-ripple border-bottom-1 surface-border p-3 flex flex-column align-items-start hover:surface-hover transition-colors transition-duration-150"
                    >
                      <div className="flex align-items-start w-full justify-content-between">
                        <div className="flex align-items-center gap-3 flex-1">
                          <Avatar
                            icon={`pi ${
                              alert.severity === "CRITICAL"
                                ? "pi-times-circle"
                                : alert.severity === "MEDIUM"
                                ? "pi-exclamation-triangle"
                                : "pi-info-circle"
                            }`}
                            size="large"
                            shape="circle"
                            className={`${
                              alert.severity === "CRITICAL"
                                ? "bg-red-100"
                                : alert.severity === "MEDIUM"
                                ? "bg-yellow-100"
                                : "bg-blue-100"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="font-bold text-900">
                              {alert.message}
                            </div>
                            <div className="text-600 text-sm">
                              Type: {alert.type}
                            </div>
                            <div className="flex align-items-center gap-2 mt-2">
                              <Tag
                                value={alert.severity}
                                severity={
                                  alert.severity === "CRITICAL"
                                    ? "danger"
                                    : alert.severity === "MEDIUM"
                                    ? "warning"
                                    : "info"
                                }
                                className="py-1"
                              />
                              <span className="text-500 text-xs">
                                <i className="pi pi-clock mr-1"></i>
                                {timeAgo(alert.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Ripple />
                    </div>
                  ))
                ) : (
                  <div className="p-5 flex flex-column align-items-center justify-content-center">
                    <i
                      className="pi pi-inbox text-400"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <span className="text-600 mt-2">Sin alertas activas</span>
                    <p className="text-500 text-center mt-1">
                      Tu inventario está en buen estado
                    </p>
                  </div>
                )}
              </div>
            </TabPanel>
          </TabView>
        </div>
        {/* 
        <div className="surface-section border-top-1 surface-border p-3 flex justify-content-center">
          <button className="p-button p-button-text p-button-plain">
            <i className="pi pi-cog mr-2"></i>
            Configurar notificaciones
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default AppNotificationDropdown;
