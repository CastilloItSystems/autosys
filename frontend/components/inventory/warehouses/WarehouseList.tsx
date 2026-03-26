"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import { handleFormError } from "@/utils/errorHandlers";
import { motion } from "framer-motion";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import WarehouseForm from "./WarehouseForm";
import CreateButton from "@/components/common/CreateButton";

export default function WarehouseList() {
  // Datos
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null,
  );

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
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionWarehouse, setActionWarehouse] = useState<Warehouse | null>(
    null,
  );
  const menuRef = useRef<Menu | null>(null);

  // Cargar almacenes cuando cambien los filtros
  useEffect(() => {
    loadWarehouses();
  }, [page, rows, searchQuery, showActive]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        isActive: showActive ? "true" : undefined,
      });

      // Estructura consistente en todos los endpoints
      const warehousesData = response.data || [];
      const total = response.meta?.total || 0;

      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading warehouses:", error);
      handleFormError(error, toast);
      setWarehouses([]);
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
    setSelectedWarehouse(null);
    setFormDialog(true);
  };

  const editWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse({ ...warehouse });
    setFormDialog(true);
  };

  const confirmDeleteWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedWarehouse?.id) return;
    setIsDeleting(true);
    try {
      await warehouseService.delete(selectedWarehouse.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Almacén eliminado correctamente",
        life: 3000,
      });
      await loadWarehouses();
      setDeleteDialog(false);
      setSelectedWarehouse(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleWarehouse = async (warehouse: Warehouse) => {
    try {
      if (warehouse.isActive) {
        await warehouseService.deactivate(warehouse.id);
      } else {
        await warehouseService.activate(warehouse.id);
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Almacén ${
          warehouse.isActive ? "desactivado" : "activado"
        } correctamente`,
        life: 3000,
      });
      await loadWarehouses();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleSave = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: selectedWarehouse?.id
          ? "Almacén actualizado correctamente"
          : "Almacén creado correctamente",
        life: 3000,
      });
      await loadWarehouses();
      setFormDialog(false);
      setSelectedWarehouse(null);
    })();
  };

  // Templates
  const actionBodyTemplate = (rowData: Warehouse) => {
    return (
      <div>
        <Button
          icon="pi pi-cog"
          rounded
          text
          aria-controls="popup_menu"
          aria-haspopup
          onClick={(e) => {
            setActionWarehouse(rowData);
            menuRef.current?.toggle(e);
          }}
          tooltip="Opciones"
          tooltipOptions={{ position: "left" }}
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Warehouse) => {
    return (
      <Tag
        value={rowData.isActive ? "Activo" : "Inactivo"}
        severity={rowData.isActive ? "success" : "secondary"}
        rounded
      />
    );
  };

  const codeBodyTemplate = (rowData: Warehouse) => {
    return <span className="font-bold text-primary">{rowData.code}</span>;
  };

  const typeBodyTemplate = (rowData: Warehouse) => {
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
        {rowData.type}
      </span>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Almacenes</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
        <Button
          label={showActive ? "Todos los almacenes" : "Solo activos"}
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
        <CreateButton
          label="Nuevo almacén"
          onClick={openNew}
          tooltip="Crear almacén"
        />
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
          value={warehouses}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron almacenes"
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
            field="address"
            header="Dirección"
            style={{ minWidth: "200px" }}
          />
          <Column
            field="isActive"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen={true}
            alignFrozen="right"
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={formDialog}
        style={{ width: "450px" }}
        breakpoints={{ "1400px": "450px", "900px": "60vw", "600px": "90vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-building mr-3 text-primary text-3xl"></i>
                {selectedWarehouse?.id ? "Modificar Almacén" : "Crear Almacén"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
        footer={
          <FormActionButtons
            formId="warehouse-form"
            isUpdate={!!selectedWarehouse?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <WarehouseForm
          warehouse={selectedWarehouse}
          onSave={handleSave}
          formId="warehouse-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelectedWarehouse(null);
        }}
        onConfirm={handleDelete}
        itemName={selectedWarehouse?.name}
        isDeleting={isDeleting}
      />

      <Menu
        model={
          actionWarehouse
            ? [
                {
                  label: "Editar",
                  icon: "pi pi-pencil",
                  command: () => editWarehouse(actionWarehouse),
                },
                {
                  label: actionWarehouse.isActive ? "Desactivar" : "Activar",
                  icon: actionWarehouse.isActive ? "pi pi-pause" : "pi pi-play",
                  command: () => handleToggleWarehouse(actionWarehouse),
                },
                { separator: true },
                {
                  label: "Eliminar",
                  icon: "pi pi-trash",
                  className: "p-menuitem-danger",
                  command: () => confirmDeleteWarehouse(actionWarehouse),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="popup_menu"
      />
    </motion.div>
  );
}
