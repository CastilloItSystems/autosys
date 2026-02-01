"use client";
import React, { useEffect, useRef, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import {
  deleteSalesOrder,
  getSalesOrders,
} from "@/app/api/inventory/salesOrderService";
import SalesOrderForm from "./SalesOrderForm";
import { SalesOrder, Item, SalesLine } from "@/libs/interfaces/inventory";
import { getItems } from "@/app/api/inventory/itemService";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { Tag } from "primereact/tag";
import ConfirmOrderDialog from "./ConfirmOrderDialog";
import ShipOrderDialog from "./ShipOrderDialog";

const SalesOrderList = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [shipDialog, setShipDialog] = useState(false);
  const [selectedOrderToConfirm, setSelectedOrderToConfirm] =
    useState<SalesOrder | null>(null);
  const [selectedOrderToShip, setSelectedOrderToShip] =
    useState<SalesOrder | null>(null);
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesOrdersDB, itemsDB] = await Promise.all([
        getSalesOrders(),
        getItems(),
      ]);

      if (Array.isArray(salesOrdersDB)) {
        setSalesOrders(salesOrdersDB);
      }
      if (itemsDB && Array.isArray(itemsDB.items)) {
        setItems(itemsDB.items);
      }
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setSalesOrder(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setSalesOrder(null);
    setFormDialog(false);
  };

  const openConfirmDialog = (order: SalesOrder) => {
    setSelectedOrderToConfirm(order);
    setConfirmDialog(true);
  };

  const hideConfirmDialog = () => {
    setSelectedOrderToConfirm(null);
    setConfirmDialog(false);
  };

  const openShipDialog = (order: SalesOrder) => {
    setSelectedOrderToShip(order);
    setShipDialog(true);
  };

  const hideShipDialog = () => {
    setSelectedOrderToShip(null);
    setShipDialog(false);
  };

  const handleConfirmSuccess = (updatedOrder: any) => {
    setSalesOrders((prev) =>
      prev.map((so) =>
        so._id === updatedOrder._id || so.id === updatedOrder.id
          ? updatedOrder
          : so
      )
    );
    hideConfirmDialog();
  };

  const handleShipSuccess = (updatedOrder: any) => {
    setSalesOrders((prev) =>
      prev.map((so) =>
        so._id === updatedOrder._id || so.id === updatedOrder.id
          ? updatedOrder
          : so
      )
    );
    hideShipDialog();
  };

  const handleDelete = async () => {
    try {
      if (salesOrder?._id || salesOrder?.id) {
        const orderId = (salesOrder._id || salesOrder.id)!;
        await deleteSalesOrder(orderId);
        setSalesOrders(
          salesOrders.filter((val) => (val._id || val.id) !== orderId)
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Orden de Venta Eliminada",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSalesOrder(null);
      setDeleteDialog(false);
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

  const actionBodyTemplate = (rowData: SalesOrder) => {
    const canConfirm =
      rowData.estado === "borrador" || rowData.estado === "pendiente";
    const canShip =
      rowData.estado === "confirmada" || rowData.estado === "parcial";

    return (
      <div className="flex gap-2">
        {canConfirm && (
          <Button
            icon="pi pi-check-circle"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Confirmar"
            tooltipOptions={{ position: "top" }}
            onClick={() => openConfirmDialog(rowData)}
          />
        )}
        {canShip && (
          <Button
            icon="pi pi-send"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Despachar"
            tooltipOptions={{ position: "top" }}
            onClick={() => openShipDialog(rowData)}
          />
        )}
        <CustomActionButtons
          rowData={rowData}
          onEdit={(data) => {
            setSalesOrder(rowData);
            setFormDialog(true);
          }}
          onDelete={(data) => {
            setSalesOrder(rowData);
            setDeleteDialog(true);
          }}
        />
      </div>
    );
  };

  const estadoBodyTemplate = (rowData: SalesOrder) => {
    const estadoConfig: Record<
      string,
      { severity: "warning" | "info" | "success" | "danger"; label: string }
    > = {
      borrador: { severity: "warning", label: "Borrador" },
      pendiente: { severity: "warning", label: "Pendiente" },
      confirmada: { severity: "info", label: "Confirmada" },
      parcial: { severity: "info", label: "Parcial" },
      despachada: { severity: "success", label: "Despachada" },
      cancelada: { severity: "danger", label: "Cancelada" },
    };

    const config = estadoConfig[rowData.estado] || {
      severity: "warning" as const,
      label: rowData.estado,
    };

    return <Tag value={config.label} severity={config.severity} />;
  };

  const customerBodyTemplate = (rowData: SalesOrder) => {
    if (typeof rowData.customer === "object" && rowData.customer?.nombre) {
      return rowData.customer.nombre;
    }
    // If customer is just an ID string, we can't display the name without additional lookup
    // For now, return a placeholder or the ID
    return typeof rowData.customer === "string"
      ? rowData.customer
      : "Cliente no especificado";
  };

  const itemsCountBodyTemplate = (rowData: SalesOrder) => {
    return rowData.items.length;
  };

  const progressBodyTemplate = (rowData: SalesOrder) => {
    const totalQty = rowData.items.reduce(
      (sum: number, line: SalesLine) => sum + line.cantidad,
      0
    );
    const deliveredQty = rowData.items.reduce(
      (sum: number, line: SalesLine) => sum + (line.entregado || 0),
      0
    );
    const percentage = totalQty > 0 ? (deliveredQty / totalQty) * 100 : 0;

    return (
      <div className="flex align-items-center gap-2">
        <span className="text-sm">
          {deliveredQty}/{totalQty}
        </span>
        <div
          className="border-round overflow-hidden bg-gray-200"
          style={{ width: "80px", height: "8px" }}
        >
          <div
            className="bg-green-500 h-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string
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
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={salesOrders}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay órdenes de venta disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} style={{ width: "150px" }} />
          <Column field="numero" header="Número" sortable />
          <Column header="Cliente" body={customerBodyTemplate} sortable />
          <Column field="fecha" header="Fecha" sortable />
          <Column
            field="items"
            header="Items"
            body={itemsCountBodyTemplate}
            sortable
          />
          <Column
            header="Progreso"
            body={progressBodyTemplate}
            style={{ width: "150px" }}
          />
          <Column
            field="estado"
            header="Estado"
            body={estadoBodyTemplate}
            sortable
          />
        </DataTable>

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
            {salesOrder && (
              <span>
                ¿Estás seguro de que deseas eliminar la orden{" "}
                <b>{salesOrder.numero}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "950px" }}
          header={salesOrder ? "Editar Orden de Venta" : "Crear Orden de Venta"}
          modal
          onHide={hideFormDialog}
          content={
            <SalesOrderForm
              salesOrder={salesOrder}
              hideFormDialog={hideFormDialog}
              salesOrders={salesOrders}
              setSalesOrders={setSalesOrders}
              setSalesOrder={setSalesOrder}
              showToast={showToast}
              toast={toast}
              items={items}
            />
          }
        ></Dialog>

        <ConfirmOrderDialog
          visible={confirmDialog}
          order={selectedOrderToConfirm}
          onHide={hideConfirmDialog}
          onSuccess={handleConfirmSuccess}
          toast={toast}
        />

        <ShipOrderDialog
          visible={shipDialog}
          order={selectedOrderToShip}
          onHide={hideShipDialog}
          onSuccess={handleShipSuccess}
          toast={toast}
        />
      </motion.div>
    </>
  );
};

export default SalesOrderList;
