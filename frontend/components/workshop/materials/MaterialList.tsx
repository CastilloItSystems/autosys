"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { materialService } from "@/app/api/workshop";
import warehouseService, {
  type Warehouse,
} from "@/app/api/inventory/warehouseService";
import stockService, { type Stock } from "@/app/api/inventory/stockService";
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

const EXIT_NOTE_STATUS_META: Record<
  string,
  {
    label: string;
    severity: "success" | "info" | "warning" | "danger" | "secondary";
  }
> = {
  PENDING: { label: "Pendiente", severity: "warning" },
  IN_PROGRESS: { label: "En preparación", severity: "info" },
  READY: { label: "Lista", severity: "success" },
  DELIVERED: { label: "Entregada", severity: "success" },
  CANCELLED: { label: "Cancelada", severity: "danger" },
};

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
  const router = useRouter();
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
  const [reserveDialog, setReserveDialog] = useState(false);
  const [reserveItem, setReserveItem] = useState<ServiceOrderMaterial | null>(
    null,
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockByWarehouse, setStockByWarehouse] = useState<
    Record<string, number>
  >({});
  const [loadingReserveMeta, setLoadingReserveMeta] = useState(false);

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
    payload?: { warehouseId?: string; quantityReturned?: number },
  ) => {
    try {
      await materialService.updateStatus(item.id, newStatus, payload);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Estado del material actualizado",
        life: 3000,
      });
      await loadItems();
      return true;
    } catch (error) {
      handleFormError(error, toast);
      return false;
    }
  };

  const handleApprovalChange = async (
    item: ServiceOrderMaterial,
    clientApproved: boolean,
  ) => {
    try {
      await materialService.updateApproval(item.id, clientApproved);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: clientApproved
          ? "Material aprobado por cliente"
          : "Material marcado como rechazado por cliente",
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const openReserveDialog = async (item: ServiceOrderMaterial) => {
    setReserveItem(item);
    setSelectedWarehouseId(item.warehouseId ?? "");
    setReserveDialog(true);
    setLoadingReserveMeta(true);

    try {
      const [warehouseRes, stockRes] = await Promise.all([
        warehouseService.getActive(),
        item.itemId ? stockService.getByItem(item.itemId) : Promise.resolve(null),
      ]);

      const warehouseRows = Array.isArray((warehouseRes as any)?.data)
        ? ((warehouseRes as any).data as Warehouse[])
        : [];

      const stocks = Array.isArray((stockRes as any)?.data)
        ? ((stockRes as any).data as Stock[])
        : [];

      const stockMap = stocks.reduce<Record<string, number>>((acc, curr) => {
        acc[curr.warehouseId] = Number(curr.quantityAvailable ?? 0);
        return acc;
      }, {});

      setWarehouses(warehouseRows);
      setStockByWarehouse(stockMap);

      if (!item.warehouseId && warehouseRows.length === 1) {
        setSelectedWarehouseId(warehouseRows[0].id);
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoadingReserveMeta(false);
    }
  };

  const confirmReserve = async () => {
    if (!reserveItem) return;

    const requiresWarehouse = Boolean(reserveItem.itemId);

    if (requiresWarehouse && !selectedWarehouseId) {
      toast.current?.show({
        severity: "warn",
        summary: "Almacén requerido",
        detail: "Selecciona un almacén para reservar el material",
        life: 3000,
      });
      return;
    }

    const available = stockByWarehouse[selectedWarehouseId] ?? 0;
    const requiredQty = Number(reserveItem.quantityRequested ?? 0);

    if (requiresWarehouse && available < requiredQty) {
      toast.current?.show({
        severity: "warn",
        summary: "Stock insuficiente",
        detail: `Disponible ${available}, requerido ${requiredQty}`,
        life: 3500,
      });
      return;
    }

    const ok = await handleStatusChange(
      reserveItem,
      "RESERVED",
      selectedWarehouseId ? { warehouseId: selectedWarehouseId } : undefined,
    );

    if (ok) {
      setReserveDialog(false);
      setReserveItem(null);
      setSelectedWarehouseId("");
    }
  };

  const goToDispatchExitNote = (item: ServiceOrderMaterial) => {
    if (!item.itemId) {
      toast.current?.show({
        severity: "warn",
        summary: "Sin ítem inventariable",
        detail: "Este material no genera nota de salida de inventario",
        life: 3000,
      });
      return;
    }

    // Navigate to the specific exit note by number if available
    const query = item.dispatchExitNote?.exitNoteNumber
      ? encodeURIComponent(item.dispatchExitNote.exitNoteNumber)
      : undefined;

    if (query) {
      router.push(`/empresa/inventario/notas-salida?search=${query}`);
    } else {
      // No exit note yet — navigate to warehouse inbox
      router.push(`/empresa/inventario/solicitudes-taller`);
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

  const warehouseTemplate = (row: ServiceOrderMaterial) => (
    <span>
      {row.warehouse
        ? `${row.warehouse.code} - ${row.warehouse.name}`
        : row.warehouseId || "—"}
    </span>
  );

  const exitNoteTemplate = (row: ServiceOrderMaterial) => {
    if (!row.itemId) return <span>—</span>;

    if (!row.dispatchExitNote) {
      return <Tag value="Pendiente" severity="secondary" rounded />;
    }

    const statusMeta =
      EXIT_NOTE_STATUS_META[row.dispatchExitNote.status] ||
      ({ label: row.dispatchExitNote.status, severity: "secondary" } as const);

    return (
      <div className="flex flex-column gap-1">
        <Button
          label={row.dispatchExitNote.exitNoteNumber}
          icon="pi pi-external-link"
          text
          size="small"
          className="p-0 justify-content-start"
          onClick={() => goToDispatchExitNote(row)}
        />
        <Tag value={statusMeta.label} severity={statusMeta.severity} rounded />
      </div>
    );
  };

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

  const approvalTemplate = (row: ServiceOrderMaterial) => {
    if (row.clientApproved === true) {
      return <Tag value="Aprobado" severity="success" rounded />;
    }

    if (row.clientApproved === false) {
      return <Tag value="Rechazado" severity="danger" rounded />;
    }

    return <Tag value="Pendiente" severity="warning" rounded />;
  };

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

    const canUpdateApproval = !["CONSUMED", "RETURNED", "CANCELLED"].includes(
      item.status,
    );

    if (canUpdateApproval && item.clientApproved !== true) {
      items.push({
        label: "Aprobar cliente",
        icon: "pi pi-thumbs-up",
        command: () => handleApprovalChange(item, true),
      });
    }

    if (canUpdateApproval && item.clientApproved !== false) {
      items.push({
        label: "Rechazar cliente",
        icon: "pi pi-thumbs-down",
        className: "p-menuitem-danger",
        command: () => handleApprovalChange(item, false),
      });
    }

    if (item.status === "REQUESTED" && item.clientApproved === true) {
      items.push({
        label: "Reservar",
        icon: "pi pi-lock",
        command: () => openReserveDialog(item),
      });
    }
    if (item.status === "RESERVED") {
      items.push({
        label: "Ver solicitud en almacén",
        icon: "pi pi-external-link",
        command: () => goToDispatchExitNote(item),
      });
    }
    if (item.status === "DISPATCHED") {
      items.push({
        label: "Marcar Consumido",
        icon: "pi pi-check",
        command: () => handleStatusChange(item, "CONSUMED"),
      });
    }

    if (["DISPATCHED", "CONSUMED", "RETURNED"].includes(item.status)) {
      items.push({
        label: "Ver nota de salida",
        icon: "pi pi-external-link",
        command: () => goToDispatchExitNote(item),
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
            header="Almacén"
            body={warehouseTemplate}
            style={{ minWidth: "170px" }}
          />
          <Column
            header="Nota salida"
            body={exitNoteTemplate}
            style={{ minWidth: "170px" }}
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
            header="Aprobación cliente"
            body={approvalTemplate}
            style={{ minWidth: "150px" }}
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

      <Dialog
        visible={reserveDialog}
        header="Seleccionar almacén"
        modal
        style={{ width: "32rem" }}
        onHide={() => {
          setReserveDialog(false);
          setReserveItem(null);
          setSelectedWarehouseId("");
        }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              text
              onClick={() => {
                setReserveDialog(false);
                setReserveItem(null);
                setSelectedWarehouseId("");
              }}
            />
            <Button
              label="Reservar"
              icon="pi pi-lock"
              onClick={confirmReserve}
            />
          </div>
        }
      >
        {loadingReserveMeta ? (
          <div className="py-5 flex justify-content-center">
            <i className="pi pi-spin pi-spinner text-2xl text-500" />
          </div>
        ) : (
          <div className="flex flex-column gap-3">
            <p className="m-0 text-700">
              Selecciona el almacén para reservar el material
              <span className="font-semibold"> {reserveItem?.description}</span>.
            </p>

            <Dropdown
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.value)}
              options={warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: `${warehouse.code} - ${warehouse.name}${reserveItem?.itemId ? ` (Disp: ${stockByWarehouse[warehouse.id] ?? 0})` : ""}`,
              }))}
              placeholder="Selecciona almacén"
              className="w-full"
              disabled={!reserveItem?.itemId}
            />

            {reserveItem?.itemId && selectedWarehouseId && (
              <small className="text-600">
                Disponible en almacén: {stockByWarehouse[selectedWarehouseId] ?? 0}
              </small>
            )}

            {!reserveItem?.itemId && (
              <small className="text-600">
                Este material no está vinculado a un ítem de inventario; no aplica
                reserva de stock.
              </small>
            )}
          </div>
        )}
      </Dialog>

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
