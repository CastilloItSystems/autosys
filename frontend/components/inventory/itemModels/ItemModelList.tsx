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
  getModels,
  deleteModel,
  toggleModel,
  getActiveModels,
  type Model,
} from "@/app/api/inventory/modelService";
import ItemModelForm from "./ItemModelForm";
import CreateButton from "@/components/common/CreateButton";

export default function ItemModelList() {
  // Datos
  const [models, setModels] = useState<Model[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Filtros y paginación
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0); // PrimeReact usa 0-indexed
  const [rows, setRows] = useState<number>(10);
  const [showActive, setShowActive] = useState<boolean>(true); // Mostrar activos por defecto

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  // Cargar modelos cuando cambien los filtros
  useEffect(() => {
    loadModels();
  }, [page, rows, searchQuery, showActive]);

  const loadModels = async () => {
    try {
      setLoading(true);
      let response: any;

      if (showActive) {
        response = await getActiveModels();
      } else {
        response = await getModels(page + 1, rows, searchQuery || undefined);
      }
      // Estructura consistente en todos los endpoints
      const modelsData = response.data || [];
      const total = response.meta?.total || 0;

      setModels(Array.isArray(modelsData) ? modelsData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading models:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar modelos de inventario",
        life: 3000,
      });
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    // Con lazy=true, event tiene: { first, rows, sortBy, filters, globalFilter }
    // Sin lazy=true, event tiene: { page, rows, first... }
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
    setSelectedModel(null);
    setFormDialog(true);
  };

  const editModel = (model: Model) => {
    setSelectedModel({ ...model });
    setFormDialog(true);
  };

  const confirmDeleteModel = (model: Model) => {
    setSelectedModel(model);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedModel?.id) return;

    try {
      await deleteModel(selectedModel.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Modelo eliminado correctamente",
        life: 3000,
      });
      loadModels();
      setDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el modelo",
        life: 3000,
      });
    }
  };

  const handleToggleModel = async (model: Model) => {
    try {
      await toggleModel(model.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Modelo ${
          model.isActive ? "desactivado" : "activado"
        } correctamente`,
        life: 3000,
      });
      loadModels();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cambiar estado del modelo",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedModel?.id
        ? "Modelo actualizado correctamente"
        : "Modelo creado correctamente",
      life: 3000,
    });
    loadModels();
    setFormDialog(false);
  };

  // Templates
  const actionBodyTemplate = (rowData: Model) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          text
          onClick={() => editModel(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={rowData.isActive ? "pi pi-pause" : "pi pi-play"}
          rounded
          severity={rowData.isActive ? "warning" : "success"}
          text
          onClick={() => handleToggleModel(rowData)}
          tooltip={rowData.isActive ? "Desactivar" : "Activar"}
        />
        <Button
          icon="pi pi-trash"
          rounded
          severity="danger"
          text
          onClick={() => confirmDeleteModel(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Model) => {
    return (
      <Tag
        value={rowData.isActive ? "Activo" : "Inactivo"}
        severity={rowData.isActive ? "success" : "secondary"}
        rounded
      />
    );
  };

  const codeBodyTemplate = (rowData: Model) => {
    return <span className="font-bold text-primary">{rowData.code}</span>;
  };

  const brandBodyTemplate = (rowData: Model) => {
    return rowData.brand?.name || "-";
  };

  const typeBodyTemplate = (rowData: Model) => {
    const label =
      rowData.type === "VEHICLE"
        ? "Vehículo"
        : rowData.type === "PART"
        ? "Repuesto"
        : rowData.type;

    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
        {label}
      </span>
    );
  };

  const yearBodyTemplate = (rowData: Model) => {
    return <span>{rowData.year || "-"}</span>;
  };

  const statsBodyTemplate = (rowData: Model) => {
    if (!rowData.stats) {
      return <span className="text-gray-400">Sin datos</span>;
    }
    return (
      <div className="flex flex-col gap-1 text-sm">
        <span>
          Items:{" "}
          <span className="font-semibold">{rowData.stats.itemsCount}</span>
        </span>
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Modelos de Inventario</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
        <Button
          label={showActive ? "Todos los modelos" : "Solo activos"}
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
        <CreateButton label="Nuevo Modelo" onClick={openNew} />
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
          value={models}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron modelos"
          sortMode="multiple"
          lazy
        >
          <Column
            field="code"
            header="Código"
            sortable
            body={codeBodyTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            field="brand.name"
            header="Marca"
            body={brandBodyTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="name"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="type"
            header="Tipo"
            body={typeBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="year"
            header="Año"
            body={yearBodyTemplate}
            style={{ minWidth: "80px" }}
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
        style={{ width: "60vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-sitemap mr-3 text-primary text-3xl"></i>
                {selectedModel?.id ? "Modificar Modelo" : "Crear Modelo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
      >
        <ItemModelForm
          model={selectedModel}
          onSave={handleSave}
          onCancel={() => setFormDialog(false)}
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
          {selectedModel && (
            <span>
              ¿Está seguro de eliminar el modelo <b>{selectedModel.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
}
