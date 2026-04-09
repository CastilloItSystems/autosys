"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { motion } from "framer-motion";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { warrantyService } from "@/app/api/workshop";
import type { WorkshopWarranty, WarrantyStatus } from "@/libs/interfaces/workshop";
import {
  WarrantyStatusBadge,
  WARRANTY_STATUS_OPTIONS,
  WARRANTY_TYPE_LABELS,
} from "@/components/workshop/shared/WarrantyStatusBadge";
import WarrantyForm from "./WarrantyForm";
import WarrantyStatusDialog from "./WarrantyStatusDialog";

export default function WarrantyList() {
  const [items, setItems] = useState<WorkshopWarranty[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<WorkshopWarranty | null>(null);
  const [actionItem, setActionItem] = useState<WorkshopWarranty | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => { loadItems(); }, [page, rows, searchQuery, statusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await warrantyService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: (statusFilter as WarrantyStatus) || undefined,
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

  const openNew = () => { setSelected(null); setFormDialog(true); };
  const editItem = (item: WorkshopWarranty) => { setSelected({ ...item }); setFormDialog(true); };
  const openStatusDialog = (item: WorkshopWarranty) => { setSelected({ ...item }); setStatusDialog(true); };

  const handleSave = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: selected?.id ? "Garantía actualizada" : "Garantía registrada",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  const handleStatusSaved = async () => {
    toast.current?.show({ severity: "success", summary: "Éxito", detail: "Estado de garantía actualizado", life: 3000 });
    await loadItems();
    setStatusDialog(false);
    setSelected(null);
  };

  // ── Templates ──────────────────────────────────────────────────────────────

  const numberTemplate = (row: WorkshopWarranty) => (
    <span className="font-bold text-primary">{row.warrantyNumber}</span>
  );

  const statusTemplate = (row: WorkshopWarranty) => <WarrantyStatusBadge status={row.status} />;

  const typeTemplate = (row: WorkshopWarranty) => (
    <Tag value={WARRANTY_TYPE_LABELS[row.type]} severity="info" rounded />
  );

  const customerTemplate = (row: WorkshopWarranty) => (
    <div>
      <div className="font-semibold">{row.customer?.name ?? "—"}</div>
      <div className="text-xs text-500">{row.customer?.code}</div>
    </div>
  );

  const originalOrderTemplate = (row: WorkshopWarranty) =>
    row.originalOrder ? (
      <span className="font-semibold text-primary">{row.originalOrder.folio}</span>
    ) : <span className="text-500">—</span>;

  const expiryTemplate = (row: WorkshopWarranty) =>
    row.expiresAt
      ? new Date(row.expiresAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
      : <span className="text-500">Sin vencimiento</span>;

  const actionBodyTemplate = (rowData: WorkshopWarranty) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-haspopup
      onClick={(e) => { setActionItem(rowData); menuRef.current?.toggle(e); }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const isEditable = (item: WorkshopWarranty) =>
    !["CLOSED", "RESOLVED"].includes(item.status);

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Garantías</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Folio, cliente..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            style={{ width: "14rem" }}
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={[{ label: "Todos los estados", value: "" }, ...WARRANTY_STATUS_OPTIONS]}
          onChange={(e) => { setStatusFilter(e.value); setPage(0); }}
          placeholder="Estado"
          style={{ width: "12rem" }}
        />
        <CreateButton label="Nueva garantía" onClick={openNew} tooltip="Registrar garantía" />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={items}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={(e) => { setPage(e.page ?? Math.floor(e.first / e.rows)); setRows(e.rows); }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron garantías"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column header="N° Garantía" body={numberTemplate} style={{ minWidth: "130px" }} />
          <Column header="Estado" body={statusTemplate} style={{ minWidth: "130px" }} />
          <Column header="Tipo" body={typeTemplate} style={{ minWidth: "120px" }} />
          <Column header="Cliente" body={customerTemplate} style={{ minWidth: "180px" }} />
          <Column header="OT original" body={originalOrderTemplate} style={{ minWidth: "120px" }} />
          <Column header="Vence" body={expiryTemplate} style={{ minWidth: "140px" }} />
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
        style={{ width: "600px" }}
        breakpoints={{ "900px": "80vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-shield mr-3 text-primary text-3xl" />
                {selected?.id ? `Editar ${selected.warrantyNumber}` : "Nueva Garantía"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => { setFormDialog(false); setSelected(null); }}
        footer={
          <FormActionButtons
            formId="warranty-form"
            isUpdate={!!selected?.id}
            onCancel={() => { setFormDialog(false); setSelected(null); }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <WarrantyForm
          warranty={selected}
          onSave={handleSave}
          formId="warranty-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Status Dialog */}
      <WarrantyStatusDialog
        visible={statusDialog}
        warranty={selected}
        onHide={() => { setStatusDialog(false); setSelected(null); }}
        onSaved={handleStatusSaved}
        toast={toast}
      />

      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Editar",
                  icon: "pi pi-pencil",
                  disabled: !isEditable(actionItem),
                  command: () => editItem(actionItem),
                },
                {
                  label: "Cambiar estado",
                  icon: "pi pi-arrow-right-arrow-left",
                  disabled: actionItem.status === "CLOSED",
                  command: () => openStatusDialog(actionItem),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="warranty-menu"
      />
    </motion.div>
  );
}
