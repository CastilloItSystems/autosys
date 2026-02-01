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
import { deleteVehicle, getVehicles } from "@/app/api/crm/vehicleService";
import VehicleForm from "./VehicleForm";
import { Vehicle } from "@/libs/interfaces/inventory";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const VehicleList = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const vehiclesDB = await getVehicles();
      if (vehiclesDB && Array.isArray(vehiclesDB.vehicles)) {
        setVehicles(vehiclesDB.vehicles);
      }
    } catch (error) {
      console.error("Error al obtener los vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setVehicle(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setVehicle(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (vehicle?.id) {
        await deleteVehicle(vehicle.id);
        setVehicles(vehicles.filter((val) => val.id !== vehicle.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Vehículo Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el vehículo",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setVehicle(null);
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

  const actionBodyTemplate = (rowData: Vehicle) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setVehicle(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setVehicle(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  const customerBodyTemplate = (rowData: Vehicle) => {
    const customer =
      typeof rowData.customer === "string"
        ? { nombre: "Cargando..." }
        : rowData.customer;
    return <span>{customer.nombre}</span>;
  };

  const modelBodyTemplate = (rowData: Vehicle) => {
    const model =
      typeof rowData.model === "string"
        ? { nombre: "Cargando..." }
        : rowData.model;
    return <span>{model.nombre}</span>;
  };

  const brandBodyTemplate = (rowData: Vehicle) => {
    const model = typeof rowData.model === "string" ? null : rowData.model;
    const brand =
      model && typeof model.brand === "string"
        ? { nombre: "Cargando..." }
        : model?.brand;
    const brandName =
      typeof brand === "string" ? "Cargando..." : brand?.nombre || "-";
    return <span>{brandName}</span>;
  };

  const estadoBodyTemplate = (rowData: Vehicle) => (
    <Tag
      value={rowData.estado === "activo" ? "Activo" : "Inactivo"}
      severity={rowData.estado === "activo" ? "success" : "danger"}
    />
  );

  const kilometrajeBodyTemplate = (rowData: Vehicle) => (
    <span>{rowData.kilometraje?.toLocaleString() || 0} km</span>
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
          value={vehicles}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay vehículos disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="placa" header="Placa" sortable />
          <Column
            field="customer.nombre"
            header="Cliente"
            body={customerBodyTemplate}
            sortable
          />
          <Column
            field="model.nombre"
            header="Modelo"
            body={modelBodyTemplate}
            sortable
          />
          <Column header="Marca" body={brandBodyTemplate} sortable />
          <Column field="year" header="Año" sortable />
          <Column field="color" header="Color" sortable />
          <Column
            field="kilometraje"
            header="Kilometraje"
            body={kilometrajeBodyTemplate}
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
            {vehicle && (
              <span>
                ¿Estás seguro de que deseas eliminar el vehículo{" "}
                <b>{vehicle.placa}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "900px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-tag mr-3 text-primary text-3xl"></i>
                  {vehicle ? "Modificar Vehículo" : "Crear Vehículo"}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={hideFormDialog}
        >
          <VehicleForm
            vehicle={vehicle}
            hideFormDialog={hideFormDialog}
            vehicles={vehicles}
            setVehicles={setVehicles}
            setVehicle={setVehicle}
            showToast={showToast}
            toast={toast}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default VehicleList;
