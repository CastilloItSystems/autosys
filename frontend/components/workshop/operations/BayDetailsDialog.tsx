"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Badge } from "primereact/badge";
import { Chip } from "primereact/chip";
import { ProgressBar } from "primereact/progressbar";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { BayWithDetails } from "@/libs/interfaces/workshop/serviceBayDashboard.interface";
import {
  BAY_CAPACITY_CONFIG,
  BAY_AREA_CONFIG,
  BAY_STATUS_CONFIG,
} from "@/libs/interfaces/workshop/serviceBayDashboard.interface";
import { getBayHistory } from "@/app/api/serviceBayService";

interface BayDetailsDialogProps {
  visible: boolean;
  bay: BayWithDetails | null;
  onHide: () => void;
}

export default function BayDetailsDialog({
  visible,
  bay,
  onHide,
}: BayDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const [historySummary, setHistorySummary] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Resetear tab al abrir
  useEffect(() => {
    if (visible) {
      setActiveTab(0);
    }
  }, [visible]);

  // Cargar historial cuando se cambia al tab de historial
  useEffect(() => {
    if (
      visible &&
      activeTab === 2 &&
      bay &&
      !historyLoading &&
      timelineEvents.length === 0 &&
      !historyUnavailable
    ) {
      loadBayHistory();
    }
  }, [activeTab, visible, bay]);

  // Cargar métricas cuando se cambia al tab de métricas o al tab general
  useEffect(() => {
    if (
      visible &&
      (activeTab === 0 || activeTab === 3) &&
      bay &&
      !metricsLoading &&
      !historySummary
    ) {
      loadMetrics();
    }
  }, [activeTab, visible, bay]);

  if (!bay) return null;

  const capacityConfig = bay.capacity
    ? BAY_CAPACITY_CONFIG[bay.capacity]
    : null;
  const areaConfig = BAY_AREA_CONFIG[bay.area];
  const statusConfig = BAY_STATUS_CONFIG[bay.status];

  // Calcular tiempo transcurrido
  const getElapsedTime = () => {
    if (!bay.currentAssignment?.entryTime) return "N/A";

    const entry = new Date(bay.currentAssignment.entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  // Calcular porcentaje de utilización hoy
  const getUtilizationPercentage = () => {
    // Si tenemos summary con datos de hoy, calcularlo
    if (historySummary && historySummary.totalHours) {
      // Calcular porcentaje de utilización basado en un día laboral de 8 horas
      const workDayHours = 8;
      const utilizationPercent = Math.min(
        100,
        Math.round((historySummary.totalHours / workDayHours) * 100)
      );
      return utilizationPercent;
    }

    // Si la bahía está ocupada actualmente, calcular basado en tiempo ocupado
    if (bay.status === "ocupado" && bay.occupancyDuration) {
      const hoursToday = bay.occupancyDuration / 60;
      const workDayHours = 8;
      const utilizationPercent = Math.min(
        100,
        Math.round((hoursToday / workDayHours) * 100)
      );
      return utilizationPercent;
    }

    return bay.utilizationToday || 0;
  };

  // Calcular duración entre dos fechas
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

  // Cargar historial de la bahía
  const loadBayHistory = async () => {
    setHistoryLoading(true);
    setHistoryUnavailable(false);
    try {
      console.log("Loading history for bay:", bay._id);
      const response = await getBayHistory(bay._id);
      console.log("History response:", response);

      // El backend devuelve { ok, history: [], summary }
      const historyArray = response.history || [];
      const events = transformHistoryToEvents(historyArray, bay);
      setTimelineEvents(events);
    } catch (error) {
      console.error("Error loading bay history:", error);
      // Mostrar timeline básico en caso de error
      const basicEvents = createBasicTimelineEvents(bay);
      setTimelineEvents(basicEvents);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Cargar métricas desde la API
  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      console.log("Loading metrics for bay:", bay._id);
      const response = await getBayHistory(bay._id);
      console.log("Metrics response:", response);

      // Guardar el summary que contiene las métricas
      if (response.summary) {
        setHistorySummary(response.summary);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
      setHistorySummary(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Transformar historial en eventos de timeline
  const transformHistoryToEvents = (
    history: any[],
    currentBay: BayWithDetails
  ) => {
    const events: any[] = [];

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
    history.forEach((record: any) => {
      const vehicleInfo = record.vehicle
        ? `${record.vehicle.model?.brand?.nombre || ""} ${
            record.vehicle.model?.nombre || ""
          } ${record.vehicle.placa || ""}`.trim()
        : "Vehículo no especificado";

      const customerName =
        record.customer?.nombreCompleto ||
        record.customer?.nombre ||
        "Cliente no especificado";

      // Evento de asignación (entrada)
      events.push({
        status: "assigned",
        date: new Date(record.entryTime),
        icon: "pi pi-user-plus",
        color: "#3b82f6",
        title: "Asignación Iniciada",
        description: `OT: ${
          record.workOrder?.numeroOrden || "N/A"
        } - ${customerName}`,
        details: {
          workOrder: record.workOrder,
          technicians: record.technicians,
          vehicle: vehicleInfo,
          customer: customerName,
          motivo: record.workOrder?.motivo,
        },
      });

      // Evento de liberación (si existe exitTime)
      if (record.exitTime) {
        const duration = calculateDuration(record.entryTime, record.exitTime);
        events.push({
          status: "released",
          date: new Date(record.exitTime),
          icon: "pi pi-user-minus",
          color: "#f59e0b",
          title: "Asignación Finalizada",
          description: `Completada - Duración: ${duration} (${
            record.totalTechnicianHours?.toFixed(2) || 0
          } hrs-hombre)`,
          details: {
            workOrder: record.workOrder,
            technicians: record.technicians,
            duration: record.duration,
            exitReason: record.exitReason,
            totalTechnicianHours: record.totalTechnicianHours,
          },
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

  // Crear eventos básicos del timeline cuando no hay historial disponible
  const createBasicTimelineEvents = (currentBay: BayWithDetails) => {
    const events: any[] = [];

    // Evento de creación de la bahía
    events.push({
      status: "created",
      date: new Date(currentBay.createdAt || Date.now()),
      icon: "pi pi-plus-circle",
      color: "#22c55e",
      title: "Bahía Creada",
      description: `Bahía ${currentBay.name} (${currentBay.code}) creada en área ${currentBay.area}`,
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

  // Marker personalizado para timeline
  const customizedMarker = (item: any) => {
    return (
      <span
        className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
        style={{ backgroundColor: item.color }}
      >
        <i className={item.icon}></i>
      </span>
    );
  };

  // Contenido personalizado para timeline
  const customizedContent = (item: any) => {
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

  // Header del diálogo
  const header = (
    <div className="flex align-items-center gap-3">
      <i
        className={`pi ${areaConfig.icon} text-2xl`}
        style={{ color: areaConfig.color }}
      />
      <div>
        <div className="font-bold text-xl">{bay.name}</div>
        <div className="text-sm text-600">{bay.code}</div>
      </div>
    </div>
  );

  // Footer del diálogo
  const footer = (
    <div className="flex justify-content-end">
      <Button label="Cerrar" icon="pi pi-times" onClick={onHide} outlined />
    </div>
  );

  return (
    <Dialog
      header={header}
      visible={visible}
      style={{ width: "800px", maxWidth: "95vw" }}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      resizable={false}
    >
      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        {/* TAB 1: Información General */}
        <TabPanel header="General" leftIcon="pi pi-info-circle mr-2">
          <div className="flex flex-column gap-4">
            {/* Estado y área */}
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="p-3 border-round surface-100">
                  <div className="text-sm text-600 mb-2">Estado Actual</div>
                  <Tag
                    value={statusConfig.label}
                    severity={statusConfig.severity}
                    icon={`pi ${statusConfig.icon}`}
                    className="text-base"
                  />
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="p-3 border-round surface-100">
                  <div className="text-sm text-600 mb-2">
                    Área de Especialización
                  </div>
                  <Tag
                    value={areaConfig.label}
                    style={{ backgroundColor: areaConfig.color }}
                    icon={`pi ${areaConfig.icon}`}
                    className="text-base"
                  />
                </div>
              </div>
            </div>

            <Divider />

            {/* Capacidad y equipamiento */}
            <div>
              <h3 className="text-lg font-bold mb-3">Capacidad y Recursos</h3>
              <div className="grid">
                <div className="col-12 md:col-4">
                  <div className="p-3 border-round surface-50 text-center">
                    <i className="pi pi-expand text-3xl text-primary mb-2" />
                    <div className="text-sm text-600">Tamaño</div>
                    <div className="font-bold text-900">
                      {capacityConfig?.label || "No especificado"}
                    </div>
                  </div>
                </div>
                <div className="col-12 md:col-4">
                  <div className="p-3 border-round surface-50 text-center">
                    <i className="pi pi-users text-3xl text-primary mb-2" />
                    <div className="text-sm text-600">Técnicos Máximos</div>
                    <div className="font-bold text-900">
                      {bay.maxTechnicians}
                    </div>
                  </div>
                </div>
                <div className="col-12 md:col-4">
                  <div className="p-3 border-round surface-50 text-center">
                    <i className="pi pi-wrench text-3xl text-primary mb-2" />
                    <div className="text-sm text-600">Equipamiento</div>
                    <div className="font-bold text-900">
                      {bay.equipment.length} items
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de equipamiento */}
            {bay.equipment.length > 0 && (
              <>
                <Divider />
                <div>
                  <h4 className="text-base font-semibold mb-3">
                    Equipamiento Disponible
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {bay.equipment.map((item, index) => (
                      <Chip
                        key={index}
                        label={item}
                        icon="pi pi-check-circle"
                        className="surface-100"
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Utilización del día */}
            <Divider />
            <div>
              <div className="flex justify-content-between align-items-center mb-2">
                <h4 className="text-base font-semibold m-0">Utilización Hoy</h4>
                <span className="font-bold text-primary">
                  {getUtilizationPercentage()}%
                </span>
              </div>
              <ProgressBar
                value={getUtilizationPercentage()}
                showValue={false}
                style={{ height: "12px" }}
              />
              <small className="text-600 mt-2 block">
                Porcentaje del tiempo que la bahía ha estado ocupada durante el
                día
              </small>
            </div>
          </div>
        </TabPanel>

        {/* TAB 2: Asignación Actual */}
        <TabPanel header="Asignación" leftIcon="pi pi-briefcase mr-2">
          {bay.currentAssignment ? (
            <div className="flex flex-column gap-4">
              {/* Información de la orden de trabajo */}
              <Card className="shadow-1">
                <div className="flex align-items-center justify-content-between mb-3">
                  <h3 className="text-lg font-bold m-0">Orden de Trabajo</h3>
                  <Tag
                    value={bay.currentAssignment.workOrder}
                    severity="info"
                  />
                </div>
                <Divider />
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="mb-3">
                      <div className="text-sm text-600 mb-1">
                        <i className="pi pi-clock mr-2" />
                        Hora de Entrada
                      </div>
                      <div className="font-semibold">
                        {bay.currentAssignment.entryTime
                          ? new Date(
                              bay.currentAssignment.entryTime
                            ).toLocaleString("es-MX", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "No registrado"}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="mb-3">
                      <div className="text-sm text-600 mb-1">
                        <i className="pi pi-hourglass mr-2" />
                        Tiempo Transcurrido
                      </div>
                      <div className="font-semibold text-primary">
                        {getElapsedTime()}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Técnicos asignados */}
              <div>
                <h4 className="text-base font-semibold mb-3">
                  <i className="pi pi-users mr-2" />
                  Técnicos Asignados ({bay.currentAssignment.technicians.length}
                  )
                </h4>
                <div className="flex flex-column gap-2">
                  {bay.currentAssignment.technicians.map((tech) => (
                    <div
                      key={tech.technician}
                      className="p-3 border-round surface-50 flex align-items-center justify-content-between"
                    >
                      <div className="flex align-items-center gap-3">
                        <i className="pi pi-user text-2xl text-600" />
                        <div>
                          <div className="font-semibold">{tech.name}</div>
                          <div className="text-sm text-600">
                            Asignado:{" "}
                            {new Date(tech.assignedAt).toLocaleString("es-MX", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </div>
                        </div>
                      </div>
                      <Tag
                        value={
                          tech.role === "principal" ? "Principal" : "Asistente"
                        }
                        severity={
                          tech.role === "principal" ? "success" : "secondary"
                        }
                        icon={
                          tech.role === "principal"
                            ? "pi pi-star-fill"
                            : "pi pi-star"
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              {bay.currentAssignment.notes && (
                <>
                  <Divider />
                  <div>
                    <h4 className="text-base font-semibold mb-2">
                      <i className="pi pi-comment mr-2" />
                      Notas
                    </h4>
                    <div className="p-3 surface-100 border-round">
                      <p className="m-0 text-700">
                        {bay.currentAssignment.notes}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center p-5">
              <i className="pi pi-inbox text-6xl text-400 mb-3" />
              <p className="text-xl text-600 mb-2">Sin Asignación Activa</p>
              <p className="text-sm text-500">
                Esta bahía no tiene ninguna orden de trabajo asignada
                actualmente.
              </p>
            </div>
          )}
        </TabPanel>

        {/* TAB 3: Historial */}
        <TabPanel header="Historial" leftIcon="pi pi-history mr-2">
          {historyLoading ? (
            <div className="flex justify-content-center align-items-center p-4">
              <ProgressSpinner />
              <span className="ml-2">Cargando historial...</span>
            </div>
          ) : historyUnavailable ? (
            <div className="text-center p-5">
              <i className="pi pi-clock text-6xl text-400 mb-3" />
              <p className="text-xl text-600 mb-2">Historial No Disponible</p>
              <p className="text-sm text-500">
                El historial detallado de esta bahía estará disponible
                próximamente.
              </p>
              <small className="text-xs text-400 block mt-3">
                Esta funcionalidad requiere el endpoint GET
                /api/service-bays/:id/history
              </small>
            </div>
          ) : (
            <div className="timeline-container">
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
            </div>
          )}
        </TabPanel>

        {/* TAB 4: Métricas */}
        <TabPanel header="Métricas" leftIcon="pi pi-chart-line mr-2">
          {metricsLoading ? (
            <div className="flex justify-content-center align-items-center p-4">
              <ProgressSpinner />
              <span className="ml-2">Cargando métricas...</span>
            </div>
          ) : (
            <div className="flex flex-column gap-4">
              {/* Estadísticas principales del historial */}
              {historySummary && (
                <>
                  <div className="grid">
                    <div className="col-12 md:col-4">
                      <Card className="shadow-1">
                        <div className="flex align-items-center gap-3">
                          <div
                            className="flex align-items-center justify-content-center border-round"
                            style={{
                              width: "3rem",
                              height: "3rem",
                              backgroundColor: "#e3f2fd",
                            }}
                          >
                            <i className="pi pi-list text-2xl text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-600">
                              Total de Órdenes
                            </div>
                            <div className="text-2xl font-bold text-900">
                              {historySummary.totalOrders || 0}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                    <div className="col-12 md:col-4">
                      <Card className="shadow-1">
                        <div className="flex align-items-center gap-3">
                          <div
                            className="flex align-items-center justify-content-center border-round"
                            style={{
                              width: "3rem",
                              height: "3rem",
                              backgroundColor: "#f3e5f5",
                            }}
                          >
                            <i className="pi pi-clock text-2xl text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-600">
                              Horas Totales
                            </div>
                            <div className="text-2xl font-bold text-900">
                              {historySummary.totalHours?.toFixed(1) || 0}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                    <div className="col-12 md:col-4">
                      <Card className="shadow-1">
                        <div className="flex align-items-center gap-3">
                          <div
                            className="flex align-items-center justify-content-center border-round"
                            style={{
                              width: "3rem",
                              height: "3rem",
                              backgroundColor: "#fff3e0",
                            }}
                          >
                            <i className="pi pi-chart-bar text-2xl text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm text-600">
                              Duración Promedio
                            </div>
                            <div className="text-2xl font-bold text-900">
                              {historySummary.averageDuration?.toFixed(1) || 0}h
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </>
              )}

              <Divider />

              {/* Información del sistema */}
              <div>
                <h4 className="text-base font-semibold mb-3">
                  Información del Sistema
                </h4>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="mb-3">
                      <div className="text-sm text-600 mb-1">
                        Fecha de Creación
                      </div>
                      <div className="font-semibold">
                        {new Date(bay.createdAt).toLocaleDateString("es-MX", {
                          dateStyle: "long",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="mb-3">
                      <div className="text-sm text-600 mb-1">
                        Última Actualización
                      </div>
                      <div className="font-semibold">
                        {new Date(bay.updatedAt).toLocaleDateString("es-MX", {
                          dateStyle: "long",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="mb-3">
                      <div className="text-sm text-600 mb-1">
                        Estado del Sistema
                      </div>
                      <Tag
                        value={!bay.eliminado ? "Activo" : "Inactivo"}
                        severity={!bay.eliminado ? "success" : "danger"}
                        icon={`pi ${
                          !bay.eliminado ? "pi-check-circle" : "pi-times-circle"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="mb-3">
                      <div className="text-sm text-600 mb-1">
                        Orden de Visualización
                      </div>
                      <Badge value={bay.order} severity="info" size="large" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje informativo si no hay datos históricos */}
              {!historySummary && !metricsLoading && (
                <div className="surface-100 border-round p-3">
                  <div className="flex gap-2">
                    <i className="pi pi-info-circle text-blue-500 mt-1" />
                    <div className="text-sm text-700">
                      No hay datos históricos disponibles para esta bahía. Las
                      métricas se mostrarán una vez que se completen órdenes de
                      trabajo.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabPanel>
      </TabView>
    </Dialog>
  );
}
