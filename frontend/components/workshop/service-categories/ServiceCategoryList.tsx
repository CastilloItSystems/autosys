"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { ServiceCategory } from "@/libs/interfaces/workshop";
import {
  getServiceCategories,
  deleteServiceCategory,
} from "@/app/api/workshop";
import CreateButton from "@/components/common/CreateButton";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import ServiceCategoryForm from "./ServiceCategoryForm";

export default function ServiceCategoryList() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await getServiceCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error loading service categories:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar categorías de servicios",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setCategory(null);
    setFormDialog(true);
  };

  const hideDialog = () => {
    setFormDialog(false);
    setCategory(null);
  };

  const hideDeleteDialog = () => {
    setDeleteDialog(false);
    setCategory(null);
  };

  const editCategory = (category: ServiceCategory) => {
    setCategory({ ...category });
    setFormDialog(true);
  };

  const confirmDeleteCategory = (category: ServiceCategory) => {
    setCategory(category);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!category?._id) return;

    try {
      await deleteServiceCategory(category._id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Categoría eliminada correctamente",
        life: 3000,
      });
      loadCategories();
      hideDeleteDialog();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la categoría",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: category?._id
        ? "Categoría actualizada correctamente"
        : "Categoría creada correctamente",
      life: 3000,
    });
    loadCategories();
    hideDialog();
  };

  // Template for codigo column with monospace font
  const codigoBodyTemplate = (rowData: ServiceCategory) => {
    return <span style={{ fontFamily: "monospace" }}>{rowData.codigo}</span>;
  };

  // Template for color column with Tag
  const colorBodyTemplate = (rowData: ServiceCategory) => {
    if (!rowData.color) return <span>-</span>;

    return (
      <Tag
        value={rowData.color}
        style={{
          backgroundColor: rowData.color,
          color: getContrastColor(rowData.color),
        }}
      />
    );
  };

  // Template for icon column
  const iconoBodyTemplate = (rowData: ServiceCategory) => {
    if (!rowData.icono) return <span>-</span>;
    return (
      <div className="flex align-items-center gap-2">
        <i className={`pi pi-${rowData.icono}`}></i>
        <span>{rowData.icono}</span>
      </div>
    );
  };

  // Template for subcategories count
  const subcategoriesBodyTemplate = (rowData: ServiceCategory) => {
    const count = rowData.subcategories?.length || 0;
    return (
      <Tag
        value={`${count} subcategoría${count !== 1 ? "s" : ""}`}
        severity="info"
        icon="pi pi-list"
      />
    );
  };

  // Template for services count
  const servicesCountBodyTemplate = (rowData: ServiceCategory) => {
    const count = rowData.servicesCount || 0;
    return (
      <Tag
        value={`${count} servicio${count !== 1 ? "s" : ""}`}
        severity="success"
        icon="pi pi-cog"
      />
    );
  };

  // Template for orden
  const ordenBodyTemplate = (rowData: ServiceCategory) => {
    return <span>{rowData.orden ?? "-"}</span>;
  };

  // Template for activo status
  const activoBodyTemplate = (rowData: ServiceCategory) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
        icon={rowData.activo ? "pi pi-check" : "pi pi-times"}
      />
    );
  };

  // Template for actions
  const actionBodyTemplate = (rowData: ServiceCategory) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onEdit={() => editCategory(rowData)}
        onDelete={() => confirmDeleteCategory(rowData)}
      />
    );
  };

  // Helper function to get contrast color
  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? "#000000" : "#FFFFFF";
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Categorías de Servicios</h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </span>
        <CreateButton label="Nueva Categoría" onClick={openNew} />
      </div>
    </div>
  );

  const deleteDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeleteDialog}
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
          value={categories}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          dataKey="_id"
          loading={loading}
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No se encontraron categorías"
          sortMode="multiple"
        >
          <Column
            field="codigo"
            header="Código"
            body={codigoBodyTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="color"
            header="Color"
            body={colorBodyTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            field="icono"
            header="Icono"
            body={iconoBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="orden"
            header="Orden"
            body={ordenBodyTemplate}
            sortable
            style={{ minWidth: "80px" }}
          />
          <Column
            header="Subcategorías"
            body={subcategoriesBodyTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            header="Servicios"
            body={servicesCountBodyTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            field="activo"
            header="Estado"
            body={activoBodyTemplate}
            sortable
            style={{ minWidth: "110px" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "120px" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={formDialog}
        style={{ width: "600px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tag mr-3 text-primary text-3xl"></i>
                {category ? "Modificar Categoría" : "Crear Categoría"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <ServiceCategoryForm
          category={category}
          onSave={handleSave}
          onCancel={hideDialog}
          toast={toast}
        />
      </Dialog>

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
          {category && (
            <span>
              ¿Está seguro de eliminar la categoría <b>{category.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
}
