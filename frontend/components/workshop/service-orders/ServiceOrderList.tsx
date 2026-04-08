"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";
import { handleFormError } from "@/utils/errorHandlers";
import { serviceOrderService } from "@/app/api/workshop";
import type {
  ServiceOrder,
  ServiceOrderStatus,
} from "@/libs/interfaces/workshop";
import {
  ServiceOrderStatusBadge,
  ServiceOrderPriorityBadge,
  SO_STATUS_OPTIONS,
} from "@/components/workshop/shared/ServiceOrderStatusBadge";
import ServiceOrderForm from "./ServiceOrderForm";
import ServiceOrderStatusDialog from "./ServiceOrderStatusDialog";
import ServiceOrderStepper from "./ServiceOrderStepper";
import ServiceOrderDetail from "./ServiceOrderDetail";

export default function ServiceOrderList() {
  const searchParams = useSearchParams();
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
  const [detailDialog, setDetailDialog] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<ServiceOrder | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [preloadData, setPreloadData] = useState<{
    receptionId?: string;
    customerId?: string;
    customerVehicleId?: string;
    vehiclePlate?: string;
    mileageIn?: string;
  } | null>(null);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      setPreloadData({
        receptionId: searchParams.get("receptionId") || undefined,
        customerId: searchParams.get("customerId") || undefined,
        customerVehicleId: searchParams.get("customerVehicleId") || undefined,
        vehiclePlate: searchParams.get("vehiclePlate") || undefined,
        mileageIn: searchParams.get("mileageIn") || undefined,
      });
      setSelected(null);
      setFormDialog(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery, statusFilter]);

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
    setPreloadData(null);
    setFormDialog(true);
  };
  const editItem = (item: ServiceOrder) => {
    setSelected({ ...item });
    setPreloadData(null);
    setFormDialog(true);
  };
  const openStatusDialog = (item: ServiceOrder) => {
    setSelected({ ...item });
    setStatusDialog(true);
  };
  const confirmDelete = (item: ServiceOrder) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await serviceOrderService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Orden ${selected.folio} eliminada`,
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
          ? `Orden ${selected.folio} actualizada`
          : "Orden de trabajo creada",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
      setPreloadData(null);
    })();
  };

  const handleStatusSaved = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Estado actualizado",
      life: 3000,
    });
    await loadItems();
    setStatusDialog(false);
    setSelected(null);
  };

  // ── Status transitions ───────────────────────────────────────────────────────

  const handleStatusTransition = async (
    order: ServiceOrder,
    newStatus: ServiceOrderStatus,
  ) => {
    try {
      await serviceOrderService.updateStatus(order.id, { status: newStatus });
      toast.current?.show({
        severity: "success",
        summary: "Estado actualizado",
        detail: `OT ${order.folio} → ${newStatus}`,
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const transitionBodyTemplate = (rowData: ServiceOrder) => {
    const { status } = rowData;
    const terminal = ["DELIVERED", "INVOICED", "CLOSED", "CANCELLED"].includes(status);
    const canCancel = !["DELIVERED", "INVOICED", "CLOSED", "CANCELLED"].includes(status);

    return (
      <div className="flex gap-1 flex-nowrap">
        {status === "DRAFT" && (
          <Button
            icon="pi pi-folder-open"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Abrir"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Abrir la OT ${rowData.folio}?`,
                icon: "pi pi-folder-open",
                iconClass: "text-blue-500",
                acceptLabel: "Abrir",
                acceptSeverity: "info",
                onAccept: () => handleStatusTransition(rowData, "OPEN"),
              })
            }
          />
        )}
        {["OPEN", "DIAGNOSING", "APPROVED"].includes(status) && (
          <Button
            icon="pi pi-play"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Iniciar trabajo"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Iniciar trabajo en la OT ${rowData.folio}?`,
                icon: "pi pi-play",
                iconClass: "text-green-500",
                acceptLabel: "Iniciar",
                acceptSeverity: "success",
                onAccept: () => handleStatusTransition(rowData, "IN_PROGRESS"),
              })
            }
          />
        )}
        {status === "IN_PROGRESS" && (
          <>
            <Button
              icon="pi pi-pause"
              className="p-button-rounded p-button-warning p-button-sm"
              tooltip="Pausar"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Pausar la OT ${rowData.folio}?`,
                  icon: "pi pi-pause",
                  iconClass: "text-orange-500",
                  acceptLabel: "Pausar",
                  acceptSeverity: "warning",
                  onAccept: () => handleStatusTransition(rowData, "PAUSED"),
                })
              }
            />
            <Button
              icon="pi pi-verified"
              className="p-button-rounded p-button-contrast p-button-sm"
              tooltip="Control de calidad"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Mover a control de calidad la OT ${rowData.folio}?`,
                  icon: "pi pi-verified",
                  iconClass: "text-purple-500",
                  acceptLabel: "Confirmar",
                  acceptSeverity: "success",
                  onAccept: () =>
                    handleStatusTransition(rowData, "QUALITY_CHECK"),
                })
              }
            />
          </>
        )}
        {["PAUSED", "WAITING_PARTS", "WAITING_AUTH"].includes(status) && (
          <Button
            icon="pi pi-play"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Reanudar"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Reanudar la OT ${rowData.folio}?`,
                icon: "pi pi-play",
                iconClass: "text-green-500",
                acceptLabel: "Reanudar",
                acceptSeverity: "success",
                onAccept: () => handleStatusTransition(rowData, "IN_PROGRESS"),
              })
            }
          />
        )}
        {status === "QUALITY_CHECK" && (
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Marcar lista"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Marcar como lista la OT ${rowData.folio}?`,
                icon: "pi pi-check",
                iconClass: "text-green-500",
                acceptLabel: "Marcar lista",
                acceptSeverity: "success",
                onAccept: () => handleStatusTransition(rowData, "READY"),
              })
            }
          />
        )}
        {status === "READY" && (
          <Button
            icon="pi pi-car"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Entregar"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Registrar entrega de la OT ${rowData.folio}?`,
                icon: "pi pi-car",
                iconClass: "text-green-500",
                acceptLabel: "Entregar",
                acceptSeverity: "success",
                onAccept: () => handleStatusTransition(rowData, "DELIVERED"),
              })
            }
          />
        )}
        {canCancel && (
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger p-button-sm"
            tooltip="Cancelar OT"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Cancelar la OT ${rowData.folio}?`,
                icon: "pi pi-ban",
                iconClass: "text-red-500",
                acceptLabel: "Sí, Cancelar",
                acceptSeverity: "danger",
                onAccept: () => handleStatusTransition(rowData, "CANCELLED"),
              })
            }
          />
        )}
      </div>
    );
  };

  // ── Row expansion ──────────────────────────────────────────────────────────

  const formatCurrency = (value: number | string) =>
    `$${Number(value || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const rowExpansionTemplate = (data: ServiceOrder) => {
    const orderItems = data.items || [];
    return (
      <div className="p-3">
        <ServiceOrderStepper currentStatus={data.status} />
        {data.diagnosisNotes && (
          <div className="mb-3 p-2 bg-blue-50 border-round border-1 border-blue-100">
            <span className="text-xs font-bold text-500 uppercase">Diagnóstico: </span>
            <span className="text-sm">{data.diagnosisNotes}</span>
          </div>
        )}
        {orderItems.length > 0 ? (
          <div
            style={{
              border: "1px solid var(--surface-300)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 8px",
                backgroundColor: "var(--surface-100)",
                borderBottom: "2px solid var(--surface-300)",
              }}
            >
              {[
                { label: "Tipo", style: { width: "5rem" } },
                { label: "Descripción", style: { flex: "1 1 0", minWidth: 0 } },
                { label: "Cant.", style: { width: "4rem", textAlign: "center" as const } },
                { label: "Precio", style: { width: "5rem", textAlign: "right" as const } },
                { label: "Desc.%", style: { width: "4rem", textAlign: "center" as const } },
                { label: "Impuesto", style: { width: "5rem", textAlign: "center" as const } },
                { label: "Total", style: { width: "6rem", textAlign: "right" as const } },
              ].map((col, i) => (
                <div
                  key={i}
                  style={{
                    ...col.style,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "var(--text-color-secondary)",
                    userSelect: "none",
                    flexShrink: 0,
                  }}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {orderItems.map((line: any, idx: number) => (
              <div
                key={line.id ?? idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderBottom: "1px solid var(--surface-200)",
                }}
              >
                <div style={{ width: "5rem", flexShrink: 0 }}>
                  <Tag
                    value={line.type}
                    severity={
                      line.type === "LABOR"
                        ? "info"
                        : line.type === "PART"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-xs"
                  />
                </div>
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <div className="font-medium text-900" style={{ fontSize: "0.8rem" }}>
                    {line.description || "—"}
                  </div>
                  {line.notes && (
                    <div
                      className="text-500"
                      style={{ fontSize: "0.7rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {line.notes}
                    </div>
                  )}
                </div>
                <div style={{ width: "4rem", textAlign: "center", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>
                  {line.quantity}
                </div>
                <div style={{ width: "5rem", textAlign: "right", fontSize: "0.8rem", flexShrink: 0 }}>
                  {formatCurrency(line.unitPrice)}
                </div>
                <div style={{ width: "4rem", textAlign: "center", fontSize: "0.8rem", flexShrink: 0 }}>
                  {Number(line.discountPct) > 0 ? `${line.discountPct}%` : "—"}
                </div>
                <div style={{ width: "5rem", textAlign: "center", flexShrink: 0 }}>
                  <Tag
                    value={
                      line.taxType === "EXEMPT"
                        ? "Exento"
                        : line.taxType === "REDUCED"
                        ? "Red. 8%"
                        : "IVA 16%"
                    }
                    severity={line.taxType === "EXEMPT" ? "warning" : "info"}
                    className="text-xs"
                  />
                </div>
                <div style={{ width: "6rem", textAlign: "right", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>
                  {formatCurrency(line.total)}
                </div>
              </div>
            ))}

            {/* Footer de totales */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                gap: "1rem",
                padding: "8px",
                backgroundColor: "var(--surface-50)",
                borderTop: "2px solid var(--surface-300)",
                fontSize: "0.8rem",
              }}
            >
              <span className="text-500">
                Mano de obra: <b>{formatCurrency(data.laborTotal)}</b>
              </span>
              <span className="text-500">
                Partes: <b>{formatCurrency(data.partsTotal)}</b>
              </span>
              <span className="text-blue-500">
                IVA: <b>{formatCurrency(data.taxAmt)}</b>
              </span>
              <span className="text-primary font-bold">
                Total: {formatCurrency(data.total)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center text-500 p-3">
            <i className="pi pi-inbox mr-2" />
            No hay ítems en esta orden
          </div>
        )}
      </div>
    );
  };

  // ── Templates ───────────────────────────────────────────────────────────────

  const folioTemplate = (row: ServiceOrder) => (
    <span
      className="font-bold text-primary cursor-pointer hover:underline"
      onClick={() => { setDetailId(row.id); setDetailItem(row); setDetailDialog(true); }}
    >
      {row.folio}
    </span>
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
      {row.vehicleDesc && (
        <div className="text-xs text-500">{row.vehicleDesc}</div>
      )}
    </div>
  );

  const totalTemplate = (row: ServiceOrder) => (
    <span className="font-semibold">
      {new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(row.total)}
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
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            style={{ width: "16rem" }}
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={[
            { label: "Todos los estados", value: "" },
            ...SO_STATUS_OPTIONS,
          ]}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          style={{ width: "14rem" }}
        />
        <CreateButton
          label="Nueva OT"
          onClick={openNew}
          tooltip="Crear orden de trabajo"
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Toast ref={toast} />
      <ConfirmActionPopup />
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
          emptyMessage="No se encontraron órdenes de trabajo"
          sortMode="multiple"
          scrollable
          size="small"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Proceso"
            body={transitionBodyTemplate}
            style={{ minWidth: "140px", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column
            field="folio"
            header="Folio"
            sortable
            body={folioTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "150px" }}
          />
          <Column
            field="priority"
            header="Prioridad"
            body={priorityTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Cliente"
            body={customerTemplate}
            style={{ minWidth: "180px" }}
          />
          <Column
            header="Vehículo"
            body={vehicleTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            field="receivedAt"
            header="Recibida"
            body={dateTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="total"
            header="Total"
            body={totalTemplate}
            sortable
            style={{ minWidth: "120px" }}
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
        style={{ width: "860px" }}
        breakpoints={{ "1200px": "860px", "900px": "90vw", "600px": "100vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-file-edit mr-3 text-primary text-3xl" />
                {selected?.id
                  ? `Editar ${selected.folio}`
                  : preloadData
                  ? "Orden de Trabajo desde Recepción"
                  : "Nueva Orden de Trabajo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => {
          setFormDialog(false);
          setSelected(null);
          setPreloadData(null);
        }}
        footer={
          <FormActionButtons
            formId="service-order-form"
            isUpdate={!!selected?.id}
            onCancel={() => {
              setFormDialog(false);
              setSelected(null);
              setPreloadData(null);
            }}
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
          preloadData={preloadData ?? undefined}
        />
      </Dialog>

      {/* Status Dialog */}
      <ServiceOrderStatusDialog
        visible={statusDialog}
        order={selected}
        onHide={() => {
          setStatusDialog(false);
          setSelected(null);
        }}
        onSaved={handleStatusSaved}
        toast={toast}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        itemName={selected?.folio}
        isDeleting={isDeleting}
      />

      {/* Detail Dialog */}
      <Dialog
        visible={detailDialog}
        onHide={() => { setDetailDialog(false); setDetailId(null); setDetailItem(null); }}
        maximizable
        modal
        draggable={false}
        style={{ width: "95vw" }}
        breakpoints={{ "960px": "98vw" }}
        contentStyle={{ padding: 0 }}
        header={
          detailItem ? (
            <div className="flex align-items-center gap-2 flex-wrap">
              <i className="pi pi-wrench text-primary" />
              <span className="font-semibold">{detailItem.folio}</span>
              <span className="text-600 text-sm">·</span>
              <span className="text-sm text-600">
                {detailItem.vehiclePlate}
                {detailItem.vehicleDesc ? ` — ${detailItem.vehicleDesc}` : ""}
              </span>
              <div className="ml-auto">
                <ServiceOrderStatusBadge status={detailItem.status} />
              </div>
            </div>
          ) : (
            <span>Orden de Servicio</span>
          )
        }
      >
        {detailId && (
          <ServiceOrderDetail
            serviceOrderId={detailId}
            embedded
            onClose={() => { setDetailDialog(false); setDetailId(null); setDetailItem(null); loadItems(); }}
          />
        )}
      </Dialog>

      {/* Actions Menu */}
      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Ver detalle",
                  icon: "pi pi-eye",
                  command: () => { setDetailId(actionItem.id); setDetailItem(actionItem); setDetailDialog(true); },
                },
                { separator: true },
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
