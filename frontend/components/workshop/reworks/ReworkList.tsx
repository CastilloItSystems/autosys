"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { motion } from "framer-motion";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { reworkService } from "@/app/api/workshop";
import type { WorkshopRework, ReworkStatus } from "@/libs/interfaces/workshop";
import {
  ReworkStatusBadge,
  REWORK_STATUS_OPTIONS,
  REWORK_STATUS_TRANSITIONS,
  REWORK_STATUS_LABELS,
} from "@/components/workshop/shared/ReworkStatusBadge";
import ReworkForm from "./ReworkForm";

export default function ReworkList() {
  const [items, setItems] = useState<WorkshopRework[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<WorkshopRework | null>(null);
  const [actionItem, setActionItem] = useState<WorkshopRework | null>(null);

  const [statusFilter, setStatusFilter] = useState<ReworkStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => {
    loadItems();
  }, [page, rows, statusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await reworkService.getAll({
        page: page + 1,
        limit: rows,
        status: (statusFilter as ReworkStatus) || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setSelected(null);
    setFormDialog(true);
  };

  const editItem = (item: WorkshopRework) => {
    setSelected({ ...item });
    setFormDialog(true);
  };

  const handleSave = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: selected?.id ? "Retrabajo actualizado" : "Retrabajo registrado",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  const handleDelete = (item: WorkshopRework) => {
    confirmDialog({
      message: `¿Eliminar este retrabajo?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await reworkService.delete(item.id);
          toast.current?.show({ severity: "success", summary: "Eliminado", detail: "Retrabajo eliminado", life: 3000 });
          await loadItems();
        } catch (error) {
          handleFormError(error, toast);
        }
      },
    });
  };

  const handleStatusChange = async (item: WorkshopRework, newStatus: ReworkStatus) => {
    try {
      await reworkService.updateStatus(item.id, newStatus);
      toast.current?.show({
        severity: "success",
        summary: "Estado actualizado",
        detail: `Retrabajo marcado como ${REWORK_STATUS_LABELS[newStatus]}`,
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  // ── Column templates ────────────────────────────────────────────────────

  const motiveTemplate = (row: WorkshopRework) => (
    <span title={row.motive}>
      {row.motive.length > 50 ? row.motive.slice(0, 50) + "..." : row.motive}
    </span>
  );

  const originalOrderTemplate = (row: WorkshopRework) =>
    row.originalOrder ? (
      <span className="font-semibold text-primary">{row.originalOrder.folio}</span>
    ) : (
      <span className="text-500">—</span>
    );

  const statusTemplate = (row: WorkshopRework) => <ReworkStatusBadge status={row.status} />;

  const technicianTemplate = (row: WorkshopRework) =>
    row.technicianId ? (
      <span className="font-mono text-sm">{row.technicianId.slice(0, 12) + "..."}</span>
    ) : (
      <span className="text-500">—</span>
    );

  const createdAtTemplate = (row: WorkshopRework) =>
    new Date(row.createdAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const actionBodyTemplate = (rowData: WorkshopRework) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-haspopup
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const buildMenuItems = (item: WorkshopRework | null) => {
    if (!item) return [];
    const nextStatuses = REWORK_STATUS_TRANSITIONS[item.status] ?? [];
    const statusItems = nextStatuses.map((s) => ({
      label: `Marcar como ${REWORK_STATUS_LABELS[s]}`,
      icon: "pi pi-arrow-right",
      command: () => handleStatusChange(item, s),
    }));

    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => editItem(item),
      },
      ...(statusItems.length > 0 ? [{ separator: true }, ...statusItems] : []),
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "text-red-500",
        command: () => handleDelete(item),
      },
    ];
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <i className="pi pi-replay text-primary text-xl" />
        <h4 className="m-0">Retrabajo</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            style={{ width: "13rem" }}
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={[{ label: "Todos los estados", value: "" }, ...REWORK_STATUS_OPTIONS]}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          style={{ width: "12rem" }}
        />
        <CreateButton
          label="Nuevo retrabajo"
          onClick={openNew}
          tooltip="Registrar retrabajo"
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="card">
        <DataTable
          value={items}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={(e) => {
            setPage(e.page ?? Math.floor(e.first / e.rows));
            setRows(e.rows);
          }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron retrabajos"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column
            header="Descripción / Motivo"
            body={motiveTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            header="OT original"
            body={originalOrderTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Técnico"
            body={technicianTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Fecha"
            body={createdAtTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "640px" }}
        breakpoints={{ "900px": "80vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-replay mr-3 text-primary text-3xl" />
                {selected?.id ? "Editar Retrabajo" : "Nuevo Retrabajo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => {
          setFormDialog(false);
          setSelected(null);
        }}
        footer={
          <FormActionButtons
            formId="rework-form"
            isUpdate={!!selected?.id}
            onCancel={() => {
              setFormDialog(false);
              setSelected(null);
            }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ReworkForm
          rework={selected}
          onSave={handleSave}
          formId="rework-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <Menu
        model={buildMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="rework-menu"
      />
    </motion.div>
  );
}
