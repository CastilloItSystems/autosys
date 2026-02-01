"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { getServices, deleteService } from "@/app/api/workshop/serviceService";
import { Service } from "@/libs/interfaces/workshop";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import CreateButton from "@/components/common/CreateButton";
import ServiceForm from "./ServiceForm";
import { handleFormError } from "@/utils/errorHandlers";

const ServiceList = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchServices();
  }, [pagination.page, pagination.limit]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getServices({});
      if (response.success && Array.isArray(response.data)) {
        setServices(response.data);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.pagination!.total,
          }));
        }
      }
    } catch (error) {
      console.error("Error al obtener los servicios:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los servicios",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setService(null);
    setFormDialog(true);
  };

  const hideDeleteDialog = () => setDeleteDialog(false);
  const hideFormDialog = () => {
    setService(null);
    setFormDialog(false);
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail:
        service?._id || service?.id
          ? "Servicio actualizado correctamente"
          : "Servicio creado correctamente",
      life: 3000,
    });
    fetchServices();
    hideFormDialog();
  };

  const handleDelete = async () => {
    if (!service) return;

    try {
      const id = service._id || service.id;
      if (id) {
        await deleteService(id);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Servicio eliminado correctamente",
          life: 3000,
        });
        fetchServices();
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setDeleteDialog(false);
      setService(null);
    }
  };

  const confirmDeleteService = (service: Service) => {
    setService(service);
    setDeleteDialog(true);
  };

  const editService = (service: Service) => {
    setService({ ...service });
    setFormDialog(true);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-content-between align-items-center">
        <h3 className="m-0">Servicios del Taller</h3>
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
        </span>
      </div>
    );
  };

  const actionBodyTemplate = (rowData: Service) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onEdit={() => editService(rowData)}
        onDelete={() => confirmDeleteService(rowData)}
      />
    );
  };

  const codigoBodyTemplate = (rowData: Service) => {
    return <span className="font-mono font-semibold">{rowData.codigo}</span>;
  };

  const categoriaBodyTemplate = (rowData: Service) => {
    const categoria =
      typeof rowData.categoria === "object" ? rowData.categoria : null;
    if (!categoria) return "-";

    return (
      <Tag
        value={categoria.nombre}
        style={{
          backgroundColor: categoria.color || "#6366f1",
        }}
      />
    );
  };

  const precioBodyTemplate = (rowData: Service) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
    }).format(rowData.precioBase);
  };

  const tiempoBodyTemplate = (rowData: Service) => {
    const tiempo = rowData.tiempoEstimadoMinutos;
    if (tiempo >= 60) {
      const horas = Math.floor(tiempo / 60);
      const minutos = tiempo % 60;
      return minutos > 0 ? `${horas}h ${minutos}m` : `${horas}h`;
    }
    return `${tiempo}m`;
  };

  const dificultadBodyTemplate = (rowData: Service) => {
    const severityMap: Record<
      string,
      "success" | "info" | "warning" | "danger"
    > = {
      baja: "success",
      media: "info",
      alta: "warning",
      experto: "danger",
    };

    const labelMap: Record<string, string> = {
      baja: "Baja",
      media: "Media",
      alta: "Alta",
      experto: "Experto",
    };

    return (
      <Tag
        value={labelMap[rowData.dificultad] || rowData.dificultad}
        severity={severityMap[rowData.dificultad]}
      />
    );
  };

  const especialistaBodyTemplate = (rowData: Service) => {
    return rowData.requiereEspecialista ? (
      <Tag value="Sí" severity="warning" icon="pi pi-star" />
    ) : (
      <Tag value="No" severity="success" />
    );
  };

  const activoBodyTemplate = (rowData: Service) => {
    return rowData.activo ? (
      <Tag value="Activo" severity="success" icon="pi pi-check" />
    ) : (
      <Tag value="Inactivo" severity="danger" icon="pi pi-times" />
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
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4 }}
        className="card"
      >
        <div className="flex justify-content-between align-items-center mb-4">
          {renderHeader()}
          <CreateButton onClick={openFormDialog} label="Crear Servicio" />
        </div>

        <DataTable
          value={services}
          paginator
          rows={pagination.limit}
          dataKey="id"
          filterDisplay="row"
          loading={loading}
          globalFilter={globalFilterValue}
          emptyMessage="No se encontraron servicios"
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} servicios"
          rowsPerPageOptions={[10, 25, 50]}
        >
          <Column
            field="codigo"
            header="Código"
            body={codigoBodyTemplate}
            sortable
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: "15rem" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            sortable
            style={{ minWidth: "20rem" }}
          />
          <Column
            field="categoria.nombre"
            header="Categoría"
            body={categoriaBodyTemplate}
            sortable
            style={{ minWidth: "12rem" }}
          />
          <Column
            field="precioBase"
            header="Precio"
            body={precioBodyTemplate}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="tiempoEstimadoMinutos"
            header="Tiempo"
            body={tiempoBodyTemplate}
            sortable
            style={{ minWidth: "8rem" }}
          />
          <Column
            field="dificultad"
            header="Dificultad"
            body={dificultadBodyTemplate}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="requiereEspecialista"
            header="Especialista"
            body={especialistaBodyTemplate}
            sortable
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="activo"
            header="Estado"
            body={activoBodyTemplate}
            sortable
            style={{ minWidth: "8rem" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "8rem" }}
          />
        </DataTable>
      </motion.div>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "900px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tags mr-3 text-primary text-3xl"></i>
                {service ? "Modificar Servicio" : "Crear Servicio"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={hideFormDialog}
        maximizable
        breakpoints={{ "960px": "95vw" }}
      >
        <ServiceForm
          service={service}
          onSave={handleSave}
          onCancel={hideFormDialog}
          toast={toast}
        />
      </Dialog>

      {/* Delete Dialog */}
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
          <span>
            ¿Está seguro que desea eliminar el servicio <b>{service?.nombre}</b>
            ?
          </span>
        </div>
      </Dialog>
    </>
  );
};

export default ServiceList;
