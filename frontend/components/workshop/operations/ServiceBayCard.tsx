"use client";

import React, { useState } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { AvatarGroup } from "primereact/avatargroup";
import { Tooltip } from "primereact/tooltip";
import { Dialog } from "primereact/dialog";
import {
  BayWithDetails,
  BAY_AREA_CONFIG,
  BAY_STATUS_CONFIG,
  BAY_CAPACITY_CONFIG,
} from "@/libs/interfaces/workshop/serviceBayDashboard.interface";

interface ServiceBayCardProps {
  bay: BayWithDetails;
  onClick?: () => void;
  onAssign?: () => void;
  onRelease?: () => void;
  onTimeline?: () => void;
  onAddTechnician?: () => void;
}

export default function ServiceBayCard({
  bay,
  onClick,
  onAssign,
  onRelease,
  onTimeline,
  onAddTechnician,
}: ServiceBayCardProps) {
  const [workOrderDialog, setWorkOrderDialog] = useState(false);

  const areaConfig = BAY_AREA_CONFIG[bay.area];
  const statusConfig = BAY_STATUS_CONFIG[bay.status];
  const capacityConfig = bay.capacity
    ? BAY_CAPACITY_CONFIG[bay.capacity]
    : null;

  const isOccupied = bay.status === "ocupado";
  const isAvailable = bay.status === "disponible";
  const isMaintenance = bay.status === "mantenimiento";
  const isOutOfService = bay.status === "fuera_servicio";

  const currentAssignment = bay.currentAssignment;
  const currentTechnicians = currentAssignment?.technicians || [];

  // Calcular tiempo en bahía
  const getOccupancyTime = () => {
    if (!bay.occupancyDuration) return null;
    const hours = Math.floor(bay.occupancyDuration / 60);
    const minutes = bay.occupancyDuration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Header de la tarjeta
  const header = (
    <div className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
      <div className="flex align-items-center gap-2">
        <i
          className={`${areaConfig.icon} text-2xl`}
          style={{ color: areaConfig.color }}
        />
        <div>
          <div className="font-bold text-lg">{bay.code}</div>
          <div className="text-sm text-600">{bay.name}</div>
        </div>
      </div>
      <Tag
        value={statusConfig.label}
        severity={statusConfig.severity}
        icon={`pi ${statusConfig.icon}`}
        rounded
      />
    </div>
  );

  // Footer con acciones
  const footer = (
    <div className="flex gap-2 p-3 border-top-1 surface-border">
      {isAvailable && (
        <Button
          label="Asignar OT"
          icon="pi pi-plus"
          className="flex-1"
          severity="success"
          onClick={(e) => {
            e.stopPropagation();
            onAssign?.();
          }}
        />
      )}

      {isOccupied && (
        <>
          <Button
            label="Detalles"
            icon="pi pi-eye"
            className="flex-1"
            severity="info"
            outlined
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          />
          <Button
            label="Liberar"
            icon="pi pi-check"
            className="flex-1"
            severity="success"
            onClick={(e) => {
              e.stopPropagation();
              onRelease?.();
            }}
          />
        </>
      )}

      {/* Botón de Timeline - disponible para todas las bahías */}
      <Button
        icon="pi pi-history"
        className="p-button-text p-button-sm"
        tooltip="Ver Timeline"
        tooltipOptions={{ position: "top" }}
        onClick={(e) => {
          e.stopPropagation();
          onTimeline?.();
        }}
      />

      {isMaintenance && (
        <Button
          label="Ver Mantenimiento"
          icon="pi pi-wrench"
          className="flex-1"
          severity="warning"
          outlined
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        />
      )}

      {isOutOfService && (
        <Button
          label="Ver Estado"
          icon="pi pi-info-circle"
          className="flex-1"
          severity="danger"
          outlined
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <Card
        header={header}
        footer={footer}
        className={`service-bay-card bay-status-${bay.status} h-full transition-all transition-duration-300 hover:shadow-4`}
        // onClick={onClick}
      >
        {/* Contenido de la tarjeta */}
        <div className="flex flex-column gap-3">
          {/* Área y Capacidad */}
          <div className="flex gap-2 flex-wrap">
            <Tag
              value={areaConfig.label}
              icon={`pi ${areaConfig.icon}`}
              style={{
                backgroundColor: areaConfig.color,
                color: "white",
              }}
            />
            {capacityConfig && (
              <Tag
                value={capacityConfig.label}
                icon={`pi ${capacityConfig.icon}`}
                severity="info"
              />
            )}
          </div>

          {/* Panel de Orden de Trabajo (solo si está ocupada) */}
          {isOccupied && bay.currentWorkOrderInfo && (
            <div className="p-3 border-1 surface-border border-round bg-primary-50">
              <div className="flex align-items-center justify-content-between mb-2">
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-file-edit text-primary" />
                  <span className="font-semibold text-primary">
                    {bay.currentWorkOrderInfo.orderNumber}
                  </span>
                  <Button
                    icon="pi pi-search"
                    rounded
                    text
                    size="small"
                    severity="info"
                    className="p-0 w-2rem h-2rem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWorkOrderDialog(true);
                    }}
                    tooltip="Ver detalles de la orden"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
                {bay.occupancyDuration && (
                  <Tag
                    value={getOccupancyTime()}
                    icon="pi pi-clock"
                    severity="warning"
                  />
                )}
              </div>

              {/* Información del vehículo */}
              {bay.currentVehicle && (
                <div className="text-sm text-700 mb-1">
                  <i className="pi pi-car mr-2" />
                  {bay.currentVehicle.marca} {bay.currentVehicle.modelo}
                  {bay.currentVehicle.year && ` ${bay.currentVehicle.year}`}
                </div>
              )}

              {bay.currentVehicle?.placa && (
                <div className="text-sm text-600">
                  <i className="pi pi-id-card mr-2" />
                  {bay.currentVehicle.placa}
                </div>
              )}

              {/* Cliente */}
              {bay.currentWorkOrderInfo.clientName && (
                <div className="text-sm text-600 mt-1">
                  <i className="pi pi-user mr-2" />
                  {bay.currentWorkOrderInfo.clientName}
                </div>
              )}

              {/* Prioridad */}
              {bay.currentWorkOrderInfo.priority && (
                <div className="mt-2">
                  <Tag
                    value={bay.currentWorkOrderInfo.priority.toUpperCase()}
                    severity={
                      bay.currentWorkOrderInfo.priority === "urgente"
                        ? "danger"
                        : bay.currentWorkOrderInfo.priority === "alta"
                        ? "warning"
                        : bay.currentWorkOrderInfo.priority === "media"
                        ? "info"
                        : "secondary"
                    }
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Mensaje si no hay OT (ocupada sin info) */}
          {isOccupied && !bay.currentWorkOrderInfo && (
            <div className="p-3 border-1 surface-border border-round bg-yellow-50">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-car text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Bahía ocupada
                  {bay.occupancyDuration && ` - ${getOccupancyTime()}`}
                </span>
              </div>
            </div>
          )}

          {/* Técnicos Asignados */}
          <div className="flex align-items-center justify-content-between">
            <span className="text-sm text-600 font-medium">
              <i className="pi pi-users mr-2" />
              Técnicos
            </span>
            <div className="flex align-items-center gap-2">
              {currentTechnicians.length > 0 ? (
                <>
                  <AvatarGroup>
                    {currentTechnicians.slice(0, 3).map((tech, index) => (
                      <>
                        <Avatar
                          key={index}
                          label={tech.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                          className={`tech-avatar tech-avatar-${bay._id}-${index}`}
                          shape="circle"
                          style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            fontSize: "0.875rem",
                          }}
                        />
                        <Tooltip
                          target={`.tech-avatar-${bay._id}-${index}`}
                          content={`${tech.name}${
                            tech.role ? ` (${tech.role})` : ""
                          }`}
                          position="top"
                        />
                      </>
                    ))}
                    {currentTechnicians.length > 3 && (
                      <Avatar
                        label={`+${currentTechnicians.length - 3}`}
                        shape="circle"
                        style={{
                          backgroundColor: "#6b7280",
                          color: "white",
                          fontSize: "0.875rem",
                        }}
                      />
                    )}
                  </AvatarGroup>
                  <Badge
                    value={`${currentTechnicians.length}/${bay.maxTechnicians}`}
                    severity={
                      currentTechnicians.length >= bay.maxTechnicians
                        ? "danger"
                        : currentTechnicians.length > 0
                        ? "warning"
                        : "secondary"
                    }
                  />
                </>
              ) : (
                <Badge value={`0/${bay.maxTechnicians}`} severity="secondary" />
              )}
            </div>
          </div>

          {/* Equipamiento */}
          {bay.equipment && bay.equipment.length > 0 && (
            <div className="flex flex-column gap-2">
              <span className="text-sm text-600 font-medium">
                <i className="pi pi-wrench mr-2" />
                Equipamiento
              </span>
              <div className="flex flex-wrap gap-1">
                {bay.equipment.slice(0, 3).map((equip, index) => (
                  <Tag
                    key={index}
                    value={equip}
                    icon="pi pi-cog"
                    severity="secondary"
                    className="text-xs"
                    rounded
                  />
                ))}
                {bay.equipment.length > 3 && (
                  <Tag
                    value={`+${bay.equipment.length - 3} más`}
                    severity="secondary"
                    className="text-xs"
                    rounded
                  />
                )}
              </div>
            </div>
          )}

          {/* Notas (si existen y no es muy largo) */}
          {bay.notes && bay.notes.length < 100 && (
            <div className="text-xs text-500 italic p-2 bg-gray-50 border-round">
              <i className="pi pi-info-circle mr-1" />
              {bay.notes}
            </div>
          )}
        </div>
      </Card>

      {/* Work Order Details Dialog */}
      <Dialog
        visible={workOrderDialog}
        style={{ width: "800px", maxWidth: "95vw" }}
        header="Detalles de la Orden de Trabajo"
        modal
        onHide={() => setWorkOrderDialog(false)}
        maximizable
      >
        {bay.currentWorkOrderInfo && (
          <div className="work-order-details">
            {/* Header Info */}
            <div className="grid mb-4">
              <div className="col-12 md:col-6">
                <div className="field">
                  <label className="font-bold text-500">Número de Orden</label>
                  <div
                    className="text-2xl font-bold text-primary"
                    style={{ fontFamily: "monospace" }}
                  >
                    {bay.currentWorkOrderInfo.orderNumber}
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="field">
                  <label className="font-bold text-500">Prioridad</label>
                  <div>
                    <Tag
                      value={
                        bay.currentWorkOrderInfo.priority?.toUpperCase() ||
                        "NORMAL"
                      }
                      severity={
                        bay.currentWorkOrderInfo.priority === "urgente"
                          ? "danger"
                          : bay.currentWorkOrderInfo.priority === "alta"
                          ? "warning"
                          : bay.currentWorkOrderInfo.priority === "media"
                          ? "info"
                          : "secondary"
                      }
                      className="text-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Customer and Vehicle */}
            <div className="surface-100 border-round p-3 mb-4">
              <h3 className="mt-0 mb-3">Cliente y Vehículo</h3>
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="field mb-2">
                    <label className="text-500 text-sm">Cliente</label>
                    <div className="font-bold flex align-items-center gap-2">
                      <i className="pi pi-user text-600" />
                      {bay.currentWorkOrderInfo.clientName || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="col-12 md:col-6">
                  {bay.currentVehicle && (
                    <>
                      <div className="field mb-2">
                        <label className="text-500 text-sm">Vehículo</label>
                        <div className="font-bold flex align-items-center gap-2">
                          <i className="pi pi-car text-600" />
                          {bay.currentVehicle.marca} {bay.currentVehicle.modelo}
                          {bay.currentVehicle.year &&
                            ` ${bay.currentVehicle.year}`}
                        </div>
                      </div>
                      <div className="field mb-2">
                        <label className="text-500 text-sm">Placa</label>
                        <div className="flex align-items-center gap-2">
                          <i className="pi pi-id-card text-600" />
                          {bay.currentVehicle.placa}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Work Order Info */}
            <div className="mb-4">
              <h3 className="mb-3">Información de la Orden</h3>
              <div className="grid">
                <div className="col-12">
                  <div className="field mb-3">
                    <label className="text-500 text-sm">Servicios</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bay.currentWorkOrderInfo.services?.map(
                        (service, index) => (
                          <Tag
                            key={index}
                            value={service}
                            icon="pi pi-wrench"
                            severity="info"
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            {bay.currentAssignment && (
              <div className="surface-100 border-round p-3 mb-4">
                <h3 className="mt-0 mb-3">Asignación Actual</h3>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="field mb-2">
                      <label className="text-500 text-sm">Bahía</label>
                      <div className="font-bold flex align-items-center gap-2">
                        <i className="pi pi-inbox text-600" />
                        {bay.name} ({bay.code})
                      </div>
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="field mb-2">
                      <label className="text-500 text-sm">
                        Tiempo en Bahía
                      </label>
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-clock text-600" />
                        {getOccupancyTime() || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="field mb-2">
                      <label className="text-500 text-sm">
                        Técnicos Asignados ({currentTechnicians.length})
                      </label>
                      <div className="flex flex-column gap-2 mt-2">
                        {currentTechnicians.map((tech, index) => (
                          <div
                            key={index}
                            className="flex align-items-center gap-2 p-2 surface-50 border-round"
                          >
                            <i className="pi pi-user text-600" />
                            <span className="font-bold">{tech.name}</span>
                            {tech.role && (
                              <Tag
                                value={
                                  tech.role === "principal"
                                    ? "Principal"
                                    : "Asistente"
                                }
                                severity={
                                  tech.role === "principal"
                                    ? "success"
                                    : "secondary"
                                }
                                className="ml-auto"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {bay.currentAssignment?.notes && (
              <div className="field">
                <label className="font-bold text-500">Notas</label>
                <div className="surface-100 border-round p-3 mt-2">
                  {bay.currentAssignment.notes}
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="mt-4 p-3 bg-blue-50 border-round flex align-items-start gap-2">
              <i className="pi pi-info-circle text-blue-500 mt-1"></i>
              <div className="text-sm text-blue-900">
                <strong>Nota:</strong> Esta información es un resumen de la
                orden de trabajo activa en esta bahía. Para ver detalles
                completos de la orden, acceda al módulo de órdenes de trabajo.
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <style jsx global>{`
        .service-bay-card {
          border: 2px solid transparent;
          border-left-width: 4px;
        }

        .service-bay-card:hover {
          border-color: var(--primary-color);
          border-left-color: var(--primary-color);
        }

        .service-bay-card.bay-status-disponible {
          border-left-color: #22c55e;
        }

        .service-bay-card.bay-status-ocupado {
          border-left-color: #f59e0b;
        }

        .service-bay-card.bay-status-mantenimiento {
          border-left-color: #3b82f6;
        }

        .service-bay-card.bay-status-fuera_servicio {
          border-left-color: #ef4444;
        }

        .tech-avatar {
          border: 2px solid white;
        }
      `}</style>
    </>
  );
}
