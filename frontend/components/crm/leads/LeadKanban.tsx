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

import leadService from "@/app/api/crm/leadService";
import {
  Lead,
  LEAD_STATUS_CONFIG,
  LEAD_CHANNEL_CONFIG,
  LEAD_PIPELINE_ORDER,
  LeadStatus,
  getStageLabel,
} from "@/libs/interfaces/crm/lead.interface";
import LeadForm from "./LeadForm";
import LeadStatusDialog from "./LeadStatusDialog";

// ── Kanban Column ─────────────────────────────────────────────────────────────

interface ColumnProps {
  status: LeadStatus;
  leads: Lead[];
  channel: string;
  onAction: (action: "edit" | "status", lead: Lead) => void;
}

function KanbanColumn({ status, leads, channel, onAction }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cfg = LEAD_STATUS_CONFIG[status];
  const label = getStageLabel(status, channel || null);
  const totalValue = leads.reduce((acc, l) => acc + Number(l.estimatedValue ?? 0), 0);

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
          borderTop: `3px solid ${cfg.color}`,
          borderRadius: "7px 7px 0 0",
          flexShrink: 0,
        }}
      >
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-2">
            <i className={`${cfg.icon} text-sm`} style={{ color: cfg.color }} />
            <span className="font-semibold text-sm text-900">{label}</span>
          </div>
          <span
            className="text-xs font-bold"
            style={{
              backgroundColor: cfg.color,
              color: "white",
              borderRadius: "10px",
              padding: "1px 8px",
            }}
          >
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <div className="text-xs text-500 mt-1">
            {leads[0]?.currency ?? "USD"}{" "}
            {totalValue.toLocaleString("es-VE", { minimumFractionDigits: 0 })}
          </div>
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
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onAction={onAction} />
        ))}
        {leads.length === 0 && (
          <div
            className="text-xs text-400 text-center"
            style={{ padding: "20px 0" }}
          >
            Sin leads
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

interface CardProps {
  lead: Lead;
  onAction: (action: "edit" | "status", lead: Lead) => void;
  isOverlay?: boolean;
}

function KanbanCard({ lead, onAction, isOverlay = false }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id, data: { lead }, disabled: isOverlay });

  const channelCfg =
    LEAD_CHANNEL_CONFIG[lead.channel as keyof typeof LEAD_CHANNEL_CONFIG];
  const daysOld = Math.floor(
    (Date.now() - new Date(lead.createdAt).getTime()) / 86_400_000
  );

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : { ...listeners, ...attributes })}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.35 : 1,
        cursor: isOverlay ? "grabbing" : "grab",
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--surface-200)",
        borderRadius: "6px",
        padding: "10px",
        boxShadow: isOverlay
          ? "0 8px 28px rgba(0,0,0,0.22)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Title */}
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
        {lead.title}
      </div>

      {/* Customer */}
      {lead.customer && (
        <div className="flex align-items-center gap-1 mb-2">
          <i className="pi pi-user text-xs text-400" />
          <span
            className="text-xs text-600"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lead.customer.name}
          </span>
        </div>
      )}

      {/* Channel + value */}
      <div className="flex align-items-center justify-content-between gap-1">
        {channelCfg ? (
          <Tag
            value={channelCfg.label}
            severity={channelCfg.severity}
            style={{ fontSize: "10px", padding: "1px 6px" }}
          />
        ) : (
          <span />
        )}
        {lead.estimatedValue != null && (
          <span className="text-xs font-semibold text-700">
            {lead.currency}{" "}
            {Number(lead.estimatedValue).toLocaleString("es-VE", {
              minimumFractionDigits: 0,
            })}
          </span>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex align-items-center justify-content-between mt-2"
        style={{
          borderTop: "1px solid var(--surface-100)",
          paddingTop: "6px",
        }}
      >
        <span className="text-xs text-400">
          {daysOld === 0 ? "Hoy" : `${daysOld}d`}
        </span>
        {/* Stop propagation so button clicks don't trigger drag */}
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
            onClick={() => onAction("edit", lead)}
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
            onClick={() => onAction("status", lead)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const channelOptions = [
  { label: "Todos los canales", value: "" },
  { label: "Repuestos", value: "REPUESTOS" },
  { label: "Taller", value: "TALLER" },
  { label: "Vehículos", value: "VEHICULOS" },
];

export default function LeadKanban() {
  const toast = useRef<Toast>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterChannel, setFilterChannel] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeLead = leads.find((l) => l.id === activeId) ?? null;

  const [formVisible, setFormVisible] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [statusDialogLead, setStatusDialogLead] = useState<Lead | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

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
      const res = await leadService.getAll({
        limit: 500,
        search: search || undefined,
        channel: filterChannel || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const raw = (res as any)?.data ?? res;
      setLeads(raw.data ?? raw);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar leads" });
    } finally {
      setLoading(false);
    }
  }, [search, filterChannel]);

  useEffect(() => {
    load();
  }, [load]);

  // Group leads by status
  const leadsByStatus = LEAD_PIPELINE_ORDER.reduce<Record<string, Lead[]>>(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status);
      return acc;
    },
    {}
  );

  // ── DnD handlers ──────────────────────────────────────────────────────────

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const lead = leads.find((l) => l.id === active.id);
    const newStatus = over.id as string;
    if (!lead || lead.status === newStatus) return;

    // LOST requires lostReason → open dialog
    if (newStatus === LeadStatus.LOST) {
      setStatusDialogLead(lead);
      setStatusDialogVisible(true);
      return;
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
    );

    try {
      await leadService.updateStatus(lead.id, { status: newStatus });
    } catch {
      // Revert
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l))
      );
      toast.current?.show({
        severity: "error",
        summary: "Error al cambiar estado",
      });
    }
  };

  const handleAction = (action: "edit" | "status", lead: Lead) => {
    if (action === "edit") {
      setEditLead(lead);
      setFormVisible(true);
    } else {
      setStatusDialogLead(lead);
      setStatusDialogVisible(true);
    }
  };

  const formFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        outlined
        severity="secondary"
        onClick={() => setFormVisible(false)}
        disabled={formSubmitting}
      />
      <Button
        label={editLead ? "Guardar" : "Crear Lead"}
        icon="pi pi-check"
        form="lead-form"
        type="submit"
        loading={formSubmitting}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="mb-1 text-900">Pipeline de Leads</h4>
            <span className="text-500 text-sm">{leads.length} leads en total</span>
          </div>
          <Button
            label="Nuevo Lead"
            icon="pi pi-plus"
            onClick={() => {
              setEditLead(null);
              setFormVisible(true);
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap align-items-center gap-2 mb-3">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar lead..."
              style={{ width: "220px" }}
            />
          </span>
          <Dropdown
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.value)}
            options={channelOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "180px" }}
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
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "16px",
            }}
          >
            {LEAD_PIPELINE_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={leadsByStatus[status] ?? []}
                channel={filterChannel}
                onAction={handleAction}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeLead ? (
              <KanbanCard lead={activeLead} onAction={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </motion.div>

      {/* Lead Form */}
      <Dialog
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        header={editLead ? "Editar Lead" : "Nuevo Lead"}
        style={{ width: "640px" }}
        footer={formFooter}
        modal
        draggable={false}
      >
        <LeadForm
          lead={editLead}
          formId="lead-form"
          onSave={() => {
            setFormVisible(false);
            load();
          }}
          onCreated={() => load()}
          onSubmittingChange={setFormSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Status Dialog */}
      <LeadStatusDialog
        lead={statusDialogLead}
        visible={statusDialogVisible}
        onHide={() => setStatusDialogVisible(false)}
        onSaved={load}
        toast={toast}
      />
    </>
  );
}
