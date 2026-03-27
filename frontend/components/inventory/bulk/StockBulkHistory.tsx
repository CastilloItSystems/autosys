"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import stockBulkService, {
  IStockBulkOperation,
  IStockBulkError,
} from "@/app/api/inventory/stockBulkService";

interface Props {
  refreshKey?: number;
}

const POLL_INTERVAL_MS = 4000;

const TYPE_CONFIG: Record<string, { severity: string; label: string }> = {
  STOCK_IMPORT:     { severity: "info",      label: "Carga Stock" },
  STOCK_ADJUSTMENT: { severity: "warning",   label: "Ajuste Stock" },
  STOCK_TRANSFER:   { severity: "secondary", label: "Transferencia" },
  STOCK_EXPORT:     { severity: "success",   label: "Exportar Stock" },
};

const STATUS_CONFIG: Record<string, { severity: string; label: string }> = {
  PENDING:               { severity: "warning",   label: "Pendiente" },
  PROCESSING:            { severity: "info",      label: "Procesando..." },
  COMPLETED:             { severity: "success",   label: "Completado" },
  COMPLETED_WITH_ERRORS: { severity: "warning",   label: "Con errores" },
  FAILED:                { severity: "danger",    label: "Fallido" },
  CANCELLED:             { severity: "secondary", label: "Cancelado" },
};

