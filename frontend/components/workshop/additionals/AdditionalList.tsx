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
import { additionalService } from "@/app/api/workshop";
import type {
  ServiceOrderAdditional,
  AdditionalStatus,
} from "@/libs/interfaces/workshop";
import AdditionalStatusBadge from "@/components/workshop/shared/AdditionalStatusBadge";
import AdditionalForm from "./AdditionalForm";

const ADDITIONAL_STATUS_OPTIONS = [
  { label: "Propuesto", value: "PROPOSED" },
  { label: "Cotizado", value: "QUOTED" },
  { label: "Aprobado", value: "APPROVED" },
  { label: "Ejecutado", value: "EXECUTED" },
  { label: "Rechazado", value: "REJECTED" },
];

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

interface AdditionalListProps {
  serviceOrderId?: string;
  embedded?: boolean;
}

export default function AdditionalList({
  serviceOrderId,
  embedded,
}: AdditionalListProps) {
  const [items, setItems] = useState<ServiceOrderAdditional[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<ServiceOrderAdditional | null>(null);
  const [actionItem, setActionItem] = useState<ServiceOrderAdditional | null>(
    null,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdditionalStatus | "">("");
  const [soIdFilter, setSoIdFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  // Use prop serviceOrderId when embedded, otherwise use state filter
  const finalServiceOrderId = embedded ? serviceOrderId : soIdFilter;

  useEffect(() => {
    if (embedded && !serviceOrderId) return; // Wait for prop if embedded
    setPage(0); // Reset to page 1 when filter changes
    loadItems();
  }, [searchQuery, statusFilter, finalServiceOrderId, embedded]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await additionalService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: (statusFilter as AdditionalStatus) || undefined,
        serviceOrderId: finalServiceOrderId || undefined,
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
  const editItem = (item: ServiceOrderAdditional) => {
    setSelected({ ...item });
    setFormDialog(true);
  };
  const confirmDelete = (item: ServiceOrderAdditional) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await additionalService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Trabajo adicional eliminado",
        life: 3000,
      });
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
        detail: selected?.id
          ? "Trabajo adicional actualizado"
          : "Trabajo adicional creado",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  const handleStatusChange = async (
    item: ServiceOrderAdditional,
    newStatus: string,
  ) => {
    try {
      await additionalService.updateStatus(item.id, newStatus);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Estado del trabajo actualizado",
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  // ── Templates ────────────────────────────────────────────────────────────────

  const descriptionTemplate = (row: ServiceOrderAdditional) => (
    <span className="font-semibold">{row.description}</span>
  );

  const folioTemplate = (row: ServiceOrderAdditional) => (
    <span className="text-primary font-medium">
      {row.serviceOrder?.folio ?? row.serviceOrderId.slice(0, 8)}
    </span>
  );

  const priceTemplate = (row: ServiceOrderAdditional) => (
    <span>{currencyFormatter.format(row.estimatedPrice)}</span>
  );

  const statusTemplate = (row: ServiceOrderAdditional) => (
    <AdditionalStatusBadge status={row.status} />
  );

  const actionBodyTemplate = (rowData: ServiceOrderAdditional) => (
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

  const buildMenuItems = (item: ServiceOrderAdditional) => {
    const menuItems: any[] = [
      { label: "Editar", icon: "pi pi-pencil", command: () => editItem(item) },
      { separator: true },
    ];

    if (item.status === "PROPOSED") {
      menuItems.push({
        label: "Cotizar",
        icon: "pi pi-file-o",
        command: () => handleStatusChange(item, "QUOTED"),
      });
    }
    if (item.status === "QUOTED") {
      menuItems.push({
        label: "Aprobar",
        icon: "pi pi-check",
        command: () => handleStatusChange(item, "APPROVED"),
      });
      menuItems.push({
        label: "Rechazar",
        icon: "pi pi-times",
        className: "p-menuitem-danger",
        command: () => handleStatusChange(item, "REJECTED"),
      });
    }
    if (item.status === "APPROVED") {
      menuItems.push({
        label: "Marcar Ejecutado",
        icon: "pi pi-check-circle",
        command: () => handleStatusChange(item, "EXECUTED"),
      });
    }

    menuItems.push({ separator: true });
    menuItems.push({
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger",
      command: () => confirmDelete(item),
    });

    return menuItems;
  };

  // ── Header ───────────────────────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Trabajos Adicionales</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar descripción..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            style={{ width: "14rem" }}
          />
        </span>
        <InputText
          placeholder="Filtrar por ID de OT"
          value={soIdFilter}
          onChange={(e) => {
            setSoIdFilter(e.target.value);
            setPage(0);
          }}
          style={{ width: "14rem" }}
        />
        <Dropdown
          value={statusFilter}
          options={[
            { label: "Todos los estados", value: "" },
            ...ADDITIONAL_STATUS_OPTIONS,
          ]}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          style={{ width: "12rem" }}
        />
        <CreateButton
          label="Nuevo adicional"
          onClick={openNew}
          tooltip="Agregar trabajo adicional"
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
          emptyMessage="No se encontraron trabajos adicionales"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column
            field="description"
            header="Descripción"
            body={descriptionTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Folio OT"
            body={folioTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="estimatedPrice"
            header="Precio estimado"
            body={priceTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusTemplate}
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
        style={{ width: "550px" }}
        breakpoints={{ "900px": "70vw", "600px": "100vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-plus-circle mr-3 text-primary text-3xl" />
                {selected?.id
                  ? "Editar Trabajo Adicional"
                  : "Nuevo Trabajo Adicional"}
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
            formId="additional-form"
            isUpdate={!!selected?.id}
            onCancel={() => {
              setFormDialog(false);
              setSelected(null);
            }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <AdditionalForm
          additional={selected}
          onSave={handleSave}
          formId="additional-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        itemName={selected?.description}
        isDeleting={isDeleting}
      />

      {/* Actions Menu */}
      <Menu
        model={actionItem ? buildMenuItems(actionItem) : []}
        popup
        ref={menuRef}
        id="additional-menu"
      />
    </motion.div>
  );
}
