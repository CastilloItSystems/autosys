"use client";
import React, { useEffect, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";
import customerService from "@/app/api/sales/customerService";
import {
  Customer,
  CustomerType,
  CUSTOMER_TYPE_CONFIG,
} from "@/libs/interfaces/sales/customer.interface";
import CustomerForm from "./CustomerForm";
import CustomerDetailDialog from "./CustomerDetailDialog";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";

const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionCustomer, setActionCustomer] = useState<Customer | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);
  const menuRef = useRef<Menu>(null);

  // ── Debounced search ──
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalFilterValue);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilterValue]);

  useEffect(() => {
    loadCustomers();
  }, [page, rows, sortField, sortOrder, debouncedSearch]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getAll({
        page: page + 1,
        limit: rows,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
      });
      setCustomers(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setPage(
      event.page !== undefined
        ? event.page
        : Math.floor(event.first / event.rows),
    );
    setRows(event.rows);
  };

  const onSort = (event: any) => {
    const newField = event.sortField;
    const newOrder = event.sortOrder === 1 ? "asc" : "desc";
    if (newField !== sortField || newOrder !== sortOrder) {
      setSortField(newField);
      setSortOrder(newOrder as "asc" | "desc");
    }
  };

  /* ── Actions ── */
  const openNew = () => {
    setSelectedCustomer(null);
    setFormDialog(true);
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedCustomer?.id ? "Cliente actualizado" : "Cliente creado",
      life: 3000,
    });
    await loadCustomers();
    setFormDialog(false);
    setSelectedCustomer(null);
  };

  const handleDelete = async () => {
    try {
      if (selectedCustomer?.id) {
        await customerService.delete(selectedCustomer.id);
        await loadCustomers();
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente eliminado",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSelectedCustomer(null);
      setDeleteDialog(false);
    }
  };

  const handleToggleActive = async (customer: Customer) => {
    try {
      await customerService.update(customer.id, {
        isActive: !customer.isActive,
      } as any);
      await loadCustomers();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Cliente ${customer.isActive ? "desactivado" : "activado"}`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
    setPage(0);
  };

  /* ── Table header ── */
  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Clientes</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center w-full sm:w-auto">
        <span className="p-input-icon-left w-full sm:w-20rem">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar (nombre, RIF, código...)"
            className="w-full"
          />
        </span>
        <CreateButton
          label="Nuevo Cliente"
          onClick={openNew}
          tooltip="Crear nuevo cliente"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );

  /* ── Menu items ── */
  const getMenuItems = (customer: Customer | null): MenuItem[] => {
    if (!customer) return [];
    return [
      {
        label: "Ver Detalles",
        icon: "pi pi-info-circle",
        command: () => {
          setSelectedCustomer(customer);
          setDetailsDialog(true);
        },
      },
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => {
          setSelectedCustomer(customer);
          setFormDialog(true);
        },
      },
      {
        label: customer.isActive ? "Desactivar" : "Activar",
        icon: customer.isActive ? "pi pi-eye-slash" : "pi pi-eye",
        command: () => handleToggleActive(customer),
      },
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => {
          setSelectedCustomer(customer);
          setDeleteDialog(true);
        },
      },
    ];
  };

  const crudBodyTemplate = (rowData: Customer) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionCustomer(rowData);
        menuRef.current?.toggle(e);
      }}
      aria-controls="customer-menu"
      aria-haspopup
    />
  );

  /* ── Column templates ── */
  const typeBodyTemplate = (rowData: Customer) => {
    const cfg = CUSTOMER_TYPE_CONFIG[rowData.type];
    return (
      <Tag
        value={cfg.label}
        severity={cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const statusBodyTemplate = (rowData: Customer) => (
    <Tag
      value={rowData.isActive ? "Activo" : "Inactivo"}
      severity={rowData.isActive ? "success" : "danger"}
      className="text-xs"
    />
  );

  const nameBodyTemplate = (rowData: Customer) => (
    <div className="flex flex-column">
      <span className="font-semibold text-900">{rowData.name}</span>
      {rowData.taxId && (
        <span className="text-xs text-500">{rowData.taxId}</span>
      )}
    </div>
  );

  const contactBodyTemplate = (rowData: Customer) => (
    <div className="flex flex-column">
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
      {!rowData.email && !rowData.phone && (
        <span className="text-400 text-xs">Sin contacto</span>
      )}
    </div>
  );

  const commercialBodyTemplate = (rowData: Customer) => (
    <div className="flex flex-column gap-1">
      <span className="text-xs">
        <i className="pi pi-list text-500 mr-1" />
        Lista {rowData.priceList}
      </span>
      {rowData.creditDays > 0 && (
        <span className="text-xs">
          <i className="pi pi-calendar text-500 mr-1" />
          {rowData.creditDays} días
        </span>
      )}
      {rowData.defaultDiscount > 0 && (
        <span className="text-xs">
          <i className="pi pi-tag text-500 mr-1" />
          {rowData.defaultDiscount}% dto.
        </span>
      )}
      {rowData.isSpecialTaxpayer && (
        <Tag value="C. Especial" severity="warning" className="text-xs w-fit" />
      )}
    </div>
  );

  const dateBodyTemplate = (rowData: Customer) =>
    new Date(rowData.createdAt).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  /* ── Render ── */
  return (
    <>
      <Toast ref={toast} />
      <ConfirmActionPopup />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={customers}
          header={renderHeader()}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          onSort={onSort}
          sortField={sortField}
          sortOrder={sortOrder === "asc" ? 1 : -1}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes"
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage="No hay clientes registrados"
          size="small"
          dataKey="id"
          scrollable
          tableStyle={{ minWidth: "60rem" }}
        >
          <Column
            field="code"
            header="Código"
            sortable
            style={{ width: "8rem" }}
          />
          <Column
            header="Cliente"
            body={nameBodyTemplate}
            sortable
            sortField="name"
          />
          <Column
            header="Tipo"
            body={typeBodyTemplate}
            style={{ width: "10rem" }}
          />
          <Column header="Contacto" body={contactBodyTemplate} />
          <Column
            header="Comercial"
            body={commercialBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            style={{ width: "7rem" }}
          />
          <Column
            header="Creado"
            body={dateBodyTemplate}
            sortable
            sortField="createdAt"
            style={{ width: "9rem" }}
          />
          <Column
            header="Acciones"
            body={crudBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>

        {/* Delete dialog */}
        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
          header="Confirmar Eliminación"
          modal
          footer={
            <div className="flex w-full gap-2 mb-4">
              <Button
                label="No"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => {
                  setSelectedCustomer(null);
                  setDeleteDialog(false);
                }}
                type="button"
                className="flex-1"
              />
              <Button
                label="Sí, Eliminar"
                icon="pi pi-trash"
                severity="danger"
                onClick={handleDelete}
                type="button"
                className="flex-1"
              />
            </div>
          }
          onHide={() => {
            setSelectedCustomer(null);
            setDeleteDialog(false);
          }}
        >
          <div className="flex align-items-center gap-3 p-2">
            <i
              className="pi pi-exclamation-triangle text-orange-500"
              style={{ fontSize: "2rem" }}
            />
            {selectedCustomer && (
              <span>
                ¿Eliminar el cliente <b>{selectedCustomer.name}</b> (
                {selectedCustomer.code})?
              </span>
            )}
          </div>
        </Dialog>

        {/* Form dialog */}
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
                  {selectedCustomer ? "Editar Cliente" : "Nuevo Cliente"}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={() => {
            setFormDialog(false);
            setSelectedCustomer(null);
          }}
          footer={
            <FormActionButtons
              formId="customer-form"
              isUpdate={!!selectedCustomer?.id}
              onCancel={() => {
                setFormDialog(false);
                setSelectedCustomer(null);
              }}
              isSubmitting={isSubmitting}
            />
          }
        >
          <CustomerForm
            customer={selectedCustomer}
            formId="customer-form"
            onSave={handleSave}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
          />
        </Dialog>

        <CustomerDetailDialog
          visible={detailsDialog}
          customer={selectedCustomer}
          onHide={() => setDetailsDialog(false)}
        />

        <Menu
          model={getMenuItems(actionCustomer)}
          popup
          ref={menuRef}
          id="customer-menu"
        />
      </motion.div>
    </>
  );
};

export default CustomerList;
