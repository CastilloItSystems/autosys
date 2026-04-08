"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { quotationService } from "@/app/api/workshop";
import type { WorkshopQuotation, QuotationStatus } from "@/libs/interfaces/workshop";
import {
  QuotationStatusBadge,
  QUOTATION_STATUS_OPTIONS,
  QUOTATION_ITEM_TYPE_LABELS,
} from "./QuotationStatusBadge";
import QuotationForm from "./QuotationForm";
import QuotationApprovalDialog from "./QuotationApprovalDialog";

const fmt = (v?: number | null) =>
  v != null ? `$ ${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—";

// Estados que permiten editar la cotización
const EDITABLE_STATUSES: QuotationStatus[] = ["DRAFT", "ISSUED", "SENT"];
// Estados donde se puede registrar aprobación / rechazo
const APPROVABLE_STATUSES: QuotationStatus[] = ["ISSUED", "SENT", "PENDING_APPROVAL"];
// Estados desde los que se puede enviar (cambiar a SENT)
const SENDABLE_STATUSES: QuotationStatus[] = ["DRAFT", "ISSUED"];
// Estados desde los que se puede convertir en OS
const CONVERTIBLE_STATUSES: QuotationStatus[] = ["APPROVED_TOTAL", "APPROVED_PARTIAL"];

export default function QuotationList() {
  const [items, setItems] = useState<WorkshopQuotation[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<WorkshopQuotation | null>(null);
  const [actionItem, setActionItem] = useState<WorkshopQuotation | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => { loadItems(); }, [page, rows, searchQuery, statusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await quotationService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (err) {
      handleFormError(err, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => { setSelected(null); setFormDialog(true); };
  const editItem = (item: WorkshopQuotation) => { setSelected({ ...item }); setFormDialog(true); };
  const openApprovalDialog = (item: WorkshopQuotation) => { setSelected({ ...item }); setApprovalDialog(true); };

  const handleSend = async (item: WorkshopQuotation) => {
    try {
      await quotationService.updateStatus(item.id, "SENT");
      toast.current?.show({ severity: "success", summary: "Listo", detail: "Cotización marcada como enviada", life: 3000 });
      await loadItems();
    } catch (err) {
      handleFormError(err, toast.current!);
    }
  };

  const handleConvert = async (item: WorkshopQuotation) => {
    setConvertLoading(true);
    try {
      await quotationService.convertToSO(item.id);
      toast.current?.show({ severity: "success", summary: "Convertida", detail: "Orden de servicio creada exitosamente", life: 4000 });
      await loadItems();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setConvertLoading(false);
    }
  };

  const handleSaved = async () => {
    toast.current?.show({
      severity: "success", summary: "Éxito",
      detail: selected?.id ? "Cotización actualizada" : "Cotización creada",
      life: 3000,
    });
    await loadItems();
    setFormDialog(false);
    setSelected(null);
  };

  const handleApprovalSaved = async () => {
    toast.current?.show({ severity: "success", summary: "Registrado", detail: "Respuesta del cliente guardada", life: 3000 });
    await loadItems();
    setApprovalDialog(false);
    setSelected(null);
  };

  // ── Column templates ────────────────────────────────────────────────────────

  const numberTemplate = (row: WorkshopQuotation) => (
    <div>
      <span className="font-bold text-primary">{row.quotationNumber}</span>
      {row.isSupplementary && (
        <Tag value="Suplementaria" severity="warning" rounded className="ml-2 text-xs" />
      )}
      {row.version > 1 && (
        <span className="text-xs text-500 ml-1">v{row.version}</span>
      )}
    </div>
  );

  const statusTemplate = (row: WorkshopQuotation) => <QuotationStatusBadge status={row.status} />;

  const customerTemplate = (row: WorkshopQuotation) => (
    <div>
      <div className="font-semibold">{row.customer?.name ?? "—"}</div>
      <div className="text-xs text-500">{row.customer?.code}</div>
    </div>
  );

  const vehicleTemplate = (row: WorkshopQuotation) =>
    row.customerVehicle?.plate
      ? <span className="font-mono">{row.customerVehicle.plate}</span>
      : <span className="text-500">—</span>;

  const totalTemplate = (row: WorkshopQuotation) => (
    <span className="font-bold">{fmt(row.total)}</span>
  );

  const dateTemplate = (row: WorkshopQuotation) =>
    new Date(row.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  const soTemplate = (row: WorkshopQuotation) =>
    row.serviceOrder
      ? <span className="font-semibold text-green-600">{row.serviceOrder.folio}</span>
      : <span className="text-500">—</span>;

  const actionBodyTemplate = (rowData: WorkshopQuotation) => (
    <Button
      icon="pi pi-cog"
      rounded text
      onClick={(e) => { setActionItem(rowData); menuRef.current?.toggle(e); }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Cotizaciones de Taller</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Número, cliente..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            style={{ width: "14rem" }}
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={[{ label: "Todos los estados", value: "" }, ...QUOTATION_STATUS_OPTIONS]}
          onChange={(e) => { setStatusFilter(e.value); setPage(0); }}
          placeholder="Estado"
          style={{ width: "13rem" }}
        />
        <CreateButton label="Nueva cotización" onClick={openNew} tooltip="Crear cotización" />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Toast ref={toast} />

      <div className="card">
        <DataTable
          value={items}
          paginator lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={(e) => { setPage(e.page ?? Math.floor(e.first / e.rows)); setRows(e.rows); }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron cotizaciones"
          scrollable
          size="small"
        >
          <Column header="Número" body={numberTemplate} style={{ minWidth: "150px" }} />
          <Column header="Estado" body={statusTemplate} style={{ minWidth: "160px" }} />
          <Column header="Cliente" body={customerTemplate} style={{ minWidth: "180px" }} />
          <Column header="Vehículo" body={vehicleTemplate} style={{ minWidth: "110px" }} />
          <Column header="Total" body={totalTemplate} style={{ minWidth: "120px" }} />
          <Column header="OS generada" body={soTemplate} style={{ minWidth: "120px" }} />
          <Column header="Fecha" body={dateTemplate} style={{ minWidth: "130px" }} />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "760px" }}
        breakpoints={{ "900px": "90vw", "600px": "98vw" }}
        maximizable
        header={
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-xl font-bold text-900 m-0 flex align-items-center gap-2">
              <i className="pi pi-file-edit text-primary text-2xl" />
              {selected?.id ? `Editar ${selected.quotationNumber}` : "Nueva Cotización"}
            </h2>
          </div>
        }
        modal className="p-fluid"
        onHide={() => { setFormDialog(false); setSelected(null); }}
        footer={
          <FormActionButtons
            formId="quotation-form"
            isUpdate={!!selected?.id}
            onCancel={() => { setFormDialog(false); setSelected(null); }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <QuotationForm
          quotation={selected}
          formId="quotation-form"
          onSave={handleSaved}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Approval Dialog */}
      <QuotationApprovalDialog
        visible={approvalDialog}
        quotation={selected}
        onHide={() => { setApprovalDialog(false); setSelected(null); }}
        onSaved={handleApprovalSaved}
        toast={toast}
      />

      {/* Context Menu */}
      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Editar",
                  icon: "pi pi-pencil",
                  disabled: !EDITABLE_STATUSES.includes(actionItem.status),
                  command: () => editItem(actionItem),
                },
                {
                  label: "Marcar como enviada",
                  icon: "pi pi-send",
                  disabled: !SENDABLE_STATUSES.includes(actionItem.status),
                  command: () => handleSend(actionItem),
                },
                {
                  label: "Registrar respuesta del cliente",
                  icon: "pi pi-check-circle",
                  disabled: !APPROVABLE_STATUSES.includes(actionItem.status),
                  command: () => openApprovalDialog(actionItem),
                },
                { separator: true },
                {
                  label: "Convertir en OS",
                  icon: "pi pi-arrow-right",
                  disabled: !CONVERTIBLE_STATUSES.includes(actionItem.status) || !!actionItem.serviceOrderId,
                  command: () => handleConvert(actionItem),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="quotation-menu"
      />
    </motion.div>
  );
}
