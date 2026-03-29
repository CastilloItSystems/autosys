"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";

import leadService from "@/app/api/crm/leadService";
import {
  Lead,
  LEAD_STATUS_CONFIG,
  LEAD_CHANNEL_CONFIG,
  LEAD_SOURCE_CONFIG,
  getStageLabel,
} from "@/libs/interfaces/crm/lead.interface";
import LeadForm from "./LeadForm";
import LeadStatusDialog from "./LeadStatusDialog";

const channelOptions = [
  { label: "Todos los canales", value: "" },
  { label: "Repuestos", value: "REPUESTOS" },
  { label: "Taller", value: "TALLER" },
  { label: "Vehículos", value: "VEHICULOS" },
];

const statusOptions = [
  { label: "Todos los estados", value: "" },
  ...Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => ({
    label: cfg.label,
    value,
  })),
];

export default function LeadList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const selectedRef = useRef<Lead | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [statusDialogLead, setStatusDialogLead] = useState<Lead | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

  const limit = 20;

  // ── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadService.getAll({
        page,
        limit,
        search: search || undefined,
        channel: filterChannel || undefined,
        status: filterStatus || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const raw = (res as any)?.data ?? res;
      setLeads(raw.data ?? raw);
      setTotal(raw.meta?.total ?? raw.length ?? 0);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar leads" });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterChannel, filterStatus]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filterChannel, filterStatus]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditLead(null);
    setFormVisible(true);
  };

  const openEdit = (lead: Lead) => {
    setEditLead(lead);
    setFormVisible(true);
  };

  const openStatusDialog = (lead: Lead) => {
    setStatusDialogLead(lead);
    setStatusDialogVisible(true);
  };

  const handleDelete = (lead: Lead) => {
    confirmDialog({
      message: `¿Eliminar el lead "${lead.title}"? Solo se pueden eliminar leads en estado Nuevo o Perdido.`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await leadService.delete(lead.id);
          toast.current?.show({ severity: "success", summary: "Lead eliminado" });
          load();
        } catch (e: any) {
          toast.current?.show({
            severity: "error",
            summary: e?.response?.data?.message ?? "Error al eliminar",
          });
        }
      },
    });
  };

  const menuItems = (lead: Lead): MenuItem[] => [
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => openEdit(lead),
    },
    {
      label: "Cambiar Estado",
      icon: "pi pi-exchange",
      command: () => openStatusDialog(lead),
    },
    { separator: true },
    {
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger",
      command: () => handleDelete(lead),
      disabled: !["NEW", "LOST"].includes(lead.status as string),
    },
  ];

  // ── Column templates ───────────────────────────────────────────────────────
  const titleBody = (lead: Lead) => (
    <div>
      <div className="font-semibold text-sm">{lead.title}</div>
      {lead.customer && (
        <div className="text-xs text-500">{lead.customer.name}</div>
      )}
    </div>
  );

  const channelBody = (lead: Lead) => {
    const cfg = LEAD_CHANNEL_CONFIG[lead.channel as keyof typeof LEAD_CHANNEL_CONFIG];
    return cfg ? <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" /> : null;
  };

  const statusBody = (lead: Lead) => {
    const cfg = LEAD_STATUS_CONFIG[lead.status as keyof typeof LEAD_STATUS_CONFIG];
    const label = getStageLabel(lead.status, lead.channel);
    return cfg ? <Tag value={label} severity={cfg.severity} className="text-xs" /> : null;
  };

  const sourceBody = (lead: Lead) => {
    const cfg = LEAD_SOURCE_CONFIG[lead.source as keyof typeof LEAD_SOURCE_CONFIG];
    return <span className="text-sm text-600">{cfg?.label ?? lead.source}</span>;
  };

  const valueBody = (lead: Lead) =>
    lead.estimatedValue != null ? (
      <span className="font-semibold text-sm">
        {lead.currency} {Number(lead.estimatedValue).toFixed(2)}
      </span>
    ) : (
      <span className="text-400">—</span>
    );

  const dateBody = (lead: Lead) =>
    new Date(lead.createdAt).toLocaleDateString("es-VE");

  const actionsBody = (lead: Lead) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-exchange"
        rounded text severity="info" size="small"
        tooltip="Cambiar Estado"
        tooltipOptions={{ position: "top" }}
        onClick={() => openStatusDialog(lead)}
      />
      <Button
        icon="pi pi-ellipsis-v"
        rounded text severity="secondary" size="small"
        onClick={(e) => {
          selectedRef.current = lead;
          menuRef.current?.toggle(e);
        }}
      />
    </div>
  );

  // ── Form dialog ───────────────────────────────────────────────────────────
  const formFooter = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" outlined severity="secondary" onClick={() => setFormVisible(false)} disabled={formSubmitting} />
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
      <Menu
        ref={menuRef}
        popup
        model={selectedRef.current ? menuItems(selectedRef.current) : []}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="mb-1 text-900">Leads / Oportunidades</h4>
            <span className="text-500 text-sm">{total} registros</span>
          </div>
          <Button label="Nuevo Lead" icon="pi pi-plus" onClick={openNew} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
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
          <Dropdown
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.value)}
            options={statusOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "180px" }}
          />
        </div>

        {/* Table */}
        <DataTable
          value={leads}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
          emptyMessage="No hay leads registrados"
          size="small"
          stripedRows
        >
          <Column header="Lead" body={titleBody} style={{ minWidth: "200px" }} />
          <Column header="Canal" body={channelBody} style={{ width: "120px" }} />
          <Column header="Fuente" body={sourceBody} style={{ width: "140px" }} />
          <Column header="Estado" body={statusBody} style={{ width: "130px" }} />
          <Column header="Valor" body={valueBody} style={{ width: "130px" }} />
          <Column header="Fecha" body={dateBody} style={{ width: "110px" }} />
          <Column header="" body={actionsBody} style={{ width: "90px" }} />
        </DataTable>
      </motion.div>

      {/* Lead Form Dialog */}
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
          onSave={() => { setFormVisible(false); load(); }}
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
