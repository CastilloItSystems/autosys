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
import { SelectButton } from "primereact/selectbutton";
import { motion } from "framer-motion";
import AppointmentCalendar from "./AppointmentCalendar";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { appointmentService } from "@/app/api/workshop";
import type { ServiceAppointment, AppointmentStatus } from "@/libs/interfaces/workshop";
import {
  AppointmentStatusBadge,
  APPT_STATUS_OPTIONS,
  APPT_STATUS_LABELS,
} from "@/components/workshop/shared/AppointmentStatusBadge";
import AppointmentForm from "./AppointmentForm";

const VIEW_OPTIONS = [
  { label: "Lista", value: "list", icon: "pi pi-list" },
  { label: "Semana", value: "calendar", icon: "pi pi-calendar" },
];

export default function AppointmentList() {
  const [items, setItems] = useState<ServiceAppointment[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<ServiceAppointment | null>(null);
  const [actionItem, setActionItem] = useState<ServiceAppointment | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => { loadItems(); }, [page, rows, searchQuery, statusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await appointmentService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: (statusFilter as AppointmentStatus) || undefined,
        sortBy: "scheduledDate",
        sortOrder: "asc",
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
  const editItem = (item: ServiceAppointment) => { setSelected({ ...item }); setFormDialog(true); };
  const confirmDelete = (item: ServiceAppointment) => { setSelected(item); setDeleteDialog(true); };

  const handleStatusChange = async (item: ServiceAppointment, status: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(item.id, status);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Cita marcada como: ${APPT_STATUS_LABELS[status]}`,
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await appointmentService.delete(selected.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Cita eliminada", life: 3000 });
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
        detail: selected?.id ? "Cita actualizada" : "Cita creada",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  // ── Templates ──────────────────────────────────────────────────────────────

  const folioTemplate = (row: ServiceAppointment) => (
    <span className="font-bold text-primary">{row.folio}</span>
  );

  const statusTemplate = (row: ServiceAppointment) => (
    <AppointmentStatusBadge status={row.status} />
  );

  const customerTemplate = (row: ServiceAppointment) => (
    <div>
      <div className="font-semibold">{row.customer?.name ?? "—"}</div>
      <div className="text-xs text-500">{row.customer?.code}</div>
    </div>
  );

  const vehicleTemplate = (row: ServiceAppointment) => (
    <span>{row.customerVehicle?.plate ?? row.vehiclePlate ?? "—"}</span>
  );

  const dateTemplate = (row: ServiceAppointment) =>
    new Date(row.scheduledDate).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const minutesTemplate = (row: ServiceAppointment) =>
    row.estimatedMinutes != null ? `${row.estimatedMinutes} min` : "—";

  const serviceTypeTemplate = (row: ServiceAppointment) =>
    row.serviceType ? (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 border-round text-sm">
        {row.serviceType.name}
      </span>
    ) : <span className="text-500">—</span>;

  const actionBodyTemplate = (rowData: ServiceAppointment) => (
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

  const isDeletable = (item: ServiceAppointment) =>
    ["SCHEDULED", "CANCELLED"].includes(item.status);

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Citas</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Folio, cliente, placa..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            style={{ width: "16rem" }}
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={[{ label: "Todos los estados", value: "" }, ...APPT_STATUS_OPTIONS]}
          onChange={(e) => { setStatusFilter(e.value); setPage(0); }}
          placeholder="Estado"
          style={{ width: "14rem" }}
        />
        <CreateButton label="Nueva cita" onClick={openNew} tooltip="Programar cita" />
        <SelectButton
          value={viewMode}
          onChange={(e) => setViewMode(e.value ?? "list")}
          options={VIEW_OPTIONS}
          optionLabel="label"
          optionValue="value"
        />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Toast ref={toast} />

      {viewMode === "calendar" ? (
        <div className="card">
          <div className="flex justify-content-between align-items-center mb-3">
            <h4 className="m-0">Citas</h4>
            <div className="flex gap-2">
              <CreateButton label="Nueva cita" onClick={openNew} tooltip="Programar cita" />
              <SelectButton
                value={viewMode}
                onChange={(e) => setViewMode(e.value ?? "list")}
                options={VIEW_OPTIONS}
                optionLabel="label"
                optionValue="value"
              />
            </div>
          </div>
          <AppointmentCalendar
            onEditAppointment={(appt) => { setSelected(appt); setFormDialog(true); }}
          />
        </div>
      ) : (
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
          emptyMessage="No se encontraron citas"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column field="folio" header="Folio" sortable body={folioTemplate} style={{ minWidth: "110px" }} />
          <Column field="status" header="Estado" body={statusTemplate} style={{ minWidth: "140px" }} />
          <Column header="Cliente" body={customerTemplate} style={{ minWidth: "180px" }} />
          <Column header="Vehículo" body={vehicleTemplate} style={{ minWidth: "110px" }} />
          <Column header="Tipo de servicio" body={serviceTypeTemplate} style={{ minWidth: "150px" }} />
          <Column field="scheduledDate" header="Fecha programada" body={dateTemplate} sortable style={{ minWidth: "180px" }} />
          <Column header="Duración est." body={minutesTemplate} style={{ minWidth: "110px" }} />
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
      )}

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "620px" }}
        breakpoints={{ "900px": "80vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-calendar mr-3 text-primary text-3xl" />
                {selected?.id ? `Editar ${selected.folio}` : "Nueva Cita"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => { setFormDialog(false); setSelected(null); }}
        footer={
          <FormActionButtons
            formId="appointment-form"
            isUpdate={!!selected?.id}
            onCancel={() => { setFormDialog(false); setSelected(null); }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <AppointmentForm
          appointment={selected}
          onSave={handleSave}
          formId="appointment-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => { setDeleteDialog(false); setSelected(null); }}
        onConfirm={handleDelete}
        itemName={selected?.folio}
        isDeleting={isDeleting}
      />

      <Menu
        model={
          actionItem
            ? [
                { label: "Editar", icon: "pi pi-pencil", command: () => editItem(actionItem) },
                { separator: true },
                {
                  label: "Confirmar",
                  icon: "pi pi-check-circle",
                  disabled: actionItem.status !== "SCHEDULED",
                  command: () => handleStatusChange(actionItem, "CONFIRMED"),
                },
                {
                  label: "Marcar llegada",
                  icon: "pi pi-sign-in",
                  disabled: !["SCHEDULED", "CONFIRMED"].includes(actionItem.status),
                  command: () => handleStatusChange(actionItem, "ARRIVED"),
                },
                {
                  label: "Completar",
                  icon: "pi pi-check",
                  disabled: actionItem.status !== "ARRIVED",
                  command: () => handleStatusChange(actionItem, "COMPLETED"),
                },
                {
                  label: "No se presentó",
                  icon: "pi pi-user-minus",
                  disabled: !["SCHEDULED", "CONFIRMED"].includes(actionItem.status),
                  command: () => handleStatusChange(actionItem, "NO_SHOW"),
                },
                {
                  label: "Cancelar",
                  icon: "pi pi-times-circle",
                  disabled: ["COMPLETED", "CANCELLED"].includes(actionItem.status),
                  command: () => handleStatusChange(actionItem, "CANCELLED"),
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
        id="appointment-menu"
      />
      )}
    </motion.div>
  );
}
