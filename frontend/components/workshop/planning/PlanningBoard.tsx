"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { SelectButton } from "primereact/selectbutton";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { ProgressBar } from "primereact/progressbar";
import { ConfirmDialog } from "primereact/confirmdialog";
import { motion } from "framer-motion";
import serviceOrderService from "@/app/api/workshop/serviceOrderService";
import workshopBayService from "@/app/api/workshop/workshopBayService";
import type {
  ServiceOrder,
  ServiceOrderStatus,
  UpdateServiceOrderStatusInput,
} from "@/libs/interfaces/workshop";
import type { WorkshopBay } from "@/libs/interfaces/workshop/workshopBay.interface";
import { handleFormError } from "@/utils/errorHandlers";
import PlanningKanbanCard from "./PlanningKanbanCard";
import ServiceOrderForm from "@/components/workshop/service-orders/ServiceOrderForm";
import ServiceOrderDetail from "@/components/workshop/service-orders/ServiceOrderDetail";
import FormActionButtons from "@/components/common/FormActionButtons";

// ── Status config ─────────────────────────────────────────────────────────────
// NOTE: Keep `NEXT_STATUSES` in sync with backend VALID_TRANSITIONS
// backend source: backend/src/features/workshop/serviceOrders/serviceOrders.service.ts

const BOARD_STATUSES: {
  id: ServiceOrderStatus;
  label: string;
  color: string;
  icon: string;
  maxCapacity?: number;
}[] = [
  { id: "OPEN", label: "Abierta", color: "#3b82f6", icon: "pi pi-folder-open" },
  {
    id: "DIAGNOSING",
    label: "Diagnóstico",
    color: "#8b5cf6",
    icon: "pi pi-search",
  },
  {
    id: "PENDING_APPROVAL",
    label: "Aprobación",
    color: "#f59e0b",
    icon: "pi pi-clock",
  },
  { id: "APPROVED", label: "Aprobada", color: "#06b6d4", icon: "pi pi-check" },
  {
    id: "IN_PROGRESS",
    label: "En proceso",
    color: "#10b981",
    icon: "pi pi-wrench",
    maxCapacity: 8,
  },
  { id: "PAUSED", label: "Pausada", color: "#f97316", icon: "pi pi-pause" },
  {
    id: "WAITING_PARTS",
    label: "Espera piezas",
    color: "#ef4444",
    icon: "pi pi-box",
  },
  // Nueva columna: WAITING_AUTH (esperando autorización)
  {
    id: "WAITING_AUTH",
    label: "Esperando autorización",
    color: "#f97316",
    icon: "pi pi-lock",
  },
  {
    id: "QUALITY_CHECK",
    label: "Control calidad",
    color: "#6366f1",
    icon: "pi pi-shield",
  },
  { id: "READY", label: "Lista", color: "#22c55e", icon: "pi pi-check-circle" },
  // Nueva columna: DELIVERED (entregada)
  {
    id: "DELIVERED",
    label: "Entregada",
    color: "#16a34a",
    icon: "pi pi-truck",
  },
  {
    id: "INVOICED",
    label: "Facturada",
    color: "#0ea5e9",
    icon: "pi pi-receipt",
  },
  {
    id: "CLOSED",
    label: "Cerrada",
    color: "#64748b",
    icon: "pi pi-lock",
  },
];

const PRIORITY_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Urgente", value: "ASAP" },
  { label: "Alta", value: "HIGH" },
  { label: "Normal", value: "NORMAL" },
  { label: "Baja", value: "LOW" },
];

// ── Status change dialog ──────────────────────────────────────────────────────

