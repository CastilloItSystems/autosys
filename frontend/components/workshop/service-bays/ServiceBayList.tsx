"use client";
import React, { useEffect, useRef, useState } from "react";

// PrimeReact components
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Badge } from "primereact/badge";

// External libraries
import { motion } from "framer-motion";

// Interfaces and schemas
import {
  ServiceBay,
  BAY_AREA_LABELS,
  BAY_STATUS_LABELS,
  BAY_STATUS_COLORS,
  BAY_CAPACITY_LABELS,
  BAY_AREA_ICONS,
} from "@/libs/interfaces/workshop/serviceBay.interface";

// API functions
import { getServiceBays, deleteServiceBay } from "@/app/api/serviceBayService";

// Utils
import { handleFormError } from "@/utils/errorHandlers";

// Components
import CustomActionButtons from "@/components/common/CustomActionButtons";
import CreateButton from "@/components/common/CreateButton";
import ServiceBayForm from "./ServiceBayForm";

/**
 * Componente para listar y gestionar bahías de servicio
 */
export default function ServiceBayList() {
  const [serviceBays, setServiceBays] = useState<ServiceBay[]>([]);
  const [serviceBay, setServiceBay] = useState<ServiceBay | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchServiceBays();
  }, []);

  const fetchServiceBays = async () => {
    try {
      setLoading(true);
      const response = await getServiceBays({ isActive: "all" });
      if (response.ok && Array.isArray(response.bays)) {
        // Ordenar por orden y luego por nombre
        const sortedBays = response.bays.sort(
          (a: ServiceBay, b: ServiceBay) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.name.localeCompare(b.name);
          }
        );
        setServiceBays(sortedBays);
      }
    } catch (error) {
      console.error("Error al obtener las bahías:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las bahías de servicio",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setServiceBay(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setServiceBay(null);
    setFormDialog(false);
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: serviceBay?._id
        ? "Bahía actualizada correctamente"
        : "Bahía creada correctamente",
      life: 3000,
    });
    fetchServiceBays();
    hideFormDialog();
  };

  const handleDelete = async () => {
    if (!serviceBay) return;

    try {
      await deleteServiceBay(serviceBay._id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Bahía eliminada correctamente",
        life: 3000,
      });
      fetchServiceBays();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setDeleteDialog(false);
      setServiceBay(null);
    }
  };

  const confirmDeleteServiceBay = (bay: ServiceBay) => {
    setServiceBay(bay);
    setDeleteDialog(true);
  };

  const editServiceBay = (bay: ServiceBay) => {
    setServiceBay({ ...bay });
    setFormDialog(true);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <div>
          <h4 className="m-0 mb-1">Gestión de Puestos de Servicio</h4>
          <p className="text-sm text-500 m-0">
            Administra las bahías de trabajo del taller
          </p>
        </div>
        <div className="flex gap-2">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Buscar..."
            />
          </span>
          <CreateButton
            label="Nueva Bahía"
            onClick={openFormDialog}
            icon="pi pi-plus"
          />
        </div>
      </div>
    );
  };

  // Templates de columnas
  const codeBodyTemplate = (rowData: ServiceBay) => {
    return (
      <div className="flex align-items-center gap-2">
        <Badge value={rowData.code} severity="info" />
      </div>
    );
  };

  const areaBodyTemplate = (rowData: ServiceBay) => {
    return (
      <div className="flex align-items-center gap-2">
        <i className={`pi ${BAY_AREA_ICONS[rowData.area]} text-lg`}></i>
        <span>{BAY_AREA_LABELS[rowData.area]}</span>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: ServiceBay) => {
    const severity = BAY_STATUS_COLORS[rowData.status] as any;
    return (
      <Tag value={BAY_STATUS_LABELS[rowData.status]} severity={severity} />
    );
  };

  const capacityBodyTemplate = (rowData: ServiceBay) => {
    return (
      <div className="flex align-items-center gap-2">
        <i className="pi pi-car text-lg"></i>
        <span>{BAY_CAPACITY_LABELS[rowData.capacity]}</span>
      </div>
    );
  };

  const techniciansBodyTemplate = (rowData: ServiceBay) => {
    const current = rowData.currentTechnicians?.length || 0;
    const max = rowData.maxTechnicians;
    const severity =
      current >= max ? "danger" : current > 0 ? "warning" : "success";

    return (
      <div className="flex align-items-center gap-2">
        <Tag value={`${current} / ${max}`} severity={severity as any} />
      </div>
    );
  };

  const equipmentBodyTemplate = (rowData: ServiceBay) => {
    const count = rowData.equipment?.length || 0;
    return (
      <Badge value={count} severity={count > 0 ? "success" : "secondary"} />
    );
  };

  const actionBodyTemplate = (rowData: ServiceBay) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onEdit={() => editServiceBay(rowData)}
        onDelete={() => confirmDeleteServiceBay(rowData)}
      />
    );
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4 }}
    >
      <Toast ref={toast} />

      <div className="card">
        <DataTable
          value={serviceBays}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          dataKey="_id"
          // filterDisplay="row"
          loading={loading}
          globalFilter={globalFilterValue}
          header={renderHeader()}
          emptyMessage="No se encontraron bahías de servicio"
          className="datatable-responsive"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} bahías"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        >
          <Column
            field="code"
            header="Código"
            sortable
            body={codeBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="name"
            header="Nombre"
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            field="area"
            header="Área"
            sortable
            body={areaBodyTemplate}
            style={{ minWidth: "150px" }}
          />
          <Column
            field="status"
            header="Estado"
            sortable
            body={statusBodyTemplate}
            style={{ minWidth: "150px" }}
          />
          <Column
            field="capacity"
            header="Capacidad"
            body={capacityBodyTemplate}
            style={{ minWidth: "150px" }}
          />
          <Column
            header="Técnicos"
            body={techniciansBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Equipos"
            body={equipmentBodyTemplate}
            style={{ minWidth: "100px" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "120px" }}
            header="Acciones"
          />
        </DataTable>
      </div>

      {/* Dialog de formulario */}
      <Dialog
        visible={formDialog}
        style={{ width: "700px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tag mr-3 text-primary text-3xl"></i>
                {serviceBay?._id ? "Editar Bahía" : "Nueva Bahía"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideFormDialog}
      >
        <ServiceBayForm
          serviceBay={serviceBay}
          onSave={handleSave}
          onCancel={hideFormDialog}
          toast={toast}
        />
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteDialog}
      >
        <div className="confirmation-content flex align-items-center">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {serviceBay && (
            <span>
              ¿Está seguro que desea eliminar la bahía <b>{serviceBay.name}</b>?
              {serviceBay.status === "ocupado" && (
                <p className="text-red-500 mt-2">
                  <strong>Advertencia:</strong> Esta bahía está actualmente
                  ocupada.
                </p>
              )}
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
}
