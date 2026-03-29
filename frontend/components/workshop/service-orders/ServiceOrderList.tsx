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
import { motion } from "framer-motion";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { serviceOrderService } from "@/app/api/workshop";
import type { ServiceOrder, ServiceOrderStatus } from "@/libs/interfaces/workshop";
import {
  ServiceOrderStatusBadge,
  ServiceOrderPriorityBadge,
  SO_STATUS_OPTIONS,
} from "@/components/workshop/shared/ServiceOrderStatusBadge";
import ServiceOrderForm from "./ServiceOrderForm";
import ServiceOrderStatusDialog from "./ServiceOrderStatusDialog";

export default function ServiceOrderList() {
  const [items, setItems] = useState<ServiceOrder[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<ServiceOrder | null>(null);
  const [actionItem, setActionItem] = useState<ServiceOrder | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => { loadItems(); }, [page, rows, searchQuery, statusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await serviceOrderService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: (statusFilter as ServiceOrderStatus) || undefined,
        sortBy: "receivedAt",
        sortOrder: "desc",
      });
      setItems(res.data?.data ?? []);
      setTotalRecords(res.data?.pagination?.total ?? 0);
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => { setSelected(null); setFormDialog(true); };
  const editItem = (item: ServiceOrder) => { setSelected({ ...item }); setFormDialog(true); };
  const openStatusDialog = (item: ServiceOrder) => { setSelected({ ...item }); setStatusDialog(true); };
  const confirmDelete = (item: ServiceOrder) => { setSelected(item); setDeleteDialog(true); };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await serviceOrderService.delete(selected.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: `Orden ${selected.folio} eliminada`, life: 3000 });
      await loadItems();
      setDeleteDialog(false);
      setSelected(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: selected?.id ? `Orden ${selected.folio} actualizada` : "Orden de trabajo creada",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  const handleStatusSaved = async () => {
    toast.current?.show({ severity: "success", summary: "Éxito", detail: "Estado actualizado", life: 3000 });
    await loadItems();
    setStatusDialog(false);
    setSelected(null);
  };

  // ── Templates ───────────────────────────────────────────────────────────────

  const folioTemplate = (row: ServiceOrder) => (
    <span className="font-bold text-primary">{row.folio}</span>
  );

  const statusTemplate = (row: ServiceOrder) => (
    <ServiceOrderStatusBadge status={row.status} />
  );

  const priorityTemplate = (row: ServiceOrder) => (
    <ServiceOrderPriorityBadge priority={row.priority} />
  );

  const customerTemplate = (row: ServiceOrder) => (
    <div>
      <div className="font-semibold">{row.customer?.name ?? "—"}</div>
      <div className="text-xs text-500">{row.customer?.code}</div>
    </div>
  );

  const vehicleTemplate = (row: ServiceOrder) => (
    <div>
      <div className="font-semibold">
        {row.customerVehicle?.plate ?? row.vehiclePlate ?? "—"}
      </div>
      {row.vehicleDesc && <div className="text-xs text-500">{row.vehicleDesc}</div>}
    </div>
  );

  const totalTemplate = (row: ServiceOrder) => (
    <span className="font-semibold">
      {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(row.total)}
    </span>
  );

  const dateTemplate = (row: ServiceOrder) =>
    new Date(row.receivedAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const actionBodyTemplate = (rowData: ServiceOrder) => (
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

  const isEditable = (order: ServiceOrder) =>
    !["DELIVERED", "INVOICED", "CLOSED", "CANCELLED"].includes(order.status);

  const isDeletable = (order: ServiceOrder) =>
    ["DRAFT", "CANCELLED"].includes(order.status);

  // ── Header ──────────────────────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Órdenes de Trabajo</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Folio, placa, cliente..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            style={{ width: "16rem" }}
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={[{ label: "Todos los estados", value: "" }, ...SO_STATUS_OPTIONS]}
          onChange={(e) => { setStatusFilter(e.value); setPage(0); }}
          placeholder="Estado"
          style={{ width: "14rem" }}
        />
        <CreateButton label="Nueva OT" onClick={openNew} tooltip="Crear orden de trabajo" />
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
          emptyMessage="No se encontraron órdenes de trabajo"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column field="folio" header="Folio" sortable body={folioTemplate} style={{ minWidth: "110px" }} />
          <Column field="status" header="Estado" body={statusTemplate} style={{ minWidth: "150px" }} />
          <Column field="priority" header="Prioridad" body={priorityTemplate} style={{ minWidth: "100px" }} />
          <Column header="Cliente" body={customerTemplate} style={{ minWidth: "180px" }} />
          <Column header="Vehículo" body={vehicleTemplate} style={{ minWidth: "130px" }} />
          <Column field="receivedAt" header="Recibida" body={dateTemplate} sortable style={{ minWidth: "120px" }} />
          <Column field="total" header="Total" body={totalTemplate} sortable style={{ minWidth: "120px" }} />
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
        style={{ width: "860px" }}
        breakpoints={{ "1200px": "860px", "900px": "90vw", "600px": "100vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-file-edit mr-3 text-primary text-3xl" />
                {selected?.id ? `Editar ${selected.folio}` : "Nueva Orden de Trabajo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => { setFormDialog(false); setSelected(null); }}
        footer={
          <FormActionButtons
            formId="service-order-form"
            isUpdate={!!selected?.id}
            onCancel={() => { setFormDialog(false); setSelected(null); }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ServiceOrderForm
          order={selected}
          onSave={handleSave}
          formId="service-order-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Status Dialog */}
      <ServiceOrderStatusDialog
        visible={statusDialog}
        order={selected}
        onHide={() => { setStatusDialog(false); setSelected(null); }}
        onSaved={handleStatusSaved}
        toast={toast}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => { setDeleteDialog(false); setSelected(null); }}
        onConfirm={handleDelete}
        itemName={selected?.folio}
        isDeleting={isDeleting}
      />

      {/* Actions Menu */}
      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Ver detalle",
                  icon: "pi pi-eye",
                  command: () => editItem(actionItem),
                },
                {
                  label: "Cambiar estado",
                  icon: "pi pi-arrow-right-arrow-left",
                  command: () => openStatusDialog(actionItem),
                },
                { separator: true },
                {
                  label: "Editar",
                  icon: "pi pi-pencil",
                  disabled: !isEditable(actionItem),
                  command: () => editItem(actionItem),
                },
                { separator: true },
                {
                  label: "Eliminar",
                  icon: "pi pi-trash",
                  className: "p-menuitem-danger",
                  disabled: !isDeletable(actionItem),
                  command: () => confirmDelete(actionItem),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="service-order-menu"
      />
    </motion.div>
  );
}
