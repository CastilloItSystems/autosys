"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import bulkService from "@/app/api/inventory/bulkService";
import type {
  IBulkOperation,
  IBulkValidationError,
} from "@/app/api/inventory/bulkService";

interface BulkHistoryProps {
  /** Increment this value from outside to trigger a reload */
  refreshKey?: number;
}

const POLL_INTERVAL_MS = 4000; // poll every 4 s while any op is PROCESSING/PENDING

export const BulkHistory = ({ refreshKey = 0 }: BulkHistoryProps) => {
  const toast = useRef<Toast>(null);

  const [operations, setOperations] = useState<IBulkOperation[]>([]);
  const [selectedOperation, setSelectedOperation] =
    useState<IBulkOperation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Reload when refreshKey changes (triggered from parent after import/export)
  useEffect(() => {
    loadOperations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), []);

  const loadOperations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await bulkService.getOperations();
      const opsData = response?.data;
      const ops: IBulkOperation[] = Array.isArray(opsData) ? opsData : [];
      setOperations(ops);

      // If any op is still active, start/keep polling; otherwise stop
      const hasActive = ops.some((o) => o.status === "PROCESSING" || o.status === "PENDING");
      if (hasActive && !pollRef.current) {
        pollRef.current = setInterval(() => loadOperations(true), POLL_INTERVAL_MS);
      } else if (!hasActive) {
        stopPolling();
      }
    } catch (error: any) {
      if (!silent) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: error.message || "Error al cargar historial",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // View operation details
  const handleViewDetails = async (operation: IBulkOperation) => {
    try {
      if (operation.id) {
        const details = await bulkService.getOperation(operation.id);
        setSelectedOperation(details?.data || operation);
      } else {
        setSelectedOperation(operation);
      }
      setShowDetails(true);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar detalles",
      });
    }
  };

  // Type badge
  const typeTemplate = (rowData: IBulkOperation) => {
    const typeConfig: Record<string, { severity: string; label: string }> = {
      IMPORT: { severity: "info", label: "Importación" },
      EXPORT: { severity: "success", label: "Exportación" },
      UPDATE: { severity: "warning", label: "Actualización" },
      DELETE: { severity: "danger", label: "Eliminación" },
      STOCK_IMPORT: { severity: "info", label: "Carga Stock" },
      STOCK_ADJUSTMENT: { severity: "warning", label: "Ajuste Stock" },
      STOCK_TRANSFER: { severity: "secondary", label: "Transferencia Stock" },
      STOCK_EXPORT: { severity: "success", label: "Exportar Stock" },
    };

    const config = typeConfig[rowData.operationType || ""] || {
      severity: "secondary",
      label: rowData.operationType,
    };

    return <Tag value={config.label} severity={config.severity as any} />;
  };

  // Status badge
  const statusTemplate = (rowData: IBulkOperation) => {
    const statusConfig: Record<string, { severity: string; label: string }> = {
      PENDING:                { severity: "warning",   label: "Pendiente" },
      PROCESSING:             { severity: "info",      label: "Procesando..." },
      COMPLETED:              { severity: "success",   label: "Completado" },
      COMPLETED_WITH_ERRORS:  { severity: "warning",   label: "Con errores" },
      FAILED:                 { severity: "danger",    label: "Fallido" },
      CANCELLED:              { severity: "secondary", label: "Cancelado" },
    };

    const config = statusConfig[rowData.status || ""] || {
      severity: "secondary",
      label: rowData.status,
    };

    const isActive = rowData.status === "PROCESSING" || rowData.status === "PENDING";
    return (
      <span className="flex align-items-center gap-1">
        {isActive && <i className="pi pi-spin pi-spinner" style={{ fontSize: "0.75rem" }} />}
        <Tag value={config.label} severity={config.severity as any} />
      </span>
    );
  };

  // Summary template
  const summaryTemplate = (rowData: IBulkOperation) => {
    const omitted = Math.max(
      0,
      (rowData.totalRecords || 0) -
        ((rowData.processedRecords || 0) + (rowData.errorRecords || 0)),
    );
    return (
      <div className="text-sm">
        <div>
          <strong>Procesados:</strong> {rowData.processedRecords || 0}
        </div>
        <div>
          <strong>Errores:</strong> {rowData.errorRecords || 0}
        </div>
        <div>
          <strong>Omitidos:</strong> {omitted}
        </div>
      </div>
    );
  };

  // Action buttons
  const actionTemplate = (rowData: IBulkOperation) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          text
          severity="info"
          onClick={() => handleViewDetails(rowData)}
          title="Ver detalles"
        />
        {rowData.fileName && (
          <Button
            icon="pi pi-download"
            rounded
            text
            severity="success"
            onClick={() =>
              toast.current?.show({
                severity: "info",
                summary: "Info",
                detail: "Descarga implementada en el backend",
              })
            }
            title="Descargar archivo"
          />
        )}
      </div>
    );
  };

  // Date template
  const dateTemplate = (rowData: IBulkOperation) => {
    if (!rowData.createdAt) return "-";
    try {
      return new Date(rowData.createdAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  // Expandable row for errors
  const errorRowExpansionTemplate = (rowData: IBulkOperation) => {
    let parsedErrors: IBulkValidationError[] = [];
    if (typeof rowData.errorDetails === "string") {
      try {
        const parsed = JSON.parse(rowData.errorDetails);
        parsedErrors = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Fallback for non-JSON string
        parsedErrors = [{ error: rowData.errorDetails } as any];
      }
    } else if (Array.isArray(rowData.errorDetails)) {
      parsedErrors = rowData.errorDetails;
    } else if (rowData.errorDetails) {
      parsedErrors = [rowData.errorDetails as any];
    }

    if (!parsedErrors || parsedErrors.length === 0) {
      return <div className="p-3 text-600">No hay errores</div>;
    }

    return (
      <div className="p-3">
        <h5>Detalles de errores ({parsedErrors.length})</h5>
        <DataTable value={parsedErrors} size="small" scrollable>
          <Column field="rowNumber" header="Fila" style={{ width: "60px" }} />
          <Column field="field" header="Campo" style={{ width: "100px" }} />
          <Column field="error" header="Mensaje" style={{ minWidth: "200px" }} />
          <Column
            field="value"
            header="Valor"
            style={{ width: "150px" }}
            body={(rowData: IBulkValidationError) => (
              <code className="text-600 text-sm">
                {String(rowData.value).substring(0, 30)}
              </code>
            )}
          />
        </DataTable>
      </div>
    );
  };

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Header */}
      <Card
        header={
          <div className="flex align-items-center justify-content-between w-full p-3">
            <h3 className="m-0">Historial de operaciones</h3>
            <Button
              icon="pi pi-refresh"
              rounded
              text
              onClick={() => loadOperations()}
              loading={loading}
              title="Recargar"
            />
          </div>
        }
      >

        {/* Operations Table */}
        <DataTable
          value={operations}
          {...({
            expandedRows,
            onExpandedRowsChange: (e: any) => setExpandedRows(e.value),
            rowExpansionTemplate: errorRowExpansionTemplate,
          } as any)}
          dataKey="id"
          loading={loading}
          emptyMessage="Sin operaciones"
          scrollable
          responsiveLayout="scroll"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} operaciones"
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            field="operationType"
            header="Tipo"
            style={{ width: "100px" }}
            body={typeTemplate}
          />
          <Column
            field="status"
            header="Estado"
            style={{ width: "100px" }}
            body={statusTemplate}
          />
          <Column
            field="fileName"
            header="Archivo"
            style={{ width: "150px" }}
            body={(rowData) => rowData.fileName || "-"}
          />
          <Column
            field="totalRecords"
            header="Total"
            style={{ width: "70px" }}
          />
          <Column
            field="summary"
            header="Resumen"
            style={{ width: "200px" }}
            body={summaryTemplate}
          />
          <Column
            field="createdAt"
            header="Fecha"
            style={{ width: "160px" }}
            body={dateTemplate}
          />
          <Column
            field="createdBy"
            header="Usuario"
            style={{ width: "120px" }}
            body={(rowData) => rowData.createdBy || "-"}
          />
          <Column
            field="actions"
            header="Acciones"
            style={{ width: "100px" }}
            body={actionTemplate}
          />
        </DataTable>
      </Card>

      {/* Details Dialog */}
      <Dialog
        visible={showDetails}
        onHide={() => setShowDetails(false)}
        header="Detalles de la operación"
        modal
        style={{ width: "90vw" }}
        maximizable
      >
        {selectedOperation && (
          <div className="flex flex-column gap-4">
            {/* Operation Info */}
            <div className="grid">
              <div className="col-12 md:col-6 lg:col-3">
                <div className="mb-2">
                  <strong>Tipo:</strong>
                </div>
                <div>{typeTemplate(selectedOperation)}</div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="mb-2">
                  <strong>Estado:</strong>
                </div>
                <div>{statusTemplate(selectedOperation)}</div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="mb-2">
                  <strong>Archivo:</strong>
                </div>
                <div>{selectedOperation.fileName || "-"}</div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="mb-2">
                  <strong>Fecha:</strong>
                </div>
                <div>{dateTemplate(selectedOperation)}</div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="grid">
              <div className="col-12 md:col-6 lg:col-3">
                <Card className="bg-green-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {selectedOperation.processedRecords || 0}
                    </div>
                    <div className="text-600 text-sm mt-1">Procesados</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <Card className="bg-red-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {selectedOperation.errorRecords || 0}
                    </div>
                    <div className="text-600 text-sm mt-1">Errores</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <Card className="bg-yellow-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {Math.max(
                        0,
                        (selectedOperation.totalRecords || 0) -
                          ((selectedOperation.processedRecords || 0) +
                            (selectedOperation.errorRecords || 0)),
                      )}
                    </div>
                    <div className="text-600 text-sm mt-1">Omitidos</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <Card className="bg-blue-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedOperation.totalRecords || 0}
                    </div>
                    <div className="text-600 text-sm mt-1">Total</div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Error Details if any */}
            {(() => {
              let parsedSelectedErrors: IBulkValidationError[] = [];
              if (typeof selectedOperation.errorDetails === "string") {
                try {
                  const parsed = JSON.parse(selectedOperation.errorDetails);
                  parsedSelectedErrors = Array.isArray(parsed)
                    ? parsed
                    : [parsed];
                } catch (e) {
                  parsedSelectedErrors = [
                    { error: selectedOperation.errorDetails } as any,
                  ];
                }
              } else if (Array.isArray(selectedOperation.errorDetails)) {
                parsedSelectedErrors = selectedOperation.errorDetails;
              } else if (selectedOperation.errorDetails) {
                parsedSelectedErrors = [selectedOperation.errorDetails as any];
              }

              if (parsedSelectedErrors.length > 0) {
                return (
                  <div>
                    <h5>Detalles de errores ({parsedSelectedErrors.length})</h5>
                    <DataTable
                      value={parsedSelectedErrors}
                      scrollable
                      size="small"
                    >
                      <Column
                        field="rowNumber"
                        header="Fila"
                        style={{ width: "60px" }}
                      />
                      <Column
                        field="field"
                        header="Campo"
                        style={{ width: "100px" }}
                      />
                      <Column field="error" header="Mensaje" style={{ minWidth: "200px" }} />
                      <Column
                        field="value"
                        header="Valor"
                        style={{ width: "150px" }}
                        body={(rowData: IBulkValidationError) => (
                          <code className="text-600 text-sm">
                            {String(rowData.value).substring(0, 30)}
                          </code>
                        )}
                      />
                    </DataTable>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-content-end">
              <Button label="Cerrar" onClick={() => setShowDetails(false)} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default BulkHistory;
