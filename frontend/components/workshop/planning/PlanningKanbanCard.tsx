"use client";
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import type { ServiceOrder } from "@/libs/interfaces/workshop";

const PRIORITY_CONFIG = {
  LOW: { label: "Baja", severity: "secondary" as const, icon: "pi pi-arrow-down" },
  NORMAL: { label: "Normal", severity: "info" as const, icon: "pi pi-minus" },
  HIGH: { label: "Alta", severity: "warning" as const, icon: "pi pi-arrow-up" },
  ASAP: { label: "Urgente", severity: "danger" as const, icon: "pi pi-exclamation-triangle" },
};

interface PlanningKanbanCardProps {
  order: ServiceOrder;
  onAction: (action: "edit" | "status", order: ServiceOrder) => void;
  isOverlay?: boolean;
}

export default function PlanningKanbanCard({
  order,
  onAction,
  isOverlay = false,
}: PlanningKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: order.id, data: { order }, disabled: isOverlay });

  const priorityCfg = PRIORITY_CONFIG[order.priority] ?? PRIORITY_CONFIG.NORMAL;
  const daysElapsed = Math.floor(
    (Date.now() - new Date(order.receivedAt).getTime()) / 86_400_000
  );
  const isDelayed =
    order.estimatedDelivery &&
    new Date(order.estimatedDelivery) < new Date() &&
    order.status !== "READY" &&
    order.status !== "DELIVERED" &&
    order.status !== "INVOICED" &&
    order.status !== "CLOSED" &&
    order.status !== "CANCELLED";

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : { ...listeners, ...attributes })}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.35 : 1,
        cursor: isOverlay ? "grabbing" : "grab",
        backgroundColor: "var(--surface-card)",
        border: `1px solid ${isDelayed ? "var(--red-300)" : "var(--surface-200)"}`,
        borderRadius: "6px",
        padding: "10px",
        boxShadow: isOverlay
          ? "0 8px 28px rgba(0,0,0,0.22)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Folio + priority */}
      <div className="flex align-items-center justify-content-between mb-1 gap-1">
        <span className="font-bold text-xs text-primary">{order.folio}</span>
        <Tag
          value={priorityCfg.label}
          severity={priorityCfg.severity}
          icon={priorityCfg.icon}
          style={{ fontSize: "9px", padding: "1px 5px" }}
        />
      </div>

      {/* Vehicle */}
      {(order.vehiclePlate || order.vehicleDesc) && (
        <div className="flex align-items-center gap-1 mb-1">
          <i className="pi pi-car text-xs text-400" />
          <span
            className="text-xs text-700 font-medium"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {order.vehiclePlate ?? order.vehicleDesc}
          </span>
        </div>
      )}

      {/* Customer */}
      {order.customer && (
        <div className="flex align-items-center gap-1 mb-2">
          <i className="pi pi-user text-xs text-400" />
          <span
            className="text-xs text-600"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {order.customer.name}
          </span>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex align-items-center justify-content-between mt-1"
        style={{ borderTop: "1px solid var(--surface-100)", paddingTop: "6px" }}
      >
        <span
          className={`text-xs font-semibold ${isDelayed ? "text-red-500" : "text-400"}`}
        >
          {isDelayed && <i className="pi pi-exclamation-circle mr-1" />}
          {daysElapsed === 0 ? "Hoy" : `${daysElapsed}d`}
        </span>
        <div
          className="flex gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            icon="pi pi-pencil"
            text
            rounded
            size="small"
            style={{ width: "22px", height: "22px" }}
            tooltip="Editar"
            tooltipOptions={{ position: "top" }}
            onClick={() => onAction("edit", order)}
          />
          <Button
            icon="pi pi-exchange"
            text
            rounded
            severity="info"
            size="small"
            style={{ width: "22px", height: "22px" }}
            tooltip="Cambiar estado"
            tooltipOptions={{ position: "top" }}
            onClick={() => onAction("status", order)}
          />
        </div>
      </div>
    </div>
  );
}