// Partial map of allowed next statuses (frontend copy of backend VALID_TRANSITIONS)
// Keep synchronized with: backend/src/features/workshop/serviceOrders/serviceOrders.service.ts
const NEXT_STATUSES: Partial<Record<ServiceOrderStatus, ServiceOrderStatus[]>> =
  {
    DRAFT: ["OPEN", "CANCELLED"],
    OPEN: ["DIAGNOSING", "IN_PROGRESS", "CANCELLED"],
    DIAGNOSING: ["PENDING_APPROVAL", "APPROVED", "CANCELLED"],
    PENDING_APPROVAL: ["APPROVED", "CANCELLED"],
    APPROVED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: [
      "PAUSED",
      "WAITING_PARTS",
      "WAITING_AUTH",
      "QUALITY_CHECK",
      "CANCELLED",
    ],
    PAUSED: ["IN_PROGRESS", "CANCELLED"],
    WAITING_PARTS: ["IN_PROGRESS", "CANCELLED"],
    WAITING_AUTH: ["IN_PROGRESS", "CANCELLED"],
    QUALITY_CHECK: ["READY", "IN_PROGRESS"],
    READY: ["DELIVERED", "IN_PROGRESS"],
    DELIVERED: ["INVOICED"],
    INVOICED: ["CLOSED"],
    CLOSED: [],
    CANCELLED: [],
  };

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  DIAGNOSING: "Diagnóstico",
  PENDING_APPROVAL: "Aprobación pendiente",
  APPROVED: "Aprobada",
  IN_PROGRESS: "En proceso",
  PAUSED: "Pausada",
  WAITING_PARTS: "Esperando piezas",
  WAITING_AUTH: "Esperando autorización",
  QUALITY_CHECK: "Control de calidad",
  READY: "Lista",
  DELIVERED: "Entregada",
  INVOICED: "Facturada",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
  DRAFT: "Borrador",
};

const STATUS_CHANGE_NOTE_TEMPLATES: Record<string, string[]> = {
  "DRAFT->OPEN": [
    "OT abierta para iniciar diagnóstico.",
    "Se valida información inicial y se inicia flujo operativo.",
  ],
  "OPEN->DIAGNOSING": [
    "Vehículo ingresado a diagnóstico técnico.",
    "Se inicia evaluación de fallas reportadas por cliente.",
  ],
  "DIAGNOSING->PENDING_APPROVAL": [
    "Diagnóstico finalizado, pendiente aprobación del cliente.",
    "Se envía presupuesto para autorización.",
  ],
  "PENDING_APPROVAL->APPROVED": [
    "Cliente aprueba cotización, se autoriza ejecución.",
    "Aprobación recibida, OT lista para programación.",
  ],
  "APPROVED->IN_PROGRESS": [
    "Trabajo iniciado por técnico asignado.",
    "OT entra en ejecución según plan de trabajo.",
  ],
  "IN_PROGRESS->PAUSED": [
    "Trabajo pausado temporalmente por prioridad operativa.",
    "Se detiene ejecución hasta nueva instrucción.",
  ],
  "IN_PROGRESS->WAITING_PARTS": [
    "OT en espera por repuestos.",
    "Se requiere abastecimiento para continuar trabajo.",
  ],
  "IN_PROGRESS->WAITING_AUTH": [
    "OT en espera de autorización adicional del cliente.",
    "Pendiente confirmación para continuar con trabajos.",
  ],
  "IN_PROGRESS->QUALITY_CHECK": [
    "Trabajo completado, pasa a control de calidad.",
    "Se envía unidad para validación final.",
  ],
  "QUALITY_CHECK->READY": [
    "Control de calidad aprobado, unidad lista para entrega.",
    "Se finaliza validación y se habilita entrega.",
  ],
  "READY->DELIVERED": [
    "Unidad entregada al cliente.",
    "Entrega completada con conformidad del cliente.",
  ],
  "DELIVERED->INVOICED": [
    "OT facturada correctamente.",
    "Se emite documento fiscal de la orden.",
  ],
  "INVOICED->CLOSED": [
    "OT cerrada administrativamente.",
    "Proceso finalizado y orden cerrada.",
  ],
  "OPEN->CANCELLED": [
    "OT cancelada por solicitud del cliente.",
    "OT cancelada por decisión operativa.",
  ],
  "DIAGNOSING->CANCELLED": [
    "OT cancelada durante diagnóstico.",
    "Se cancela por falta de aprobación de continuidad.",
  ],
  "IN_PROGRESS->CANCELLED": [
    "OT cancelada durante ejecución.",
    "Trabajo cancelado por instrucción del cliente.",
  ],
};

