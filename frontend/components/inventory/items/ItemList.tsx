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
import { deleteItem, getItems } from "@/app/api/inventory/itemService";
import ItemForm from "./ItemForm";
import { Item } from "@/libs/interfaces/inventory";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const ItemList = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [item, setItem] = useState<Item | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const itemsDB = await getItems();
      if (itemsDB && Array.isArray(itemsDB.items)) {
        setItems(itemsDB.items);
      }
    } catch (error) {
      console.error("Error al obtener los artículos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setItem(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setItem(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (item?.id) {
        await deleteItem(item.id);
        setItems(items.filter((val) => val.id !== item.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Artículo Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el artículo",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setItem(null);
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

  const actionBodyTemplate = (rowData: Item) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setItem(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setItem(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  const estadoBodyTemplate = (rowData: Item) => (
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

  const priceBodyTemplate = (
    rowData: Item,
    field: "precioCosto" | "precioVenta"
  ) => {
    const value = rowData[field];
    return value ? `$${value.toFixed(2)}` : "-";
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
          value={items}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay artículos disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="sku" header="SKU" sortable />
          <Column field="codigo" header="Código" sortable />
          <Column field="nombre" header="Nombre" sortable />
          <Column field="marca.nombre" header="Marca" sortable />
          <Column field="modelo.nombre" header="Modelo" sortable />
          <Column field="categoria.nombre" header="Categoría" sortable />
          <Column field="unidad.nombre" header="Unidad" sortable />
          <Column
            field="precioCosto"
            header="Precio Costo"
            body={(rowData) => priceBodyTemplate(rowData, "precioCosto")}
            sortable
          />
          <Column
            field="precioVenta"
            header="Precio Venta"
            body={(rowData) => priceBodyTemplate(rowData, "precioVenta")}
            sortable
          />
          <Column field="stockMinimo" header="Stock Mín" sortable />
          <Column field="stockMaximo" header="Stock Máx" sortable />
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
            {item && (
              <span>
                ¿Estás seguro de que deseas eliminar <b>{item.nombre}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "850px" }}
          header={item ? "Editar Artículo" : "Crear Artículo"}
          modal
          onHide={hideFormDialog}
          content={
            <ItemForm
              item={item}
              hideFormDialog={hideFormDialog}
              items={items}
              setItems={setItems}
              setItem={setItem}
              showToast={showToast}
              toast={toast}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default ItemList;
