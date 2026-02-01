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
import {
  getStatuses,
  deleteStatusById,
} from "@/app/api/workshop/workOrderStatusService";
import {
  WorkOrderStatus,
  WorkOrderStatusFilters,
} from "@/libs/interfaces/workshop";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import CreateButton from "@/components/common/CreateButton";
import WorkOrderStatusForm from "./WorkOrderStatusForm";
import { handleFormError } from "@/utils/errorHandlers";

const WorkOrderStatusList = () => {
  const [statuses, setStatuses] = useState<WorkOrderStatus[]>([]);
  const [status, setStatus] = useState<WorkOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [filters, setFilters] = useState<WorkOrderStatusFilters>({});
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchStatuses();
  }, [filters]);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await getStatuses(filters);
      if (response.success && Array.isArray(response.data)) {
        setStatuses(response.data);
      }
    } catch (error) {
      console.error("Error fetching work order statuses:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los estados de orden de trabajo",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setStatus(null);
    setFormDialog(true);
  };

  const handleEdit = (selectedStatus: WorkOrderStatus) => {
    setStatus(selectedStatus);
    setFormDialog(true);
  };

  const handleDelete = (selectedStatus: WorkOrderStatus) => {
    setStatus(selectedStatus);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!status?._id) return;

    try {
      await deleteStatusById(status._id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Estado de orden de trabajo eliminado correctamente",
      });
      fetchStatuses();
      setDeleteDialog(false);
      setStatus(null);
    } catch (error) {
      console.error("Error deleting work order status:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el estado de orden de trabajo",
      });
    }
  };

  const onFormSuccess = () => {
    fetchStatuses();
    setFormDialog(false);
    setStatus(null);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  // Template functions for DataTable columns
  const codeTemplate = (rowData: WorkOrderStatus) => {
    return <span className="font-medium text-900">{rowData.codigo}</span>;
  };

  const nameTemplate = (rowData: WorkOrderStatus) => {
    return <span className="font-medium">{rowData.nombre}</span>;
  };

  const typeTemplate = (rowData: WorkOrderStatus) => {
    if (!rowData.tipo) return null;

    const typeLabels = {
      inicial: "Inicial",
      intermedio: "Intermedio",
      final: "Final",
      cancelado: "Cancelado",
    };

    const severityMap = {
      inicial: "info",
      intermedio: "warning",
      final: "success",
      cancelado: "danger",
    } as const;

    return (
      <Tag
        value={typeLabels[rowData.tipo]}
        severity={severityMap[rowData.tipo]}
        className="text-xs"
      />
    );
  };

  const statusTemplate = (rowData: WorkOrderStatus) => {
    return (
      <Tag
        value={rowData.activo ? "Activo" : "Inactivo"}
        severity={rowData.activo ? "success" : "danger"}
        className="text-xs"
      />
    );
  };

  const orderTemplate = (rowData: WorkOrderStatus) => {
    return <span className="text-center">{rowData.orden || 0}</span>;
  };

  const colorTemplate = (rowData: WorkOrderStatus) => {
    if (!rowData.color) return null;
    return (
      <div className="flex align-items-center gap-2">
        <div
          className="w-1rem h-1rem border-circle"
          style={{ backgroundColor: rowData.color }}
        />
        <span className="text-sm">{rowData.color}</span>
      </div>
    );
  };

  const actionTemplate = (rowData: WorkOrderStatus) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onEdit={() => handleEdit(rowData)}
        onDelete={() => handleDelete(rowData)}
      />
    );
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div className="flex align-items-center gap-3">
        <h5 className="m-0 text-900 font-semibold">
          Estados de Orden de Trabajo
        </h5>
        <CreateButton onClick={handleCreate} label="Nuevo Estado" />
      </div>
      <div className="flex align-items-center gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar estados..."
            className="w-full md:w-20rem"
          />
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-20rem">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      <Toast ref={toast} />

      <DataTable
        value={statuses}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilter={globalFilterValue}
        header={header}
        emptyMessage="No se encontraron estados de orden de trabajo"
        className="p-datatable-sm"
        stripedRows
        showGridlines={false}
        sortMode="multiple"
        removableSort
      >
        <Column
          field="codigo"
          header="Código"
          body={codeTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="nombre"
          header="Nombre"
          body={nameTemplate}
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="tipo"
          header="Tipo"
          body={typeTemplate}
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="orden"
          header="Orden"
          body={orderTemplate}
          sortable
          style={{ minWidth: "80px", textAlign: "center" }}
        />
        <Column
          field="color"
          header="Color"
          body={colorTemplate}
          style={{ minWidth: "120px" }}
        />
        <Column
          field="activo"
          header="Estado"
          body={statusTemplate}
          sortable
          style={{ minWidth: "100px" }}
        />
        <Column
          body={actionTemplate}
          header="Acciones"
          style={{ minWidth: "120px", textAlign: "center" }}
          frozen
          alignFrozen="right"
        />
      </DataTable>

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={deleteDialog}
        onHide={() => setDeleteDialog(false)}
        header="Confirmar Eliminación"
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={() => setDeleteDialog(false)}
            />
            <Button
              label="Eliminar"
              icon="pi pi-check"
              severity="danger"
              onClick={confirmDelete}
            />
          </div>
        }
      >
        <p>
          ¿Está seguro de que desea eliminar el estado{" "}
          <strong>{status?.nombre}</strong>?
        </p>
        <p className="text-sm text-600 mt-2">
          Esta acción no se puede deshacer.
        </p>
      </Dialog>

      {/* Form Dialog */}
      <WorkOrderStatusForm
        visible={formDialog}
        onHide={() => setFormDialog(false)}
        status={status}
        onSuccess={onFormSuccess}
      />
    </motion.div>
  );
};

export default WorkOrderStatusList;
