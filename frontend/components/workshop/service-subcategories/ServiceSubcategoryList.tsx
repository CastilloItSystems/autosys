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
import {
  ServiceSubcategory,
  ServiceCategoryReference,
} from "@/libs/interfaces/workshop";
import {
  getServiceSubcategories,
  deleteServiceSubcategory,
} from "@/app/api/workshop";
import CreateButton from "@/components/common/CreateButton";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import ServiceSubcategoryForm from "./ServiceSubcategoryForm";

export default function ServiceSubcategoryList() {
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [subcategory, setSubcategory] = useState<ServiceSubcategory | null>(
    null
  );
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadSubcategories();
  }, []);

  const loadSubcategories = async () => {
    try {
      setLoading(true);
      const response = await getServiceSubcategories();
      setSubcategories(response.data || []);
    } catch (error) {
      console.error("Error loading service subcategories:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar subcategorías de servicios",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setSubcategory(null);
    setFormDialog(true);
  };

  const hideDialog = () => {
    setFormDialog(false);
    setSubcategory(null);
  };

  const hideDeleteDialog = () => {
    setDeleteDialog(false);
    setSubcategory(null);
  };

  const editSubcategory = (subcategory: ServiceSubcategory) => {
    setSubcategory({ ...subcategory });
    setFormDialog(true);
  };

  const confirmDeleteSubcategory = (subcategory: ServiceSubcategory) => {
    setSubcategory(subcategory);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!subcategory?._id) return;

    try {
      await deleteServiceSubcategory(subcategory._id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Subcategoría eliminada correctamente",
        life: 3000,
      });
      loadSubcategories();
      hideDeleteDialog();
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la subcategoría",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: subcategory?._id
        ? "Subcategoría actualizada correctamente"
        : "Subcategoría creada correctamente",
      life: 3000,
    });
    loadSubcategories();
    hideDialog();
  };

  // Template for codigo column with monospace font
  const codigoBodyTemplate = (rowData: ServiceSubcategory) => {
    return <span style={{ fontFamily: "monospace" }}>{rowData.codigo}</span>;
  };

  // Template for categoria column with Tag and color
  const categoriaBodyTemplate = (rowData: ServiceSubcategory) => {
    if (typeof rowData.categoria === "string") {
      return <span>{rowData.categoria}</span>;
    }

    const categoria = rowData.categoria as ServiceCategoryReference;
    return (
      <Tag
        value={categoria.nombre}
        style={{
          backgroundColor: categoria.color || "#607D8B",
          color: getContrastColor(categoria.color || "#607D8B"),
        }}
      />
    );
  };

  // Template for activo status
  const activoBodyTemplate = (rowData: ServiceSubcategory) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
        icon={rowData.activo ? "pi pi-check" : "pi pi-times"}
      />
    );
  };

  // Template for actions
  const actionBodyTemplate = (rowData: ServiceSubcategory) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onEdit={() => editSubcategory(rowData)}
        onDelete={() => confirmDeleteSubcategory(rowData)}
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
      <h4 className="m-0">Subcategorías de Servicios</h4>
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
        <CreateButton label="Nueva Subcategoría" onClick={openNew} />
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
          value={subcategories}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          dataKey="_id"
          loading={loading}
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No se encontraron subcategorías"
          sortMode="multiple"
        >
          <Column
            field="codigo"
            header="Código"
            body={codigoBodyTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Categoría"
            body={categoriaBodyTemplate}
            sortable
            sortField="categoria.nombre"
            style={{ minWidth: "200px" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            style={{ minWidth: "250px" }}
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
                <i className="pi pi-tags mr-3 text-primary text-3xl"></i>
                {subcategory ? "Modificar Subcategoría" : "Crear Subcategoría"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <ServiceSubcategoryForm
          subcategory={subcategory}
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
          {subcategory && (
            <span>
              ¿Está seguro de eliminar la subcategoría{" "}
              <b>{subcategory.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
}
