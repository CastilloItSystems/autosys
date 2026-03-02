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
import unitsService, { Unit } from "@/app/api/inventory/unitService";
import UnitForm from "./UnitForm";
import CreateButton from "@/components/common/CreateButton";

const UNIT_TYPES_LABELS: Record<string, string> = {
  COUNTABLE: "Contable",
  WEIGHT: "Peso",
  VOLUME: "Volumen",
  LENGTH: "Longitud",
};

export default function UnitList() {
  // Datos
  const [units, setUnits] = useState<Unit[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

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

  // Cargar unidades cuando cambien los filtros
  useEffect(() => {
    loadUnits();
  }, [page, rows, searchQuery, showActive]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const response = await unitsService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        isActive: showActive ? "true" : undefined,
      });

      // Estructura consistente en todos los endpoints
      const unitsData = response.data || [];
      const total = response.meta?.total || 0;

      setUnits(Array.isArray(unitsData) ? unitsData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading units:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar unidades",
        life: 3000,
      });
      setUnits([]);
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
    setSelectedUnit(null);
    setFormDialog(true);
  };

  const editUnit = (unit: Unit) => {
    setSelectedUnit({ ...unit });
    setFormDialog(true);
  };

  const confirmDeleteUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedUnit?.id) return;

    try {
      await unitsService.delete(selectedUnit.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Unidad eliminada correctamente",
        life: 3000,
      });
      loadUnits();
      setDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la unidad",
        life: 3000,
      });
    }
  };

  const handleToggleUnit = async (unit: Unit) => {
    try {
      await unitsService.toggleActive(unit.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Unidad ${
          unit.isActive ? "desactivada" : "activada"
        } correctamente`,
        life: 3000,
      });
      loadUnits();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cambiar estado de la unidad",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedUnit?.id
        ? "Unidad actualizada correctamente"
        : "Unidad creada correctamente",
      life: 3000,
    });
    loadUnits();
    setFormDialog(false);
  };

  // Templates
  const actionBodyTemplate = (rowData: Unit) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          text
          onClick={() => editUnit(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={rowData.isActive ? "pi pi-pause" : "pi pi-play"}
          rounded
          severity={rowData.isActive ? "warning" : "success"}
          text
          onClick={() => handleToggleUnit(rowData)}
          tooltip={rowData.isActive ? "Desactivar" : "Activar"}
        />
        <Button
          icon="pi pi-trash"
          rounded
          severity="danger"
          text
          onClick={() => confirmDeleteUnit(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Unit) => {
    return (
      <Tag
        value={rowData.isActive ? "Activo" : "Inactivo"}
        severity={rowData.isActive ? "success" : "secondary"}
        rounded
      />
    );
  };

  const codeBodyTemplate = (rowData: Unit) => {
    return <span className="font-bold text-primary">{rowData.code}</span>;
  };

  const typeBodyTemplate = (rowData: Unit) => {
    const typeLabel =
      UNIT_TYPES_LABELS[rowData.type || ""] || rowData.type || "-";
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
        {typeLabel}
      </span>
    );
  };

  const abbreviationBodyTemplate = (rowData: Unit) => {
    return <span className="text-gray-600">{rowData.abbreviation || "-"}</span>;
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Unidades de Medida</h4>
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
        <CreateButton label="Nueva Unidad" onClick={openNew} />
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
          value={units}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron unidades"
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
            style={{ minWidth: "150px" }}
          />
          <Column
            field="abbreviation"
            header="Abreviación"
            body={abbreviationBodyTemplate}
            style={{ minWidth: "100px" }}
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
                {selectedUnit?.id ? "Modificar Unidad" : "Crear Unidad"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
      >
        <UnitForm
          unit={selectedUnit}
          hideFormDialog={() => setFormDialog(false)}
          onSuccess={handleSave}
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
          {selectedUnit && (
            <span>
              ¿Está seguro de eliminar la unidad <b>{selectedUnit.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
}