const getStatusChangeNoteOptions = (
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
): string[] => {
  const key = `${from}->${to}`;
  return (
    STATUS_CHANGE_NOTE_TEMPLATES[key] ?? [
      `Cambio de estado: ${STATUS_LABELS[from] ?? from} -> ${
        STATUS_LABELS[to] ?? to
      }.`,
    ]
  );
};

interface StatusDialogProps {
  order: ServiceOrder | null;
  visible: boolean;
  forcedStatus?: ServiceOrderStatus | null;
  onHide: () => void;
  onSaved: (id: string, newStatus: ServiceOrderStatus) => void;
  toast: React.RefObject<Toast>;
}

function StatusDialog({
  order,
  visible,
  forcedStatus = null,
  onHide,
  onSaved,
  toast,
}: StatusDialogProps) {
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ServiceOrderStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [noteOptions, setNoteOptions] = useState<string[]>([]);

  const nexts = order ? NEXT_STATUSES[order.status] ?? [] : [];

  useEffect(() => {
    if (!visible) {
      setSelectedStatus(null);
      setNotes("");
      setNoteOptions([]);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !order || !forcedStatus) return;
    applyStatusSelection(forcedStatus);
  }, [visible, order, forcedStatus]);

  const applyStatusSelection = (status: ServiceOrderStatus) => {
    if (!order) return;
    setSelectedStatus(status);
    const options = getStatusChangeNoteOptions(order.status, status);
    setNoteOptions(options);
    setNotes(options[0] ?? "");
  };

  const handleSave = async () => {
    if (!order || !selectedStatus) return;
    if (!notes.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Nota requerida",
        detail: "Agrega una nota para registrar el cambio de estado.",
        life: 3000,
      });
      return;
    }
    setSaving(true);
    try {
      await serviceOrderService.updateStatus(order.id, {
        status: selectedStatus,
        comment: notes.trim(),
      } as UpdateServiceOrderStatusInput);
      onSaved(order.id, selectedStatus);
      onHide();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Cambiar estado"
      style={{ width: "380px" }}
      modal
      draggable={false}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button
            label="Cancelar"
            outlined
            severity="secondary"
            onClick={onHide}
            disabled={saving}
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            onClick={handleSave}
            loading={saving}
            disabled={!selectedStatus || !notes.trim()}
          />
        </div>
      }
    >
      {order && (
        <div className="flex flex-column gap-3">
          <div className="text-sm text-600">
            OT: <strong>{order.folio}</strong> — Estado actual:{" "}
            <strong>{STATUS_LABELS[order.status] ?? order.status}</strong>
          </div>
          <div className="flex flex-column gap-2">
            {nexts.map((s) => (
              <div
                key={s}
                className={`p-3 border-round cursor-pointer transition-colors transition-duration-150 ${
                  forcedStatus && forcedStatus !== s
                    ? "surface-100 border-200 opacity-60"
                    : selectedStatus === s
                    ? "bg-primary-100 border-primary-400"
                    : "surface-100 border-200"
                } border-1`}
                onClick={() => {
                  if (forcedStatus && forcedStatus !== s) return;
                  applyStatusSelection(s);
                }}
              >
                {STATUS_LABELS[s] ?? s}
              </div>
            ))}
            {nexts.length === 0 && (
              <div className="text-500 text-sm">
                No hay transiciones disponibles desde este estado.
              </div>
            )}
          </div>
          {selectedStatus && noteOptions.length > 0 && (
            <div className="flex flex-column gap-1">
              <label className="text-sm text-600">Plantilla sugerida</label>
              <Dropdown
                value={notes}
                options={noteOptions.map((n) => ({ label: n, value: n }))}
                onChange={(e) => setNotes(e.value ?? "")}
                placeholder="Selecciona una plantilla"
              />
            </div>
          )}
          <div className="flex flex-column gap-1">
            <label className="text-sm text-600">Notas (requerido)</label>
            <InputText
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo del cambio..."
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

interface ColumnConfig {
  id: string;
  label: string;
  color: string;
  icon: string;
  maxCapacity?: number;
}

interface ColumnProps {
  cfg: ColumnConfig;
  orders: ServiceOrder[];
  onAction: (
    action: "view" | "history" | "times" | "edit" | "status",
    order: ServiceOrder,
  ) => void;
}

function KanbanColumn({ cfg, orders, onAction }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: cfg.id });
  const pct = cfg.maxCapacity
    ? Math.min(100, Math.round((orders.length / cfg.maxCapacity) * 100))
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: "210px",
        maxWidth: "210px",
        display: "flex",
        flexDirection: "column",
        borderRadius: "8px",
        backgroundColor: isOver ? "var(--surface-100)" : "var(--surface-50)",
        border: "1px solid var(--surface-200)",
        transition: "background-color 0.15s",
        maxHeight: "calc(100vh - 220px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 12px 8px",
          borderBottom: "1px solid var(--surface-200)",
          borderTop: `3px solid ${cfg.color}`,
          borderRadius: "7px 7px 0 0",
          flexShrink: 0,
        }}
      >
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-2">
            <i className={`${cfg.icon} text-xs`} style={{ color: cfg.color }} />
            <span className="font-semibold text-xs text-900">{cfg.label}</span>
          </div>
          <span
            className="text-xs font-bold"
            style={{
              backgroundColor: cfg.color,
              color: "white",
              borderRadius: "10px",
              padding: "1px 7px",
            }}
          >
            {orders.length}
          </span>
        </div>
        {pct !== null && (
          <ProgressBar
            value={pct}
            style={{ height: "4px", marginTop: "6px" }}
            showValue={false}
            color={
              pct >= 90
                ? "var(--red-400)"
                : pct >= 70
                ? "var(--orange-400)"
                : undefined
            }
          />
        )}
      </div>

      {/* Cards */}
      <div
        style={{
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          overflowY: "auto",
          flex: 1,
        }}
      >
        {orders.map((o) => (
          <PlanningKanbanCard key={o.id} order={o} onAction={onAction} />
        ))}
        {orders.length === 0 && (
          <div
            className="text-xs text-400 text-center"
            style={{ padding: "20px 0" }}
          >
            Sin órdenes
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const VIEW_OPTIONS = [
  { label: "Por estado", value: "status" },
  { label: "Por bahía", value: "bay" },
];

export default function PlanningBoard() {
  const toast = useRef<Toast>(null);

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [view, setView] = useState("status");

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeOrder = orders.find((o) => o.id === activeId) ?? null;

  const [formVisible, setFormVisible] = useState(false);
  const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [statusDialogOrder, setStatusDialogOrder] =
    useState<ServiceOrder | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [statusDialogForcedStatus, setStatusDialogForcedStatus] =
    useState<ServiceOrderStatus | null>(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [detailOrder, setDetailOrder] = useState<ServiceOrder | null>(null);
  const [detailInitialTabIndex, setDetailInitialTabIndex] = useState<number>(0);

  const [bays, setBays] = useState<WorkshopBay[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 100 };
      if (search) params.search = search;
      const res = await serviceOrderService.getAll(params as any);
      setOrders(res.data ?? []);
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  // Load bays once on mount
  useEffect(() => {
    workshopBayService
      .getAll({ isActive: "true", limit: 100 })
      .then((res) => setBays(res.data ?? []))
      .catch(() => {
        /* bays failing shouldn't block the board */
      });
  }, []);

  // Apply priority filter client-side
  const visibleOrders = priorityFilter
    ? orders.filter((o) => o.priority === priorityFilter)
    : orders;

  // Group orders by status
  const ordersByStatus = BOARD_STATUSES.reduce((acc, s) => {
    acc[s.id] = visibleOrders.filter((o) => o.status === s.id);
    return acc;
  }, {} as Record<string, ServiceOrder[]>);

  // Group orders by bay
  const BAY_COLOR = "#64748b";
  const BAY_ICON = "pi pi-car";
  const bayColumns: ColumnConfig[] = [
    ...bays.map((b) => ({
      id: b.id,
      label: b.name,
      color: BAY_COLOR,
      icon: BAY_ICON,
    })),
    {
      id: "UNASSIGNED",
      label: "Sin asignar",
      color: "#94a3b8",
      icon: "pi pi-inbox",
    },
  ];
  const ordersByBay = bayColumns.reduce((acc, col) => {
    acc[col.id] = visibleOrders.filter((o) =>
      col.id === "UNASSIGNED" ? !o.bayId : o.bayId === col.id,
    );
    return acc;
  }, {} as Record<string, ServiceOrder[]>);

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const order = orders.find((o) => o.id === active.id);
    if (!order) return;

    if (view === "bay") {
      const newBayId = over.id === "UNASSIGNED" ? null : (over.id as string);
      if (order.bayId === newBayId) return;
      const prev = [...orders];
      setOrders((curr) =>
        curr.map((o) => (o.id === order.id ? { ...o, bayId: newBayId } : o)),
      );
      try {
        await serviceOrderService.update(order.id, { bayId: newBayId });
        toast.current?.show({
          severity: "success",
          summary: "Bahía actualizada",
          detail: `OT ${order.folio} → ${
            newBayId ? "bahía asignada" : "sin asignar"
          }`,
          life: 2500,
        });
      } catch (err) {
        setOrders(prev);
        handleFormError(err, toast);
      }
    } else {
      const newStatus = over.id as ServiceOrderStatus;
      if (order.status === newStatus) return;
      setStatusDialogOrder(order);
      setStatusDialogForcedStatus(newStatus);
      setStatusDialogVisible(true);
    }
  };

  const handleAction = (
    action: "view" | "history" | "times" | "edit" | "status",
    order: ServiceOrder,
  ) => {
    if (action === "view") {
      setDetailInitialTabIndex(0);
      setDetailOrder(order);
      setDetailDialogVisible(true);
    } else if (action === "history") {
      setDetailInitialTabIndex(10);
      setDetailOrder(order);
      setDetailDialogVisible(true);
    } else if (action === "times") {
      setDetailInitialTabIndex(4);
      setDetailOrder(order);
      setDetailDialogVisible(true);
    } else if (action === "edit") {
      setEditOrder(order);
      setFormVisible(true);
    } else {
      setStatusDialogOrder(order);
      setStatusDialogForcedStatus(null);
      setStatusDialogVisible(true);
    }
  };

  const handleStatusSaved = (id: string, newStatus: ServiceOrderStatus) => {
    setOrders((curr) =>
      curr.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
    );
  };

  return (
    <>
      <Toast ref={toast} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="mb-1 text-900 flex align-items-center gap-2">
              <i className="pi pi-th-large text-primary" />
              Tablero de Planeación
            </h4>
            <span className="text-500 text-sm">
              {orders.length} órdenes activas
            </span>
          </div>
          <div className="flex align-items-center gap-2">
            <SelectButton
              value={view}
              onChange={(e) => setView(e.value ?? "status")}
              options={VIEW_OPTIONS}
              optionLabel="label"
              optionValue="value"
            />
            <Button
              label="Nueva OT"
              icon="pi pi-plus"
              onClick={() => {
                setEditOrder(null);
                setFormVisible(true);
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap align-items-center gap-2 mb-3">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar folio, placa, cliente..."
              style={{ width: "240px" }}
            />
          </span>
          <Dropdown
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.value)}
            options={PRIORITY_OPTIONS}
            optionLabel="label"
            optionValue="value"
            placeholder="Prioridad"
            style={{ minWidth: "160px" }}
          />
          {loading && (
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: "1.1rem", color: "var(--primary-color)" }}
            />
          )}
        </div>

        {/* Board */}
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "16px",
            }}
          >
            {view === "status"
              ? BOARD_STATUSES.map((cfg) => (
                  <KanbanColumn
                    key={cfg.id}
                    cfg={cfg}
                    orders={ordersByStatus[cfg.id] ?? []}
                    onAction={handleAction}
                  />
                ))
              : bayColumns.map((cfg) => (
                  <KanbanColumn
                    key={cfg.id}
                    cfg={cfg}
                    orders={ordersByBay[cfg.id] ?? []}
                    onAction={handleAction}
                  />
                ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeOrder ? (
              <PlanningKanbanCard
                order={activeOrder}
                onAction={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </motion.div>

      {/* OT Form Dialog */}
      <Dialog
        visible={formVisible}
        style={{ width: "85vw" }}
        breakpoints={{ "1200px": "90vw", "900px": "95vw", "600px": "100vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-file-edit mr-3 text-primary text-3xl" />
                {editOrder
                  ? `Editar ${editOrder.folio}`
                  : "Nueva Orden de Trabajo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => {
          setFormVisible(false);
          setEditOrder(null);
        }}
        footer={
          <FormActionButtons
            formId="planning-so-form"
            isUpdate={!!editOrder?.id}
            onCancel={() => {
              setFormVisible(false);
              setEditOrder(null);
            }}
            isSubmitting={formSubmitting}
          />
        }
      >
        <ServiceOrderForm
          order={editOrder}
          formId="planning-so-form"
          onSave={() => {
            setFormVisible(false);
            load();
          }}
          onSubmittingChange={setFormSubmitting}
          toast={toast}
        />
      </Dialog>

      <Dialog
        visible={detailDialogVisible}
        onHide={() => {
          setDetailDialogVisible(false);
          setDetailOrder(null);
        }}
        maximizable
        modal
        draggable={false}
        style={{ width: "95vw" }}
        breakpoints={{ "960px": "98vw" }}
        contentStyle={{ padding: 0 }}
        header={
          detailOrder ? (
            <div className="flex align-items-center gap-2 flex-wrap">
              <i className="pi pi-wrench text-primary" />
              <span className="font-semibold">{detailOrder.folio}</span>
              <span className="text-600 text-sm">·</span>
              <span className="text-sm text-600">
                {detailOrder.vehiclePlate}
                {detailOrder.vehicleDesc ? ` — ${detailOrder.vehicleDesc}` : ""}
              </span>
            </div>
          ) : (
            <span>Orden de Servicio</span>
          )
        }
      >
        {detailOrder && (
          <ServiceOrderDetail
            serviceOrderId={detailOrder.id}
            initialTabIndex={detailInitialTabIndex}
            embedded
            onClose={() => {
              setDetailDialogVisible(false);
              setDetailOrder(null);
              load();
            }}
          />
        )}
      </Dialog>

      {/* Status Dialog */}
      <StatusDialog
        order={statusDialogOrder}
        visible={statusDialogVisible}
        forcedStatus={statusDialogForcedStatus}
        onHide={() => {
          setStatusDialogVisible(false);
          setStatusDialogForcedStatus(null);
        }}
        onSaved={handleStatusSaved}
        toast={toast}
      />

      <ConfirmDialog />
    </>
  );
}
