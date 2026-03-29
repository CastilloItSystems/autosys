"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { motion } from "framer-motion";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { receptionService } from "@/app/api/workshop";
import type { VehicleReception } from "@/libs/interfaces/workshop";
import ReceptionForm from "./ReceptionForm";

const FUEL_LABELS: Record<string, string> = {
  EMPTY: "Vacío",
  QUARTER: "1/4",
  HALF: "1/2",
  THREE_QUARTERS: "3/4",
  FULL: "Lleno",
};

export default function ReceptionList() {
  const [items, setItems] = useState<VehicleReception[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<VehicleReception | null>(null);
  const [actionItem, setActionItem] = useState<VehicleReception | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => { loadItems(); }, [page, rows, searchQuery]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await receptionService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        sortBy: "createdAt",
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
  const editItem = (item: VehicleReception) => { setSelected({ ...item }); setFormDialog(true); };
  const confirmDelete = (item: VehicleReception) => { setSelected(item); setDeleteDialog(true); };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await receptionService.delete(selected.id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Recepción eliminada", life: 3000 });
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
        detail: selected?.id ? "Recepción actualizada" : "Recepción registrada",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  // ── Templates ──────────────────────────────────────────────────────────────

  const folioTemplate = (row: VehicleReception) => (
    <span className="font-bold text-primary">{row.folio}</span>
  );

  const customerTemplate = (row: VehicleReception) => (
    <div>
      <div className="font-semibold">{row.customer?.name ?? "—"}</div>
      <div className="text-xs text-500">{row.customer?.code}</div>
    </div>
  );

  const vehicleTemplate = (row: VehicleReception) => (
    <div>
      <div className="font-semibold">
        {row.customerVehicle?.plate ?? row.vehiclePlate ?? "—"}
      </div>
      {row.vehicleDesc && <div className="text-xs text-500">{row.vehicleDesc}</div>}
    </div>
  );

  const fuelTemplate = (row: VehicleReception) =>
    row.fuelLevel ? (
      <span className="px-2 py-1 surface-200 border-round text-sm">
        {FUEL_LABELS[row.fuelLevel] ?? row.fuelLevel}
      </span>
    ) : <span className="text-500">—</span>;

  const damageTemplate = (row: VehicleReception) => (
    <Tag
      value={row.hasPreExistingDamage ? "Con daños" : "Sin daños"}
      severity={row.hasPreExistingDamage ? "warning" : "success"}
      rounded
    />
  );

  const orderTemplate = (row: VehicleReception) =>
    row.serviceOrder ? (
      <span className="font-bold text-primary">{row.serviceOrder.folio}</span>
    ) : <span className="text-500">—</span>;

  const dateTemplate = (row: VehicleReception) =>
    new Date(row.createdAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const actionBodyTemplate = (rowData: VehicleReception) => (
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

  const isDeletable = (item: VehicleReception) => !item.serviceOrder;

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Recepciones de Vehículos</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
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
        <CreateButton label="Nueva recepción" onClick={openNew} tooltip="Registrar recepción de vehículo" />
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
          emptyMessage="No se encontraron recepciones"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column field="folio" header="Folio" sortable body={folioTemplate} style={{ minWidth: "110px" }} />
          <Column header="Cliente" body={customerTemplate} style={{ minWidth: "180px" }} />
          <Column header="Vehículo" body={vehicleTemplate} style={{ minWidth: "140px" }} />
          <Column field="mileageIn" header="Km entrada" style={{ minWidth: "100px" }} />
          <Column header="Combustible" body={fuelTemplate} style={{ minWidth: "110px" }} />
          <Column header="Estado previo" body={damageTemplate} style={{ minWidth: "120px" }} />
          <Column header="OT generada" body={orderTemplate} style={{ minWidth: "120px" }} />
          <Column field="createdAt" header="Fecha" body={dateTemplate} sortable style={{ minWidth: "110px" }} />
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

      <Dialog
        visible={formDialog}
        style={{ width: "700px" }}
        breakpoints={{ "900px": "85vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-car mr-3 text-primary text-3xl" />
                {selected?.id ? `Editar ${selected.folio}` : "Nueva Recepción"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => { setFormDialog(false); setSelected(null); }}
        footer={
          <FormActionButtons
            formId="reception-form"
            isUpdate={!!selected?.id}
            onCancel={() => { setFormDialog(false); setSelected(null); }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ReceptionForm
          reception={selected}
          onSave={handleSave}
          formId="reception-form"
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
        id="reception-menu"
      />
    </motion.div>
  );
}
