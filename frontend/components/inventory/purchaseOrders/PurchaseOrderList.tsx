"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import purchaseOrderService from "@/app/api/inventory/purchaseOrderService";
import PurchaseOrderForm from "./PurchaseOrderForm";
import PurchaseOrderStepper from "./PurchaseOrderStepper";
import ReceiveOrderDialog from "./ReceiveOrderDialog";
import { PurchaseOrder, PO_STATUS_CONFIG } from "@/libs/interfaces/inventory";
import itemService, { type Item } from "@/app/api/inventory/itemService";
import supplierService, {
  type Supplier,
} from "@/app/api/inventory/supplierService";
import warehouseService, {
  type Warehouse,
} from "@/app/api/inventory/warehouseService";
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
import FormActionButtons from "@/components/common/FormActionButtons";

const PurchaseOrderList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [receiveDialog, setReceiveDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrderToReceive, setSelectedOrderToReceive] =
    useState<PurchaseOrder | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [actionPurchaseOrder, setActionPurchaseOrder] =
    useState<PurchaseOrder | null>(null);
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
  const formatCurrency = (value: number | string) =>
    `$${Number(value || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

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

  const openFormDialog = () => {
    setPurchaseOrder(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setPurchaseOrder(null);
    setFormDialog(false);
  };

  const openReceiveDialog = (order: PurchaseOrder) => {
    setSelectedOrderToReceive(order);
    setReceiveDialog(true);
  };

  const hideReceiveDialog = () => {
    setSelectedOrderToReceive(null);
    setReceiveDialog(false);
  };

  const handleReceiveSuccess = (updatedOrder: any) => {
    loadPurchaseOrders();
    hideReceiveDialog();
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
    setIsDeleting(true);
    try {
      await purchaseOrderService.delete(purchaseOrder.id);
      await loadPurchaseOrders();
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

  const handleApprove = async (po: PurchaseOrder) => {
    try {
      await purchaseOrderService.approve(po.id);
      await loadPurchaseOrders();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Orden ${po.orderNumber} enviada`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleCancel = async (po: PurchaseOrder) => {
    try {
      await purchaseOrderService.cancel(po.id);
      await loadPurchaseOrders();
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
        {/* DRAFT → Enviar */}
        {status === "DRAFT" && (
          <Button
            icon="pi pi-send"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Enviar para Aprobación"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Enviar la orden ${rowData.orderNumber} para aprobación?`,
                icon: "pi pi-send",
                iconClass: "text-blue-500",
                acceptLabel: "Enviar",
                acceptSeverity: "info",
                onAccept: () => handleApprove(rowData),
              })
            }
          />
        )}

        {/* SENT / PARTIAL → Recepcionar / Cancelar */}
        {(status === "SENT" || status === "PARTIAL") && (
          <>
            <Button
              icon="pi pi-inbox"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Recepcionar Artículos"
              tooltipOptions={{ position: "top" }}
              onClick={() => openReceiveDialog(rowData)}
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

  /* CRUD actions (Edit / Delete) — cog menu, solo disponible cuando DRAFT */
  const getMenuItems = (po: PurchaseOrder | null): MenuItem[] => {
    if (!po || po.status !== "DRAFT") return [];
    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => {
          setPurchaseOrder(po);
          setFormDialog(true);
        },
      },
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
    ];
  };

  const crudBodyTemplate = (rowData: PurchaseOrder) => {
    if (rowData.status !== "DRAFT") return null;
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
        {formatCurrency(rowData.total)}
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
                    {formatCurrency(Number(line.unitCost || 0))}
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
                    {formatCurrency(orderTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
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
                    ? "Editar Orden de Compra"
                    : "Nueva Orden de Compra"}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={hideFormDialog}
          footer={
            <FormActionButtons
              formId="purchase-order-form"
              isUpdate={!!purchaseOrder?.id}
              onCancel={hideFormDialog}
              isSubmitting={isSubmitting}
            />
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

        {/* Receive dialog */}
        <ReceiveOrderDialog
          visible={receiveDialog}
          order={selectedOrderToReceive}
          onHide={hideReceiveDialog}
          onSuccess={handleReceiveSuccess}
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
