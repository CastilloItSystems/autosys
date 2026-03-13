"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import itemService, { Item } from "@/app/api/inventory/itemService";
import ItemForm from "./ItemForm";
import CreateButton from "@/components/common/CreateButton";

const ItemList = () => {
  // Datos
  const [items, setItems] = useState<Item[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Filtros y paginación
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [showActive, setShowActive] = useState<boolean>(true);

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  // Cargar items cuando cambien los filtros
  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery, showActive]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await itemService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        isActive: showActive,
      });

      const itemsData = response.data || [];
      const total = response.meta?.total || 0;

      setItems(Array.isArray(itemsData) ? itemsData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading items:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar artículos",
        life: 3000,
      });
      setItems([]);
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

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const openNew = () => {
    setSelectedItem(null);
    setFormDialog(true);
  };

  const editItem = (item: Item) => {
    setSelectedItem({ ...item });
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: Item) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleToggleItem = async (item: Item) => {
    try {
      await itemService.toggleActive(item.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Artículo ${item.isActive ? "desactivado" : "activado"}`,
        life: 3000,
      });
      loadItems();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cambiar estado del artículo",
        life: 3000,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await itemService.delete(selectedItem!.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Artículo eliminado correctamente",
        life: 3000,
      });
      loadItems();
      setDeleteDialog(false);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar artículo",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedItem?.id
        ? "Artículo actualizado correctamente"
        : "Artículo creado correctamente",
      life: 3000,
    });
    loadItems();
    setFormDialog(false);
  };

  // Templates
  const actionBodyTemplate = (rowData: Item) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          text
          onClick={() => editItem(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={rowData.isActive ? "pi pi-pause" : "pi pi-play"}
          rounded
          severity={rowData.isActive ? "warning" : "success"}
          text
          onClick={() => handleToggleItem(rowData)}
          tooltip={rowData.isActive ? "Desactivar" : "Activar"}
        />
        <Button
          icon="pi pi-trash"
          rounded
          severity="danger"
          text
          onClick={() => confirmDeleteItem(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Item) => {
    return (
      <Tag
        value={rowData.isActive ? "Activo" : "Inactivo"}
        severity={rowData.isActive ? "success" : "secondary"}
        rounded
      />
    );
  };

  const codeBodyTemplate = (rowData: Item) => {
    return <span className="font-bold text-primary">{rowData.code}</span>;
  };

  const quantityBodyTemplate = (rowData: Item) => {
    const amount = rowData.quantity || 0;
    const minStock = rowData.minStock || 0;
    const severity =
      amount === 0 ? "danger" : amount <= minStock ? "warning" : "success";
    return <Tag value={amount.toString()} severity={severity} rounded />;
  };

  const priceBodyTemplate = (rowData: Item) => {
    if (!rowData.salePrice) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(rowData.salePrice);
  };

  const marginBodyTemplate = (rowData: Item) => {
    if (!rowData.costPrice || !rowData.salePrice) return "-";
    const margin =
      ((rowData.salePrice - rowData.costPrice) / rowData.costPrice) * 100;
    const severity =
      margin < 10 ? "danger" : margin < 20 ? "warning" : "success";
    return <Tag value={`${margin.toFixed(0)}%`} severity={severity} rounded />;
  };

  const imagesBodyTemplate = (rowData: Item) => {
    const count = rowData.images?.length || 0;
    if (count === 0) return <Tag value="0" severity="info" rounded />;
    return <Tag value={`📷 ${count}`} severity="success" rounded />;
  };

  const tagsBodyTemplate = (rowData: Item) => {
    if (!rowData.tags || rowData.tags.length === 0) return "-";
    return rowData.tags
      .slice(0, 2)
      .map((tag, idx) => (
        <Tag
          key={idx}
          value={tag}
          style={{ marginRight: "4px" }}
          severity="info"
        />
      ));
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Artículos</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
        <Button
          label={showActive ? "Todos" : "Solo activos"}
          icon={showActive ? "pi pi-filter-slash" : "pi pi-filter"}
          outlined
          size="small"
          onClick={() => {
            setShowActive(!showActive);
            setPage(0);
          }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </span>
        <CreateButton label="Nuevo Artículo" onClick={openNew} />
      </div>
    </div>
  );

  const deleteDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={() => setDeleteDialog(false)}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={handleDelete}
      />
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={items}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron artículos"
          sortMode="multiple"
          lazy
        >
          <Column
            field="code"
            header="Código"
            sortable
            body={codeBodyTemplate}
            style={{ minWidth: "80px" }}
          />
          <Column
            field="name"
            header="Nombre"
            sortable
            style={{ minWidth: "250px" }}
          />
          <Column
            field="brand.name"
            header="Marca"
            style={{ minWidth: "120px" }}
          />
          <Column
            field="category.name"
            header="Categoría"
            style={{ minWidth: "120px" }}
          />
          <Column
            field="salePrice"
            header="Precio"
            body={priceBodyTemplate}
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Margen"
            body={marginBodyTemplate}
            style={{ minWidth: "90px" }}
          />
          <Column
            field="quantity"
            header="Stock"
            body={quantityBodyTemplate}
            style={{ minWidth: "80px" }}
          />
          <Column
            header="Imágenes"
            body={imagesBodyTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Tags"
            body={tagsBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="isActive"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "140px" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={formDialog}
        style={{ width: "80vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-box mr-3 text-primary text-3xl"></i>
                {selectedItem?.id ? "Modificar Artículo" : "Crear Artículo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
      >
        <ItemForm
          model={selectedItem}
          onSave={handleSave}
          toast={toast}
        />
      </Dialog>

      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar eliminación"
        modal
        footer={deleteDialogFooter}
        onHide={() => setDeleteDialog(false)}
      >
        <div className="confirmation-content flex align-items-center gap-3">
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "2rem", color: "var(--red-500)" }}
          />
          {selectedItem && (
            <span>
              ¿Está seguro de eliminar el artículo <b>{selectedItem.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
};

export default ItemList;
