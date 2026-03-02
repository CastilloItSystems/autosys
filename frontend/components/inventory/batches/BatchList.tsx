"use client";
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Badge } from "primereact/badge";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import {
  Batch,
  BatchStatus,
  BATCH_STATUS_CONFIG,
  getDaysUntilExpiry,
} from "@/types/batch.interface";
import {
  getBatches,
  createBatch,
  deleteBatch,
  updateBatch,
} from "@/app/api/batchService";
import BatchForm from "./BatchForm";
import BatchDetail from "./BatchDetail";
import { handleFormError } from "@/utils/errorHandlers";
import { motion } from "framer-motion";

interface BatchListProps {
  warehouseId?: string;
}

export default function BatchList({ warehouseId }: BatchListProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const [filterStatus, setFilterStatus] = useState<BatchStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const toast = useRef<Toast>(null);

  // Load batches
  const loadBatches = async (page: number, rows: number, status?: string) => {
    setLoading(true);
    try {
      const response = await getBatches(page, rows, {
        status: status as BatchStatus,
        warehouseId: warehouseId || undefined,
      });
      setBatches(response.data);
      setTotalRecords(response.total);
    } catch (error) {
      console.error("Error loading batches:", error);
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadBatches(lazyState.page, lazyState.rows, filterStatus || undefined);
  }, [lazyState, filterStatus, warehouseId]);

  const onPage = (event: any) => {
    setLazyState({
      first: event.first,
      rows: event.rows,
      page: (event.first || 0) / event.rows + 1,
    });
  };

  // Template functions
  const statusBodyTemplate = (rowData: Batch) => {
    const config = BATCH_STATUS_CONFIG[rowData.status];
    return (
      <Tag value={config.label} severity={config.severity} icon={config.icon} />
    );
  };

  const expiryBodyTemplate = (rowData: Batch) => {
    const daysUntilExpiry = getDaysUntilExpiry(rowData.expiryDate);
    const expiryDate = new Date(rowData.expiryDate).toLocaleDateString("es-ES");

    if (daysUntilExpiry < 0) {
      return (
        <div className="flex items-center gap-2">
          <Badge value={daysUntilExpiry} severity="danger" />
          <span className="text-red-600">{expiryDate}</span>
        </div>
      );
    } else if (daysUntilExpiry <= 30) {
      return (
        <div className="flex items-center gap-2">
          <Badge value={daysUntilExpiry} severity="warning" />
          <span className="text-yellow-600">{expiryDate}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <Badge value={daysUntilExpiry} severity="success" />
          <span className="text-green-600">{expiryDate}</span>
        </div>
      );
    }
  };

  const quantityBodyTemplate = (rowData: Batch) => {
    const remaining = rowData.quantityRemaining || rowData.quantity;
    return (
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{remaining}</span>
        <span className="text-xs text-gray-500">de {rowData.quantity}</span>
      </div>
    );
  };

  const actionBodyTemplate = (rowData: Batch) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          outline
          severity="info"
          onClick={() => {
            setSelectedBatch(rowData);
            setShowDetail(true);
          }}
          tooltip="Ver detalles"
          tooltipPosition="left"
        />
        <Button
          icon="pi pi-pencil"
          rounded
          outline
          severity="warning"
          onClick={() => {
            setSelectedBatch(rowData);
            setShowForm(true);
          }}
          tooltip="Editar"
          tooltipPosition="left"
        />
        <Button
          icon="pi pi-trash"
          rounded
          outline
          severity="danger"
          onClick={() => handleDelete(rowData)}
          tooltip="Eliminar"
          tooltipPosition="left"
        />
      </div>
    );
  };

  const handleDelete = async (batch: Batch) => {
    try {
      await deleteBatch(batch.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Lote eliminado correctamente",
        life: 3000,
      });
      loadBatches(lazyState.page, lazyState.rows, filterStatus || undefined);
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedBatch) {
        await updateBatch(selectedBatch.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Lote actualizado correctamente",
          life: 3000,
        });
      } else {
        await createBatch(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Lote creado correctamente",
          life: 3000,
        });
      }
      setShowForm(false);
      setSelectedBatch(null);
      loadBatches(lazyState.page, lazyState.rows, filterStatus || undefined);
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4"
    >
      <Toast ref={toast} position="top-right" />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gestionar Lotes</h2>
        <Button
          label="Nuevo Lote"
          icon="pi pi-plus"
          onClick={() => {
            setSelectedBatch(null);
            setShowForm(true);
          }}
          className="p-button-success"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <Dropdown
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.value)}
          options={Object.values(BatchStatus).map((status) => ({
            label: BATCH_STATUS_CONFIG[status].label,
            value: status,
          }))}
          placeholder="Filtrar por estado"
          showClear
          className="w-64"
        />
      </div>

      <DataTable
        value={batches}
        lazy
        paginator
        first={lazyState.first}
        rows={lazyState.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        className="p-datatable-striped"
        responsive
      >
        <Column field="batchNumber" header="Número de Lote" sortable />
        <Column field="sku" header="SKU" sortable />
        <Column
          field="quantity"
          header="Cantidad"
          body={quantityBodyTemplate}
        />
        <Column
          field="expiryDate"
          header="Fecha de Vencimiento"
          body={expiryBodyTemplate}
        />
        <Column
          field="status"
          header="Estado"
          body={statusBodyTemplate}
          sortable
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ width: "12rem" }}
        />
      </DataTable>

      <Dialog
        header={selectedBatch ? "Editar Lote" : "Nuevo Lote"}
        visible={showForm}
        style={{ width: "50vw" }}
        onHide={() => {
          setShowForm(false);
          setSelectedBatch(null);
        }}
        modal
      >
        <BatchForm
          batch={selectedBatch}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedBatch(null);
          }}
        />
      </Dialog>

      {selectedBatch && (
        <Dialog
          header="Detalles del Lote"
          visible={showDetail}
          style={{ width: "50vw" }}
          onHide={() => setShowDetail(false)}
          modal
        >
          <BatchDetail batch={selectedBatch} />
        </Dialog>
      )}
    </motion.div>
  );
}
