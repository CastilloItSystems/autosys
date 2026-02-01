"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import {
  deletePurchaseOrder,
  getPurchaseOrders,
} from "@/app/api/inventory/purchaseOrderService";
import PurchaseOrderForm from "./PurchaseOrderForm";
import ReceiveOrderDialog from "./ReceiveOrderDialog";
import { PurchaseOrder, Item, Supplier } from "@/libs/interfaces/inventory";
import { getItems } from "@/app/api/inventory/itemService";
import { getSuppliers } from "@/app/api/inventory/supplierService";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { Tag } from "primereact/tag";

const PurchaseOrderList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [receiveDialog, setReceiveDialog] = useState(false);
  const [selectedOrderToReceive, setSelectedOrderToReceive] =
    useState<PurchaseOrder | null>(null);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchaseOrdersDB, itemsDB, suppliersDB] = await Promise.all([
        getPurchaseOrders(),
        getItems(),
        getSuppliers(),
      ]);

      if (purchaseOrdersDB && Array.isArray(purchaseOrdersDB.purchaseOrders)) {
        setPurchaseOrders(purchaseOrdersDB.purchaseOrders);
      }
      if (itemsDB && Array.isArray(itemsDB.items)) {
        setItems(itemsDB.items);
      }
      if (suppliersDB && Array.isArray(suppliersDB.suppliers)) {
        setSuppliers(suppliersDB.suppliers);
      }
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
    // Actualizar la orden en la lista
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === updatedOrder.id ? updatedOrder : po))
    );
    hideReceiveDialog();
  };

  const handleDelete = async () => {
    try {
      if (purchaseOrder?.id) {
        await deletePurchaseOrder(purchaseOrder.id);
        setPurchaseOrders(
          purchaseOrders.filter((val) => val.id !== purchaseOrder.id)
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Orden de Compra Eliminada",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar la orden de compra",
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

  const actionBodyTemplate = (rowData: PurchaseOrder) => {
    const canReceive =
      rowData.estado !== "recibido" && rowData.estado !== "cancelado";

    return (
      <div className="flex gap-2">
        {canReceive && (
          <Button
            icon="pi pi-inbox"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Recepcionar"
            tooltipOptions={{ position: "top" }}
            onClick={() => openReceiveDialog(rowData)}
          />
        )}
        <CustomActionButtons
          rowData={rowData}
          onEdit={(data) => {
            setPurchaseOrder(rowData);
            setFormDialog(true);
          }}
          onDelete={(data) => {
            setPurchaseOrder(rowData);
            setDeleteDialog(true);
          }}
        />
      </div>
    );
  };

  const estadoBodyTemplate = (rowData: PurchaseOrder) => {
    const estadoConfig: Record<
      string,
      { severity: "warning" | "info" | "success" | "danger"; label: string }
    > = {
      pendiente: { severity: "warning", label: "Pendiente" },
      parcial: { severity: "info", label: "Parcial" },
      recibido: { severity: "success", label: "Recibido" },
      cancelado: { severity: "danger", label: "Cancelado" },
    };

    const config = estadoConfig[rowData.estado || "pendiente"] || {
      severity: "warning" as const,
      label: rowData.estado || "Pendiente",
    };

    return <Tag value={config.label} severity={config.severity} />;
  };

  const itemsCountBodyTemplate = (rowData: PurchaseOrder) => {
    return rowData.items.length;
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
        >
          <Column body={actionBodyTemplate} />
          <Column field="numero" header="Número" sortable />
          <Column field="proveedor.nombre" header="Proveedor" sortable />
          <Column field="fecha" header="Fecha" sortable />
          <Column
            field="items"
            header="Artículos"
            body={itemsCountBodyTemplate}
            sortable
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
            {purchaseOrder && (
              <span>
                ¿Estás seguro de que deseas eliminar la orden{" "}
                <b>{purchaseOrder.numero}</b>?
              </span>
            )}
          </div>
        </Dialog>

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
              setPurchaseOrder={setPurchaseOrder}
              showToast={showToast}
              toast={toast}
              items={items}
              suppliers={suppliers}
            />
          }
        ></Dialog>

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
