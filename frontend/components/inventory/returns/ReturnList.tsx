"use client";

import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Badge } from "primereact/badge";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import returnService, {
  ReturnOrder,
  ReturnStatus,
  ReturnType,
  RETURN_STATUS_CONFIG,
  RETURN_TYPE_CONFIG,
} from "@/app/api/inventory/returnService";
import ReturnForm from "./ReturnForm";
import ReturnDetail from "./ReturnDetail";

interface ReturnListFilters {
  status?: ReturnStatus | null;
  type?: ReturnType | null;
}

const ReturnList = () => {
  const toast = useRef<Toast>(null);
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState<
    ReturnListFilters & { page: number; limit: number }
  >({
    page: 1,
    limit: 20,
  });
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load returns
  const loadReturns = async (
    page: number,
    limit: number,
    status?: ReturnStatus | null,
    type?: ReturnType | null,
  ) => {
    setLoading(true);
    try {
      const response = await returnService.getReturns(page, limit, {
        status: status || undefined,
        type: type || undefined,
      });
      setReturns(response.data);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      console.error("Error loading returns:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las devoluciones",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns(filters.page, filters.limit, filters.status, filters.type);
  }, [filters.page, filters.limit, filters.status, filters.type]);

  const handleApprove = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Aprobar devolución ${ret.returnNumber}?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.approveReturn(ret.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Devolución aprobada",
          });
          loadReturns(
            filters.page,
            filters.limit,
            filters.status,
            filters.type,
          );
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo aprobar la devolución",
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleProcess = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Procesar devolución ${ret.returnNumber}? Esto agregará los artículos al stock.`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.processReturn(ret.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Devolución procesada",
          });
          loadReturns(
            filters.page,
            filters.limit,
            filters.status,
            filters.type,
          );
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo procesar la devolución",
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleReject = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Rechazar devolución ${ret.returnNumber}?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.rejectReturn(ret.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Devolución rechazada",
          });
          loadReturns(
            filters.page,
            filters.limit,
            filters.status,
            filters.type,
          );
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo rechazar la devolución",
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleCancel = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Cancelar devolución ${ret.returnNumber}?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.cancelReturn(ret.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Devolución cancelada",
          });
          loadReturns(
            filters.page,
            filters.limit,
            filters.status,
            filters.type,
          );
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo cancelar la devolución",
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleView = (ret: ReturnOrder) => {
    setSelectedReturn(ret);
    setIsDetailOpen(true);
  };

  const handlePageChange = (e: any) => {
    setFilters({ ...filters, page: e.page + 1, limit: e.rows });
  };

  const handleStatusChange = (status: ReturnStatus | null) => {
    setFilters({ ...filters, status, page: 1 });
  };

  const handleTypeChange = (type: ReturnType | null) => {
    setFilters({ ...filters, type, page: 1 });
  };

  const statusOptions = Object.values(ReturnStatus).map((status) => ({
    label: RETURN_STATUS_CONFIG[status].label,
    value: status,
  }));

  const typeOptions = Object.values(ReturnType).map((type) => ({
    label: RETURN_TYPE_CONFIG[type].label,
    value: type,
  }));

  // Action template
  const actionTemplate = (rowData: ReturnOrder) => {
    return (
      <div className="flex gap-2 flex-wrap">
        {/* View button */}
        <Button
          icon="pi pi-eye"
          rounded
          text
          severity="info"
          onClick={() => handleView(rowData)}
          tooltip="Ver detalles"
          tooltipOptions={{ position: "top" }}
          size="small"
          disabled={actionInProgress !== null}
        />

        {/* Approve button - only for DRAFT */}
        {rowData.status === ReturnStatus.DRAFT && (
          <Button
            icon="pi pi-check"
            rounded
            text
            severity="success"
            onClick={() => handleApprove(rowData)}
            tooltip="Aprobar"
            tooltipOptions={{ position: "top" }}
            size="small"
            loading={actionInProgress === rowData.id}
            disabled={actionInProgress !== null}
          />
        )}

        {/* Process button - only for APPROVED */}
        {rowData.status === ReturnStatus.APPROVED && (
          <Button
            icon="pi pi-plus"
            rounded
            text
            severity="success"
            onClick={() => handleProcess(rowData)}
            tooltip="Procesar"
            tooltipOptions={{ position: "top" }}
            size="small"
            loading={actionInProgress === rowData.id}
            disabled={actionInProgress !== null}
          />
        )}

        {/* Reject button - only for PENDING */}
        {rowData.status === ReturnStatus.PENDING_APPROVAL && (
          <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            onClick={() => handleReject(rowData)}
            tooltip="Rechazar"
            tooltipOptions={{ position: "top" }}
            size="small"
            loading={actionInProgress === rowData.id}
            disabled={actionInProgress !== null}
          />
        )}

        {/* Cancel button - for DRAFT, APPROVED, PENDING */}
        {[
          ReturnStatus.DRAFT,
          ReturnStatus.APPROVED,
          ReturnStatus.PENDING_APPROVAL,
        ].includes(rowData.status) && (
          <Button
            icon="pi pi-ban"
            rounded
            text
            severity="danger"
            onClick={() => handleCancel(rowData)}
            tooltip="Cancelar"
            tooltipOptions={{ position: "top" }}
            size="small"
            loading={actionInProgress === rowData.id}
            disabled={actionInProgress !== null}
          />
        )}
      </div>
    );
  };

  // Status template
  const statusTemplate = (rowData: ReturnOrder) => {
    const config = RETURN_STATUS_CONFIG[rowData.status];
    return (
      <div className="flex items-center gap-2">
        <i className={config.icon}></i>
        <Badge value={config.label} severity={config.severity as any} />
      </div>
    );
  };

  // Type template
  const typeTemplate = (rowData: ReturnOrder) => {
    const config = RETURN_TYPE_CONFIG[rowData.type];
    return (
      <div className="flex items-center gap-2">
        <i className={config.icon}></i>
        <span>{config.label}</span>
      </div>
    );
  };

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex gap-2 flex-wrap">
          <Button
            label="Nueva Devolución"
            icon="pi pi-plus"
            onClick={() => setIsFormOpen(true)}
            severity="success"
          />

          <Dropdown
            options={[
              { label: "Todos los estados", value: null },
              ...statusOptions,
            ]}
            value={filters.status || null}
            onChange={(e) => handleStatusChange(e.value)}
            placeholder="Filtrar por estado"
            className="w-full md:w-48"
          />

          <Dropdown
            options={[
              { label: "Todos los tipos", value: null },
              ...typeOptions,
            ]}
            value={filters.type || null}
            onChange={(e) => handleTypeChange(e.value)}
            placeholder="Filtrar por tipo"
            className="w-full md:w-48"
          />
        </div>

        {/* Data Table */}
        <DataTable
          value={returns}
          loading={loading}
          paginator
          rows={filters.limit}
          first={(filters.page - 1) * filters.limit}
          totalRecords={totalRecords}
          onPage={handlePageChange}
          dataKey="id"
          stripedRows
          responsiveLayout="scroll"
          className="w-full"
        >
          <Column
            field="returnNumber"
            header="Nº Devolución"
            style={{ width: "12%" }}
          />
          <Column header="Tipo" body={typeTemplate} style={{ width: "18%" }} />
          <Column field="reason" header="Razón" style={{ width: "25%" }} />
          <Column
            header="Estado"
            body={statusTemplate}
            style={{ width: "15%" }}
          />
          <Column
            field="warehouseId"
            header="Almacén"
            style={{ width: "13%" }}
          />
          <Column
            header="Acciones"
            body={actionTemplate}
            style={{ width: "17%" }}
            align="center"
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={isFormOpen}
        onHide={() => setIsFormOpen(false)}
        header="Nueva Devolución"
        modal
        style={{ width: "90vw", maxWidth: "800px" }}
      >
        <ReturnForm
          onSuccess={() => {
            setIsFormOpen(false);
            loadReturns(
              filters.page,
              filters.limit,
              filters.status,
              filters.type,
            );
          }}
        />
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        visible={isDetailOpen}
        onHide={() => setIsDetailOpen(false)}
        header={`Devolución ${selectedReturn?.returnNumber}`}
        modal
        style={{ width: "90vw", maxWidth: "800px" }}
      >
        {selectedReturn && <ReturnDetail returnOrder={selectedReturn} />}
      </Dialog>
    </>
  );
};

export default ReturnList;
