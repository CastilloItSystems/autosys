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
import { useEmpresasStore } from "@/store/empresasStore";
import loanService, {
  Loan,
  LoanStatus,
  LOAN_STATUS_CONFIG,
} from "@/app/api/inventory/loanService";
import LoanForm from "./LoanForm";
import LoanDetail from "./LoanDetail";
import LoanReturnDialog from "./LoanReturnDialog";

const LoanList = () => {
  const { activeEmpresa } = useEmpresasStore();
  const toast = useRef<Toast>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState<{
    status?: LoanStatus | null;
    borrowerName?: string;
    page: number;
    limit: number;
  }>({ page: 1, limit: 20 });

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadLoans = async () => {
    try {
      setLoading(true);
      const response = await loanService.getAll(filters.page, filters.limit, {
        status: filters.status || undefined,
        borrowerName: filters.borrowerName || undefined,
      });
      setLoans(Array.isArray(response.data) ? response.data : []);
      setTotalRecords(response.pagination?.total ?? 0);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.message ||
          "No se pudieron cargar los préstamos",
        life: 3000,
      });
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeEmpresa) loadLoans();
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.borrowerName,
    activeEmpresa?.id_empresa,
  ]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleApprove = (loan: Loan) => {
    confirmDialog({
      message: `¿Aprobar el préstamo ${loan.loanNumber}?`,
      header: "Confirmar aprobación",
      icon: "pi pi-check-circle",
      acceptClassName: "p-button-success",
      acceptLabel: "Aprobar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setActionInProgress(loan.id);
        try {
          await loanService.approve(loan.id);
          toast.current?.show({
            severity: "success",
            summary: "Aprobado",
            detail: `Préstamo ${loan.loanNumber} aprobado`,
            life: 3000,
          });
          loadLoans();
        } catch (error: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error?.response?.data?.message || "No se pudo aprobar",
            life: 4000,
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleActivate = (loan: Loan) => {
    confirmDialog({
      message: `¿Activar el préstamo ${loan.loanNumber}? Los artículos serán descontados del stock.`,
      header: "Confirmar activación",
      icon: "pi pi-play",
      acceptClassName: "p-button-success",
      acceptLabel: "Activar",
      rejectLabel: "Cancelar",
      accept: async () => {
        setActionInProgress(loan.id);
        try {
          await loanService.activate(loan.id);
          toast.current?.show({
            severity: "success",
            summary: "Activado",
            detail: `Préstamo ${loan.loanNumber} activado`,
            life: 3000,
          });
          loadLoans();
        } catch (error: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error?.response?.data?.message || "No se pudo activar",
            life: 4000,
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleCancel = (loan: Loan) => {
    confirmDialog({
      message: `¿Cancelar el préstamo ${loan.loanNumber}?`,
      header: "Confirmar cancelación",
      icon: "pi pi-times-circle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Cancelar préstamo",
      rejectLabel: "Volver",
      accept: async () => {
        setActionInProgress(loan.id);
        try {
          await loanService.cancel(loan.id);
          toast.current?.show({
            severity: "info",
            summary: "Cancelado",
            detail: `Préstamo ${loan.loanNumber} cancelado`,
            life: 3000,
          });
          loadLoans();
        } catch (error: any) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error?.response?.data?.message || "No se pudo cancelar",
            life: 4000,
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  // ── Templates ────────────────────────────────────────────────────────────

  const statusTemplate = (rowData: Loan) => {
    const cfg = LOAN_STATUS_CONFIG[rowData.status];
    return (
      <Tag value={cfg.label} severity={cfg.severity as any} icon={cfg.icon} />
    );
  };

  const dueDateTemplate = (rowData: Loan) => {
    const dueDate = new Date(rowData.dueDate);
    const today = new Date();
    const isOverdue =
      dueDate < today &&
      (rowData.status === LoanStatus.ACTIVE ||
        rowData.status === LoanStatus.OVERDUE);
    const daysOverdue = isOverdue
      ? Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;
    const daysUntilDue = !isOverdue
      ? Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    return (
      <div className="flex align-items-center gap-2">
        <span>{dueDate.toLocaleDateString("es-VE")}</span>
        {isOverdue && (
          <Tag value={`${daysOverdue}d vencido`} severity="danger" />
        )}
        {!isOverdue && daysUntilDue <= 7 && daysUntilDue >= 0 && (
          <Tag value={`${daysUntilDue}d restantes`} severity="warning" />
        )}
      </div>
    );
  };

  const actionTemplate = (rowData: Loan) => {
    const busy = actionInProgress !== null;
    return (
      <div className="flex align-items-center gap-1">
        <Button
          icon="pi pi-eye"
          rounded
          text
          severity="info"
          size="small"
          tooltip="Ver detalles"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            setSelectedLoan(rowData);
            setIsDetailOpen(true);
          }}
          disabled={busy}
        />
        {rowData.status === LoanStatus.DRAFT && (
          <Button
            icon="pi pi-pencil"
            rounded
            text
            severity="warning"
            size="small"
            tooltip="Editar"
            tooltipOptions={{ position: "top" }}
            onClick={() => {
              setSelectedLoan(rowData);
              setIsFormOpen(true);
            }}
            disabled={busy}
          />
        )}
        {rowData.status === LoanStatus.DRAFT && (
          <Button
            icon="pi pi-check"
            rounded
            text
            severity="success"
            size="small"
            tooltip="Aprobar"
            tooltipOptions={{ position: "top" }}
            loading={actionInProgress === rowData.id}
            disabled={busy}
            onClick={() => handleApprove(rowData)}
          />
        )}
        {rowData.status === LoanStatus.APPROVED && (
          <Button
            icon="pi pi-play"
            rounded
            text
            severity="success"
            size="small"
            tooltip="Activar"
            tooltipOptions={{ position: "top" }}
            loading={actionInProgress === rowData.id}
            disabled={busy}
            onClick={() => handleActivate(rowData)}
          />
        )}
        {(rowData.status === LoanStatus.ACTIVE ||
          rowData.status === LoanStatus.OVERDUE) && (
          <Button
            icon="pi pi-undo"
            rounded
            text
            severity="info"
            size="small"
            tooltip="Registrar devolución"
            tooltipOptions={{ position: "top" }}
            disabled={busy}
            onClick={() => {
              setSelectedLoan(rowData);
              setIsReturnOpen(true);
            }}
          />
        )}
        {[
          LoanStatus.DRAFT,
          LoanStatus.APPROVED,
          LoanStatus.ACTIVE,
          LoanStatus.OVERDUE,
        ].includes(rowData.status) && (
          <Button
            icon="pi pi-ban"
            rounded
            text
            severity="danger"
            size="small"
            tooltip="Cancelar"
            tooltipOptions={{ position: "top" }}
            loading={actionInProgress === rowData.id}
            disabled={busy}
            onClick={() => handleCancel(rowData)}
          />
        )}
      </div>
    );
  };

  // ── Header del DataTable ─────────────────────────────────────────────────

  const statusOptions = [
    { label: "Todos los estados", value: null },
    ...Object.values(LoanStatus).map((s) => ({
      label: LOAN_STATUS_CONFIG[s].label,
      value: s,
    })),
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Gestión de Préstamos</h4>
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          options={statusOptions}
          value={filters.status ?? null}
          onChange={(e) => setFilters({ ...filters, status: e.value, page: 1 })}
          placeholder="Todos los estados"
          className="w-14rem"
          showClear={!!filters.status}
        />
        <Button
          label="Nuevo Préstamo"
          icon="pi pi-plus"
          disabled={!activeEmpresa}
          onClick={() => {
            setSelectedLoan(null);
            setIsFormOpen(true);
          }}
        />
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <ConfirmDialog />

      {!activeEmpresa && (
        <Message
          severity="warn"
          className="w-full mb-3"
          text="Selecciona una empresa desde el menú superior para ver los préstamos."
        />
      )}

      <div className="card">
        <DataTable
          value={loans}
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
          emptyMessage="No se encontraron préstamos."
          size="small"
        >
          <Column body={actionTemplate} style={{ minWidth: "180px" }} />
          <Column
            field="loanNumber"
            header="Nº Préstamo"
            sortable
            style={{ minWidth: "140px" }}
          />
          <Column
            field="borrowerName"
            header="Prestatario"
            style={{ minWidth: "160px" }}
          />
          <Column
            field="purpose"
            header="Propósito"
            style={{ minWidth: "180px" }}
            body={(r) => (
              <span
                className="overflow-hidden white-space-nowrap block"
                style={{ maxWidth: "180px", textOverflow: "ellipsis" }}
              >
                {r.purpose}
              </span>
            )}
          />
          <Column
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Fecha Devolución"
            body={dueDateTemplate}
            style={{ minWidth: "190px" }}
          />
          <Column
            header="Creado"
            field="createdAt"
            sortable
            style={{ minWidth: "120px" }}
            body={(r) => new Date(r.createdAt).toLocaleDateString("es-VE")}
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={isFormOpen}
        onHide={() => {
          setIsFormOpen(false);
          setSelectedLoan(null);
        }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-file-edit text-primary text-2xl" />
            <span className="text-xl font-semibold">
              {selectedLoan ? "Editar Préstamo" : "Nuevo Préstamo"}
            </span>
          </div>
        }
        modal
        style={{ width: "90vw", maxWidth: "820px" }}
      >
        <LoanForm
          loan={selectedLoan ?? undefined}
          onSuccess={() => {
            setIsFormOpen(false);
            loadLoans();
          }}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedLoan(null);
          }}
        />
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        visible={isDetailOpen}
        onHide={() => {
          setIsDetailOpen(false);
          setSelectedLoan(null);
        }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-info-circle text-primary text-2xl" />
            <span className="text-xl font-semibold">
              Préstamo {selectedLoan?.loanNumber}
            </span>
          </div>
        }
        modal
        style={{ width: "90vw", maxWidth: "820px" }}
      >
        {selectedLoan && (
          <LoanDetail
            loan={selectedLoan}
            onReturn={() => {
              setIsDetailOpen(false);
              setIsReturnOpen(true);
            }}
            onRefresh={loadLoans}
          />
        )}
      </Dialog>

      {/* Return Dialog */}
      {selectedLoan && (
        <LoanReturnDialog
          visible={isReturnOpen}
          loan={selectedLoan}
          onHide={() => setIsReturnOpen(false)}
          onSuccess={() => {
            setIsReturnOpen(false);
            toast.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: "Devolución registrada correctamente",
              life: 3000,
            });
            loadLoans();
          }}
          toast={toast}
        />
      )}
    </motion.div>
  );
};

export default LoanList;
