"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import {
  deleteCustomer,
  getCustomers,
} from "@/app/api/inventory/customerService";
import CustomerForm from "./CustomerForm";
import { Customer } from "@/libs/interfaces/inventory";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const customersDB = await getCustomers();
      if (customersDB && Array.isArray(customersDB.customers)) {
        setCustomers(customersDB.customers);
      }
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setCustomer(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setCustomer(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (customer?.id) {
        await deleteCustomer(customer.id);
        setCustomers(customers.filter((val) => val.id !== customer.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el cliente",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setCustomer(null);
      setDeleteDialog(false);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <span className="p-input-icon-left w-full sm:w-20rem flex-order-1 sm:flex-order-0">
        <i className="pi pi-search"></i>
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Búsqueda Global"
          className="w-full"
        />
      </span>
      <CreateButton onClick={openFormDialog} />
    </div>
  );

  const actionBodyTemplate = (rowData: Customer) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setCustomer(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setCustomer(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  const tipoBodyTemplate = (rowData: Customer) => (
    <Tag
      value={rowData.tipo === "persona" ? "Persona" : "Empresa"}
      severity={rowData.tipo === "persona" ? "info" : "success"}
    />
  );

  const estadoBodyTemplate = (rowData: Customer) => (
    <Tag
      value={rowData.estado === "activo" ? "Activo" : "Inactivo"}
      severity={rowData.estado === "activo" ? "success" : "danger"}
    />
  );

  const vehiclesCountBodyTemplate = (rowData: Customer) => (
    <span className="font-semibold">
      {rowData.vehicles?.length || 0} vehículo
      {rowData.vehicles?.length !== 1 ? "s" : ""}
    </span>
  );

  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const deleteDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
      <Button label="Sí" icon="pi pi-check" text onClick={handleDelete} />
    </>
  );

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 40,
          filter: "blur(8px)",
        }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={customers}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay clientes disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="nombre" header="Nombre" sortable />
          <Column field="tipo" header="Tipo" body={tipoBodyTemplate} sortable />
          <Column field="telefono" header="Teléfono" sortable />
          <Column field="correo" header="Correo" sortable />
          <Column field="rif" header="RIF" sortable />
          <Column field="razonSocial" header="Razón Social" sortable />
          <Column
            field="vehicles"
            header="Vehículos"
            body={vehiclesCountBodyTemplate}
            sortable
          />
          <Column
            field="estado"
            header="Estado"
            body={estadoBodyTemplate}
            sortable
          />
        </DataTable>

        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
          header="Confirmar"
          modal
          footer={deleteDialogFooter}
          onHide={hideDeleteDialog}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {customer && (
              <span>
                ¿Estás seguro de que deseas eliminar <b>{customer.nombre}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "850px" }}
          header={customer ? "Editar Cliente" : "Crear Cliente"}
          modal
          onHide={hideFormDialog}
          content={
            <CustomerForm
              customer={customer}
              hideFormDialog={hideFormDialog}
              customers={customers}
              setCustomers={setCustomers}
              setCustomer={setCustomer}
              showToast={showToast}
              toast={toast}
            />
          }
        ></Dialog>
      </motion.div>
    </>
  );
};

export default CustomerList;
