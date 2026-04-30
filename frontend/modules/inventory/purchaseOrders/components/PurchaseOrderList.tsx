"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import purchaseOrderService from "@/modules/inventory/purchaseOrders/services/purchaseOrderService";
import entryNoteService from "@/modules/inventory/entryNotes/services/entryNoteService";
import { AuditTrailDialog } from "@/components/audit/AuditTrail";
import PurchaseOrderForm from "./PurchaseOrderForm";
import PurchaseOrderStepper from "./PurchaseOrderStepper";
import { PurchaseOrder, PO_STATUS_CONFIG } from "@/modules/inventory/purchaseOrders/interfaces/purchaseOrder.interface";
import itemService, { type Item } from "@/modules/inventory/items/services/itemService";
import supplierService, {
  type Supplier,
} from "@/modules/inventory/suppliers/services/supplierService";
import warehouseService, {
  type Warehouse,
} from "@/modules/inventory/warehouses/services/warehouseService";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { Tag } from "primereact/tag";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/shared/components/FormActionButtons";

const PurchaseOrderList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contextualSearchFilter = searchParams.get("search") || "";
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState(
    contextualSearchFilter,
  );
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrderToReject, setSelectedOrderToReject] =
    useState<PurchaseOrder | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [actionPurchaseOrder, setActionPurchaseOrder] =
    useState<PurchaseOrder | null>(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [auditDialog, setAuditDialog] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);
  const menuRef = useRef<Menu>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalFilterValue);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilterValue]);

  useEffect(() => {
    setGlobalFilterValue(contextualSearchFilter);
    setPage(0);
  }, [contextualSearchFilter]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [page, rows, sortField, sortOrder, debouncedSearch]);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const [itemsRes, suppliersRes, warehousesRes] = await Promise.all([
        itemService.getActive(),
        supplierService.getActive(),
        warehouseService.getActive(),
      ]);

      // itemService.getActive → { data: Item[] }
      const itemList = itemsRes?.data ?? [];
      setItems(Array.isArray(itemList) ? itemList : []);

      // getActiveSuppliers → { data: Supplier[] }
      const supplierList = suppliersRes?.data ?? [];
      setSuppliers(Array.isArray(supplierList) ? supplierList : []);

      // getActiveWarehouses → { data: Warehouse[] }
      const warehouseList = warehousesRes?.data ?? [];
      setWarehouses(Array.isArray(warehouseList) ? warehouseList : []);
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await purchaseOrderService.getAll({
        page: page + 1,
        limit: rows,
        sortBy: sortField,
        sortOrder: sortOrder,
        search: debouncedSearch || undefined,
      });

      setPurchaseOrders(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener órdenes de compra:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las órdenes de compra",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    const newPage =
      event.page !== undefined
        ? event.page
        : Math.floor(event.first / event.rows);
    setPage(newPage);
    setRows(event.rows);
  };

  const onSort = (event: any) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder === 1 ? "asc" : "desc");
  };

  /* ── Helpers ── */
  const formatCurrency = (value: number | string, currency = "USD") => {
    const symbol = currency === "VES" ? "Bs." : currency === "EUR" ? "€" : "$";
    return `${symbol}${Number(value || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEditableOrder = (po: PurchaseOrder | null) =>
    !po || po.status === "DRAFT" || po.status === "REJECTED";

  const openFormDialog = () => {
    setPurchaseOrder(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setPurchaseOrder(null);
    setFormDialog(false);
  };

  const mergePurchaseOrder = (updatedOrder?: PurchaseOrder | null) => {
    if (!updatedOrder?.id) return;

    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === updatedOrder.id ? { ...po, ...updatedOrder } : po,
      ),
    );
    setPurchaseOrder((prev) =>
      prev?.id === updatedOrder.id ? { ...prev, ...updatedOrder } : prev,
    );
    setActionPurchaseOrder((prev) =>
      prev?.id === updatedOrder.id ? { ...prev, ...updatedOrder } : prev,
    );
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: purchaseOrder?.id
        ? "Orden de compra actualizada correctamente"
        : "Orden de compra creada correctamente",
      life: 3000,
    });
    await loadPurchaseOrders();
    hideFormDialog();
  };

  const handleDelete = async () => {
    if (!purchaseOrder?.id) return;
    const deletedId = purchaseOrder.id;
    const remainingRows = purchaseOrders.length - 1;
    setIsDeleting(true);
    try {
      await purchaseOrderService.delete(deletedId);
      setPurchaseOrders((prev) => prev.filter((po) => po.id !== deletedId));
      setTotalRecords((prev) => Math.max(0, prev - 1));
      if (remainingRows <= 0 && page > 0) setPage((prev) => prev - 1);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Orden de Compra Eliminada",
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsDeleting(false);
      setPurchaseOrder(null);
      setDeleteDialog(false);
    }
  };

  const handleSubmitForApproval = async (po: PurchaseOrder) => {
    try {
      const response = await purchaseOrderService.submit(po.id);
      mergePurchaseOrder(response.data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Orden ${po.orderNumber} enviada para aprobación`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleApprove = async (po: PurchaseOrder) => {
    try {
      const response = await purchaseOrderService.approve(po.id);
      mergePurchaseOrder(response.data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Orden ${po.orderNumber} aprobada`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const openRejectDialog = (po: PurchaseOrder) => {
    setSelectedOrderToReject(po);
    setRejectionReason("");
    setRejectDialog(true);
  };

  const hideRejectDialog = () => {
    setSelectedOrderToReject(null);
    setRejectionReason("");
    setRejectDialog(false);
  };

  const handleReject = async () => {
    if (!selectedOrderToReject || !rejectionReason.trim()) return;
    try {
      const response = await purchaseOrderService.reject(
        selectedOrderToReject.id,
        rejectionReason.trim(),
      );
      mergePurchaseOrder(response.data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Orden ${selectedOrderToReject.orderNumber} rechazada`,
        life: 3000,
      });
      hideRejectDialog();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleSend = async (po: PurchaseOrder) => {
    try {
      const response = await purchaseOrderService.send(po.id);
      mergePurchaseOrder(response.data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Orden ${po.orderNumber} enviada al proveedor`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleReceiveInEntryNote = async (po: PurchaseOrder) => {
    try {
      const response = await entryNoteService.createFromPurchaseOrder(po.id);
      const entryNote = response.data;
      toast.current?.show({
        severity: "success",
        summary: "Nota de entrada",
        detail: `Abriendo recepción ${entryNote.entryNoteNumber}`,
        life: 3000,
      });
      router.push(
        `/empresa/inventario/notas-entrada?search=${encodeURIComponent(
          entryNote.entryNoteNumber,
        )}`,
      );
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleCancel = async (po: PurchaseOrder) => {
    try {
      const response = await purchaseOrderService.cancel(po.id);
      mergePurchaseOrder(response.data);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Orden ${po.orderNumber} cancelada`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const hideAuditDialog = () => {
    setAuditDialog(false);
    setActionPurchaseOrder(null);
  };

  const openAuditDialog = (po: PurchaseOrder) => {
    setActionPurchaseOrder(po);
    setAuditDialog(true);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setGlobalFilterValue(value);
    setPage(0); // Reset page on search
  };

  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Órdenes de Compra</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center w-full sm:w-auto">
        <span className="p-input-icon-left w-full sm:w-20rem">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar orden (nro, proveedor, almacén...)"
            className="w-full"
          />
        </span>
        <CreateButton
          label="Nueva Orden"
          onClick={openFormDialog}
          tooltip="Crear nueva orden de compra"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );

  /* ── Action buttons based on status ── */
  const actionBodyTemplate = (rowData: PurchaseOrder) => {
    const { status } = rowData;

    return (
      <div className="flex gap-1 flex-nowrap">
        {/* DRAFT / REJECTED → Enviar para aprobación */}
        {(status === "DRAFT" || status === "REJECTED") && (
          <Button
            icon="pi pi-send"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Enviar para aprobación"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Enviar la orden ${rowData.orderNumber} para aprobación?`,
                icon: "pi pi-send",
                iconClass: "text-blue-500",
                acceptLabel: "Enviar",
                acceptSeverity: "info",
                onAccept: () => handleSubmitForApproval(rowData),
              })
            }
          />
        )}

        {/* PENDING_APPROVAL → Aprobar / Rechazar / Cancelar */}
        {status === "PENDING_APPROVAL" && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Aprobar"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Aprobar la orden ${rowData.orderNumber}?`,
                  icon: "pi pi-check",
                  iconClass: "text-green-500",
                  acceptLabel: "Aprobar",
                  acceptSeverity: "success",
                  onAccept: () => handleApprove(rowData),
                })
              }
            />
            <Button
              icon="pi pi-ban"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Rechazar"
              tooltipOptions={{ position: "top" }}
              onClick={() => openRejectDialog(rowData)}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar Orden"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Cancelar la orden ${rowData.orderNumber}? Esta acción no se puede deshacer.`,
                  icon: "pi pi-ban",
                  iconClass: "text-red-500",
                  acceptLabel: "Sí, Cancelar",
                  acceptSeverity: "danger",
                  onAccept: () => handleCancel(rowData),
                })
              }
            />
          </>
        )}

        {/* APPROVED → Enviar al proveedor / Cancelar */}
        {status === "APPROVED" && (
          <>
            <Button
              icon="pi pi-truck"
              className="p-button-rounded p-button-warning p-button-sm"
              tooltip="Enviar al proveedor"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Enviar la orden ${rowData.orderNumber} al proveedor?`,
                  icon: "pi pi-truck",
                  iconClass: "text-orange-500",
                  acceptLabel: "Enviar",
                  acceptSeverity: "warning",
                  onAccept: () => handleSend(rowData),
                })
              }
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar Orden"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Cancelar la orden ${rowData.orderNumber}? Esta acción no se puede deshacer.`,
                  icon: "pi pi-ban",
                  iconClass: "text-red-500",
                  acceptLabel: "Sí, Cancelar",
                  acceptSeverity: "danger",
                  onAccept: () => handleCancel(rowData),
                })
              }
            />
          </>
        )}

        {/* SENT / PARTIAL → Recepcionar / Cancelar */}
        {(status === "SENT" || status === "PARTIAL") && (
          <>
            <Button
              icon="pi pi-inbox"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Recepcionar en Nota de Entrada"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleReceiveInEntryNote(rowData)}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar Orden"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Cancelar la orden ${rowData.orderNumber}? Esta acción no se puede deshacer.`,
                  icon: "pi pi-ban",
                  iconClass: "text-red-500",
                  acceptLabel: "Sí, Cancelar",
                  acceptSeverity: "danger",
                  onAccept: () => handleCancel(rowData),
                })
              }
            />
          </>
        )}

        {/* COMPLETED / CANCELLED → Solo ver */}
        {(status === "COMPLETED" || status === "CANCELLED") && (
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-secondary p-button-sm"
            tooltip="Ver detalle"
            tooltipOptions={{ position: "top" }}
            onClick={() => {
              setPurchaseOrder(rowData);
              setFormDialog(true);
            }}
          />
        )}
      </div>
    );
  };

  /* CRUD actions (View / Audit / Edit / Delete) */
  const getMenuItems = (po: PurchaseOrder | null): MenuItem[] => {
    if (!po) return [];

    const editable = isEditableOrder(po);
    const items: MenuItem[] = [
      {
        label: editable ? "Editar" : "Ver detalle",
        icon: editable ? "pi pi-pencil" : "pi pi-eye",
        command: () => {
          setPurchaseOrder(po);
          setFormDialog(true);
        },
      },
      {
        label: "Auditoría",
        icon: "pi pi-history",
        command: () => openAuditDialog(po),
      },
    ];

    if (!editable) return items;

    items.push(
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => {
          setPurchaseOrder(po);
          setDeleteDialog(true);
        },
      },
    );

    return items;
  };

  const crudBodyTemplate = (rowData: PurchaseOrder) => {
    return (
      <Button
        icon="pi pi-cog"
        rounded
        text
        onClick={(e) => {
          setActionPurchaseOrder(rowData);
          menuRef.current?.toggle(e);
        }}
        aria-controls="purchase-order-menu"
        aria-haspopup
        tooltip="Opciones"
        tooltipOptions={{ position: "left" }}
      />
    );
  };

  /* ── Status tag ── */
  const statusBodyTemplate = (rowData: PurchaseOrder) => {
    const config = PO_STATUS_CONFIG[rowData.status] || {
      label: rowData.status,
      severity: "secondary" as const,
    };
    return (
      <Tag
        value={config.label}
        severity={config.severity}
        className="text-xs"
      />
    );
  };

  /* ── Total formatted ── */
  const totalBodyTemplate = (rowData: PurchaseOrder) => {
    return (
      <span className="font-semibold text-primary">
        {formatCurrency(rowData.total, rowData.currency)}
      </span>
    );
  };

  /* ── Items count ── */
  const itemsCountBodyTemplate = (rowData: PurchaseOrder) => {
    const count = rowData.items?.length || 0;
    return (
      <Tag
        value={`${count} ${count === 1 ? "artículo" : "artículos"}`}
        severity={count > 0 ? "info" : "warning"}
        className="text-xs"
      />
    );
  };

  /* ── Date format ── */
  const dateBodyTemplate = (rowData: PurchaseOrder) =>
    formatDate(rowData.expectedDate);

  /* ── Row expansion with stepper ── */
  const rowExpansionTemplate = (data: PurchaseOrder) => {
    const orderTotal =
      data.items?.reduce(
        (sum, l) => sum + Number(l.totalLine || l.subtotal || 0),
        0,
      ) ?? 0;

    return (
      <div className="p-3">
        <PurchaseOrderStepper currentStatus={data.status} />
        {data.items && data.items.length > 0 && (
          <div className="mt-3">
            <div
              style={{
                border: "1px solid var(--surface-300)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
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
                  { label: "Artículo", style: { flex: "1 1 0", minWidth: 0 } },
                  {
                    label: "Ord.",
                    style: { width: "4.5rem", textAlign: "center" as const },
                  },
                  {
                    label: "Rec.",
                    style: { width: "4.5rem", textAlign: "center" as const },
                  },
                  {
                    label: "Pend.",
                    style: { width: "4.5rem", textAlign: "center" as const },
                  },
                  {
                    label: "Costo Unit.",
                    style: { width: "6rem", textAlign: "right" as const },
                  },
                  {
                    label: "Desc. %",
                    style: { width: "5rem", textAlign: "center" as const },
                  },
                  {
                    label: "Impuesto",
                    style: { width: "5.5rem", textAlign: "center" as const },
                  },
                  {
                    label: "Total Línea",
                    style: { width: "6.5rem", textAlign: "right" as const },
                  },
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

              {/* Rows */}
              {data.items.map((line) => (
                <div
                  key={line.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    borderBottom: "1px solid var(--surface-200)",
                  }}
                >
                  {/* Artículo */}
                  <div style={{ flex: "1 1 0", minWidth: 0 }}>
                    <div
                      className="font-medium text-900"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {line.item?.sku || "—"}
                    </div>
                    <div
                      className="text-500"
                      style={{
                        fontSize: "0.7rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={line.itemName || line.item?.name || ""}
                    >
                      {line.itemName || line.item?.name || "Sin nombre"}
                    </div>
                  </div>

                  {/* Ordenado */}
                  <div
                    style={{
                      width: "4.5rem",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {line.quantityOrdered}
                  </div>

                  {/* Recibido */}
                  <div
                    style={{
                      width: "4.5rem",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {line.quantityReceived}
                  </div>

                  {/* Pendiente */}
                  <div
                    style={{
                      width: "4.5rem",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className={
                        line.quantityPending > 0
                          ? "text-orange-500 font-bold"
                          : "text-green-600"
                      }
                    >
                      {line.quantityPending}
                    </span>
                  </div>

                  {/* Costo Unit. */}
                  <div
                    style={{
                      width: "6rem",
                      textAlign: "right",
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {formatCurrency(Number(line.unitCost || 0), data.currency)}
                  </div>

                  {/* Desc % */}
                  <div
                    style={{
                      width: "5rem",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {Number(line.discountPercent || 0) > 0 ? (
                      <span className="text-green-600 font-medium">
                        {Number(line.discountPercent)}%
                      </span>
                    ) : (
                      <span className="text-400">—</span>
                    )}
                  </div>

                  {/* Impuesto */}
                  <div
                    style={{
                      width: "5.5rem",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    <Tag
                      value={
                        line.taxType === "EXEMPT"
                          ? "Exento"
                          : line.taxType === "REDUCED"
                          ? "Red. 8%"
                          : "IVA 16%"
                      }
                      severity={
                        line.taxType === "EXEMPT"
                          ? "secondary"
                          : line.taxType === "REDUCED"
                          ? "warning"
                          : "info"
                      }
                      className="text-xs"
                      style={{ fontSize: "0.65rem" }}
                    />
                  </div>

                  {/* Total Línea */}
                  <div
                    style={{
                      width: "6.5rem",
                      textAlign: "right",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {formatCurrency(
                      Number(line.totalLine || line.subtotal || 0),
                      data.currency,
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            {orderTotal > 0 && (
              <div className="flex justify-content-end mt-2">
                <div className="surface-100 border-round px-4 py-2">
                  <span className="text-500 mr-3">Total:</span>
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(orderTotal, data.currency)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading && purchaseOrders.length === 0) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <ConfirmActionPopup />
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 40,
          filter: "blur(8px)",
        }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={purchaseOrders}
          header={renderHeader()}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          onSort={onSort}
          sortField={sortField}
          sortOrder={sortOrder === "asc" ? 1 : -1}
          sortMode="multiple"
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes de compra"
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage="No hay órdenes de compra disponibles"
          rowClassName={() => "animated-row"}
          size="small"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          dataKey="id"
          scrollable
          tableStyle={{ minWidth: "75rem" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Proceso"
            body={actionBodyTemplate}
            style={{ width: "7rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column field="orderNumber" header="Número" sortable />
          <Column
            header="Proveedor"
            sortable
            sortField="supplier.name"
            body={(rowData: PurchaseOrder) => rowData.supplier?.name || "—"}
          />
          <Column
            header="Almacén"
            sortable
            sortField="warehouse.name"
            body={(rowData: PurchaseOrder) => rowData.warehouse?.name || "—"}
          />
          <Column
            header="F. Esperada"
            body={dateBodyTemplate}
            sortable
            sortField="expectedDate"
          />
          <Column
            header="Artículos"
            body={itemsCountBodyTemplate}
            style={{ width: "8rem" }}
            className="text-center"
          />
          <Column
            header="Total"
            body={totalBodyTemplate}
            sortable
            sortField="total"
            style={{ width: "9rem" }}
            className="text-right"
          />
          <Column
            field="status"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ width: "8rem" }}
            className="text-center"
            headerStyle={{ textAlign: "center" }}
          />
          <Column
            header="Acciones"
            body={crudBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>

        {/* Delete confirmation */}
        <DeleteConfirmDialog
          visible={deleteDialog}
          onHide={hideDeleteDialog}
          onConfirm={handleDelete}
          itemName={purchaseOrder?.orderNumber}
          isDeleting={isDeleting}
        />

        {/* Form dialog */}
        <Dialog
          visible={formDialog}
          style={{ width: "75vw" }}
          breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
          maximizable
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-shopping-cart mr-3 text-primary text-3xl"></i>
                  {purchaseOrder
                    ? isEditableOrder(purchaseOrder)
                      ? "Editar Orden de Compra"
                      : "Detalle de Orden de Compra"
                    : "Nueva Orden de Compra"}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={hideFormDialog}
          footer={
            isEditableOrder(purchaseOrder) ? (
              <FormActionButtons
                formId="purchase-order-form"
                isUpdate={!!purchaseOrder?.id}
                onCancel={hideFormDialog}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="flex justify-content-end mb-4">
                <Button
                  label="Cerrar"
                  icon="pi pi-times"
                  severity="secondary"
                  onClick={hideFormDialog}
                />
              </div>
            )
          }
        >
          <PurchaseOrderForm
            purchaseOrder={purchaseOrder}
            formId="purchase-order-form"
            onSave={handleSave}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
            items={items}
            suppliers={suppliers}
            warehouses={warehouses}
          />
        </Dialog>

        {/* Reject dialog */}
        <Dialog
          visible={rejectDialog}
          style={{ width: "34rem" }}
          breakpoints={{ "600px": "95vw" }}
          header="Rechazar Orden"
          modal
          onHide={hideRejectDialog}
          footer={
            <div className="flex justify-content-end gap-2">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                severity="secondary"
                text
                onClick={hideRejectDialog}
              />
              <Button
                label="Rechazar"
                icon="pi pi-ban"
                severity="danger"
                disabled={rejectionReason.trim().length < 3}
                onClick={handleReject}
              />
            </div>
          }
        >
          <div className="flex flex-column gap-2">
            <label htmlFor="rejectionReason" className="font-medium text-900">
              Motivo
            </label>
            <InputTextarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={5}
              autoResize
              autoFocus
              placeholder="Indique el motivo del rechazo"
              className="w-full"
            />
            <small className="text-600">
              Mínimo 3 caracteres. Este motivo quedará en la auditoría.
            </small>
          </div>
        </Dialog>

        <AuditTrailDialog
          visible={auditDialog}
          onHide={hideAuditDialog}
          entity="PurchaseOrder"
          entityId={actionPurchaseOrder?.id}
          title="Historial de orden de compra"
          subtitle={actionPurchaseOrder?.orderNumber}
          toast={toast}
        />

        <Menu
          model={getMenuItems(actionPurchaseOrder)}
          popup
          ref={menuRef}
          id="purchase-order-menu"
        />
      </motion.div>
    </>
  );
};

export default PurchaseOrderList;
