"use client";
import React, { useEffect, useRef, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import {
  getWorkOrders,
  deleteWorkOrder,
} from "@/app/api/workshop/workOrderService";
import WorkOrderForm from "./WorkOrderForm";
import WorkOrderItemsDialog from "./WorkOrderItemsDialog";
import WorkOrderHistoryDialog from "./WorkOrderHistoryDialog";
import { WorkOrder } from "@/libs/interfaces/workshop";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const WorkOrderList = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [itemsDialog, setItemsDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [selectedWorkOrderForItems, setSelectedWorkOrderForItems] = useState<{
    id: string;
    numero: string;
  } | null>(null);
  const [selectedWorkOrderForHistory, setSelectedWorkOrderForHistory] =
    useState<{
      id: string;
      numero: string;
    } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchWorkOrders();
  }, [pagination.page, pagination.limit]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await getWorkOrders({});
      if (response.success && Array.isArray(response.data)) {
        setWorkOrders(response.data);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.pagination!.total,
          }));
        }
      }
    } catch (error) {
      console.error("Error al obtener las órdenes de trabajo:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las órdenes de trabajo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setWorkOrder(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setWorkOrder(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (workOrder?.id || workOrder?._id) {
        const id = workOrder.id || workOrder._id!;
        await deleteWorkOrder(id);
        setWorkOrders(workOrders.filter((val) => (val.id || val._id) !== id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Orden de Trabajo Eliminada",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setWorkOrder(null);
      setDeleteDialog(false);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  const openHistoryDialog = (workOrder: WorkOrder) => {
    const id = workOrder._id || workOrder.id;
    if (id) {
      setSelectedWorkOrderForHistory({
        id,
        numero: workOrder.numeroOrden,
      });
      setHistoryDialog(true);
    }
  };

  const hideHistoryDialog = () => {
    setHistoryDialog(false);
    setSelectedWorkOrderForHistory(null);
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

  const actionBodyTemplate = (rowData: WorkOrder) => (
    <div className="flex gap-2">
      <CustomActionButtons
        rowData={rowData}
        onEdit={(data) => {
          setWorkOrder(rowData);
          setFormDialog(true);
        }}
        onDelete={(data) => {
          setWorkOrder(rowData);
          setDeleteDialog(true);
        }}
      />
      <Button
        icon="pi pi-history"
        rounded
        text
        severity="info"
        tooltip="Ver Historial"
        tooltipOptions={{ position: "top" }}
        onClick={() => openHistoryDialog(rowData)}
      />
    </div>
  );

  const numeroOrdenBodyTemplate = (rowData: WorkOrder) => (
    <span className="font-semibold text-primary">{rowData.numeroOrden}</span>
  );

  const customerBodyTemplate = (rowData: WorkOrder) => {
    const customer =
      typeof rowData.customer === "object" ? rowData.customer : null;
    return customer ? (
      <div>
        <div className="font-semibold">{customer.nombre}</div>
        {customer.telefono && (
          <div className="text-sm text-500">{customer.telefono}</div>
        )}
      </div>
    ) : (
      "-"
    );
  };

  const vehicleBodyTemplate = (rowData: WorkOrder) => {
    const vehicle =
      typeof rowData.vehicle === "object" ? rowData.vehicle : null;
    return vehicle ? (
      <span className="font-semibold">{vehicle.placa}</span>
    ) : (
      "-"
    );
  };

  const estadoBodyTemplate = (rowData: WorkOrder) => {
    const estado = typeof rowData.estado === "object" ? rowData.estado : null;
    return estado ? (
      <Tag
        value={estado.nombre}
        style={{ backgroundColor: estado.color || "#6366f1" }}
        icon={`pi pi-${estado.icono || "info-circle"}`}
      />
    ) : (
      "-"
    );
  };

  const prioridadBodyTemplate = (rowData: WorkOrder) => {
    const severityMap = {
      baja: "info",
      normal: "success",
      alta: "warning",
      urgente: "danger",
    };
    return (
      <Tag
        value={rowData.prioridad.toUpperCase()}
        severity={severityMap[rowData.prioridad] as any}
      />
    );
  };

  const tecnicoBodyTemplate = (rowData: WorkOrder) => {
    const tecnico =
      typeof rowData.tecnicoAsignado === "object"
        ? rowData.tecnicoAsignado
        : null;
    return tecnico ? tecnico.nombre : "Sin asignar";
  };

  const kilometrajeBodyTemplate = (rowData: WorkOrder) => {
    return `${rowData.kilometraje.toLocaleString()} km`;
  };

  const costoBodyTemplate = (rowData: WorkOrder) => {
    return `$${rowData.costoTotal.toFixed(2)}`;
  };

  const diasBodyTemplate = (rowData: WorkOrder) => {
    const dias = rowData.diasTranscurridos || 0;
    return (
      <Tag
        value={`${dias} ${dias === 1 ? "día" : "días"}`}
        severity={dias > 7 ? "danger" : dias > 3 ? "warning" : "success"}
      />
    );
  };

  const itemsBodyTemplate = (rowData: WorkOrder) => {
    const handleShowItems = () => {
      const id = rowData._id || rowData.id;
      if (id) {
        setSelectedWorkOrderForItems({
          id,
          numero: rowData.numeroOrden,
        });
        setItemsDialog(true);
      }
    };

    return (
      <Button
        icon="pi pi-list"
        rounded
        text
        severity="info"
        tooltip="Ver Items"
        tooltipOptions={{ position: "top" }}
        onClick={handleShowItems}
      />
    );
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
          value={workOrders}
          header={renderHeader()}
          paginator
          rows={pagination.limit}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay órdenes de trabajo disponibles"
          rowClassName={() => "animated-row"}
          size="small"
          totalRecords={pagination.total}
        >
          <Column body={actionBodyTemplate} style={{ width: "8rem" }} />
          <Column
            field="numeroOrden"
            header="N° Orden"
            body={numeroOrdenBodyTemplate}
            sortable
          />
          <Column
            field="customer.nombre"
            header="Cliente"
            body={customerBodyTemplate}
            sortable
          />
          <Column
            field="vehicle.placa"
            header="Vehículo"
            body={vehicleBodyTemplate}
            sortable
          />
          <Column
            field="estado.nombre"
            header="Estado"
            body={estadoBodyTemplate}
            sortable
          />
          <Column
            field="prioridad"
            header="Prioridad"
            body={prioridadBodyTemplate}
            sortable
          />
          <Column
            field="tecnicoAsignado.nombre"
            header="Técnico"
            body={tecnicoBodyTemplate}
            sortable
          />
          <Column
            field="kilometraje"
            header="Kilometraje"
            body={kilometrajeBodyTemplate}
            sortable
          />
          <Column
            field="costoTotal"
            header="Costo Total"
            body={costoBodyTemplate}
            sortable
          />
          <Column
            field="diasTranscurridos"
            header="Días"
            body={diasBodyTemplate}
            sortable
          />
          <Column
            header="Items"
            body={itemsBodyTemplate}
            style={{ width: "5rem" }}
          />
        </DataTable>
      </motion.div>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "60vw" }}
        // breakpoints={{ "960px": "90vw", "641px": "100vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tags mr-3 text-primary text-3xl"></i>
                {workOrder
                  ? "Modificar Orden de Trabajo"
                  : "Crear Orden de Trabajo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideFormDialog}
        maximizable
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      >
        <WorkOrderForm
          workOrder={workOrder}
          onSave={() => {
            hideFormDialog();
            fetchWorkOrders();
          }}
          onCancel={hideFormDialog}
          toast={toast}
        />
      </Dialog>

      {/* <Dialog
        visible={formDialog}
        style={{ width: "600px" }}
        header={invoice?._id ? "Editar Factura" : "Nueva Factura"}
        modal
        className="p-fluid"
        onHide={hideDialog}
        maximizable
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      ></Dialog> */}
      {/* Delete Dialog */}
      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteDialog}
      >
        <div className="confirmation-content flex align-items-center">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          <span>
            ¿Está seguro que desea eliminar la orden de trabajo{" "}
            <b>{workOrder?.numeroOrden}</b>?
          </span>
        </div>
      </Dialog>

      {/* Items Dialog */}
      <WorkOrderItemsDialog
        visible={itemsDialog}
        workOrderId={selectedWorkOrderForItems?.id || null}
        workOrderNumber={selectedWorkOrderForItems?.numero || ""}
        onHide={() => {
          setItemsDialog(false);
          setSelectedWorkOrderForItems(null);
        }}
      />

      {/* History Dialog */}
      <WorkOrderHistoryDialog
        visible={historyDialog}
        workOrderId={selectedWorkOrderForHistory?.id || null}
        workOrderNumber={selectedWorkOrderForHistory?.numero || ""}
        onHide={hideHistoryDialog}
      />
    </>
  );
};

export default WorkOrderList;
