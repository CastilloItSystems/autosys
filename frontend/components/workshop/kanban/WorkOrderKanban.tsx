"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { motion } from "framer-motion";
import {
  WorkOrder,
  WorkOrderStatusReference,
  CustomerReference,
  VehicleReference,
  TechnicianReference,
  WorkOrderItem,
} from "@/libs/interfaces/workshop";
import {
  getWorkOrders,
  changeWorkOrderStatus,
  getWorkOrderStatuses,
} from "@/app/api/workshop/workOrderService";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import WorkOrderHistoryDialog from "../work-orders/WorkOrderHistoryDialog";

export default function WorkOrderKanban() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailsDialog, setDetailsDialog] = useState<boolean>(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null
  );
  const [historyDialog, setHistoryDialog] = useState<boolean>(false);
  const [selectedWorkOrderForHistory, setSelectedWorkOrderForHistory] =
    useState<{
      id: string;
      numero: string;
    } | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set()
  );

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<boolean>(false);
  const [pendingTransition, setPendingTransition] = useState<{
    workOrder: WorkOrder;
    fromStatus: any;
    toStatus: any;
  } | null>(null);
  const [transitionData, setTransitionData] = useState<any>({});

  const toast = useRef<Toast>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    console.log("🔔 Estado del modal confirmación:", confirmDialog);
    console.log("🔔 Transición pendiente:", pendingTransition);
  }, [confirmDialog, pendingTransition]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workOrdersRes, statusesRes] = await Promise.all([
        getWorkOrders({}),
        getWorkOrderStatuses(),
      ]);

      console.log("🔍 RAW workOrdersRes:", workOrdersRes);
      console.log("🔍 RAW statusesRes:", statusesRes);

      // getWorkOrders returns { success, data, pagination }
      const workOrdersData = workOrdersRes?.data || [];
      console.log("📋 Work Orders Data:", workOrdersData);
      console.log("📋 Work Orders Count:", workOrdersData.length);

      setWorkOrders(workOrdersData);

      // getWorkOrderStatuses returns WorkOrderStatus[] directly (already unwrapped)
      // Sort statuses by orden and filter active ones
      const statusesArray = Array.isArray(statusesRes) ? statusesRes : [];
      console.log("📊 Statuses Array:", statusesArray);

      // Filtrar estados activos y no eliminados
      const sortedStatuses = statusesArray
        .filter((s: any) => s.activo === true && s.eliminado === false)
        .sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));

      console.log("📊 Filtered & Sorted Statuses:", sortedStatuses);
      console.log("📊 Statuses Count:", sortedStatuses.length);

      setStatuses(sortedStatuses);

      // Initialize collapsed columns based on status.collapsed property
      const initiallyCollapsed = new Set<string>();
      sortedStatuses.forEach((status: any) => {
        if (status.collapsed === true) {
          initiallyCollapsed.add(status._id);
        }
      });
      setCollapsedColumns(initiallyCollapsed);

      console.log("✅ Estado final cargado:");
      console.log("   - Órdenes de trabajo:", workOrdersData.length);
      console.log("   - Estados activos:", sortedStatuses.length);
      console.log(
        "   - Columnas colapsadas inicialmente:",
        initiallyCollapsed.size
      );

      if (sortedStatuses.length === 0) {
        console.warn("⚠️ No se encontraron estados activos y no eliminados");
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail:
            "No hay estados de órdenes activos disponibles (campo activo=true y eliminado=false)",
          life: 5000,
        });
      }

      if (workOrdersData.length === 0) {
        console.info("ℹ️ No se encontraron órdenes de trabajo");
        toast.current?.show({
          severity: "info",
          summary: "Información",
          detail: "No hay órdenes de trabajo disponibles",
          life: 5000,
        });
      }
    } catch (error) {
      console.error("❌ Error loading kanban data:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos del tablero",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Comentado temporalmente para que no interfiera con el modal de confirmación
    // La actualización visual se hará después de confirmar en el modal
    return;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeWorkOrder = workOrders.find(
      (wo) => wo._id === activeId || wo.id === activeId
    );
    if (!activeWorkOrder) return;

    const oldStatusId =
      typeof activeWorkOrder.estado === "string"
        ? activeWorkOrder.estado
        : (activeWorkOrder.estado as WorkOrderStatusReference)._id;

    // Check if overId is a status (column) or a work order (card)
    let targetStatus: any;

    // First, check if it's a status/column
    targetStatus = statuses.find((s) => s._id === overId);

    if (!targetStatus) {
      // If not, check if it's a work order - find which status it belongs to
      const overWorkOrder = workOrders.find(
        (wo) => wo._id === overId || wo.id === overId
      );
      if (overWorkOrder) {
        const overStatusId =
          typeof overWorkOrder.estado === "string"
            ? overWorkOrder.estado
            : (overWorkOrder.estado as WorkOrderStatusReference)._id;
        targetStatus = statuses.find((s) => s._id === overStatusId);
      }
    }

    if (!targetStatus) return;

    // If dropped on the same status, no change needed
    if (targetStatus._id === oldStatusId) {
      console.log("⚠️ Mismo estado, no se requiere cambio");
      return;
    }

    // Find from status
    const fromStatus = statuses.find((s) => s._id === oldStatusId);

    console.log("🔄 Iniciando transición:");
    console.log("  - Orden:", activeWorkOrder.numeroOrden);
    console.log("  - De:", fromStatus?.nombre);
    console.log("  - A:", targetStatus?.nombre);

    // Show confirmation dialog with dynamic fields
    setPendingTransition({
      workOrder: activeWorkOrder,
      fromStatus: fromStatus,
      toStatus: targetStatus,
    });
    setTransitionData({});
    setConfirmDialog(true);

    console.log("✅ Modal de confirmación debería abrirse");
  };

  const handleConfirmTransition = async () => {
    if (!pendingTransition) return;

    const { workOrder, fromStatus, toStatus } = pendingTransition;

    // Update in backend
    try {
      const result = await changeWorkOrderStatus(
        workOrder._id!,
        toStatus.codigo,
        transitionData.observaciones || ""
      );

      console.log("✅ Estado cambiado exitosamente:", result);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail:
          result.msg ||
          `Orden ${workOrder.numeroOrden} movida a ${toStatus.nombre}`,
        life: 3000,
      });

      // Close dialog and reset
      setConfirmDialog(false);
      setPendingTransition(null);
      setTransitionData({});

      // Reload to get fresh data
      loadData();
    } catch (error: any) {
      console.error("❌ Error updating work order status:", error);

      let errorMessage = "Error al actualizar el estado de la orden";

      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.status === 400) {
        errorMessage = "Transición de estado no válida";
      } else if (error.response?.status === 403) {
        errorMessage = "No tienes permisos para cambiar el estado";
      } else if (error.response?.status === 404) {
        errorMessage = "Orden de trabajo no encontrada";
      }

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 3000,
      });

      // Revert the change
      const oldStatusId = fromStatus?._id;
      if (oldStatusId) {
        setWorkOrders((workOrders) => {
          return workOrders.map((wo) => {
            if (wo._id === workOrder._id || wo.id === workOrder._id) {
              return { ...wo, estado: oldStatusId };
            }
            return wo;
          });
        });
      }

      // Close dialog
      setConfirmDialog(false);
      setPendingTransition(null);
      setTransitionData({});
    }
  };

  const handleCancelTransition = () => {
    // Revert the visual change
    if (pendingTransition) {
      const { workOrder, fromStatus } = pendingTransition;
      const oldStatusId = fromStatus?._id;
      if (oldStatusId) {
        setWorkOrders((workOrders) => {
          return workOrders.map((wo) => {
            if (wo._id === workOrder._id || wo.id === workOrder._id) {
              return { ...wo, estado: oldStatusId };
            }
            return wo;
          });
        });
      }
    }

    // Close dialog and reset
    setConfirmDialog(false);
    setPendingTransition(null);
    setTransitionData({});
  };

  const handleCardClick = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setDetailsDialog(true);
  };

  const hideDetailsDialog = () => {
    setDetailsDialog(false);
    setSelectedWorkOrder(null);
  };

  const handleHistoryClick = (workOrder: WorkOrder) => {
    const id = workOrder._id || workOrder.id;
    if (id) {
      setSelectedWorkOrderForHistory({
        id,
        numero: workOrder.numeroOrden,
      });
      setHistoryDialog(true);
    }
  };

  const hideHistoryDialog = () => {
    setHistoryDialog(false);
    setSelectedWorkOrderForHistory(null);
  };

  const toggleColumnCollapse = (statusId: string) => {
    setCollapsedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(statusId)) {
        newSet.delete(statusId);
      } else {
        newSet.add(statusId);
      }
      return newSet;
    });
  };

  // Get work orders by status
  const getWorkOrdersByStatus = (statusId: string): WorkOrder[] => {
    return workOrders.filter((wo) => {
      const woStatusId =
        typeof wo.estado === "string"
          ? wo.estado
          : (wo.estado as WorkOrderStatusReference)._id;
      return woStatusId === statusId;
    });
  };

  // Get required fields based on status transition (DEMO - valores ficticios)
  const getTransitionFields = (fromStatus: any, toStatus: any) => {
    const fromCode = fromStatus?.codigo || "";
    const toCode = toStatus?.codigo || "";

    // Ejemplos de transiciones con campos requeridos
    if (fromCode === "RECIBIDO" && toCode === "EN_DIAGNOSTICO") {
      return [
        {
          name: "puestoTaller",
          label: "Puesto de Taller",
          type: "dropdown",
          required: true,
          options: [
            { label: "Puesto 1 - Mecánica General", value: "P1" },
            { label: "Puesto 2 - Electricidad", value: "P2" },
            { label: "Puesto 3 - Aire Acondicionado", value: "P3" },
            { label: "Puesto 4 - Frenos", value: "P4" },
          ],
        },
        {
          name: "tecnicoAsignado",
          label: "Técnico Asignado",
          type: "dropdown",
          required: true,
          options: [
            { label: "Juan Pérez", value: "T1" },
            { label: "María García", value: "T2" },
            { label: "Carlos López", value: "T3" },
          ],
        },
        {
          name: "observaciones",
          label: "Observaciones",
          type: "textarea",
          required: false,
        },
      ];
    }

    if (toCode === "EN_REPARACION") {
      return [
        {
          name: "diagnosticoCompleto",
          label: "Diagnóstico Completo",
          type: "textarea",
          required: true,
        },
        {
          name: "repuestosNecesarios",
          label: "Repuestos Necesarios",
          type: "text",
          required: false,
        },
      ];
    }

    if (toCode === "COMPLETADO") {
      return [
        {
          name: "trabajoRealizado",
          label: "Trabajo Realizado",
          type: "textarea",
          required: true,
        },
        {
          name: "kilometrajeFinal",
          label: "Kilometraje Final",
          type: "text",
          required: true,
        },
        {
          name: "repuestosUsados",
          label: "Repuestos Utilizados",
          type: "textarea",
          required: false,
        },
      ];
    }

    if (toCode === "LISTO_ENTREGA") {
      return [
        {
          name: "fechaEntrega",
          label: "Fecha de Entrega Estimada",
          type: "text",
          required: true,
        },
        {
          name: "notificarCliente",
          label: "¿Notificar al Cliente?",
          type: "dropdown",
          required: true,
          options: [
            { label: "Sí, notificar", value: "si" },
            { label: "No notificar", value: "no" },
          ],
        },
      ];
    }

    // Default: solo observaciones
    return [
      {
        name: "observaciones",
        label: "Observaciones (opcional)",
        type: "textarea",
        required: false,
      },
    ];
  };

  // Get active work order for drag overlay
  const activeWorkOrder = activeId
    ? workOrders.find((wo) => wo._id === activeId || wo.id === activeId)
    : null;

  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="m-0">Tablero de Órdenes de Trabajo</h2>
        <div className="flex gap-2 align-items-center">
          <span className="p-tag p-tag-info">{statuses.length} estados</span>
          <span className="p-tag p-tag-success">
            {workOrders.length} órdenes
          </span>
          {collapsedColumns.size > 0 && (
            <Button
              label="Expandir Todo"
              icon="pi pi-plus"
              outlined
              size="small"
              onClick={() => setCollapsedColumns(new Set())}
              severity="secondary"
            />
          )}
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            outlined
            onClick={loadData}
            loading={loading}
          />
        </div>
      </div>

      {/* Kanban Board */}
      {statuses.length === 0 ? (
        <div
          className="flex flex-column justify-content-center align-items-center surface-100 border-round p-6"
          style={{ minHeight: "400px" }}
        >
          <i
            className="pi pi-inbox text-6xl text-400 mb-3"
            style={{ fontSize: "4rem" }}
          ></i>
          <h3 className="text-600 mb-2">No hay estados configurados</h3>
          <p className="text-500 m-0 text-center">
            Por favor, configure los estados de órdenes de trabajo en el sistema
            <br />
            para poder visualizar el tablero Kanban.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            className="kanban-board flex gap-3 overflow-x-auto pb-4"
            style={{ minHeight: "600px" }}
          >
            {statuses.map((status) => (
              <KanbanColumn
                key={status._id}
                status={status}
                workOrders={getWorkOrdersByStatus(status._id)}
                onCardClick={handleCardClick}
                onHistoryClick={handleHistoryClick}
                isCollapsed={collapsedColumns.has(status._id)}
                onToggleCollapse={() => toggleColumnCollapse(status._id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeWorkOrder ? (
              <div style={{ cursor: "grabbing", opacity: 0.8 }}>
                <KanbanCard workOrder={activeWorkOrder} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Transition Confirmation Dialog */}
      <Dialog
        visible={confirmDialog}
        style={{ width: "600px" }}
        header="Confirmar Cambio de Estado"
        modal
        className="p-fluid"
        onHide={handleCancelTransition}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={handleCancelTransition}
            />
            <Button
              label="Confirmar"
              icon="pi pi-check"
              onClick={handleConfirmTransition}
              autoFocus
            />
          </div>
        }
      >
        {pendingTransition && (
          <div>
            {/* Transition Info */}
            <div className="mb-4 p-3 surface-100 border-round">
              <div className="flex align-items-center gap-3 mb-2">
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-box text-xl text-primary"></i>
                  <span className="font-bold">
                    Orden: {pendingTransition.workOrder.numeroOrden}
                  </span>
                </div>
              </div>
              <div className="flex align-items-center gap-2 text-sm">
                <span
                  className="px-3 py-1 border-round font-semibold"
                  style={{
                    backgroundColor:
                      pendingTransition.fromStatus?.color || "#607D8B",
                    color: "#fff",
                  }}
                >
                  {pendingTransition.fromStatus?.nombre || "Estado Anterior"}
                </span>
                <i className="pi pi-arrow-right text-500"></i>
                <span
                  className="px-3 py-1 border-round font-semibold"
                  style={{
                    backgroundColor:
                      pendingTransition.toStatus?.color || "#607D8B",
                    color: "#fff",
                  }}
                >
                  {pendingTransition.toStatus?.nombre || "Estado Nuevo"}
                </span>
              </div>
            </div>

            {/* Dynamic Fields */}
            <div className="flex flex-column gap-3">
              {getTransitionFields(
                pendingTransition.fromStatus,
                pendingTransition.toStatus
              ).map((field) => (
                <div key={field.name} className="field">
                  <label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {field.type === "text" && (
                    <InputText
                      id={field.name}
                      value={transitionData[field.name] || ""}
                      onChange={(e) =>
                        setTransitionData({
                          ...transitionData,
                          [field.name]: e.target.value,
                        })
                      }
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                    />
                  )}
                  {field.type === "textarea" && (
                    <InputTextarea
                      id={field.name}
                      value={transitionData[field.name] || ""}
                      onChange={(e) =>
                        setTransitionData({
                          ...transitionData,
                          [field.name]: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                    />
                  )}
                  {field.type === "dropdown" && (
                    <Dropdown
                      id={field.name}
                      value={transitionData[field.name] || ""}
                      onChange={(e) =>
                        setTransitionData({
                          ...transitionData,
                          [field.name]: e.value,
                        })
                      }
                      options={field.options || []}
                      placeholder={`Seleccione ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Info Message */}
            <div className="mt-3 p-3 bg-blue-50 border-round flex align-items-start gap-2">
              <i className="pi pi-info-circle text-blue-500 mt-1"></i>
              <div className="text-sm text-blue-900">
                <strong>Nota:</strong> Esta es una vista de demostración. Los
                campos mostrados son ejemplos y no afectan datos reales. En
                producción, estos campos se guardarían junto con el cambio de
                estado.
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        visible={detailsDialog}
        style={{ width: "900px" }}
        header="Detalles de la Orden de Trabajo"
        modal
        className="p-fluid"
        onHide={hideDetailsDialog}
        maximizable
      >
        {selectedWorkOrder && (
          <WorkOrderDetails workOrder={selectedWorkOrder} />
        )}
      </Dialog>

      {/* History Dialog */}
      <WorkOrderHistoryDialog
        visible={historyDialog}
        workOrderId={selectedWorkOrderForHistory?.id || null}
        workOrderNumber={selectedWorkOrderForHistory?.numero || ""}
        onHide={hideHistoryDialog}
      />
    </motion.div>
  );
}

// Component to display work order details
function WorkOrderDetails({ workOrder }: { workOrder: WorkOrder }) {
  const customer =
    typeof workOrder.customer === "string"
      ? { nombre: "N/A", telefono: "", correo: "", nombreCompleto: "N/A" }
      : (workOrder.customer as CustomerReference);

  const vehicle =
    typeof workOrder.vehicle === "string"
      ? { placa: "N/A" }
      : (workOrder.vehicle as VehicleReference);

  const technician =
    typeof workOrder.tecnicoAsignado === "string"
      ? { nombre: "No asignado" }
      : workOrder.tecnicoAsignado
      ? (workOrder.tecnicoAsignado as TechnicianReference)
      : { nombre: "No asignado" };

  const status =
    typeof workOrder.estado === "string"
      ? { nombre: workOrder.estado, color: "#607D8B" }
      : (workOrder.estado as WorkOrderStatusReference);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const priorityLabels = {
    baja: "Baja",
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente",
  };

  return (
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
              {workOrder.numeroOrden}
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6">
          <div className="field">
            <label className="font-bold text-500">Estado</label>
            <div>
              <span
                className="inline-block px-3 py-2 border-round font-bold"
                style={{
                  backgroundColor: status.color || "#607D8B",
                  color: "#ffffff",
                }}
              >
                {status.nombre}
              </span>
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
              <div className="font-bold">
                {customer.nombreCompleto || customer.nombre}
              </div>
            </div>
            {customer.telefono && (
              <div className="field mb-2">
                <label className="text-500 text-sm">Teléfono</label>
                <div>{customer.telefono}</div>
              </div>
            )}
            {customer.correo && (
              <div className="field mb-2">
                <label className="text-500 text-sm">Correo</label>
                <div>{customer.correo}</div>
              </div>
            )}
          </div>
          <div className="col-12 md:col-6">
            <div className="field mb-2">
              <label className="text-500 text-sm">Placa</label>
              <div className="font-bold">{vehicle.placa}</div>
            </div>
            <div className="field mb-2">
              <label className="text-500 text-sm">Kilometraje</label>
              <div>{workOrder.kilometraje?.toLocaleString()} km</div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Order Info */}
      <div className="grid mb-4">
        <div className="col-12 md:col-6">
          <div className="field mb-3">
            <label className="text-500 text-sm">Motivo</label>
            <div className="font-bold">{workOrder.motivo}</div>
          </div>
          <div className="field mb-3">
            <label className="text-500 text-sm">Prioridad</label>
            <div>{priorityLabels[workOrder.prioridad]}</div>
          </div>
          <div className="field mb-3">
            <label className="text-500 text-sm">Técnico Asignado</label>
            <div>{technician.nombre}</div>
          </div>
        </div>
        <div className="col-12 md:col-6">
          <div className="field mb-3">
            <label className="text-500 text-sm">Fecha de Apertura</label>
            <div>{formatDate(workOrder.fechaApertura)}</div>
          </div>
          {workOrder.fechaEstimadaEntrega && (
            <div className="field mb-3">
              <label className="text-500 text-sm">
                Fecha Estimada de Entrega
              </label>
              <div>{formatDate(workOrder.fechaEstimadaEntrega)}</div>
            </div>
          )}
          {workOrder.fechaEntregaReal && (
            <div className="field mb-3">
              <label className="text-500 text-sm">Fecha de Entrega Real</label>
              <div>{formatDate(workOrder.fechaEntregaReal)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Problem Description */}
      {workOrder.descripcionProblema && (
        <div className="field mb-4">
          <label className="font-bold text-500">Descripción del Problema</label>
          <div className="surface-100 border-round p-3 mt-2">
            {workOrder.descripcionProblema}
          </div>
        </div>
      )}

      {/* Items */}
      {workOrder.items && workOrder.items.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-3">Items</h3>
          <div className="surface-100 border-round p-3">
            {workOrder.items.map((item: WorkOrderItem, index: number) => (
              <div
                key={item._id || index}
                className="flex justify-content-between align-items-center mb-2 pb-2"
                style={{
                  borderBottom:
                    index < workOrder.items!.length - 1
                      ? "1px solid #dee2e6"
                      : "none",
                }}
              >
                <div className="flex-1">
                  <div className="font-bold">{item.nombre}</div>
                  {item.descripcion && (
                    <div className="text-sm text-500">{item.descripcion}</div>
                  )}
                  <div className="text-sm">
                    <span className="text-500">Cantidad:</span> {item.cantidad}{" "}
                    • <span className="text-500">Precio Unit:</span>{" "}
                    {formatCurrency(item.precioUnitario)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {formatCurrency(item.precioFinal)}
                  </div>
                  <div className="text-sm text-500 capitalize">
                    {item.estado}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="surface-100 border-round p-3">
        <h3 className="mt-0 mb-3">Resumen Financiero</h3>
        <div className="grid">
          <div className="col-6">
            <div className="field mb-2">
              <label className="text-500 text-sm">Subtotal Servicios</label>
              <div>{formatCurrency(workOrder.subtotalServicios)}</div>
            </div>
          </div>
          <div className="col-6">
            <div className="field mb-2">
              <label className="text-500 text-sm">Subtotal Repuestos</label>
              <div>{formatCurrency(workOrder.subtotalRepuestos)}</div>
            </div>
          </div>
          <div className="col-6">
            <div className="field mb-2">
              <label className="text-500 text-sm">Descuento</label>
              <div>{formatCurrency(workOrder.descuento)}</div>
            </div>
          </div>
          <div className="col-6">
            <div className="field mb-2">
              <label className="text-500 text-sm">Impuesto (IVA)</label>
              <div>{formatCurrency(workOrder.impuesto)}</div>
            </div>
          </div>
          <div className="col-12">
            <div
              className="field mb-0 pt-3"
              style={{ borderTop: "2px solid #dee2e6" }}
            >
              <label className="text-500 text-sm">Costo Total</label>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(workOrder.costoTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      {workOrder.observaciones && (
        <div className="field mt-4">
          <label className="font-bold text-500">Observaciones</label>
          <div className="surface-100 border-round p-3 mt-2">
            {workOrder.observaciones}
          </div>
        </div>
      )}
    </div>
  );
}
