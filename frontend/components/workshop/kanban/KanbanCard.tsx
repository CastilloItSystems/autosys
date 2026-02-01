"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import {
  WorkOrder,
  CustomerReference,
  VehicleReference,
} from "@/libs/interfaces/workshop";

interface KanbanCardProps {
  workOrder: WorkOrder;
  onClick: () => void;
  onHistoryClick?: () => void;
}

export default function KanbanCard({
  workOrder,
  onClick,
  onHistoryClick,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workOrder._id || workOrder.id || "" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  // Extract customer and vehicle info
  const customer =
    typeof workOrder.customer === "string"
      ? { nombre: "N/A", nombreCompleto: "N/A" }
      : (workOrder.customer as CustomerReference);

  const vehicle =
    typeof workOrder.vehicle === "string"
      ? { placa: "N/A" }
      : (workOrder.vehicle as VehicleReference);

  // Priority colors and labels
  const priorityConfig = {
    baja: { severity: "secondary", label: "Baja", icon: "pi-arrow-down" },
    normal: { severity: "info", label: "Normal", icon: "pi-minus" },
    alta: { severity: "warning", label: "Alta", icon: "pi-arrow-up" },
    urgente: {
      severity: "danger",
      label: "Urgente",
      icon: "pi-exclamation-circle",
    },
  } as const;

  const priority = priorityConfig[workOrder.prioridad] || priorityConfig.normal;

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Calculate days elapsed
  const daysElapsed = workOrder.diasTranscurridos || 0;
  const getDaysColor = () => {
    if (daysElapsed > 7) return "danger";
    if (daysElapsed > 3) return "warning";
    return "success";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3"
    >
      <Card
        onClick={onClick}
        className="shadow-2 hover:shadow-4 transition-all transition-duration-300"
        style={{
          borderLeft: `4px solid ${
            priority.severity === "danger"
              ? "#f44336"
              : priority.severity === "warning"
              ? "#ff9800"
              : priority.severity === "info"
              ? "#2196F3"
              : "#9e9e9e"
          }`,
        }}
      >
        {/* Header */}
        <div className="flex justify-content-between align-items-start mb-2">
          <div className="flex-1">
            <div
              className="text-lg font-bold text-primary mb-1"
              style={{ fontFamily: "monospace" }}
            >
              {workOrder.numeroOrden}
            </div>
            <div className="text-sm text-600">
              <i className="pi pi-user mr-1"></i>
              {customer.nombreCompleto || customer.nombre}
            </div>
          </div>
          <Tag
            severity={priority.severity as any}
            icon={`pi ${priority.icon}`}
            value={priority.label}
          />
        </div>

        {/* Vehicle */}
        <div className="flex align-items-center gap-2 mb-2">
          <i className="pi pi-car text-600"></i>
          <span className="text-sm font-semibold">{vehicle.placa}</span>
          {workOrder.kilometraje && (
            <span className="text-sm text-500">
              • {workOrder.kilometraje.toLocaleString()} km
            </span>
          )}
        </div>

        {/* Motivo */}
        <div
          className="text-sm text-700 mb-2"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {workOrder.motivo}
        </div>

        {/* Footer Info */}
        <div
          className="flex justify-content-between align-items-center pt-2"
          style={{ borderTop: "1px solid #dee2e6" }}
        >
          <div className="flex flex-column">
            <span className="text-xs text-500">Total</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(workOrder.costoTotal)}
            </span>
          </div>

          <div className="flex gap-2 align-items-center">
            {/* Items count */}
            {workOrder.items && workOrder.items.length > 0 && (
              <Badge value={workOrder.items.length} severity="info"></Badge>
            )}

            {/* History button */}
            {onHistoryClick && (
              <Button
                icon="pi pi-history"
                rounded
                text
                severity="info"
                size="small"
                tooltip="Ver Historial"
                tooltipOptions={{ position: "top" }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onHistoryClick();
                }}
                style={{ width: "24px", height: "24px" }}
              />
            )}

            {/* Days elapsed */}
            <Tag
              severity={getDaysColor() as any}
              value={`${daysElapsed}d`}
              icon="pi pi-clock"
            />
          </div>
        </div>

        {/* Delivery date if exists */}
        {workOrder.fechaEstimadaEntrega && (
          <div className="text-xs text-500 mt-2">
            <i className="pi pi-calendar mr-1"></i>
            Entrega: {formatDate(workOrder.fechaEstimadaEntrega)}
          </div>
        )}
      </Card>
    </div>
  );
}
