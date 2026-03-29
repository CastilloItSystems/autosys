"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { motion } from "framer-motion";

import caseService from "@/app/api/crm/caseService";
import {
  Case,
  CASE_STATUS_CONFIG,
  CASE_PRIORITY_CONFIG,
} from "@/libs/interfaces/crm/case.interface";
import CaseForm from "./CaseForm";
import CaseStatusDialog from "./CaseStatusDialog";
import CaseDetailDialog from "./CaseDetailDialog";

// Active columns shown in the Kanban (CLOSED and REJECTED are terminal → list view)
const KANBAN_STATUSES = [
  "OPEN",
  "IN_ANALYSIS",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "ESCALATED",
  "RESOLVED",
] as const;

type KanbanStatus = (typeof KANBAN_STATUSES)[number];

// Colors for each status column top border
const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3B82F6",
  IN_ANALYSIS: "#6366F1",
  IN_PROGRESS: "#F97316",
  WAITING_CLIENT: "#EAB308",
  ESCALATED: "#EF4444",
  RESOLVED: "#22C55E",
};

// Statuses that require extra info when transitioning (open dialog instead of direct update)
const DIALOG_REQUIRED = ["RESOLVED", "CLOSED", "REJECTED"];

// ── Column ────────────────────────────────────────────────────────────────────

interface ColumnProps {
  status: KanbanStatus;
  cases: Case[];
  onAction: (action: "edit" | "status" | "detail", c: Case) => void;
}

