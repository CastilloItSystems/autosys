"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import * as bulkService from "@/app/api/inventory/bulkService";
import type {
  IBulkOperation,
  IBulkValidationError,
} from "@/app/api/inventory/bulkService";

export const BulkHistory = () => {
  const toast = useRef<Toast>(null);

  const [operations, setOperations] = useState<IBulkOperation[]>([]);
  const [selectedOperation, setSelectedOperation] =
    useState<IBulkOperation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({});

  // Load operations on mount
  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    try {
      setLoading(true);
      const response = await bulkService.getOperations();
      setOperations(response || []);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Error al cargar historial",
      });
    } finally {
      setLoading(false);
    }
  };

  // View operation details
  const handleViewDetails = async (operation: IBulkOperation) => {
    try {
      if (operation.id) {
        const details = await bulkService.getOperation(operation.id);
        setSelectedOperation(details as IBulkOperation);
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
      import: { severity: "info", label: "Importación" },
      export: { severity: "success", label: "Exportación" },
      update: { severity: "warning", label: "Actualización" },
      delete: { severity: "danger", label: "Eliminación" },
    };

    const config = typeConfig[rowData.type || ""] || {
      severity: "secondary",
      label: rowData.type,
    };

    return <Tag value={config.label} severity={config.severity as any} />;
  };

  // Status badge
  const statusTemplate = (rowData: IBulkOperation) => {
    const statusConfig: Record<string, { severity: string; label: string }> = {
      pending: { severity: "warning", label: "Pendiente" },
      processing: { severity: "info", label: "Procesando" },
      completed: { severity: "success", label: "Completado" },
      failed: { severity: "danger", label: "Fallido" },
    };

    const config = statusConfig[rowData.status || ""] || {
      severity: "secondary",
      label: rowData.status,
    };

    return <Tag value={config.label} severity={config.severity as any} />;
  };

  // Summary template
  const summaryTemplate = (rowData: IBulkOperation) => {
    return (
      <div className="text-sm">
        <div>
          <strong>Exitosos:</strong> {rowData.successCount || 0}
        </div>
        <div>
          <strong>Errores:</strong> {rowData.failureCount || 0}
        </div>
        <div>
          <strong>Omitidos:</strong> {rowData.skippedCount || 0}
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
    if (!rowData.errorDetails || rowData.errorDetails.length === 0) {
      return <div className="p-3 text-600">No hay errores</div>;
    }

    return (
      <div className="p-3">
        <h5>Detalles de errores ({rowData.errorDetails.length})</h5>
        <DataTable value={rowData.errorDetails} size="small" scrollable>
          <Column field="row" header="Fila" style={{ width: "60px" }} />
          <Column field="field" header="Campo" style={{ width: "100px" }} />
          <Column field="message" header="Mensaje" flex={1} />
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
      <Card>
        <template slot="header">
          <div className="flex align-items-center justify-content-between w-full">
            <h3 className="m-0">Historial de operaciones</h3>
            <Button
              icon="pi pi-refresh"
              rounded
              text
              onClick={loadOperations}
              loading={loading}
              title="Recargar"
            />
          </div>
        </template>

        {/* Operations Table */}
        <DataTable
          value={operations}
          expandedRows={expandedRows}
          onExpandedRowsChange={(e) => setExpandedRows(e.value)}
          rowExpansionTemplate={errorRowExpansionTemplate}
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
            field="type"
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
            field="user"
            header="Usuario"
            style={{ width: "120px" }}
            body={(rowData) => rowData.user || "-"}
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
                <div>{selectedOperation.type || "-"}</div>
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
                      {selectedOperation.successCount || 0}
                    </div>
                    <div className="text-600 text-sm mt-1">Exitosos</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <Card className="bg-red-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {selectedOperation.failureCount || 0}
                    </div>
                    <div className="text-600 text-sm mt-1">Errores</div>
                  </div>
                </Card>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <Card className="bg-yellow-50 mb-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {selectedOperation.skippedCount || 0}
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
            {selectedOperation.errorDetails &&
              selectedOperation.errorDetails.length > 0 && (
                <div>
                  <h5>
                    Detalles de errores ({selectedOperation.errorDetails.length}
                    )
                  </h5>
                  <DataTable
                    value={selectedOperation.errorDetails}
                    scrollable
                    size="small"
                  >
                    <Column
                      field="row"
                      header="Fila"
                      style={{ width: "60px" }}
                    />
                    <Column
                      field="field"
                      header="Campo"
                      style={{ width: "100px" }}
                    />
                    <Column field="message" header="Mensaje" flex={1} />
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
              )}

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
