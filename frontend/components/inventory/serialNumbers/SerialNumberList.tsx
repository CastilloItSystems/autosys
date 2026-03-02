"use client";
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import { Dropdown } from "primereact/dropdown";
import {
  SerialNumber,
  SerialStatus,
  SERIAL_STATUS_CONFIG,
} from "@/types/serialNumber.interface";
import {
  getSerialNumbers,
  createSerialNumber,
  deleteSerialNumber,
  updateSerialNumber,
} from "@/app/api/serialNumberService";
import SerialNumberForm from "./SerialNumberForm";
import SerialNumberDetail from "./SerialNumberDetail";
import SerialNumberTimeline from "./SerialNumberTimeline";
import { handleFormError } from "@/utils/errorHandlers";
import { motion } from "framer-motion";

interface SerialNumberListProps {
  warehouseId?: string;
}

export default function SerialNumberList({
  warehouseId,
}: SerialNumberListProps) {
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const [filterStatus, setFilterStatus] = useState<SerialStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(
    null,
  );
  const [showDetail, setShowDetail] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const toast = useRef<Toast>(null);

  // Load serial numbers
  const loadSerialNumbers = async (
    page: number,
    rows: number,
    status?: string,
  ) => {
    setLoading(true);
    try {
      const response = await getSerialNumbers(page, rows, {
        status: status as SerialStatus,
        warehouseId: warehouseId || undefined,
      });
      setSerials(response.data);
      setTotalRecords(response.total);
    } catch (error) {
      console.error("Error loading serial numbers:", error);
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSerialNumbers(
      lazyState.page,
      lazyState.rows,
      filterStatus || undefined,
    );
  }, [lazyState, filterStatus, warehouseId]);

  const onPage = (event: any) => {
    setLazyState({
      first: event.first,
      rows: event.rows,
      page: (event.first || 0) / event.rows + 1,
    });
  };

  // Template functions
  const statusBodyTemplate = (rowData: SerialNumber) => {
    const config = SERIAL_STATUS_CONFIG[rowData.status];
    return (
      <Tag value={config.label} severity={config.severity} icon={config.icon} />
    );
  };

  const batchBodyTemplate = (rowData: SerialNumber) => {
    if (!rowData.batch) return "N/A";
    return (
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{rowData.batch.batchNumber}</span>
        <span className="text-xs text-gray-500">
          {new Date(rowData.batch.expiryDate).toLocaleDateString("es-ES")}
        </span>
      </div>
    );
  };

  const actionBodyTemplate = (rowData: SerialNumber) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-map"
          rounded
          outline
          severity="info"
          onClick={() => {
            setSelectedSerial(rowData);
            setShowTimeline(true);
          }}
          tooltip="Ver trayectoria"
          tooltipPosition="left"
        />
        <Button
          icon="pi pi-eye"
          rounded
          outline
          severity="info"
          onClick={() => {
            setSelectedSerial(rowData);
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
            setSelectedSerial(rowData);
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

  const handleDelete = async (serial: SerialNumber) => {
    try {
      await deleteSerialNumber(serial.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Número de serie eliminado correctamente",
        life: 3000,
      });
      loadSerialNumbers(
        lazyState.page,
        lazyState.rows,
        filterStatus || undefined,
      );
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedSerial) {
        await updateSerialNumber(selectedSerial.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Número de serie actualizado correctamente",
          life: 3000,
        });
      } else {
        await createSerialNumber(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Número de serie creado correctamente",
          life: 3000,
        });
      }
      setShowForm(false);
      setSelectedSerial(null);
      loadSerialNumbers(
        lazyState.page,
        lazyState.rows,
        filterStatus || undefined,
      );
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
        <h2 className="text-2xl font-bold">Gestionar Números de Serie</h2>
        <Button
          label="Nuevo Número de Serie"
          icon="pi pi-plus"
          onClick={() => {
            setSelectedSerial(null);
            setShowForm(true);
          }}
          className="p-button-success"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <Dropdown
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.value)}
          options={Object.values(SerialStatus).map((status) => ({
            label: SERIAL_STATUS_CONFIG[status].label,
            value: status,
          }))}
          placeholder="Filtrar por estado"
          showClear
          className="w-64"
        />
      </div>

      <DataTable
        value={serials}
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
        <Column field="serialNumber" header="Número de Serie" sortable />
        <Column field="sku" header="SKU" sortable />
        <Column field="batch" header="Lote" body={batchBodyTemplate} />
        <Column
          field="status"
          header="Estado"
          body={statusBodyTemplate}
          sortable
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ width: "14rem" }}
        />
      </DataTable>

      <Dialog
        header={
          selectedSerial ? "Editar Número de Serie" : "Nuevo Número de Serie"
        }
        visible={showForm}
        style={{ width: "50vw" }}
        onHide={() => {
          setShowForm(false);
          setSelectedSerial(null);
        }}
        modal
      >
        <SerialNumberForm
          serial={selectedSerial}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedSerial(null);
          }}
        />
      </Dialog>

      {selectedSerial && (
        <>
          <Dialog
            header="Detalles del Número de Serie"
            visible={showDetail}
            style={{ width: "50vw" }}
            onHide={() => setShowDetail(false)}
            modal
          >
            <SerialNumberDetail serial={selectedSerial} />
          </Dialog>

          <Dialog
            header="Trayectoria del Número de Serie"
            visible={showTimeline}
            style={{ width: "60vw" }}
            onHide={() => setShowTimeline(false)}
            modal
          >
            <SerialNumberTimeline serialId={selectedSerial.id} />
          </Dialog>
        </>
      )}
    </motion.div>
  );
}
