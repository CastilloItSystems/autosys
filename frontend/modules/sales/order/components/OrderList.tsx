"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";
import orderService from "../services/orderService";
import {
  Order,
  OrderItem,
  OrderStatus,
  ORDER_STATUS_CONFIG,
  ORDER_CURRENCY_LABELS,
  OrderCurrency,
  OrderSalesStockDiagnosis,
  OrderSuggestedReplenishmentResult,
} from "../interfaces/order.interface";
import itemService, { Item } from "@/app/api/inventory/itemService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import customerService, {
  Customer,
} from "@/modules/sales/customer/services/customerService";
import supplierService, { Supplier } from "@/app/api/inventory/supplierService";
import OrderForm from "./OrderForm";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/shared/components/FormActionButtons";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";
import OrderStepper from "./OrderStepper";
import { AuditTrailDialog } from "@/components/audit/AuditTrail";

const formatCurrency = (value: number | string) =>
  `$${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const extractSalesStockShortage = (
  error: unknown,
): OrderSalesStockDiagnosis | null => {
  const axiosError = error as AxiosError<{
    errors?: Array<Record<string, any>>;
  }>;

  const errors = axiosError.response?.data?.errors;
  if (!Array.isArray(errors)) return null;

  const payload = errors.find(
    (entry) =>
      entry?.code === "SALES_STOCK_SHORTAGE" &&
      (!entry?.scope || entry?.scope === "ORDER"),
  );
  if (!payload) return null;

  return {
    orderId: String(payload.orderId ?? ""),
    orderNumber: String(payload.orderNumber ?? ""),
    salesWarehouse: payload.salesWarehouse ?? null,
    hasShortages: Boolean(payload.hasShortages),
    shortages: Array.isArray(payload.shortages) ? payload.shortages : [],
  };
};

const OrderList = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [shortageDialogVisible, setShortageDialogVisible] = useState(false);
  const [shortagePayload, setShortagePayload] =
    useState<OrderSalesStockDiagnosis | null>(null);
  const [resolvingReplenishment, setResolvingReplenishment] = useState(false);
  const [replenishmentResult, setReplenishmentResult] =
    useState<OrderSuggestedReplenishmentResult | null>(null);
  const [purchaseOverrides, setPurchaseOverrides] = useState<
    Record<string, { purchaseQuantity: number; supplierId?: string }>
  >({});
  const [auditDialog, setAuditDialog] = useState(false);
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);
  const menuRef = useRef<Menu>(null);

  // ── Debounced search ──
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalFilterValue);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilterValue]);

  useEffect(() => {
    loadOrders();
  }, [page, rows, sortField, sortOrder, debouncedSearch]);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const [whRes, itemRes, custRes, supRes] = await Promise.all([
        warehouseService.getActive(),
        itemService.getActive(),
        customerService.getActive(),
        supplierService.getActive(),
      ]);
      setWarehouses(whRes.data || []);
      setItems(itemRes.data || []);
      setCustomers(custRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAll({
        page: page + 1,
        limit: rows,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setPage(
      event.page !== undefined
        ? event.page
        : Math.floor(event.first / event.rows),
    );
    setRows(event.rows);
  };

  const onSort = (event: any) => {
    const newField = event.sortField;
    const newOrder = event.sortOrder === 1 ? "asc" : "desc";
    if (newField !== sortField || newOrder !== sortOrder) {
      setSortField(newField);
      setSortOrder(newOrder as "asc" | "desc");
    }
  };

  /* ── Helpers ── */
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ── Actions ── */
  const openNew = () => {
    setSelectedOrder(null);
    setFormDialog(true);
  };

  const mergeOrder = (updatedOrder?: Order | null) => {
    if (!updatedOrder?.id) return;
    setOrders((prev) =>
      prev.map((order) =>
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order,
      ),
    );
    setSelectedOrder((prev) =>
      prev?.id === updatedOrder.id ? { ...prev, ...updatedOrder } : prev,
    );
    setActionOrder((prev) =>
      prev?.id === updatedOrder.id ? { ...prev, ...updatedOrder } : prev,
    );
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedOrder?.id ? "Orden actualizada" : "Orden creada",
      life: 3000,
    });
    await loadOrders();
    setFormDialog(false);
    setSelectedOrder(null);
  };

  const handleDelete = async () => {
    try {
      if (selectedOrder?.id) {
        const deletedId = selectedOrder.id;
        const remainingRows = orders.length - 1;
        await orderService.delete(deletedId);
        setOrders((prev) => prev.filter((order) => order.id !== deletedId));
        setTotalRecords((prev) => Math.max(0, prev - 1));
        if (remainingRows <= 0 && page > 0) setPage((prev) => prev - 1);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Orden eliminada",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSelectedOrder(null);
      setDeleteDialog(false);
    }
  };

  const handleApprove = async (order: Order) => {
    try {
      const response = await orderService.approve(order.id);
      mergeOrder(response.data);
      toast.current?.show({
        severity: "success",
        summary: "Aprobada",
        detail: `Orden ${order.orderNumber} aprobada`,
        life: 3000,
      });
    } catch (error) {
      const shortage = extractSalesStockShortage(error);
      if (shortage) {
        setShortagePayload(shortage);
        setReplenishmentResult(null);
        const defaults: Record<
          string,
          { purchaseQuantity: number; supplierId?: string }
        > = {};
        for (const row of shortage.shortages || []) {
          defaults[row.itemId] = {
            purchaseQuantity: row.purchaseSuggestion?.suggestedQuantity || 0,
            supplierId: row.purchaseSuggestion?.supplierId,
          };
        }
        setPurchaseOverrides(defaults);
        setShortageDialogVisible(true);
        return;
      }
      handleFormError(error, toast);
    }
  };

  const updatePurchaseOverride = (
    itemId: string,
    patch: Partial<{ purchaseQuantity: number; supplierId?: string }>,
  ) => {
    setPurchaseOverrides((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { purchaseQuantity: 0 }),
        ...patch,
      },
    }));
  };

  const handleResolveReplenishment = async () => {
    if (!shortagePayload?.orderId) return;

    setResolvingReplenishment(true);
    try {
      const result = await orderService.createSuggestedReplenishmentPlan(
        shortagePayload.orderId,
        {
          overrides: Object.entries(purchaseOverrides).map(
            ([itemId, value]) => ({
              itemId,
              purchaseQuantity: Number(value.purchaseQuantity || 0),
              supplierId: value.supplierId,
            }),
          ),
        },
      );
      setReplenishmentResult(result.data);
      const transferCount =
        (result.data?.createdTransfers?.length ?? 0) +
        (result.data?.reusedTransfers?.length ?? 0);
      const poCount =
        (result.data?.createdPOs?.length ?? 0) +
        (result.data?.reusedPOs?.length ?? 0);

      toast.current?.show({
        severity: "success",
        summary: "Plan de Reabastecimiento Ejecutado",
        detail: `Transferencias: ${transferCount} | OCs: ${poCount}`,
        life: 4500,
      });
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setResolvingReplenishment(false);
    }
  };

  const handleCancel = async (order: Order) => {
    try {
      const response = await orderService.cancel(order.id);
      mergeOrder(response.data);
      toast.current?.show({
        severity: "success",
        summary: "Cancelada",
        detail: `Orden ${order.orderNumber} cancelada`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const hideAuditDialog = () => {
    setAuditDialog(false);
    setActionOrder(null);
  };

  const openAuditDialog = (order: Order) => {
    setActionOrder(order);
    setAuditDialog(true);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
    setPage(0);
  };

  /* ── Table header ── */
  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Órdenes de Venta</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center w-full sm:w-auto">
        <span className="p-input-icon-left w-full sm:w-20rem">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar (nro, cliente...)"
            className="w-full"
          />
        </span>
        <CreateButton
          label="Nueva Orden"
          onClick={openNew}
          tooltip="Crear nueva orden de venta"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );

  /* ── Column: Status transitions ── */
  const actionBodyTemplate = (rowData: Order) => {
    const { status } = rowData;
    return (
      <div className="flex gap-1 flex-nowrap">
        {status === OrderStatus.DRAFT && (
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
        )}
        {(status === OrderStatus.DRAFT || status === OrderStatus.APPROVED) && (
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger p-button-sm"
            tooltip="Cancelar"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Cancelar la orden ${rowData.orderNumber}?`,
                icon: "pi pi-ban",
                iconClass: "text-red-500",
                acceptLabel: "Sí, Cancelar",
                acceptSeverity: "danger",
                onAccept: () => handleCancel(rowData),
              })
            }
          />
        )}
      </div>
    );
  };

  /* ── Column: CRUD (cog menu) ── */
  const getMenuItems = (order: Order | null): MenuItem[] => {
    if (!order) return [];

    const items: MenuItem[] = [
      {
        label: "Auditoría",
        icon: "pi pi-history",
        command: () => openAuditDialog(order),
      },
    ];

    if (order.status !== OrderStatus.DRAFT) return items;

    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => {
          setSelectedOrder(order);
          setFormDialog(true);
        },
      },
      ...items,
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => {
          setSelectedOrder(order);
          setDeleteDialog(true);
        },
      },
    ];
  };

  const crudBodyTemplate = (rowData: Order) => {
    return (
      <Button
        icon="pi pi-cog"
        rounded
        text
        onClick={(e) => {
          setActionOrder(rowData);
          menuRef.current?.toggle(e);
        }}
        aria-controls="order-menu"
        aria-haspopup
      />
    );
  };

  /* ── Column templates ── */
  const statusBodyTemplate = (rowData: Order) => {
    const cfg = ORDER_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={cfg.label}
        severity={cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const customerBodyTemplate = (rowData: Order) =>
    rowData.customer?.name || "—";

  const totalBodyTemplate = (rowData: Order) => (
    <span className="font-semibold">{formatCurrency(rowData.total)}</span>
  );

  const dateBodyTemplate = (rowData: Order) => formatDate(rowData.createdAt);

  const itemsCountBodyTemplate = (rowData: Order) => {
    const count = rowData.items?.length || 0;
    return (
      <Tag
        value={`${count} ${count === 1 ? "artículo" : "artículos"}`}
        severity={count > 0 ? "info" : "warning"}
        className="text-xs"
      />
    );
  };

  /* ── Row expansion ── */
  const rowExpansionTemplate = (data: Order) => {
    const orderItems = data.items || [];
    return (
      <div className="p-3">
        <OrderStepper currentStatus={data.status} />
        {orderItems.length > 0 && (
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
                { label: "Artículo", style: { flex: "1 1 0", minWidth: 0 } },
                {
                  label: "Cant.",
                  style: { width: "4rem", textAlign: "center" as const },
                },
                {
                  label: "Precio",
                  style: { width: "5rem", textAlign: "right" as const },
                },
                {
                  label: "Desc.%",
                  style: { width: "4rem", textAlign: "center" as const },
                },
                {
                  label: "Impuesto",
                  style: { width: "5rem", textAlign: "center" as const },
                },
                {
                  label: "Total Línea",
                  style: { width: "6rem", textAlign: "right" as const },
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
            {orderItems.map((line) => (
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
                  >
                    {line.itemName || line.item?.name || "Sin nombre"}
                  </div>
                </div>
                <div
                  style={{
                    width: "4rem",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {line.quantity}
                </div>
                <div
                  style={{
                    width: "5rem",
                    textAlign: "right",
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  {formatCurrency(line.unitPrice)}
                </div>
                <div
                  style={{
                    width: "4rem",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  {Number(line.discountPercent) > 0
                    ? `${line.discountPercent}%`
                    : "—"}
                </div>
                <div
                  style={{ width: "5rem", textAlign: "center", flexShrink: 0 }}
                >
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
                <div
                  style={{
                    width: "6rem",
                    textAlign: "right",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {formatCurrency(line.totalLine)}
                </div>
              </div>
            ))}
            {/* Totals footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                padding: "8px",
                backgroundColor: "var(--surface-50)",
                borderTop: "2px solid var(--surface-300)",
                fontSize: "0.8rem",
              }}
            >
              <span className="text-500">
                Subtotal: <b>{formatCurrency(data.subtotalBruto)}</b>
              </span>
              {Number(data.discountAmount) > 0 && (
                <span className="text-orange-500">
                  Desc: <b>-{formatCurrency(data.discountAmount)}</b>
                </span>
              )}
              <span className="text-blue-500">
                IVA: <b>{formatCurrency(data.taxAmount)}</b>
              </span>
              {data.igtfApplies && (
                <span className="text-purple-500">
                  IGTF: <b>{formatCurrency(data.igtfAmount)}</b>
                </span>
              )}
              <span className="text-primary font-bold">
                Total: {formatCurrency(data.total)}
              </span>
            </div>
          </div>
        )}
        {orderItems.length === 0 && (
          <div className="text-center text-500 p-3">
            <i className="pi pi-inbox mr-2" />
            No hay artículos en esta orden
          </div>
        )}
      </div>
    );
  };

  /* ── Render ── */
  const supplierOptions = suppliers.map((s) => ({
    label: `${s.code} - ${s.name}`,
    value: s.id,
  }));

  return (
    <>
      <Toast ref={toast} />
      <ConfirmActionPopup />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={orders}
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
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage="No hay órdenes de venta"
          size="small"
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          tableStyle={{ minWidth: "70rem" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Proceso"
            body={actionBodyTemplate}
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column field="orderNumber" header="Nro. Orden" sortable />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            sortable
            sortField="status"
          />
          <Column header="Cliente" body={customerBodyTemplate} />
          <Column
            header="Total"
            body={totalBodyTemplate}
            sortable
            sortField="total"
          />
          <Column
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            sortField="createdAt"
          />
          <Column
            header="Artículos"
            body={itemsCountBodyTemplate}
            style={{ width: "8rem" }}
            className="text-center"
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

        {/* Delete dialog */}
        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
          header="Confirmar Eliminación"
          modal
          footer={
            <div className="flex w-full gap-2 mb-4">
              <Button
                label="No"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => {
                  setSelectedOrder(null);
                  setDeleteDialog(false);
                }}
                type="button"
                className="flex-1"
              />
              <Button
                label="Sí, Eliminar"
                icon="pi pi-trash"
                severity="danger"
                onClick={handleDelete}
                type="button"
                className="flex-1"
              />
            </div>
          }
          onHide={() => {
            setSelectedOrder(null);
            setDeleteDialog(false);
          }}
        >
          <div className="flex align-items-center gap-3 p-2">
            <i
              className="pi pi-exclamation-triangle text-orange-500"
              style={{ fontSize: "2rem" }}
            />
            {selectedOrder && (
              <span>
                ¿Eliminar la orden <b>{selectedOrder.orderNumber}</b>?
              </span>
            )}
          </div>
        </Dialog>

        {/* Form dialog */}
        <Dialog
          visible={formDialog}
          style={{ width: "85vw" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-shopping-cart mr-3 text-primary text-3xl"></i>
                  {selectedOrder
                    ? "Editar Orden de Venta"
                    : "Nueva Orden de Venta"}
                </h2>
              </div>
            </div>
          }
          modal
          maximizable
          onHide={() => {
            setFormDialog(false);
            setSelectedOrder(null);
          }}
          footer={
            <FormActionButtons
              formId="order-form"
              isUpdate={!!selectedOrder?.id}
              onCancel={() => {
                setFormDialog(false);
                setSelectedOrder(null);
              }}
              isSubmitting={isSubmitting}
            />
          }
        >
          <OrderForm
            order={selectedOrder}
            formId="order-form"
            onSave={handleSave}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
            items={items}
            warehouses={warehouses}
            customers={customers}
          />
        </Dialog>

        <Menu
          model={getMenuItems(actionOrder)}
          popup
          ref={menuRef}
          id="order-menu"
        />

        <AuditTrailDialog
          visible={auditDialog}
          onHide={hideAuditDialog}
          entity="Order"
          entityId={actionOrder?.id}
          title="Historial de orden de venta"
          subtitle={actionOrder?.orderNumber}
          toast={toast}
        />

        <Dialog
          visible={shortageDialogVisible}
          style={{ width: "980px", maxWidth: "95vw" }}
          header="Orquestador de Reabastecimiento"
          modal
          onHide={() => setShortageDialogVisible(false)}
          footer={
            <div className="flex w-full gap-2">
              <Button
                label="Cerrar"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={() => setShortageDialogVisible(false)}
                disabled={resolvingReplenishment}
                className="flex-1"
              />
              <Button
                label="Resolver faltantes"
                icon="pi pi-wrench"
                severity="warning"
                onClick={handleResolveReplenishment}
                loading={resolvingReplenishment}
                className="flex-1"
              />
            </div>
          }
        >
          <div className="flex flex-column gap-3">
            <div className="surface-100 border-round p-3">
              <div className="font-semibold text-900 mb-2">
                1) Faltantes detectados
              </div>
              <p className="m-0 text-700">
                La orden no puede aprobarse porque el almacén de venta no tiene
                cobertura completa. Ajusta compra por línea si lo necesitas y
                luego ejecuta el plan.
              </p>
              {shortagePayload?.salesWarehouse && (
                <div className="mt-2 text-700 text-sm">
                  Almacén de venta:{" "}
                  <b>
                    {shortagePayload.salesWarehouse.code} (
                    {shortagePayload.salesWarehouse.name})
                  </b>
                </div>
              )}
            </div>

            <div className="surface-50 border-round p-3">
              <div className="font-semibold text-900 mb-2">
                2) Plan sugerido (transferir + comprar)
              </div>
              <div className="flex flex-column gap-2">
                {(shortagePayload?.shortages || []).map((row) => {
                  const defaults = purchaseOverrides[row.itemId] || {
                    purchaseQuantity:
                      row.purchaseSuggestion?.suggestedQuantity || 0,
                    supplierId: row.purchaseSuggestion?.supplierId,
                  };
                  const transferCovered = (row.suggestions || []).reduce(
                    (sum, s) => sum + Number(s.suggestedQuantity || 0),
                    0,
                  );
                  const purchaseCovered = Number(
                    defaults.purchaseQuantity || 0,
                  );
                  const remaining = Math.max(
                    0,
                    Number(row.shortage || 0) -
                      transferCovered -
                      purchaseCovered,
                  );
                  const statusLabel =
                    remaining === 0
                      ? "Cubierto"
                      : transferCovered + purchaseCovered > 0
                      ? "Parcial"
                      : "Sin solución";
                  const statusSeverity =
                    remaining === 0
                      ? "success"
                      : transferCovered + purchaseCovered > 0
                      ? "warning"
                      : "danger";
                  return (
                    <div
                      key={row.itemId}
                      className="border-1 border-round border-300 p-3 surface-0"
                    >
                      <div className="font-semibold text-900 flex justify-content-between align-items-center">
                        <span>
                          {row.itemSku} ({row.itemName})
                        </span>
                        <Tag
                          value={statusLabel}
                          severity={statusSeverity as any}
                        />
                      </div>
                      <div className="text-sm text-700 mt-1">
                        Requerido: <b>{row.required}</b> | Disponible:{" "}
                        <b>{row.available}</b> | Faltante: <b>{row.shortage}</b>
                      </div>
                      <div className="text-sm text-600 mt-2">
                        Transferir sugerido: <b>{transferCovered}</b>
                        {(row.suggestions || []).length > 0
                          ? ` (${row.suggestions
                              .map(
                                (s) =>
                                  `${s.fromWarehouseCode}: ${s.suggestedQuantity}`,
                              )
                              .join(" | ")})`
                          : " (sin origen transferible)"}
                      </div>
                      <div className="grid mt-2">
                        <div className="col-12 md:col-4">
                          <label className="text-xs text-600">
                            Cantidad a comprar
                          </label>
                          <InputNumber
                            value={defaults.purchaseQuantity}
                            min={0}
                            onValueChange={(e) =>
                              updatePurchaseOverride(row.itemId, {
                                purchaseQuantity: Number(e.value || 0),
                              })
                            }
                            className="w-full"
                          />
                        </div>
                        <div className="col-12 md:col-8">
                          <label className="text-xs text-600">
                            Proveedor de compra
                          </label>
                          <Dropdown
                            value={defaults.supplierId}
                            options={supplierOptions}
                            onChange={(e) =>
                              updatePurchaseOverride(row.itemId, {
                                supplierId: e.value,
                              })
                            }
                            placeholder="Seleccione proveedor"
                            className="w-full"
                            filter
                          />
                        </div>
                      </div>
                      <div className="text-sm text-700 mt-2">
                        Cobertura estimada: transferir <b>{transferCovered}</b>{" "}
                        + comprar <b>{purchaseCovered}</b> ={" "}
                        <b>{transferCovered + purchaseCovered}</b> | Pendiente:{" "}
                        <b>{remaining}</b>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surface-100 border-round p-3">
              <div className="font-semibold text-900 mb-2">
                3) Estado de ejecución
              </div>
              {!replenishmentResult ? (
                <div className="text-700 text-sm">
                  Aún no se ha ejecutado el plan. Presiona{" "}
                  <b>Resolver faltantes</b>.
                </div>
              ) : (
                <div className="text-sm text-700">
                  <div>
                    Transferencias: creadas{" "}
                    <b>{replenishmentResult.createdTransfers.length}</b>,
                    reusadas <b>{replenishmentResult.reusedTransfers.length}</b>
                    , pendientes de recibir{" "}
                    <b>
                      {replenishmentResult.executionState.pendingTransfersCount}
                    </b>
                  </div>
                  <div className="mt-1">
                    Órdenes de compra: creadas{" "}
                    <b>{replenishmentResult.createdPOs.length}</b>, reusadas{" "}
                    <b>{replenishmentResult.reusedPOs.length}</b>, pendientes de
                    completar{" "}
                    <b>{replenishmentResult.executionState.pendingPOsCount}</b>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="small"
                      outlined
                      label="Ver transferencias vinculadas"
                      onClick={() =>
                        router.push(
                          `/empresa/inventario/transferencias?search=${encodeURIComponent(
                            replenishmentResult.orderNumber,
                          )}`,
                        )
                      }
                    />
                    <Button
                      size="small"
                      outlined
                      label="Ver compras vinculadas"
                      onClick={() =>
                        router.push(
                          `/empresa/inventario/ordenes-compra?search=${encodeURIComponent(
                            replenishmentResult.orderNumber,
                          )}`,
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      </motion.div>
    </>
  );
};

export default OrderList;
