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
  deleteVehicleModel,
  getVehicleModels,
} from "@/app/api/crm/vehicleModelService";
import VehicleModelForm from "./VehicleModelForm";
import { VehicleModel } from "@/libs/interfaces/inventory";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";

const VehicleModelList = () => {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [model, setModel] = useState<VehicleModel | null>(null);
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const router = useRouter();
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const modelsDB = await getVehicleModels();
      if (modelsDB && Array.isArray(modelsDB.vehicleModels)) {
        setModels(modelsDB.vehicleModels);
      }
    } catch (error) {
      console.error("Error al obtener los modelos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setModel(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setModel(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (model?.id) {
        await deleteVehicleModel(model.id);
        setModels(models.filter((val) => val.id !== model.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Modelo Eliminado",
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar el modelo",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setModel(null);
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

  const actionBodyTemplate = (rowData: VehicleModel) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={(data) => {
        setModel(rowData);
        setFormDialog(true);
      }}
      onDelete={(data) => {
        setModel(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  const brandBodyTemplate = (rowData: VehicleModel) => {
    const brand =
      typeof rowData.brand === "string"
        ? { nombre: "Cargando..." }
        : rowData.brand;
    return <span>{brand.nombre}</span>;
  };

  const tipoBodyTemplate = (rowData: VehicleModel) => (
    <Tag
      value={
        rowData.tipo === "sedan"
          ? "Sedán"
          : rowData.tipo === "suv"
          ? "SUV"
          : rowData.tipo === "pickup"
          ? "Pickup"
          : rowData.tipo === "hatchback"
          ? "Hatchback"
          : rowData.tipo === "coupe"
          ? "Cupé"
          : rowData.tipo === "convertible"
          ? "Convertible"
          : rowData.tipo === "wagon"
          ? "Wagon"
          : rowData.tipo === "van"
          ? "Van"
          : rowData.tipo
      }
      severity="info"
    />
  );

  const motorBodyTemplate = (rowData: VehicleModel) => (
    <Tag
      value={
        rowData.motor === "gasolina"
          ? "Gasolina"
          : rowData.motor === "diesel"
          ? "Diésel"
          : rowData.motor === "electrico"
          ? "Eléctrico"
          : rowData.motor === "hibrido"
          ? "Híbrido"
          : rowData.motor
      }
      severity="success"
    />
  );

  const yearRangeBodyTemplate = (rowData: VehicleModel) => (
    <span>
      {rowData.yearInicio ? rowData.yearInicio : "?"} -{" "}
      {rowData.yearFin ? rowData.yearFin : "?"}
    </span>
  );

  const estadoBodyTemplate = (rowData: VehicleModel) => (
    <Tag
      value={rowData.estado === "activo" ? "Activo" : "Inactivo"}
      severity={rowData.estado === "activo" ? "success" : "danger"}
    />
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
          value={models}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} entradas"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay modelos disponibles"
          rowClassName={() => "animated-row"}
          size="small"
        >
          <Column body={actionBodyTemplate} />
          <Column field="nombre" header="Nombre" sortable />
          <Column
            field="brand.nombre"
            header="Marca"
            body={brandBodyTemplate}
            sortable
          />
          <Column field="tipo" header="Tipo" body={tipoBodyTemplate} sortable />
          <Column
            field="motor"
            header="Motor"
            body={motorBodyTemplate}
            sortable
          />
          <Column header="Años" body={yearRangeBodyTemplate} sortable />
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
            {model && (
              <span>
                ¿Estás seguro de que deseas eliminar el modelo{" "}
                <b>{model.nombre}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={formDialog}
          style={{ width: "700px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-tag mr-3 text-primary text-3xl"></i>
                  {model ? "Modificar Modelo" : "Crear Modelo"}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={hideFormDialog}
        >
          <VehicleModelForm
            model={model}
            hideFormDialog={hideFormDialog}
            models={models}
            setModels={setModels}
            setModel={setModel}
            showToast={showToast}
            toast={toast}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default VehicleModelList;
