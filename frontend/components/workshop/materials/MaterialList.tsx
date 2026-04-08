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
import { materialService } from "@/app/api/workshop";
import type {
  ServiceOrderMaterial,
  MaterialStatus,
} from "@/libs/interfaces/workshop";
import MaterialStatusBadge from "@/components/workshop/shared/MaterialStatusBadge";
import MaterialForm from "./MaterialForm";

const MATERIAL_STATUS_OPTIONS = [
  { label: "Solicitado", value: "REQUESTED" },
  { label: "Reservado", value: "RESERVED" },
  { label: "Despachado", value: "DISPATCHED" },
  { label: "Consumido", value: "CONSUMED" },
  { label: "Devuelto", value: "RETURNED" },
  { label: "Cancelado", value: "CANCELLED" },
];

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

interface MaterialListProps {
  serviceOrderId?: string;
  embedded?: boolean;
}

export default function MaterialList({
  serviceOrderId,
  embedded,
}: MaterialListProps) {
  const [items, setItems] = useState<ServiceOrderMaterial[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<ServiceOrderMaterial | null>(null);
  const [actionItem, setActionItem] = useState<ServiceOrderMaterial | null>(
    null,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | "">("");
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
      const res = await materialService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: (statusFilter as MaterialStatus) || undefined,
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
  const editItem = (item: ServiceOrderMaterial) => {
    setSelected({ ...item });
    setFormDialog(true);
  };
  const confirmDelete = (item: ServiceOrderMaterial) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await materialService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Material eliminado",
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
        detail: selected?.id ? "Material actualizado" : "Material creado",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  const handleStatusChange = async (
    item: ServiceOrderMaterial,
    newStatus: string,
  ) => {
    try {
      await materialService.updateStatus(item.id, newStatus);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Estado del material actualizado",
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  // ── Templates ────────────────────────────────────────────────────────────────

  const descriptionTemplate = (row: ServiceOrderMaterial) => (
    <span className="font-semibold">{row.description}</span>
  );

  const folioTemplate = (row: ServiceOrderMaterial) => (
    <span className="text-primary font-medium">
      {row.serviceOrder?.folio ?? row.serviceOrderId.slice(0, 8)}
    </span>
  );

  const itemTemplate = (row: ServiceOrderMaterial) => (
    <span>{row.item?.name ?? row.itemId ?? "—"}</span>
  );

  const qtyTemplate = (row: ServiceOrderMaterial) => (
    <span>
      <span className="font-semibold">{row.quantityRequested}</span>
      <span className="text-500"> / </span>
      <span className="text-green-600 font-semibold">
        {row.quantityConsumed}
      </span>
    </span>
  );

  const priceTemplate = (row: ServiceOrderMaterial) => (
    <span>{currencyFormatter.format(row.unitPrice)}</span>
  );

  const statusTemplate = (row: ServiceOrderMaterial) => (
    <MaterialStatusBadge status={row.status} />
  );

  const actionBodyTemplate = (rowData: ServiceOrderMaterial) => (
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

  const buildMenuItems = (item: ServiceOrderMaterial) => {
    const items: any[] = [
      { label: "Editar", icon: "pi pi-pencil", command: () => editItem(item) },
      { separator: true },
    ];

    if (item.status === "REQUESTED") {
      items.push({
        label: "Reservar",
        icon: "pi pi-lock",
        command: () => handleStatusChange(item, "RESERVED"),
      });
    }
    if (item.status === "RESERVED") {
      items.push({
        label: "Despachar",
        icon: "pi pi-box",
        command: () => handleStatusChange(item, "DISPATCHED"),
      });
    }
    if (item.status === "DISPATCHED") {
      items.push({
        label: "Marcar Consumido",
        icon: "pi pi-check",
        command: () => handleStatusChange(item, "CONSUMED"),
      });
    }
    if (!["CONSUMED", "RETURNED", "CANCELLED"].includes(item.status)) {
      items.push({
        label: "Cancelar",
        icon: "pi pi-times",
        className: "p-menuitem-danger",
        command: () => handleStatusChange(item, "CANCELLED"),
      });
    }

    items.push({ separator: true });
    items.push({
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger",
      command: () => confirmDelete(item),
    });

    return items;
  };

  // ── Header ───────────────────────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Materiales de Órdenes</h4>
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
            ...MATERIAL_STATUS_OPTIONS,
          ]}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          style={{ width: "12rem" }}
        />
        <CreateButton
          label="Nuevo material"
          onClick={openNew}
          tooltip="Agregar material a OT"
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
          emptyMessage="No se encontraron materiales"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column
            field="description"
            header="Descripción"
            body={descriptionTemplate}
            style={{ minWidth: "180px" }}
          />
          <Column
            header="Folio OT"
            body={folioTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Ítem"
            body={itemTemplate}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Req / Cons"
            body={qtyTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            field="unitPrice"
            header="Precio unitario"
            body={priceTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "140px" }}
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
        style={{ width: "600px" }}
        breakpoints={{ "900px": "75vw", "600px": "100vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-box mr-3 text-primary text-3xl" />
                {selected?.id ? "Editar Material" : "Agregar Material"}
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
            formId="material-form"
            isUpdate={!!selected?.id}
            onCancel={() => {
              setFormDialog(false);
              setSelected(null);
            }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <MaterialForm
          material={selected}
          onSave={handleSave}
          formId="material-form"
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
        id="material-menu"
      />
    </motion.div>
  );
}
