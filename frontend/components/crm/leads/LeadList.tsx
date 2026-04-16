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
import { ConfirmDialog } from "primereact/confirmdialog";
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
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

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

  const [actionLead, setActionLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [statusDialogLead, setStatusDialogLead] = useState<Lead | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadService.getAll({
        page: page + 1,
        limit: rows,
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
  }, [page, rows, search, filterChannel, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [search, filterChannel, filterStatus]);

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

  const confirmDeleteLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedLead) return;

    setIsDeleting(true);
    try {
      await leadService.delete(selectedLead.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Lead eliminado correctamente",
        life: 3000,
      });
      setDeleteDialog(false);
      setSelectedLead(null);
      await load();
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: error?.response?.data?.message ?? "Error al eliminar",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: editLead ? "Lead actualizado correctamente" : "Lead creado correctamente",
      life: 3000,
    });
    setFormVisible(false);
    setEditLead(null);
    await load();
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
    {
      label: "Convertir a Oportunidad",
      icon: "pi pi-sitemap",
      command: async () => {
        try {
          const next = new Date();
          next.setDate(next.getDate() + 1);
          await leadService.convertToOpportunity(lead.id, {
            nextActivityAt: next.toISOString(),
            stageCode: "DISCOVERY",
            notes: "Conversión rápida desde listado de leads",
          });
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Lead convertido a oportunidad",
            life: 3000,
          });
          load();
        } catch (e: any) {
          toast.current?.show({
            severity: "error",
            summary: e?.response?.data?.message ?? "No se pudo convertir el lead",
          });
        }
      },
      disabled: !["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION"].includes(lead.status as string),
    },
    { separator: true },
    {
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger",
      command: () => confirmDeleteLead(lead),
      disabled: !["NEW", "LOST"].includes(lead.status as string),
    },
  ];

  const titleBody = (lead: Lead) => (
    <div>
      <div className="font-semibold text-sm">{lead.title}</div>
      {lead.customer && <div className="text-xs text-500">{lead.customer.name}</div>}
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

  const dateBody = (lead: Lead) => new Date(lead.createdAt).toLocaleDateString("es-VE");

  const actionBodyTemplate = (rowData: Lead) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionLead(rowData);
        menuRef.current?.toggle(e);
      }}
      aria-controls="lead-menu"
      aria-haspopup
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <Menu model={menuItems(actionLead as Lead)} popup ref={menuRef} id="lead-menu" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="mb-1 text-900">Leads / Oportunidades</h4>
            <span className="text-500 text-sm">{total} registros</span>
          </div>
          <CreateButton label="Nuevo Lead" onClick={openNew} />
        </div>

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

        <DataTable
          value={leads}
          loading={loading}
          lazy
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={total}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={(e: DataTableStateEvent) => {
            setPage(e.page ?? 0);
            setRows(e.rows ?? 20);
          }}
          dataKey="id"
          emptyMessage="No se encontraron leads"
          sortMode="multiple"
          scrollable
          tableStyle={{ minWidth: "70rem" }}
        >
          <Column header="Lead" body={titleBody} style={{ minWidth: "200px" }} />
          <Column header="Canal" body={channelBody} style={{ width: "120px" }} />
          <Column header="Fuente" body={sourceBody} style={{ width: "140px" }} />
          <Column header="Estado" body={statusBody} style={{ width: "130px" }} />
          <Column header="Valor" body={valueBody} style={{ width: "130px" }} />
          <Column header="Fecha" body={dateBody} style={{ width: "110px" }} />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen={true}
            alignFrozen="right"
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </motion.div>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelectedLead(null);
        }}
        onConfirm={handleDelete}
        itemName={selectedLead?.title || "lead"}
        isDeleting={isDeleting}
      />

      <Dialog
        visible={formVisible}
        onHide={() => {
          setFormVisible(false);
          setEditLead(null);
        }}
        modal
        maximizable
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-chart-line mr-3 text-primary text-3xl"></i>
                {editLead ? "Editar Lead" : "Nuevo Lead"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="lead-form"
            isUpdate={!!editLead?.id}
            onCancel={() => {
              setFormVisible(false);
              setEditLead(null);
            }}
            isSubmitting={formSubmitting}
          />
        }
      >
        <LeadForm
          lead={editLead}
          formId="lead-form"
          onSave={handleSave}
          onCreated={() => load()}
          onSubmittingChange={setFormSubmitting}
          toast={toast}
        />
      </Dialog>

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
