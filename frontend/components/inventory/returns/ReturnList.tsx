"use client";

import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { motion } from "framer-motion";
import returnService, {
  ReturnOrder,
  ReturnStatus,
  ReturnType,
  RETURN_STATUS_CONFIG,
  RETURN_TYPE_CONFIG,
} from "@/app/api/inventory/returnService";
import { useEmpresasStore } from "@/store/empresasStore";
import ReturnForm from "./ReturnForm";
import ReturnDetail from "./ReturnDetail";

const ReturnList = () => {
  const { activeEmpresa } = useEmpresasStore();
  const toast = useRef<Toast>(null);
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState<{
    status?: ReturnStatus | null;
    type?: ReturnType | null;
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 20,
  });

  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadReturns = async () => {
    try {
      setLoading(true);
      const response = await returnService.getAll(filters.page, filters.limit, {
        status: filters.status || undefined,
        type: filters.type || undefined,
      });
      setReturns(Array.isArray(response.data) ? response.data : []);
      setTotalRecords(response.meta?.total || 0);
    } catch (error: any) {
      const detail =
        error?.response?.data?.message ||
        "No se pudieron cargar las devoluciones";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail,
        life: 3000,
      });
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeEmpresa) loadReturns();
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.type,
    activeEmpresa?.id_empresa,
  ]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSubmitForApproval = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Enviar la devolución ${ret.returnNumber} a aprobación?`,
      header: "Confirmar envío",
      icon: "pi pi-send",
      acceptClassName: "p-button-info",
      acceptLabel: "Enviar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.submit(ret.id);
          toast.current?.show({
            severity: "info",
            summary: "Enviado",
            detail: `Devolución ${ret.returnNumber} enviada a aprobación`,
            life: 3000,
          });
          loadReturns();
        } catch (error: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.response?.data?.message ||
              "No se pudo enviar la devolución",
            life: 3000,
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleApprove = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Aprobar la devolución ${ret.returnNumber}?`,
      header: "Confirmar aprobación",
      icon: "pi pi-check-circle",
      acceptClassName: "p-button-success",
      acceptLabel: "Aprobar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.approve(ret.id);
          toast.current?.show({
            severity: "success",
            summary: "Aprobado",
            detail: `Devolución ${ret.returnNumber} aprobada`,
            life: 3000,
          });
          loadReturns();
        } catch (error: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.response?.data?.message ||
              "No se pudo aprobar la devolución",
            life: 3000,
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleProcess = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Procesar la devolución ${ret.returnNumber}? Los artículos serán agregados al stock.`,
      header: "Confirmar procesamiento",
      icon: "pi pi-box",
      acceptClassName: "p-button-success",
      acceptLabel: "Procesar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.process(ret.id);
          toast.current?.show({
            severity: "success",
            summary: "Procesado",
            detail: `Devolución ${ret.returnNumber} procesada. Stock actualizado.`,
            life: 4000,
          });
          loadReturns();
        } catch (error: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.response?.data?.message ||
              "No se pudo procesar la devolución",
            life: 3000,
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleReject = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Rechazar la devolución ${ret.returnNumber}?`,
      header: "Confirmar rechazo",
      icon: "pi pi-times-circle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Rechazar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.reject(ret.id);
          toast.current?.show({
            severity: "warn",
            summary: "Rechazado",
            detail: `Devolución ${ret.returnNumber} rechazada`,
            life: 3000,
          });
          loadReturns();
        } catch (error: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.response?.data?.message ||
              "No se pudo rechazar la devolución",
            life: 3000,
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleCancel = (ret: ReturnOrder) => {
    confirmDialog({
      message: `¿Cancelar la devolución ${ret.returnNumber}?`,
      header: "Confirmar cancelación",
      icon: "pi pi-times-circle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Cancelar devolución",
      rejectLabel: "Volver",
      accept: async () => {
        setActionInProgress(ret.id);
        try {
          await returnService.cancel(ret.id);
          toast.current?.show({
            severity: "info",
            summary: "Cancelado",
            detail: `Devolución ${ret.returnNumber} cancelada`,
            life: 3000,
          });
          loadReturns();
        } catch (error: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.response?.data?.message ||
              "No se pudo cancelar la devolución",
            life: 3000,
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  // ── Templates ────────────────────────────────────────────────────────────────

  const statusTemplate = (rowData: ReturnOrder) => {
    const cfg = RETURN_STATUS_CONFIG[rowData.status];
    const severityMap: Record<string, any> = {
      secondary: "secondary",
      warning: "warning",
      info: "info",
      success: "success",
      danger: "danger",
    };
    return (
      <Tag
        value={cfg.label}
        severity={severityMap[cfg.severity] ?? "info"}
        icon={cfg.icon}
      />
    );
  };

  const typeTemplate = (rowData: ReturnOrder) => {
    const cfg = RETURN_TYPE_CONFIG[rowData.type];
    return (
      <div className="flex align-items-center gap-2">
        <i className={cfg.icon} style={{ color: cfg.color }} />
        <span>{cfg.label}</span>
      </div>
    );
  };

  const actionTemplate = (rowData: ReturnOrder) => {
    const busy = actionInProgress !== null;
    const isDraft = rowData.status === ReturnStatus.DRAFT;
    const isPending = rowData.status === ReturnStatus.PENDING_APPROVAL;
    const isApproved = rowData.status === ReturnStatus.APPROVED;
    const isCancellable = [
      ReturnStatus.DRAFT,
      ReturnStatus.PENDING_APPROVAL,
      ReturnStatus.APPROVED,
    ].includes(rowData.status);

    return (
      <div className="flex align-items-center gap-1">
        {/* Ver */}
        <Button
          icon="pi pi-eye"
          rounded
          text
          severity="info"
          size="small"
          tooltip="Ver detalles"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            setSelectedReturn(rowData);
            setIsDetailOpen(true);
          }}
          disabled={busy}
        />

        {/* Enviar a aprobación — solo DRAFT */}
        {isDraft && (
          <Button
            icon="pi pi-send"
            rounded
            text
            severity="info"
            size="small"
            tooltip="Enviar a aprobación"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleSubmitForApproval(rowData)}
            loading={actionInProgress === rowData.id}
            disabled={busy}
          />
        )}

        {/* Aprobar — solo PENDING_APPROVAL */}
        {isPending && (
          <Button
            icon="pi pi-check"
            rounded
            text
            severity="success"
            size="small"
            tooltip="Aprobar"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleApprove(rowData)}
            loading={actionInProgress === rowData.id}
            disabled={busy}
          />
        )}

        {/* Rechazar — solo PENDING_APPROVAL */}
        {isPending && (
          <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            size="small"
            tooltip="Rechazar"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleReject(rowData)}
            loading={actionInProgress === rowData.id}
            disabled={busy}
          />
        )}

        {/* Procesar — solo APPROVED */}
        {isApproved && (
          <Button
            icon="pi pi-box"
            rounded
            text
            severity="success"
            size="small"
            tooltip="Procesar (agregar a stock)"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleProcess(rowData)}
            loading={actionInProgress === rowData.id}
            disabled={busy}
          />
        )}

        {/* Cancelar */}
        {isCancellable && (
          <Button
            icon="pi pi-ban"
            rounded
            text
            severity="danger"
            size="small"
            tooltip="Cancelar"
            tooltipOptions={{ position: "top" }}
            onClick={() => handleCancel(rowData)}
            loading={actionInProgress === rowData.id}
            disabled={busy}
          />
        )}
      </div>
    );
  };

  // ── Filter options ────────────────────────────────────────────────────────────

  const statusOptions = [
    { label: "Todos los estados", value: null },
    ...Object.values(ReturnStatus).map((s) => ({
      label: RETURN_STATUS_CONFIG[s].label,
      value: s,
    })),
  ];

  const typeOptions = [
    { label: "Todos los tipos", value: null },
    ...Object.values(ReturnType).map((t) => ({
      label: RETURN_TYPE_CONFIG[t].label,
      value: t,
    })),
  ];

  // ── Header ────────────────────────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Devoluciones</h4>
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          options={statusOptions}
          value={filters.status ?? null}
          onChange={(e) => setFilters({ ...filters, status: e.value, page: 1 })}
          placeholder="Todos los estados"
          className="w-14rem"
          showClear={!!filters.status}
        />
        <Dropdown
          options={typeOptions}
          value={filters.type ?? null}
          onChange={(e) => setFilters({ ...filters, type: e.value, page: 1 })}
          placeholder="Todos los tipos"
          className="w-14rem"
          showClear={!!filters.type}
        />
        <Button
          label="Nueva Devolución"
          icon="pi pi-plus"
          onClick={() => {
            setSelectedReturn(null);
            setIsFormOpen(true);
          }}
        />
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Aviso si no hay empresa activa */}
      {!activeEmpresa && (
        <Message
          severity="warn"
          className="w-full mb-3"
          text="Selecciona una empresa desde el menú superior para ver las devoluciones."
        />
      )}

      <div className="card">
        <DataTable
          value={returns}
          loading={loading}
          paginator
          rows={filters.limit}
          first={(filters.page - 1) * filters.limit}
          totalRecords={totalRecords}
          onPage={(e) =>
            setFilters({ ...filters, page: e.page + 1, limit: e.rows })
          }
          rowsPerPageOptions={[10, 20, 50]}
          dataKey="id"
          stripedRows
          scrollable
          header={header}
          emptyMessage="No se encontraron devoluciones."
          size="small"
        >
          <Column body={actionTemplate} style={{ minWidth: "200px" }} />
          <Column
            field="returnNumber"
            header="Nº Devolución"
            sortable
            style={{ minWidth: "140px" }}
          />
          <Column
            header="Tipo"
            body={typeTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            field="reason"
            header="Razón"
            style={{ minWidth: "200px" }}
            body={(r) => (
              <span
                className="overflow-hidden white-space-nowrap block"
                style={{ maxWidth: "200px", textOverflow: "ellipsis" }}
              >
                {r.reason}
              </span>
            )}
          />
          <Column
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "180px" }}
          />
          <Column
            header="Almacén"
            style={{ minWidth: "140px" }}
            body={(r) => r.warehouse?.name ?? r.warehouseId}
          />
          <Column
            header="Creado"
            field="createdAt"
            sortable
            style={{ minWidth: "130px" }}
            body={(r) => new Date(r.createdAt).toLocaleDateString("es-VE")}
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={isFormOpen}
        onHide={() => {
          setIsFormOpen(false);
          setSelectedReturn(null);
        }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-file-edit text-primary text-2xl" />
            <span className="text-xl font-semibold">Nueva Devolución</span>
          </div>
        }
        modal
        style={{ width: "90vw", maxWidth: "860px" }}
      >
        <ReturnForm
          onSuccess={() => {
            setIsFormOpen(false);
            loadReturns();
          }}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedReturn(null);
          }}
        />
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        visible={isDetailOpen}
        onHide={() => {
          setIsDetailOpen(false);
          setSelectedReturn(null);
        }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-info-circle text-primary text-2xl" />
            <span className="text-xl font-semibold">
              Devolución {selectedReturn?.returnNumber}
            </span>
          </div>
        }
        modal
        style={{ width: "90vw", maxWidth: "860px" }}
      >
        {selectedReturn && (
          <ReturnDetail
            returnOrder={selectedReturn}
            onRefresh={() => loadReturns()}
          />
        )}
      </Dialog>
    </motion.div>
  );
};

export default ReturnList;
