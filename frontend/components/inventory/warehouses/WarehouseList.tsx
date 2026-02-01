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
import { useRefineriaStore } from "@/store/refineriaStore";
import {
  deleteWarehouse,
  getWarehouses,
} from "@/app/api/inventory/warehouseService";
import WarehouseForm from "./WarehouseForm";
import { Warehouse } from "@/libs/interfaces/inventory";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const WarehouseList = () => {
  const { activeRefineria } = useRefineriaStore();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, [activeRefineria]);

  const fetchWarehouses = async () => {
    try {
      const warehousesDB = await getWarehouses();
      if (warehousesDB && Array.isArray(warehousesDB.warehouses)) {
        setWarehouses(warehousesDB.warehouses);
      }
    } catch (error) {
      console.error("Error al obtener los almacenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setWarehouse(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setWarehouse(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (warehouse?.id) {
        await deleteWarehouse(warehouse.id);
        setWarehouses(warehouses.filter((val) => val.id !== warehouse.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Almacén Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el almacén",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setWarehouse(null);
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

  const actionBodyTemplate = (rowData: Warehouse) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setWarehouse(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setWarehouse(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  const estadoBodyTemplate = (rowData: Warehouse) => (
    <span
      className={`px-2 py-1 border-round text-sm font-semibold ${
        rowData.estado === "activo"
          ? "bg-green-100 text-green-900"
          : "bg-red-100 text-red-900"
      }`}
    >
      {rowData.estado}
    </span>
  );

  const tipoBodyTemplate = (rowData: Warehouse) => (
    <span className="capitalize">{rowData.tipo}</span>
  );

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
          value={warehouses}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay almacenes disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="nombre" header="Nombre" sortable />
          <Column field="ubicacion" header="Ubicación" sortable />
          <Column field="tipo" header="Tipo" body={tipoBodyTemplate} sortable />
          <Column field="capacidad" header="Capacidad" sortable />
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
            {warehouse && (
              <span>
                ¿Estás seguro de que deseas eliminar <b>{warehouse.nombre}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "850px" }}
          header={warehouse ? "Editar Almacén" : "Crear Almacén"}
          modal
          onHide={hideFormDialog}
          content={
            <WarehouseForm
              warehouse={warehouse}
              hideFormDialog={hideFormDialog}
              warehouses={warehouses}
              setWarehouses={setWarehouses}
              setWarehouse={setWarehouse}
              showToast={showToast}
              toast={toast}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default WarehouseList;
