"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { motion } from "framer-motion";
import serviceOrderService, {
  ServiceOrder,
  ServiceOrderStatus,
} from "@/app/api/workshop/serviceOrderService";
import ServiceOrderForm from "./ServiceOrderForm";
import CreateButton from "@/components/common/CreateButton";

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  RECEIVED: "Recibido",
  IN_PROGRESS: "En trabajo",
  DONE: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const STATUS_SEVERITY: Record<
  ServiceOrderStatus,
  "info" | "warning" | "success" | "secondary" | "danger"
> = {
  RECEIVED: "info",
  IN_PROGRESS: "warning",
  DONE: "success",
  DELIVERED: "secondary",
  CANCELLED: "danger",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  label,
  value,
}));

const NEXT_STATUS: Partial<Record<ServiceOrderStatus, ServiceOrderStatus>> = {
  RECEIVED: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "DELIVERED",
};

// ── Component ─────────────────────────────────────────────────────────────

const ServiceOrderList = () => {
  const toast = useRef<Toast | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | "">("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialogs
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<ServiceOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await serviceOrderService.getAll({
        page,
        limit,
        search: search || undefined,
        status: (statusFilter as ServiceOrderStatus) || undefined,
        sortBy: "receivedAt",
        sortOrder: "desc",
      });
      if (res.data) {
        setOrders(res.data as any);
        setTotal((res as any).pagination?.total ?? 0);
      }
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las órdenes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdvanceStatus = async (order: ServiceOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await serviceOrderService.updateStatus(order.id, { status: next });
      toast.current?.show({
        severity: "success",
        summary: "Estado actualizado",
        detail: `${order.folio} → ${STATUS_LABELS[next]}`,
        life: 2500,
      });
      load();
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.error ?? "No se pudo cambiar el estado",
        life: 3000,
      });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await serviceOrderService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: `${selected.folio} eliminado`,
        life: 2500,
      });
      setDeleteDialog(false);
      setSelected(null);
      load();
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.error ?? "No se pudo eliminar",
        life: 3000,
      });
    }
  };

  // ── Templates ───────────────────────────────────────────────────────────

  const folioTemplate = (row: ServiceOrder) => (
    <span className="font-bold text-primary">{row.folio}</span>
  );

  const statusTemplate = (row: ServiceOrder) => (
    <Tag
      value={STATUS_LABELS[row.status]}
      severity={STATUS_SEVERITY[row.status]}
    />
  );

  const customerTemplate = (row: ServiceOrder) => (
    <div>
      <div className="font-semibold">{row.customer?.name ?? "—"}</div>
      <div className="text-xs text-500">{row.customer?.code}</div>
    </div>
  );

  const vehicleTemplate = (row: ServiceOrder) => (
    <div>
      <div className="font-semibold">{row.vehiclePlate ?? "—"}</div>
      {row.vehicleDesc && (
        <div className="text-xs text-500">{row.vehicleDesc}</div>
      )}
    </div>
  );

  const totalTemplate = (row: ServiceOrder) => (
    <span className="font-semibold">{Number(row.total).toFixed(2)}</span>
  );

  const dateTemplate = (row: ServiceOrder) =>
    new Date(row.receivedAt).toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const actionsTemplate = (row: ServiceOrder) => {
    const next = NEXT_STATUS[row.status];
    return (
      <div className="flex gap-1">
        {next && (
          <Button
            icon="pi pi-arrow-right"
            size="small"
            text
            severity="success"
            tooltip={`Avanzar a: ${STATUS_LABELS[next]}`}
            tooltipOptions={{ position: "top" }}
            onClick={() => handleAdvanceStatus(row)}
          />
        )}
        <Button
          icon="pi pi-pencil"
          size="small"
          text
          severity="info"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
          disabled={row.status === "DELIVERED" || row.status === "CANCELLED"}
          onClick={() => {
            setSelected(row);
            setFormDialog(true);
          }}
        />
        <Button
          icon="pi pi-trash"
          size="small"
          text
          severity="danger"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          disabled={
            row.status !== "RECEIVED" && row.status !== "CANCELLED"
          }
          onClick={() => {
            setSelected(row);
            setDeleteDialog(true);
          }}
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex gap-2 flex-wrap">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Folio, placa, cliente..."
            className="w-14rem"
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={[{ label: "Todos los estados", value: "" }, ...STATUS_OPTIONS]}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(1);
          }}
          className="w-12rem"
        />
      </div>
      <CreateButton
        label="Nueva orden"
        onClick={() => {
          setSelected(null);
          setFormDialog(true);
        }}
        tooltip="Nueva orden de taller"
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          value={orders}
          header={header}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e) => setPage(Math.floor(e.first / limit) + 1)}
          emptyMessage="No hay órdenes de taller"
          size="small"
          rowClassName={(row: ServiceOrder) =>
            row.status === "DONE" ? "bg-green-50" : ""
          }
        >
          <Column body={actionsTemplate} style={{ width: "8rem" }} />
          <Column field="folio" header="Folio" body={folioTemplate} sortable />
          <Column header="Estado" body={statusTemplate} />
          <Column header="Cliente" body={customerTemplate} />
          <Column header="Vehículo" body={vehicleTemplate} />
          <Column header="Recibido" body={dateTemplate} sortable field="receivedAt" />
          <Column field="total" header="Total" body={totalTemplate} sortable />
        </DataTable>
      </motion.div>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "860px" }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-wrench text-primary text-xl" />
            <span className="font-bold text-lg">
              {selected ? `Editar ${selected.folio}` : "Nueva Orden de Taller"}
            </span>
          </div>
        }
        modal
        maximizable
        onHide={() => {
          setFormDialog(false);
          setSelected(null);
        }}
      >
        <ServiceOrderForm
          order={selected}
          onSave={() => {
            setFormDialog(false);
            setSelected(null);
            load();
          }}
          onCancel={() => {
            setFormDialog(false);
            setSelected(null);
          }}
          toast={toast}
        />
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        visible={deleteDialog}
        style={{ width: "400px" }}
        header="Confirmar eliminación"
        modal
        onHide={() => setDeleteDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setDeleteDialog(false)}
            />
            <Button
              label="Eliminar"
              icon="pi pi-trash"
              severity="danger"
              onClick={handleDelete}
            />
          </div>
        }
      >
        <div className="flex align-items-center gap-3">
          <i className="pi pi-exclamation-triangle text-3xl text-orange-500" />
          <span>
            ¿Eliminar la orden <b>{selected?.folio}</b>? Esta acción no se puede
            deshacer.
          </span>
        </div>
      </Dialog>
    </>
  );
};

export default ServiceOrderList;
