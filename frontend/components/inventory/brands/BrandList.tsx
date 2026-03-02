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
  getBrands,
  deleteBrand,
  toggleBrand,
  getActiveBrands,
} from "@/app/api/inventory/brandService";
import BrandForm from "./BrandForm";
import CreateButton from "@/components/common/CreateButton";
import type { Brand } from "@/app/api/inventory/brandService";

export default function BrandList() {
  // Datos
  const [brands, setBrands] = useState<Brand[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Filtros y paginación
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0); // PrimeReact usa 0-indexed
  const [rows, setRows] = useState<number>(10);
  const [showActive, setShowActive] = useState<boolean>(true); // Mostrar activas por defecto

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  // Cargar marcas cuando cambien los filtros
  useEffect(() => {
    loadBrands();
  }, [page, rows, searchQuery, showActive]);

  const loadBrands = async () => {
    try {
      setLoading(true);
      let response: any;

      if (showActive) {
        response = await getActiveBrands();
      } else {
        response = await getBrands(page + 1, rows, searchQuery || undefined);
      }

      // Estructura consistente en todos los endpoints
      const brandsData = response.data || [];
      const total = response.meta?.total || 0;

      setBrands(Array.isArray(brandsData) ? brandsData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading brands:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar marcas de inventario",
        life: 3000,
      });
      setBrands([]);
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
    setSelectedBrand(null);
    setFormDialog(true);
  };

  const editBrand = (brand: Brand) => {
    setSelectedBrand({ ...brand });
    setFormDialog(true);
  };

  const confirmDeleteBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedBrand?.id) return;

    try {
      await deleteBrand(selectedBrand.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Marca eliminada correctamente",
        life: 3000,
      });
      loadBrands();
      setDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la marca",
        life: 3000,
      });
    }
  };

  const handleToggleBrand = async (brand: Brand) => {
    try {
      await toggleBrand(brand.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Marca ${
          brand.isActive ? "desactivada" : "activada"
        } correctamente`,
        life: 3000,
      });
      loadBrands();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cambiar estado de la marca",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedBrand?.id
        ? "Marca actualizada correctamente"
        : "Marca creada correctamente",
      life: 3000,
    });
    loadBrands();
    setFormDialog(false);
  };

  // Templates
  const actionBodyTemplate = (rowData: Brand) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          text
          onClick={() => editBrand(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={rowData.isActive ? "pi pi-pause" : "pi pi-play"}
          rounded
          severity={rowData.isActive ? "warning" : "success"}
          text
          onClick={() => handleToggleBrand(rowData)}
          tooltip={rowData.isActive ? "Desactivar" : "Activar"}
        />
        <Button
          icon="pi pi-trash"
          rounded
          severity="danger"
          text
          onClick={() => confirmDeleteBrand(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Brand) => {
    return (
      <Tag
        value={rowData.isActive ? "Activo" : "Inactivo"}
        severity={rowData.isActive ? "success" : "secondary"}
        rounded
      />
    );
  };

  const codeBodyTemplate = (rowData: Brand) => {
    return <span className="font-bold text-primary">{rowData.code}</span>;
  };

  const typeBodyTemplate = (rowData: Brand) => {
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
        {rowData.typeLabel}
      </span>
    );
  };

  const statsBodyTemplate = (rowData: Brand) => {
    if (!rowData.stats) {
      return <span className="text-gray-400">Sin datos</span>;
    }
    return (
      <div className="flex flex-col gap-1 text-sm">
        <span>
          Items:{" "}
          <span className="font-semibold">{rowData.stats.itemsCount}</span>
        </span>
        <span>
          Modelos:{" "}
          <span className="font-semibold">{rowData.stats.modelsCount}</span>
        </span>
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Marcas de Inventario</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
        <Button
          label={showActive ? "Todas las marcas" : "Solo activas"}
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
        <CreateButton label="Nueva Marca" onClick={openNew} />
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
          value={brands}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron marcas"
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
            field="isActive"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Estadísticas"
            body={statsBodyTemplate}
            style={{ minWidth: "140px" }}
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
        style={{ width: "450px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tag mr-3 text-primary text-3xl"></i>
                {selectedBrand?.id ? "Modificar Marca" : "Crear Marca"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
      >
        <BrandForm
          brand={selectedBrand}
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
          {selectedBrand && (
            <span>
              ¿Está seguro de eliminar la marca <b>{selectedBrand.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
}
