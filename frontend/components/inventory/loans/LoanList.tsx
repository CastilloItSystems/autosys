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
import loanService, {
  Loan,
  LoanStatus,
  LOAN_STATUS_CONFIG,
} from "@/app/api/inventory/loanService";
import LoanForm from "./LoanForm";
import LoanDetail from "./LoanDetail";

interface LoanListFilters {
  status?: LoanStatus;
  borrowerName?: string;
}

const LoanList = () => {
  const toast = useRef<Toast>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState<
    LoanListFilters & { page: number; limit: number }
  >({
    page: 1,
    limit: 20,
  });
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load loans
  const loadLoans = async (
    page: number,
    limit: number,
    status?: LoanStatus,
    borrowerName?: string,
  ) => {
    setLoading(true);
    try {
      const response = await loanService.getLoans(page, limit, {
        status,
        borrowerName,
      });
      setLoans(response.data);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      console.error("Error loading loans:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los préstamos",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans(
      filters.page,
      filters.limit,
      filters.status,
      filters.borrowerName,
    );
  }, [filters.page, filters.limit, filters.status, filters.borrowerName]);

  const handleApprove = (loan: Loan) => {
    confirmDialog({
      message: `¿Aprobar préstamo ${loan.loanNumber}?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        setActionInProgress(loan.id);
        try {
          await loanService.approveLoan(loan.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Préstamo aprobado",
          });
          loadLoans(
            filters.page,
            filters.limit,
            filters.status,
            filters.borrowerName,
          );
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo aprobar el préstamo",
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleActivate = (loan: Loan) => {
    confirmDialog({
      message: `¿Activar préstamo ${loan.loanNumber}?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        setActionInProgress(loan.id);
        try {
          await loanService.activateLoan(loan.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Préstamo activado",
          });
          loadLoans(
            filters.page,
            filters.limit,
            filters.status,
            filters.borrowerName,
          );
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo activar el préstamo",
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handleCancel = (loan: Loan) => {
    confirmDialog({
      message: `¿Cancelar préstamo ${loan.loanNumber}?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        setActionInProgress(loan.id);
        try {
          await loanService.cancelLoan(loan.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Préstamo cancelado",
          });
          loadLoans(
            filters.page,
            filters.limit,
            filters.status,
            filters.borrowerName,
          );
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo cancelar el préstamo",
          });
        } finally {
          setActionInProgress(null);
        }
      },
    });
  };

  const handlePageChange = (e: any) => {
    setFilters({ ...filters, page: e.page + 1, limit: e.rows });
  };

  const handleStatusChange = (status: LoanStatus | null) => {
    setFilters({ ...filters, status, page: 1 });
  };

  const handleBorrowerNameChange = (borrowerName: string) => {
    setFilters({ ...filters, borrowerName, page: 1 });
  };

  const handleEdit = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsFormOpen(true);
  };

  const handleView = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDetailOpen(true);
  };

  const statusOptions = Object.values(LoanStatus).map((status) => ({
    label: LOAN_STATUS_CONFIG[status].label,
    value: status,
  }));

  // Action template
  const actionTemplate = (rowData: Loan) => {
    const isOverdue = rowData.status === LoanStatus.OVERDUE;

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
          tooltipPosition="top"
          size="small"
          disabled={actionInProgress !== null}
        />

        {/* Edit button - only for DRAFT */}
        {rowData.status === LoanStatus.DRAFT && (
          <Button
            icon="pi pi-pencil"
            rounded
            text
            severity="warning"
            onClick={() => handleEdit(rowData)}
            tooltip="Editar"
            tooltipPosition="top"
            size="small"
            disabled={actionInProgress !== null}
          />
        )}

        {/* Approve button - only for DRAFT */}
        {rowData.status === LoanStatus.DRAFT && (
          <Button
            icon="pi pi-check"
            rounded
            text
            severity="success"
            onClick={() => handleApprove(rowData)}
            tooltip="Aprobar"
            tooltipPosition="top"
            size="small"
            loading={actionInProgress === rowData.id}
            disabled={actionInProgress !== null}
          />
        )}

        {/* Activate button - only for APPROVED */}
        {rowData.status === LoanStatus.APPROVED && (
          <Button
            icon="pi pi-play"
            rounded
            text
            severity="success"
            onClick={() => handleActivate(rowData)}
            tooltip="Activar"
            tooltipPosition="top"
            size="small"
            loading={actionInProgress === rowData.id}
            disabled={actionInProgress !== null}
          />
        )}

        {/* Cancel button - for DRAFT, APPROVED, ACTIVE, OVERDUE */}
        {[
          LoanStatus.DRAFT,
          LoanStatus.APPROVED,
          LoanStatus.ACTIVE,
          LoanStatus.OVERDUE,
        ].includes(rowData.status) && (
          <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            onClick={() => handleCancel(rowData)}
            tooltip="Cancelar"
            tooltipPosition="top"
            size="small"
            loading={actionInProgress === rowData.id}
            disabled={actionInProgress !== null}
          />
        )}
      </div>
    );
  };

  // Status template
  const statusTemplate = (rowData: Loan) => {
    const config = LOAN_STATUS_CONFIG[rowData.status];
    return (
      <div className="flex items-center gap-2">
        <i className={config.icon}></i>
        <Badge value={config.label} severity={config.severity as any} />
      </div>
    );
  };

  // Overdue indicator
  const dueDateTemplate = (rowData: Loan) => {
    const dueDate = new Date(rowData.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today && rowData.status === LoanStatus.ACTIVE;
    const daysOverdue = isOverdue
      ? Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    if (isOverdue) {
      return (
        <div className="flex items-center gap-2">
          <span>{dueDate.toLocaleDateString()}</span>
          <Badge
            value={`${daysOverdue}d vencido`}
            severity="danger"
            className="font-bold"
          />
        </div>
      );
    }

    const daysUntilDue = Math.floor(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (
      <div className="flex items-center gap-2">
        <span>{dueDate.toLocaleDateString()}</span>
        {daysUntilDue <= 7 && (
          <Badge value={`${daysUntilDue}d restantes`} severity="warning" />
        )}
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
            label="Nuevo Préstamo"
            icon="pi pi-plus"
            onClick={() => {
              setSelectedLoan(null);
              setIsFormOpen(true);
            }}
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

          <InputText
            placeholder="Buscar por prestatario..."
            value={filters.borrowerName || ""}
            onChange={(e) => handleBorrowerNameChange(e.target.value)}
            className="w-full md:flex-1"
          />
        </div>

        {/* Data Table */}
        <DataTable
          value={loans}
          loading={loading}
          paginator
          rows={filters.limit}
          first={(filters.page - 1) * filters.limit}
          totalRecords={totalRecords}
          onPage={handlePageChange}
          dataKey="id"
          stripedRows
          responsive
          className="w-full"
        >
          <Column
            field="loanNumber"
            header="Nº Préstamo"
            style={{ width: "12%" }}
          />
          <Column
            field="borrowerName"
            header="Prestatario"
            style={{ width: "18%" }}
          />
          <Column field="purpose" header="Propósito" style={{ width: "20%" }} />
          <Column
            header="Estado"
            body={statusTemplate}
            style={{ width: "15%" }}
          />
          <Column
            header="Fecha de Devolución"
            body={dueDateTemplate}
            style={{ width: "18%" }}
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
        header={selectedLoan ? "Editar Préstamo" : "Nuevo Préstamo"}
        modal
        style={{ width: "90vw", maxWidth: "800px" }}
      >
        <LoanForm
          loan={selectedLoan}
          onSuccess={() => {
            setIsFormOpen(false);
            loadLoans(
              filters.page,
              filters.limit,
              filters.status,
              filters.borrowerName,
            );
          }}
        />
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        visible={isDetailOpen}
        onHide={() => setIsDetailOpen(false)}
        header={`Préstamo ${selectedLoan?.loanNumber}`}
        modal
        style={{ width: "90vw", maxWidth: "800px" }}
      >
        {selectedLoan && <LoanDetail loan={selectedLoan} />}
      </Dialog>
    </>
  );
};

export default LoanList;
