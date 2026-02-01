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
import { deleteStock, getStocks } from "@/app/api/inventory/stockService";
import StockForm from "./StockForm";
import { Stock, Item, Warehouse } from "@/libs/interfaces/inventory";
import { getItems } from "@/app/api/inventory/itemService";
import { getWarehouses } from "@/app/api/inventory/warehouseService";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const StockList = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
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
      const [stocksDB, itemsDB, warehousesDB] = await Promise.all([
        getStocks(),
        getItems(),
        getWarehouses(),
      ]);

      if (stocksDB && Array.isArray(stocksDB.stocks)) {
        setStocks(stocksDB.stocks);
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
    setStock(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setStock(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (stock?.id) {
        await deleteStock(stock.id);
        setStocks(stocks.filter((val) => val.id !== stock.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Stock Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el stock",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setStock(null);
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

  const actionBodyTemplate = (rowData: Stock) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setStock(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setStock(rowData);
        setDeleteDialog(true);
      }}
    />
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
          value={stocks}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay stock disponible"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="item.nombre" header="Artículo" sortable />
          <Column field="warehouse.nombre" header="Almacén" sortable />
          <Column field="cantidad" header="Cantidad" sortable />
          <Column field="costoPromedio" header="Costo Promedio" sortable />
          <Column field="lote" header="Lote" sortable />
          <Column field="ubicacionZona" header="Ubicación/Zona" sortable />
          <Column field="reservado" header="Reservado" sortable />
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
            {stock && (
              <span>¿Estás seguro de que deseas eliminar este stock?</span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "850px" }}
          header={stock ? "Editar Stock" : "Crear Stock"}
          modal
          onHide={hideFormDialog}
          content={
            <StockForm
              stock={stock}
              hideFormDialog={hideFormDialog}
              stocks={stocks}
              setStocks={setStocks}
              setStock={setStock}
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

export default StockList;
