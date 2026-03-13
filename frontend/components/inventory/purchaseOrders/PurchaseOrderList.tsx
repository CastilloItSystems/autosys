"use client";
import React, { useEffect, useRef, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
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
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { Tag } from "primereact/tag";

const PurchaseOrderList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [receiveDialog, setReceiveDialog] = useState(false);
  const [selectedOrderToReceive, setSelectedOrderToReceive] =
    useState<PurchaseOrder | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [poRes, itemsRes, suppliersRes, warehousesRes] = await Promise.all([
        purchaseOrderService.getAll(),
        itemService.getActive(),
        supplierService.getActive(),
        warehouseService.getActive(),
      ]);

      // getPurchaseOrders → { data: PurchaseOrder[], meta: {...} }
      const poList = poRes?.data ?? [];
      setPurchaseOrders(Array.isArray(poList) ? poList : []);

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
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
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
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === updatedOrder.id ? updatedOrder : po)),
    );
    hideReceiveDialog();
  };

  const handleDelete = async () => {
    try {
      if (purchaseOrder?.id) {
        await purchaseOrderService.delete(purchaseOrder.id);
        setPurchaseOrders(
          purchaseOrders.filter((val) => val.id !== purchaseOrder.id),
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Orden de Compra Eliminada",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setPurchaseOrder(null);
      setDeleteDialog(false);
    }
  };

  const handleApprove = async (po: PurchaseOrder) => {
    try {
      const result = await purchaseOrderService.approve(po.id);
      const updated = result.data || result;
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
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
      const result = await purchaseOrderService.cancel(po.id);
      const updated = result.data || result;
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
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
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <span className="p-input-icon-left w-full sm:w-20rem flex-order-1 sm:flex-order-0">
        <i className="pi pi-search"></i>
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Búsqueda Global"
          className="w-full"
        />
      </span>
      <CreateButton onClick={openFormDialog} />
    </div>
  );

  /* ── Action buttons based on status ── */
  const actionBodyTemplate = (rowData: PurchaseOrder) => {
    const { status } = rowData;

    return (
      <div className="flex gap-1 flex-nowrap">
        {/* DRAFT → Enviar / Editar / Eliminar */}
        {status === "DRAFT" && (
          <>
            <Button
              icon="pi pi-send"
              className="p-button-rounded p-button-info p-button-sm"
              tooltip="Enviar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleApprove(rowData)}
            />
            <Button
              icon="pi pi-pencil"
              className="p-button-rounded p-button-warning p-button-sm"
              tooltip="Editar"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setPurchaseOrder(rowData);
                setFormDialog(true);
              }}
            />
            <Button
              icon="pi pi-trash"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Eliminar"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setPurchaseOrder(rowData);
                setDeleteDialog(true);
              }}
            />
          </>
        )}

        {/* SENT / PARTIAL → Recepcionar / Cancelar */}
        {(status === "SENT" || status === "PARTIAL") && (
          <>
            <Button
              icon="pi pi-inbox"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Recepcionar"
              tooltipOptions={{ position: "top" }}
              onClick={() => openReceiveDialog(rowData)}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleCancel(rowData)}
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

  /* ── Status tag ── */
  const statusBodyTemplate = (rowData: PurchaseOrder) => {
    const config = PO_STATUS_CONFIG[rowData.status] || {
      label: rowData.status,
      severity: "secondary" as const,
    };
    return <Tag value={config.label} severity={config.severity} />;
  };

  /* ── Total formatted ── */
  const totalBodyTemplate = (rowData: PurchaseOrder) => {
    return `$${Number(rowData.total || 0).toFixed(2)}`;
  };

  /* ── Items count ── */
  const itemsCountBodyTemplate = (rowData: PurchaseOrder) => {
    return rowData.items?.length || 0;
  };

  /* ── Date format ── */
  const dateBodyTemplate = (rowData: PurchaseOrder) => {
    if (!rowData.expectedDate) return "—";
    return new Date(rowData.expectedDate).toLocaleDateString("es-VE");
  };

  /* ── Row expansion with stepper ── */
  const rowExpansionTemplate = (data: PurchaseOrder) => {
    return (
      <div className="p-3">
        <PurchaseOrderStepper currentStatus={data.status} />
        {data.items && data.items.length > 0 && (
          <div className="mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-bottom-1 surface-border">
                  <th className="text-left py-2">Artículo</th>
                  <th className="text-center py-2">Ordenado</th>
                  <th className="text-center py-2">Recibido</th>
                  <th className="text-center py-2">Pendiente</th>
                  <th className="text-right py-2">Costo Unit.</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((line) => (
                  <tr key={line.id} className="border-bottom-1 surface-border">
                    <td className="py-2">
                      {line.item
                        ? `${line.item.sku} — ${line.item.name}`
                        : line.itemId}
                    </td>
                    <td className="text-center py-2">{line.quantityOrdered}</td>
                    <td className="text-center py-2">
                      {line.quantityReceived}
                    </td>
                    <td className="text-center py-2">
                      <span
                        className={
                          line.quantityPending > 0
                            ? "text-orange-500 font-bold"
                            : "text-green-600"
                        }
                      >
                        {line.quantityPending}
                      </span>
                    </td>
                    <td className="text-right py-2">
                      ${Number(line.unitCost || 0).toFixed(2)}
                    </td>
                    <td className="text-right py-2">
                      ${Number(line.subtotal || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string,
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const deleteDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
      <Button label="Sí" icon="pi pi-check" text onClick={handleDelete} />
    </>
  );

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
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay órdenes de compra disponibles"
          rowClassName={() => "animated-row"}
          size="small"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          dataKey="id"
        >
          <Column expander style={{ width: "3rem" }} />
          <Column body={actionBodyTemplate} style={{ width: "10rem" }} />
          <Column field="orderNumber" header="Número" sortable />
          <Column
            field="supplier.name"
            header="Proveedor"
            sortable
            body={(rowData: PurchaseOrder) => rowData.supplier?.name || "—"}
          />
          <Column
            field="warehouse.name"
            header="Almacén"
            sortable
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
            style={{ width: "6rem" }}
          />
          <Column
            header="Total"
            body={totalBodyTemplate}
            sortable
            sortField="total"
            style={{ width: "8rem" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ width: "8rem" }}
          />
        </DataTable>

        {/* Delete confirmation */}
        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
          header="Confirmar"
          modal
          footer={deleteDialogFooter}
          onHide={hideDeleteDialog}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {purchaseOrder && (
              <span>
                ¿Estás seguro de que deseas eliminar la orden{" "}
                <b>{purchaseOrder.orderNumber}</b>?
              </span>
            )}
          </div>
        </Dialog>

        {/* Form dialog */}
        <Dialog
          visible={formDialog}
          style={{ width: "950px" }}
          header={
            purchaseOrder ? "Editar Orden de Compra" : "Crear Orden de Compra"
          }
          modal
          onHide={hideFormDialog}
          content={
            <PurchaseOrderForm
              purchaseOrder={purchaseOrder}
              hideFormDialog={hideFormDialog}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
              showToast={showToast}
              toast={toast}
              items={items}
              suppliers={suppliers}
              warehouses={warehouses}
            />
          }
        ></Dialog>

        {/* Receive dialog */}
        <ReceiveOrderDialog
          visible={receiveDialog}
          order={selectedOrderToReceive}
          onHide={hideReceiveDialog}
          onSuccess={handleReceiveSuccess}
          toast={toast}
        />
      </motion.div>
    </>
  );
};

export default PurchaseOrderList;
