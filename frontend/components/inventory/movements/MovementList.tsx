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
  deleteMovement,
  getMovements,
} from "@/app/api/inventory/movementService";
import MovementForm from "./MovementForm";
import { Movement, Item, Warehouse } from "@/libs/interfaces/inventory";
import { getItems } from "@/app/api/inventory/itemService";
import { getWarehouses } from "@/app/api/inventory/warehouseService";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const MovementList = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movement, setMovement] = useState<Movement | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movementsDB, itemsDB, warehousesDB] = await Promise.all([
        getMovements(),
        getItems(),
        getWarehouses(),
      ]);

      if (movementsDB && Array.isArray(movementsDB.movements)) {
        setMovements(movementsDB.movements);
      }
      if (itemsDB && Array.isArray(itemsDB.items)) {
        setItems(itemsDB.items);
      }
      if (warehousesDB && Array.isArray(warehousesDB.warehouses)) {
        setWarehouses(warehousesDB.warehouses);
      }
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setMovement(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setMovement(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (movement?.id) {
        await deleteMovement(movement.id);
        setMovements(movements.filter((val) => val.id !== movement.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el movimiento",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setMovement(null);
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

  const actionBodyTemplate = (rowData: Movement) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setMovement(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setMovement(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  const tipoBodyTemplate = (rowData: Movement) => {
    const tipoColors: Record<string, string> = {
      entrada: "bg-blue-100 text-blue-900",
      salida: "bg-orange-100 text-orange-900",
      transferencia: "bg-purple-100 text-purple-900",
      ajuste: "bg-gray-100 text-gray-900",
    };

    return (
      <span
        className={`px-2 py-1 border-round text-sm font-semibold ${
          tipoColors[rowData.tipo] || "bg-gray-100 text-gray-900"
        }`}
      >
        {rowData.tipo}
      </span>
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
          value={movements}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay movimientos disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="tipo" header="Tipo" body={tipoBodyTemplate} sortable />
          <Column field="referencia" header="Referencia" sortable />
          <Column field="item.nombre" header="Artículo" sortable />
          <Column field="cantidad" header="Cantidad" sortable />
          <Column field="costoUnitario" header="Costo Unit." sortable />
          <Column
            field="warehouseFrom.nombre"
            header="Almacén Origen"
            sortable
          />
          <Column
            field="warehouseTo.nombre"
            header="Almacén Destino"
            sortable
          />
          <Column field="lote" header="Lote" sortable />
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
            {movement && (
              <span>¿Estás seguro de que deseas eliminar este movimiento?</span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "850px" }}
          header={movement ? "Editar Movimiento" : "Crear Movimiento"}
          modal
          onHide={hideFormDialog}
          content={
            <MovementForm
              movement={movement}
              hideFormDialog={hideFormDialog}
              movements={movements}
              setMovements={setMovements}
              setMovement={setMovement}
              showToast={showToast}
              toast={toast}
              items={items}
              warehouses={warehouses}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default MovementList;
