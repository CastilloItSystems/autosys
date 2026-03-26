"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import supplierService, {
  type Supplier,
} from "@/app/api/inventory/supplierService";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import { handleFormError } from "@/utils/errorHandlers";
import SupplierForm from "./SupplierForm";
import SupplierDetailDialog from "./SupplierDetailDialog";
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
  const [detailsDialog, setDetailsDialog] = useState<boolean>(false);
  const toast = useRef<Toast>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSupplier, setActionSupplier] = useState<Supplier | null>(null);
  const menuRef = useRef<Menu | null>(null);

  // Cargar proveedores cuando cambien los filtros
  useEffect(() => {
    loadSuppliers();
  }, [page, rows, searchQuery, showActive]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAll({
        page: page + 1,
        limit: rows,
        name: searchQuery || undefined,
        isActive: showActive ? "true" : undefined,
      });

      // Estructura consistente en todos los endpoints
      const suppliersData = response.data || [];
      const total = response.meta?.total || 0;

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
    setIsDeleting(true);
    try {
      await supplierService.delete(selectedSupplier.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Proveedor eliminado correctamente",
        life: 3000,
      });
      await loadSuppliers();
      setDeleteDialog(false);
      setSelectedSupplier(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSupplier = async (supplier: Supplier) => {
    try {
      await supplierService.toggle(supplier.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Proveedor ${
          supplier.isActive ? "desactivado" : "activado"
        } correctamente`,
        life: 3000,
      });
      await loadSuppliers();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleSave = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: selectedSupplier?.id
          ? "Proveedor actualizado correctamente"
          : "Proveedor creado correctamente",
        life: 3000,
      });
      await loadSuppliers();
      setFormDialog(false);
      setSelectedSupplier(null);
    })();
  };

  // Templates
  const actionBodyTemplate = (rowData: Supplier) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-controls="popup_menu"
      aria-haspopup
      onClick={(e) => {
        setActionSupplier(rowData);
        menuRef.current?.toggle(e);
      }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const statusBodyTemplate = (rowData: Supplier) => (
    <Tag
      value={rowData.isActive ? "Activo" : "Inactivo"}
      severity={rowData.isActive ? "success" : "secondary"}
      rounded
    />
  );

  const typeBodyTemplate = (rowData: Supplier) => (
    <Tag
      value={rowData.type === "COMPANY" ? "Empresa" : "Individual"}
      severity={rowData.type === "COMPANY" ? "success" : "info"}
      icon={rowData.type === "COMPANY" ? "pi pi-building" : "pi pi-user"}
      className="text-xs"
    />
  );

  const nameBodyTemplate = (rowData: Supplier) => (
    <div className="flex flex-column">
      <span className="font-semibold text-900">{rowData.name}</span>
      {rowData.taxId && (
        <span className="text-xs text-500">{rowData.taxId}</span>
      )}
    </div>
  );

  const contactBodyTemplate = (rowData: Supplier) => (
    <div className="flex flex-column gap-1">
      {rowData.contactName && (
        <span className="text-xs font-medium text-800">
          <i className="pi pi-user text-500 mr-1" />
          {rowData.contactName}
        </span>
      )}
      {rowData.email && (
        <span className="text-xs">
          <i className="pi pi-envelope text-500 mr-1" />
          {rowData.email}
        </span>
      )}
      {rowData.phone && (
        <span className="text-xs">
          <i className="pi pi-phone text-500 mr-1" />
          {rowData.phone}
        </span>
      )}
      {!rowData.contactName && !rowData.email && !rowData.phone && (
        <span className="text-400 text-xs">Sin contacto</span>
      )}
    </div>
  );

  const commercialBodyTemplate = (rowData: Supplier) => (
    <div className="flex flex-column gap-1">
      {rowData.currency && (
        <span className="text-xs">
          <i className="pi pi-dollar text-500 mr-1" />
          {rowData.currency}
        </span>
      )}
      {rowData.creditDays > 0 && (
        <span className="text-xs">
          <i className="pi pi-calendar text-500 mr-1" />
          {rowData.creditDays} días
        </span>
      )}
      {rowData.isSpecialTaxpayer && (
        <Tag value="C. Especial" severity="warning" className="text-xs w-fit" />
      )}
    </div>
  );

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
          scrollable
        >
          <Column
            field="code"
            header="Código"
            sortable
            body={(r: Supplier) => <span className="font-bold text-primary">{r.code}</span>}
            style={{ minWidth: "100px" }}
          />
          <Column
            header="Proveedor"
            body={nameBodyTemplate}
            sortable
            sortField="name"
            style={{ minWidth: "180px" }}
          />
          <Column
            header="Tipo"
            body={typeBodyTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            header="Contacto"
            body={contactBodyTemplate}
            style={{ minWidth: "180px" }}
          />
          <Column
            header="Comercial"
            body={commercialBodyTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            field="isActive"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ minWidth: "90px" }}
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
        style={{ width: "800px" }}
        breakpoints={{ "960px": "80vw", "640px": "95vw" }}
        maximizable
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
        footer={
          <FormActionButtons
            formId="supplier-form"
            isUpdate={!!selectedSupplier?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <SupplierForm
          supplier={selectedSupplier}
          onSave={handleSave}
          formId="supplier-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <SupplierDetailDialog
        visible={detailsDialog}
        supplier={selectedSupplier}
        onHide={() => setDetailsDialog(false)}
      />

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelectedSupplier(null);
        }}
        onConfirm={handleDelete}
        itemName={selectedSupplier?.name}
        isDeleting={isDeleting}
      />

      <Menu
        model={
          actionSupplier
            ? [
                {
                  label: "Ver Detalles",
                  icon: "pi pi-info-circle",
                  command: () => {
                    setSelectedSupplier(actionSupplier);
                    setDetailsDialog(true);
                  },
                },
                {
                  label: "Editar",
                  icon: "pi pi-pencil",
                  command: () => editSupplier(actionSupplier),
                },
                {
                  label: actionSupplier.isActive ? "Desactivar" : "Activar",
                  icon: actionSupplier.isActive ? "pi pi-pause" : "pi pi-play",
                  command: () => handleToggleSupplier(actionSupplier),
                },
                { separator: true },
                {
                  label: "Eliminar",
                  icon: "pi pi-trash",
                  className: "p-menuitem-danger",
                  command: () => confirmDeleteSupplier(actionSupplier),
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
