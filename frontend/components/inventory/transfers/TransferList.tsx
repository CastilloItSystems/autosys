"use client";
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import {
  Transfer,
  TransferStatus,
  TRANSFER_STATUS_CONFIG,
} from "@/libs/interfaces";
import {
  getTransfers,
  sendTransfer,
  receiveTransfer,
  cancelTransfer,
  deleteTransfer,
} from "@/app/api/inventory/transferService";
import TransferForm from "./TransferForm";
import TransferDetail from "./TransferDetail";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import { handleFormError } from "@/utils/errorHandlers";
import { motion } from "framer-motion";

interface TransferListProps {
  warehouseId?: string;
  warehouses: Warehouse[];
}

export default function TransferList({
  warehouseId,
  warehouses,
}: TransferListProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const [filterStatus, setFilterStatus] = useState<TransferStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );
  const [showDetail, setShowDetail] = useState(false);
  const [actingTransfer, setActingTransfer] = useState<Transfer | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const toast = useRef<Toast>(null);

  // Load transfers
  const loadTransfers = async (page: number, rows: number, status?: string) => {
    setLoading(true);
    try {
      const response = await getTransfers(page + 1, rows, {
        status: status || undefined,
        fromWarehouseId: warehouseId || undefined,
      });
      setTransfers(response.data);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      console.error("Error loading transfers:", error);
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTransfers(lazyState.page, lazyState.rows, filterStatus || undefined);
  }, [lazyState, filterStatus]);

  const onPage = (event: any) => {
    setLazyState({
      first: event.first,
      rows: event.rows,
      page: (event.first || 0) / event.rows + 1,
    });
  };

  // Action handlers
  const handleSend = async (transfer: Transfer) => {
    setActionInProgress(transfer.id);
    try {
      await sendTransfer(transfer.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Transferencia enviada correctamente",
        life: 3000,
      });
      loadTransfers(lazyState.page, lazyState.rows, filterStatus || undefined);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReceive = async (transfer: Transfer) => {
    setActionInProgress(transfer.id);
    try {
      await receiveTransfer(transfer.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Transferencia recibida correctamente",
        life: 3000,
      });
      loadTransfers(lazyState.page, lazyState.rows, filterStatus || undefined);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancel = async (transfer: Transfer) => {
    setActionInProgress(transfer.id);
    try {
      await cancelTransfer(transfer.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Transferencia cancelada correctamente",
        life: 3000,
      });
      loadTransfers(lazyState.page, lazyState.rows, filterStatus || undefined);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (transfer: Transfer) => {
    if (!confirm("¿Está seguro de que desea eliminar esta transferencia?"))
      return;

    setActionInProgress(transfer.id);
    try {
      await deleteTransfer(transfer.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Transferencia eliminada correctamente",
        life: 3000,
      });
      loadTransfers(lazyState.page, lazyState.rows, filterStatus || undefined);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setActionInProgress(null);
    }
  };

  // Templates
  const statusTemplate = (rowData: Transfer) => {
    const config = TRANSFER_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={config.label}
        severity={config.severity as any}
        icon={config.icon}
      />
    );
  };

  const actionTemplate = (rowData: Transfer) => {
    const isLoading = actionInProgress === rowData.id;

    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          text
          severity="info"
          onClick={() => {
            setSelectedTransfer(rowData);
            setShowDetail(true);
          }}
          tooltip="Ver detalles"
          disabled={isLoading}
        />

        {rowData.status === TransferStatus.DRAFT && (
          <Button
            icon="pi pi-send"
            rounded
            text
            severity="success"
            onClick={() => handleSend(rowData)}
            loading={isLoading}
            tooltip="Enviar transferencia"
          />
        )}

        {rowData.status === TransferStatus.IN_TRANSIT && (
          <Button
            icon="pi pi-check"
            rounded
            text
            severity="success"
            onClick={() => handleReceive(rowData)}
            loading={isLoading}
            tooltip="Recibir transferencia"
          />
        )}

        {rowData.status !== TransferStatus.CANCELLED &&
          rowData.status !== TransferStatus.RECEIVED && (
            <Button
              icon="pi pi-times"
              rounded
              text
              severity="danger"
              onClick={() => handleCancel(rowData)}
              loading={isLoading}
              tooltip="Cancelar transferencia"
            />
          )}

        {rowData.status === TransferStatus.DRAFT && (
          <Button
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            onClick={() => handleDelete(rowData)}
            loading={isLoading}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  const headerTemplate = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Transferencias Entre Almacenes</h5>
      <Button
        label="Nueva Transferencia"
        icon="pi pi-plus"
        className="p-button-success"
        onClick={() => setShowForm(true)}
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <Tooltip target=".custom-tooltip-icon" />

      <DataTable
        value={transfers}
        lazy
        paginator
        first={lazyState.first}
        rows={lazyState.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        dataKey="id"
        header={headerTemplate}
        responsiveLayout="scroll"
        emptyMessage="No se encontraron transferencias"
        stripedRows
      >
        <Column
          field="transferNumber"
          header="Número"
          sortable
          style={{ width: "12%" }}
        />
        <Column
          field="fromWarehouseId"
          header="Origen"
          style={{ width: "15%" }}
        />
        <Column
          field="toWarehouseId"
          header="Destino"
          style={{ width: "15%" }}
        />
        <Column field="itemsCount" header="Items" style={{ width: "10%" }} />
        <Column
          field="status"
          header="Estado"
          body={statusTemplate}
          style={{ width: "15%" }}
        />
        <Column
          field="createdAt"
          header="Fecha Creación"
          style={{ width: "15%" }}
          body={(rowData) =>
            new Date(rowData.createdAt).toLocaleDateString("es-ES")
          }
        />
        <Column
          body={actionTemplate}
          style={{ width: "18%" }}
          exportable={false}
        />
      </DataTable>

      {/* Form Dialog */}
      <Dialog
        header="Nueva Transferencia"
        visible={showForm}
        style={{ width: "90vw", maxWidth: "800px" }}
        onHide={() => setShowForm(false)}
        modal
      >
        <TransferForm
          warehouses={warehouses}
          onSuccess={() => {
            setShowForm(false);
            loadTransfers(
              lazyState.page,
              lazyState.rows,
              filterStatus || undefined,
            );
          }}
        />
      </Dialog>

      {/* Detail Dialog */}
      {selectedTransfer && (
        <Dialog
          header={`Transferencia: ${selectedTransfer.transferNumber}`}
          visible={showDetail}
          style={{ width: "90vw", maxWidth: "900px" }}
          onHide={() => {
            setShowDetail(false);
            setSelectedTransfer(null);
          }}
          modal
        >
          <TransferDetail transfer={selectedTransfer} />
        </Dialog>
      )}
    </motion.div>
  );
}