function KanbanColumn({ status, cases, onAction }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cfg = CASE_STATUS_CONFIG[status];
  const color = STATUS_COLORS[status] ?? "#94A3B8";

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: "230px",
        maxWidth: "230px",
        display: "flex",
        flexDirection: "column",
        borderRadius: "8px",
        backgroundColor: isOver ? "var(--surface-100)" : "var(--surface-50)",
        border: "1px solid var(--surface-200)",
        transition: "background-color 0.15s",
        maxHeight: "calc(100vh - 240px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 12px 8px",
          borderBottom: "1px solid var(--surface-200)",
          borderTop: `3px solid ${color}`,
          borderRadius: "7px 7px 0 0",
          flexShrink: 0,
        }}
      >
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-2">
            <i className={`${cfg?.icon ?? "pi pi-circle"} text-sm`} style={{ color }} />
            <span className="font-semibold text-sm text-900">{cfg?.label ?? status}</span>
          </div>
          <span
            className="text-xs font-bold"
            style={{
              backgroundColor: color,
              color: "white",
              borderRadius: "10px",
              padding: "1px 8px",
            }}
          >
            {cases.length}
          </span>
        </div>
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
        {cases.map((c) => (
          <KanbanCard key={c.id} caseRecord={c} onAction={onAction} />
        ))}
        {cases.length === 0 && (
          <div className="text-xs text-400 text-center" style={{ padding: "20px 0" }}>
            Sin casos
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  caseRecord: Case;
  onAction: (action: "edit" | "status" | "detail", c: Case) => void;
  isOverlay?: boolean;
}

function KanbanCard({ caseRecord: c, onAction, isOverlay = false }: CardProps) {
  const isTerminal = ["CLOSED", "REJECTED"].includes(c.status as string);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: c.id,
    data: { caseRecord: c },
    disabled: isOverlay || isTerminal,
  });

  const priorityCfg = CASE_PRIORITY_CONFIG[c.priority];
  const daysOld = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86_400_000);

  const isOverdue =
    c.slaDeadline &&
    new Date(c.slaDeadline) < new Date() &&
    !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status as string);

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay || isTerminal ? {} : { ...listeners, ...attributes })}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.35 : 1,
        cursor: isOverlay ? "grabbing" : isTerminal ? "default" : "grab",
        backgroundColor: "var(--surface-card)",
        border: `1px solid ${isOverdue ? "#FCA5A5" : "var(--surface-200)"}`,
        borderRadius: "6px",
        padding: "10px",
        boxShadow: isOverlay
          ? "0 8px 28px rgba(0,0,0,0.22)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Case number + title */}
      <div className="flex align-items-start justify-content-between gap-1 mb-1">
        <span className="text-xs text-500 font-mono">{c.caseNumber}</span>
        {priorityCfg && (
          <Tag
            value={priorityCfg.label}
            severity={priorityCfg.severity}
            style={{ fontSize: "9px", padding: "1px 5px" }}
          />
        )}
      </div>

      <div
        className="font-semibold text-sm text-900 mb-1"
        style={{
          lineHeight: "1.3",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {c.title}
      </div>

      {/* Customer */}
      {c.customer && (
        <div className="flex align-items-center gap-1 mb-2">
          <i className="pi pi-user text-xs text-400" />
          <span
            className="text-xs text-600"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {c.customer.name}
          </span>
        </div>
      )}

      {/* SLA */}
      {c.slaDeadline && (
        <div
          className="flex align-items-center gap-1 mb-1"
          style={{ color: isOverdue ? "#EF4444" : "var(--text-color-secondary)" }}
        >
          {isOverdue && <i className="pi pi-exclamation-triangle text-xs" />}
          <span className="text-xs">
            SLA: {new Date(c.slaDeadline).toLocaleDateString("es-VE")}
          </span>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex align-items-center justify-content-between mt-2"
        style={{ borderTop: "1px solid var(--surface-100)", paddingTop: "6px" }}
      >
        <span className="text-xs text-400">{daysOld === 0 ? "Hoy" : `${daysOld}d`}</span>
        <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
          <Button
            icon="pi pi-eye"
            text rounded size="small"
            style={{ width: "22px", height: "22px" }}
            tooltip="Ver detalle"
            tooltipOptions={{ position: "top" }}
            onClick={() => onAction("detail", c)}
          />
          <Button
            icon="pi pi-exchange"
            text rounded severity="info" size="small"
            style={{ width: "22px", height: "22px" }}
            tooltip="Cambiar estado"
            tooltipOptions={{ position: "top" }}
            disabled={isTerminal}
            onClick={() => onAction("status", c)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const priorityOptions = [
  { label: "Todas las prioridades", value: "" },
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
  { label: "Crítica", value: "CRITICAL" },
];

export default function CaseKanban() {
  const toast = useRef<Toast>(null);

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeCase = cases.find((c) => c.id === activeId) ?? null;

  const [formVisible, setFormVisible] = useState(false);
  const [editCase, setEditCase] = useState<Case | null>(null);

  const [statusDialogCase, setStatusDialogCase] = useState<Case | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await caseService.getAll({
        limit: 500,
        search: search || undefined,
        priority: filterPriority || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const raw = (res as any)?.data ?? res;
      // Only show active cases in kanban
      const all: Case[] = raw.data ?? raw;
      setCases(all.filter((c) => !["CLOSED", "REJECTED"].includes(c.status as string)));
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar casos" });
    } finally {
      setLoading(false);
    }
  }, [search, filterPriority]);

  useEffect(() => { load(); }, [load]);

  // Group by status
  const casesByStatus = KANBAN_STATUSES.reduce<Record<string, Case[]>>((acc, status) => {
    acc[status] = cases.filter((c) => c.status === status);
    return acc;
  }, {});

  // ── DnD ───────────────────────────────────────────────────────────────────

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(active.id as string);

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const c = cases.find((x) => x.id === active.id);
    const newStatus = over.id as string;
    if (!c || c.status === newStatus) return;

    // Transitions to RESOLVED/CLOSED/REJECTED need resolution → open dialog
    if (DIALOG_REQUIRED.includes(newStatus)) {
      setStatusDialogCase(c);
      setStatusDialogVisible(true);
      return;
    }

    // Optimistic update
    setCases((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: newStatus } : x)));

    try {
      await caseService.updateStatus(c.id, { status: newStatus });
    } catch {
      setCases((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: c.status } : x)));
      toast.current?.show({ severity: "error", summary: "Error al cambiar estado" });
    }
  };

  const handleAction = (action: "edit" | "status" | "detail", c: Case) => {
    if (action === "edit") { setEditCase(c); setFormVisible(true); }
    else if (action === "status") { setStatusDialogCase(c); setStatusDialogVisible(true); }
    else { setDetailCaseId(c.id); setDetailVisible(true); }
  };

  const formFooter = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" outlined severity="secondary" onClick={() => setFormVisible(false)} />
      <Button label={editCase ? "Guardar" : "Crear Caso"} icon="pi pi-check" form="case-form" type="submit" />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="mb-1 text-900">Casos / PQRS</h4>
            <span className="text-500 text-sm">{cases.length} casos activos</span>
          </div>
          <Button label="Nuevo Caso" icon="pi pi-plus" onClick={() => { setEditCase(null); setFormVisible(true); }} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap align-items-center gap-2 mb-3">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar caso..."
              style={{ width: "220px" }}
            />
          </span>
          <Dropdown
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.value)}
            options={priorityOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "180px" }}
          />
          {loading && (
            <i className="pi pi-spin pi-spinner" style={{ fontSize: "1.1rem", color: "var(--primary-color)" }} />
          )}
        </div>

        {/* Board */}
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "16px" }}>
            {KANBAN_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                cases={casesByStatus[status] ?? []}
                onAction={handleAction}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeCase ? (
              <KanbanCard caseRecord={activeCase} onAction={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </motion.div>

      {/* Case Form */}
      <CaseForm
        case={editCase}
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        onSaved={() => { setFormVisible(false); load(); }}
        toast={toast}
      />

      {/* Status Dialog */}
      <CaseStatusDialog
        caseRecord={statusDialogCase}
        visible={statusDialogVisible}
        onHide={() => setStatusDialogVisible(false)}
        onSaved={load}
        toast={toast}
      />

      {/* Detail Dialog */}
      <CaseDetailDialog
        caseId={detailCaseId}
        visible={detailVisible}
        onHide={() => setDetailVisible(false)}
        onUpdated={load}
        toast={toast}
      />
    </>
  );
}
