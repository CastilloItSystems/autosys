"use client";
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  WorkOrder,
  WorkOrderStatusReference,
} from "@/libs/interfaces/workshop";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  status: any; // WorkOrderStatus or WorkOrderStatusReference
  workOrders: WorkOrder[];
  onCardClick: (workOrder: WorkOrder) => void;
  onHistoryClick?: (workOrder: WorkOrder) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function KanbanColumn({
  status,
  workOrders,
  onCardClick,
  onHistoryClick,
  isCollapsed = false,
  onToggleCollapse,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status._id,
  });

  // Get contrast color for text
  const getContrastColor = (hexColor?: string): string => {
    if (!hexColor) return "#000000";
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? "#000000" : "#FFFFFF";
  };

  const workOrderIds = workOrders.map((wo) => wo._id || wo.id || "");

  // Collapsed view
  if (isCollapsed) {
    return (
      <div
        className="kanban-column-collapsed"
        style={{
          minWidth: "70px",
          maxWidth: "70px",
          cursor: "pointer",
          flexShrink: 0,
        }}
        onClick={onToggleCollapse}
        title={`Click para expandir ${status.nombre}`}
      >
        <div
          className="border-round shadow-3 h-full flex flex-column align-items-center gap-3"
          style={{
            backgroundColor: status.color || "#607D8B",
            color: getContrastColor(status.color),
            minHeight: "500px",
            padding: "1.5rem 0.5rem",
            position: "relative",
          }}
        >
          {/* Expand Icon at top */}
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "0.875rem",
              opacity: 0.8,
            }}
          >
            <i className="pi pi-angle-double-right"></i>
          </div>

          {/* Status Icon */}
          {status.icono && (
            <div style={{ marginTop: "2rem" }}>
              <i
                className={`pi ${status.icono}`}
                style={{ fontSize: "1.5rem" }}
              ></i>
            </div>
          )}

          {/* Status Name (vertical) */}
          <div
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              fontSize: "0.95rem",
              fontWeight: "bold",
              letterSpacing: "1px",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {status.nombre}
          </div>

          {/* Order Count Badge */}
          <div
            className="border-circle"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              minWidth: "2.5rem",
              minHeight: "2.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span className="font-bold" style={{ fontSize: "1rem" }}>
              {workOrders.length}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="kanban-column"
      style={{ minWidth: "320px", maxWidth: "380px" }}
    >
      {/* Column Header */}
      <div
        className="p-3 border-round-top shadow-2 mb-3"
        style={{
          backgroundColor: status.color || "#607D8B",
          color: getContrastColor(status.color),
        }}
      >
        <div className="flex justify-content-between align-items-center">
          <div className="flex align-items-center gap-2">
            {status.icono && <i className={`pi ${status.icono} text-xl`}></i>}
            <span className="font-bold text-lg">{status.nombre}</span>
          </div>
          <div className="flex align-items-center gap-2">
            <div
              className="border-circle px-2 py-1"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                minWidth: "2rem",
                textAlign: "center",
              }}
            >
              <span className="font-bold">{workOrders.length}</span>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-0 border-none bg-transparent cursor-pointer"
                style={{
                  color: getContrastColor(status.color),
                  fontSize: "1.2rem",
                  padding: "0.25rem",
                }}
                title="Minimizar columna"
              >
                <i className="pi pi-minus"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Droppable Area */}
      <SortableContext
        items={workOrderIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="kanban-column-content p-3 border-round-bottom"
          style={{
            minHeight: "500px",
            backgroundColor: isOver ? "rgba(33, 150, 243, 0.1)" : "#f8f9fa",
            border: isOver ? "2px dashed #2196F3" : "2px solid transparent",
            transition: "all 0.3s ease",
          }}
        >
          {workOrders.length === 0 ? (
            <div className="text-center text-500 py-5">
              <i className="pi pi-inbox text-4xl mb-3"></i>
              <div>No hay órdenes en este estado</div>
            </div>
          ) : (
            <div className="flex flex-column gap-2">
              {workOrders.map((workOrder) => (
                <KanbanCard
                  key={workOrder._id || workOrder.id}
                  workOrder={workOrder}
                  onClick={() => onCardClick(workOrder)}
                  onHistoryClick={
                    onHistoryClick ? () => onHistoryClick(workOrder) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
