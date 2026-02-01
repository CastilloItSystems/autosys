import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  BayWithDetails,
  ServiceBayAssignment,
} from "@/libs/interfaces/workshop/serviceBayDashboard.interface";
import { getBayHistory } from "@/app/api/serviceBayService";

interface BayTimelineProps {
  visible: boolean;
  onHide: () => void;
  bay: BayWithDetails | null;
}

interface TimelineEvent {
  status: string;
  date: Date;
  icon: string;
  color: string;
  title: string;
  description: string;
  details?: any;
}

export default function BayTimeline({
  visible,
  onHide,
  bay,
}: BayTimelineProps) {
  const [loading, setLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);

  useEffect(() => {
    if (visible && bay) {
      loadBayHistory();
    } else if (!visible) {
      // Resetear estados cuando se cierra el modal
      setTimelineEvents([]);
      setHistoryUnavailable(false);
    }
  }, [visible, bay]);

  const loadBayHistory = async () => {
    if (!bay) return;

    setLoading(true);
    setHistoryUnavailable(false);
    try {
      // Obtener historial de asignaciones de la bahía
      const history = await getBayHistory(bay._id);

      // Transformar el historial en eventos de timeline
      const events = transformHistoryToEvents(history, bay);
      setTimelineEvents(events);
    } catch (error) {
      console.error("Error loading bay history:", error);
      // Marcar que el historial no está disponible
      setHistoryUnavailable(true);
      setTimelineEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const transformHistoryToEvents = (
    history: any[],
    currentBay: BayWithDetails
  ): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Evento de creación de la bahía
    events.push({
      status: "created",
      date: new Date(currentBay.createdAt || Date.now()),
      icon: "pi pi-plus-circle",
      color: "#22c55e",
      title: "Bahía Creada",
      description: `Bahía ${currentBay.name} (${currentBay.code}) creada en área ${currentBay.area}`,
    });

    // Procesar historial de asignaciones
    history.forEach((assignment: any) => {
      // Evento de asignación
      events.push({
        status: "assigned",
        date: new Date(assignment.entryTime),
        icon: "pi pi-user-plus",
        color: "#3b82f6",
        title: "Asignación Iniciada",
        description: `OT: ${assignment.workOrder?.numeroOrden || "N/A"} - ${
          assignment.technicians?.length || 0
        } técnicos asignados`,
        details: assignment,
      });

      // Evento de liberación (si existe exitTime)
      if (assignment.exitTime) {
        events.push({
          status: "released",
          date: new Date(assignment.exitTime),
          icon: "pi pi-user-minus",
          color: "#f59e0b",
          title: "Asignación Finalizada",
          description: `Liberada después de ${calculateDuration(
            assignment.entryTime,
            assignment.exitTime
          )}`,
          details: assignment,
        });
      }
    });

    // Evento actual si la bahía está ocupada
    if (currentBay.status === "ocupado" && currentBay.currentAssignment) {
      events.push({
        status: "current",
        date: new Date(),
        icon: "pi pi-clock",
        color: "#ef4444",
        title: "Actualmente Ocupada",
        description: `OT: ${
          currentBay.currentWorkOrderInfo?.orderNumber || "N/A"
        } - En progreso`,
        details: currentBay.currentAssignment,
      });
    }

    // Ordenar eventos por fecha (más reciente primero)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const createBasicTimelineEvents = (
    currentBay: BayWithDetails
  ): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Evento de creación
    events.push({
      status: "created",
      date: new Date(currentBay.createdAt || Date.now()),
      icon: "pi pi-plus-circle",
      color: "#22c55e",
      title: "Bahía Creada",
      description: `Bahía ${currentBay.name} (${currentBay.code}) creada en área ${currentBay.area}`,
    });

    // Evento actual
    if (currentBay.status === "ocupado") {
      events.push({
        status: "current",
        date: new Date(),
        icon: "pi pi-clock",
        color: "#ef4444",
        title: "Actualmente Ocupada",
        description: `OT: ${
          currentBay.currentWorkOrderInfo?.orderNumber || "N/A"
        }`,
      });
    } else {
      events.push({
        status: "available",
        date: new Date(),
        icon: "pi pi-check-circle",
        color: "#22c55e",
        title: "Disponible",
        description: "Bahía lista para asignación",
      });
    }

    return events;
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const customizedMarker = (item: TimelineEvent) => {
    return (
      <span
        className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
        style={{ backgroundColor: item.color }}
      >
        <i className={item.icon}></i>
      </span>
    );
  };

  const customizedContent = (item: TimelineEvent) => {
    return (
      <Card className="border-1 border-200">
        <div className="flex align-items-center gap-2 mb-2">
          <Badge
            value={item.status.toUpperCase()}
            severity={
              item.status === "created"
                ? "success"
                : item.status === "assigned"
                ? "info"
                : item.status === "released"
                ? "warning"
                : item.status === "current"
                ? "danger"
                : "success"
            }
          />
          <span className="text-sm text-600">
            {item.date.toLocaleString("es-ES", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <h6 className="mt-0 mb-1">{item.title}</h6>
        <p className="mt-0 mb-2 text-700">{item.description}</p>
        {item.details && (
          <div className="text-sm">
            {item.details.technicians && (
              <div>
                <strong>Técnicos:</strong> {item.details.technicians.length}
              </div>
            )}
            {item.details.workOrder && (
              <div>
                <strong>Orden:</strong>{" "}
                {item.details.workOrder.numeroOrden || "N/A"}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  const header = (
    <div className="flex align-items-center gap-2">
      <i className="pi pi-history text-primary"></i>
      <span className="text-xl font-semibold">
        Timeline de Bahía {bay?.name || ""}
      </span>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      modal
      className="w-11 md:w-8 lg:w-6"
      maximizable
    >
      {loading ? (
        <div className="flex justify-content-center align-items-center p-4">
          <ProgressSpinner />
          <span className="ml-2">Cargando historial...</span>
        </div>
      ) : (
        <div className="timeline-container">
          {historyUnavailable ? (
            <div className="text-center p-4">
              <i className="pi pi-clock text-4xl text-orange-500 mb-3"></i>
              <h5 className="text-orange-600 mb-2">Historial No Disponible</h5>
              <p className="text-600 mb-2">
                El historial detallado de esta bahía estará disponible
                próximamente.
              </p>
              <small className="text-500">
                Esta funcionalidad requiere el endpoint{" "}
                <code>GET /api/service-bays/:id/history</code>
              </small>
            </div>
          ) : (
            <>
              <Timeline
                value={timelineEvents}
                align="left"
                className="customized-timeline"
                marker={customizedMarker}
                content={customizedContent}
              />
              {timelineEvents.length === 0 && (
                <div className="text-center p-4 text-600">
                  <i className="pi pi-info-circle text-4xl mb-2"></i>
                  <p>No hay eventos registrados para esta bahía</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          onClick={onHide}
          className="p-button-text"
        />
      </div>
    </Dialog>
  );
}