export const StockBulkHistory = ({ refreshKey = 0 }: Props) => {
  const toast = useRef<Toast>(null);
  const [operations, setOperations] = useState<IStockBulkOperation[]>([]);
  const [selectedOp, setSelectedOp] = useState<IStockBulkOperation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => { loadOperations(); }, [refreshKey]); // eslint-disable-line
  useEffect(() => () => stopPolling(), []);

  const loadOperations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await stockBulkService.getOperations();
      const ops: IStockBulkOperation[] = Array.isArray(response?.data) ? response.data : [];
      setOperations(ops);
      const hasActive = ops.some((o) => o.status === "PROCESSING" || o.status === "PENDING");
      if (hasActive && !pollRef.current) {
        pollRef.current = setInterval(() => loadOperations(true), POLL_INTERVAL_MS);
      } else if (!hasActive) {
        stopPolling();
      }
    } catch (err: any) {
      if (!silent) toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const typeTemplate = (row: IStockBulkOperation) => {
    const cfg = TYPE_CONFIG[row.operationType] ?? { severity: "secondary", label: row.operationType };
    return <Tag value={cfg.label} severity={cfg.severity as any} />;
  };

  const statusTemplate = (row: IStockBulkOperation) => {
    const cfg = STATUS_CONFIG[row.status] ?? { severity: "secondary", label: row.status };
    const isActive = row.status === "PROCESSING" || row.status === "PENDING";
    return (
      <span className="flex align-items-center gap-1">
        {isActive && <i className="pi pi-spin pi-spinner" style={{ fontSize: "0.75rem" }} />}
        <Tag value={cfg.label} severity={cfg.severity as any} />
      </span>
    );
  };

  const summaryTemplate = (row: IStockBulkOperation) => (
    <div className="text-sm">
      <div><strong>Procesados:</strong> {row.processedRecords ?? 0}</div>
      <div><strong>Errores:</strong> {row.errorRecords ?? 0}</div>
    </div>
  );

  const dateTemplate = (row: IStockBulkOperation) => {
    if (!row.createdAt) return "-";
    return new Date(row.createdAt).toLocaleDateString("es-MX", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const actionTemplate = (row: IStockBulkOperation) => (
    <Button
      icon="pi pi-eye"
      rounded text severity="info"
      onClick={() => { setSelectedOp(row); setShowDetails(true); }}
      title="Ver detalles"
    />
  );

  const errorExpansionTemplate = (row: IStockBulkOperation) => {
    let errors: IStockBulkError[] = [];
    if (typeof row.errorDetails === "string") {
      try { errors = JSON.parse(row.errorDetails); } catch { errors = []; }
    } else if (Array.isArray(row.errorDetails)) {
      errors = row.errorDetails;
    }
    if (!errors.length) return <div className="p-3 text-600">Sin errores</div>;
    return (
      <div className="p-3">
        <h5>Errores ({errors.length})</h5>
        <DataTable value={errors} size="small" scrollable>
          <Column field="rowNumber" header="Fila" style={{ width: "70px" }} />
          <Column field="sku" header="SKU" style={{ width: "120px" }} />
          <Column field="warehouseCode" header="Almacén" style={{ width: "120px" }} />
          <Column field="error" header="Error" />
        </DataTable>
      </div>
    );
  };

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      <Card
        header={
          <div className="flex align-items-center justify-content-between w-full p-3">
            <h3 className="m-0">Historial de operaciones de stock</h3>
            <Button icon="pi pi-refresh" rounded text onClick={() => loadOperations()} loading={loading} title="Recargar" />
          </div>
        }
      >
        <DataTable
          value={operations}
          {...({ expandedRows, onExpandedRowsChange: (e: any) => setExpandedRows(e.value), rowExpansionTemplate: errorExpansionTemplate } as any)}
          dataKey="id"
          loading={loading}
          emptyMessage="Sin operaciones"
          scrollable
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
        >
          <Column expander style={{ width: "3rem" }} />
          <Column field="operationType" header="Tipo" style={{ width: "130px" }} body={typeTemplate} />
          <Column field="status" header="Estado" style={{ width: "130px" }} body={statusTemplate} />
          <Column field="fileName" header="Archivo" body={(r) => r.fileName || "-"} />
          <Column field="totalRecords" header="Total" style={{ width: "70px" }} />
          <Column header="Resumen" style={{ width: "180px" }} body={summaryTemplate} />
          <Column field="createdAt" header="Fecha" style={{ width: "160px" }} body={dateTemplate} />
          <Column header="Acciones" style={{ width: "80px" }} body={actionTemplate} />
        </DataTable>
      </Card>

      <Dialog
        visible={showDetails}
        onHide={() => setShowDetails(false)}
        header="Detalles de la operación"
        modal style={{ width: "80vw" }} maximizable
      >
        {selectedOp && (
          <div className="flex flex-column gap-4">
            <div className="grid">
              <div className="col-6 md:col-3"><strong>Tipo:</strong><div className="mt-1">{typeTemplate(selectedOp)}</div></div>
              <div className="col-6 md:col-3"><strong>Estado:</strong><div className="mt-1">{statusTemplate(selectedOp)}</div></div>
              <div className="col-6 md:col-3"><strong>Archivo:</strong><div className="mt-1">{selectedOp.fileName || "-"}</div></div>
              <div className="col-6 md:col-3"><strong>Fecha:</strong><div className="mt-1">{dateTemplate(selectedOp)}</div></div>
            </div>
            <div className="grid">
              <div className="col-6 md:col-3">
                <Card className="bg-green-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{selectedOp.processedRecords ?? 0}</div>
                    <div className="text-600 text-sm mt-1">Procesados</div>
                  </div>
                </Card>
              </div>
              <div className="col-6 md:col-3">
                <Card className="bg-red-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{selectedOp.errorRecords ?? 0}</div>
                    <div className="text-600 text-sm mt-1">Errores</div>
                  </div>
                </Card>
              </div>
              <div className="col-6 md:col-3">
                <Card className="bg-blue-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{selectedOp.totalRecords ?? 0}</div>
                    <div className="text-600 text-sm mt-1">Total</div>
                  </div>
                </Card>
              </div>
            </div>
            {errorExpansionTemplate(selectedOp)}
            <div className="flex justify-content-end">
              <Button label="Cerrar" onClick={() => setShowDetails(false)} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default StockBulkHistory;
