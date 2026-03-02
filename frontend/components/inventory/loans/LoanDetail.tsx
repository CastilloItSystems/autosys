"use client";

import { Loan, LOAN_STATUS_CONFIG } from "@/app/api/inventory/loanService";
import { Badge } from "primereact/badge";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface LoanDetailProps {
  loan: Loan;
}

const LoanDetail = ({ loan }: LoanDetailProps) => {
  const statusConfig = LOAN_STATUS_CONFIG[loan.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold block text-gray-500">
              Nº Préstamo
            </label>
            <p className="text-lg font-bold">{loan.loanNumber}</p>
          </div>
          <div>
            <label className="font-semibold block text-gray-500">Estado</label>
            <div className="flex items-center gap-2 mt-1">
              <i className={statusConfig.icon}></i>
              <Badge
                value={statusConfig.label}
                severity={statusConfig.severity as any}
              />
            </div>
          </div>
          <div>
            <label className="font-semibold block text-gray-500">
              Crear En
            </label>
            <p className="text-sm">
              {new Date(loan.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="border-t pt-4" />
      </div>

      {/* Borrower Info */}
      <div className="space-y-2">
        <label className="font-semibold block text-lg">
          Información del Prestatario
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-gray-500 block">Nombre</label>
            <p>{loan.borrowerName}</p>
          </div>
          {loan.borrowerId && (
            <div>
              <label className="font-semibold text-gray-500 block">
                ID Prestatario
              </label>
              <p>{loan.borrowerId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Loan Details */}
      <div className="space-y-2">
        <label className="font-semibold block text-lg">
          Detalles del Préstamo
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-gray-500 block">Almacén</label>
            <p>{loan.warehouseId}</p>
          </div>
          <div>
            <label className="font-semibold text-gray-500 block">
              Propósito
            </label>
            <p>{loan.purpose || "-"}</p>
          </div>
          <div>
            <label className="font-semibold text-gray-500 block">
              Fecha de Inicio
            </label>
            <p>{new Date(loan.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="font-semibold text-gray-500 block">
              Fecha de Devolución
            </label>
            <p>{new Date(loan.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Approval Info */}
      {loan.approvedAt && (
        <div className="space-y-2">
          <label className="font-semibold block text-lg">
            Información de Aprobación
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-500 block">
                Aprobado por
              </label>
              <p>{loan.approvedBy || "-"}</p>
            </div>
            <div>
              <label className="font-semibold text-gray-500 block">
                Aprobado en
              </label>
              <p>{new Date(loan.approvedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Return Info */}
      {loan.returnedAt && (
        <div className="space-y-2">
          <label className="font-semibold block text-lg">
            Información de Devolución
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-500 block">
                Devuelto en
              </label>
              <p>{new Date(loan.returnedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        <label className="font-semibold block text-lg">Artículos</label>
        <DataTable value={loan.items} responsiveLayout="scroll">
          <Column field="item.name" header="Artículo" />
          <Column field="item.sku" header="SKU" />
          <Column field="quantityLoaned" header="Cantidad Prestada" />
          <Column field="quantityReturned" header="Cantidad Devuelta" />
          <Column field="unitCost" header="Costo Unitario" />
          <Column field="notes" header="Notas" />
        </DataTable>
      </div>

      {/* Notes */}
      {loan.notes && (
        <div className="space-y-2">
          <label className="font-semibold block text-lg">Notas</label>
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="whitespace-pre-wrap">{loan.notes}</p>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
        <p>ID: {loan.id}</p>
        <p>Creado por: {loan.createdBy}</p>
        <p>Última actualización: {new Date(loan.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default LoanDetail;
