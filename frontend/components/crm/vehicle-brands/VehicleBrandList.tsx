"use client";
import React, { useEffect, useRef, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import {
  deleteVehicleBrand,
  getVehicleBrands,
} from "@/app/api/crm/vehicleBrandService";
import VehicleBrandForm from "./VehicleBrandForm";
import { VehicleBrand } from "@/libs/interfaces/inventory";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const VehicleBrandList = () => {
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [brand, setBrand] = useState<VehicleBrand | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const brandsDB = await getVehicleBrands();
      if (brandsDB && Array.isArray(brandsDB.vehicleBrands)) {
        setBrands(brandsDB.vehicleBrands);
      }
    } catch (error) {
      console.error("Error al obtener las marcas:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setBrand(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setBrand(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (brand?.id) {
        await deleteVehicleBrand(brand.id);
        setBrands(brands.filter((val) => val.id !== brand.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Marca Eliminada",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar la marca",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setBrand(null);
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

  const actionBodyTemplate = (rowData: VehicleBrand) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setBrand(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setBrand(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  const estadoBodyTemplate = (rowData: VehicleBrand) => (
    <Tag
      value={rowData.estado === "activo" ? "Activo" : "Inactivo"}
      severity={rowData.estado === "activo" ? "success" : "danger"}
    />
  );

  const paisOrigenBodyTemplate = (rowData: VehicleBrand) => (
    <span>{rowData.paisOrigen || "-"}</span>
  );

  const logoBodyTemplate = (rowData: VehicleBrand) => (
    <span>{rowData.logo ? "Sí" : "No"}</span>
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
          value={brands}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay marcas disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="nombre" header="Nombre" sortable />
          <Column
            field="paisOrigen"
            header="País de Origen"
            body={paisOrigenBodyTemplate}
            sortable
          />
          <Column field="logo" header="Logo" body={logoBodyTemplate} sortable />
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
            {brand && (
              <span>
                ¿Estás seguro de que deseas eliminar la marca{" "}
                <b>{brand.nombre}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "600px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-tag mr-3 text-primary text-3xl"></i>
                  {brand ? "Modificar Marca" : "Crear Marca"}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={hideFormDialog}
        >
          <VehicleBrandForm
            brand={brand}
            hideFormDialog={hideFormDialog}
            brands={brands}
            setBrands={setBrands}
            setBrand={setBrand}
            showToast={showToast}
            toast={toast}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default VehicleBrandList;
