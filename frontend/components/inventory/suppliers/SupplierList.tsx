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
  getSuppliers,
  getActiveSuppliers,
  deleteSupplier,
  toggleSupplier,
  Supplier,
} from "@/app/api/inventory/supplierService";
import SupplierForm from "./SupplierForm";
import CreateButton from "@/components/common/CreateButton";

export default function SupplierList() {
  // Datos
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

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

  // Cargar proveedores cuando cambien los filtros
  useEffect(() => {
    loadSuppliers();
  }, [page, rows, searchQuery, showActive]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      let response: any;

      if (showActive) {
        response = await getActiveSuppliers();
      } else {
        response = await getSuppliers(page + 1, rows, searchQuery || undefined);
      }

      // Estructura consistente en todos los endpoints
      const suppliersData = response.data || [];
      const total = response.pagination?.total || 0;

      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar proveedores",
        life: 3000,
      });
      setSuppliers([]);
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
    setSelectedSupplier(null);
    setFormDialog(true);
  };

  const editSupplier = (supplier: Supplier) => {
    setSelectedSupplier({ ...supplier });
    setFormDialog(true);
  };

  const confirmDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedSupplier?.id) return;

    try {
      await deleteSupplier(selectedSupplier.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Proveedor eliminado correctamente",
        life: 3000,
      });
      loadSuppliers();
      setDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el proveedor",
        life: 3000,
      });
    }
  };

  const handleToggleSupplier = async (supplier: Supplier) => {
    try {
      await toggleSupplier(supplier.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Proveedor ${
          supplier.isActive ? "desactivado" : "activado"
        } correctamente`,
        life: 3000,
      });
      loadSuppliers();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cambiar estado del proveedor",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedSupplier?.id
        ? "Proveedor actualizado correctamente"
        : "Proveedor creado correctamente",
      life: 3000,
    });
    loadSuppliers();
    setFormDialog(false);
  };

  // Templates
  const actionBodyTemplate = (rowData: Supplier) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          text
          onClick={() => editSupplier(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={rowData.isActive ? "pi pi-pause" : "pi pi-play"}
          rounded
          severity={rowData.isActive ? "warning" : "success"}
          text
          onClick={() => handleToggleSupplier(rowData)}
          tooltip={rowData.isActive ? "Desactivar" : "Activar"}
        />
        <Button
          icon="pi pi-trash"
          rounded
          severity="danger"
          text
          onClick={() => confirmDeleteSupplier(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Supplier) => {
    return (
      <Tag
        value={rowData.isActive ? "Activo" : "Inactivo"}
        severity={rowData.isActive ? "success" : "secondary"}
        rounded
      />
    );
  };

  const codeBodyTemplate = (rowData: Supplier) => {
    return <span className="font-bold text-primary">{rowData.code}</span>;
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Proveedores</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
        <Button
          label={showActive ? "Todos los proveedores" : "Solo activos"}
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
        <CreateButton label="Nuevo Proveedor" onClick={openNew} />
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
          value={suppliers}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron proveedores"
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
            field="contactName"
            header="Contacto"
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="email"
            header="Correo"
            sortable
            style={{ minWidth: "180px" }}
          />
          <Column
            field="phone"
            header="Teléfono"
            style={{ minWidth: "120px" }}
          />
          <Column
            field="address"
            header="Dirección"
            style={{ minWidth: "200px" }}
          />
          <Column
            field="taxId"
            header="RIF/NIT"
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
        style={{ width: "550px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-users mr-3 text-primary text-3xl"></i>
                {selectedSupplier?.id
                  ? "Modificar Proveedor"
                  : "Crear Proveedor"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
      >
        <SupplierForm
          supplier={selectedSupplier}
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
          {selectedSupplier && (
            <span>
              ¿Está seguro de eliminar el proveedor{" "}
              <b>{selectedSupplier.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
}
