"use client";

import { useState, useRef, ReactNode } from "react";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ReportFormat } from "@/app/api/inventory/reportService";
import reportService from "@/app/api/inventory/reportService";
import { format as formatDate } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

interface ReportsTableProps {
  title: string;
  data: any[];
  columns: Array<{
    field: string;
    header: string;
    body?: (rowData: any) => ReactNode;
    width?: string;
    sortable?: boolean;
  }>;
  loading: boolean;
  totalRecords: number;
  page: number;
  rows: number;
  reportType:
    | "stock-value"
    | "movements"
    | "abc"
    | "turnover"
    | "low-stock"
    | "dead-stock"
    | "sales-by-period"
    | "sales-by-customer"
    | "sales-by-product"
    | "sales-pending-invoices";
  onPageChange: (e: DataTablePageEvent) => void;
  filters?: {
    search?: string;
    dateFrom?: Date | null;
    dateTo?: Date | null;
    warehouseId?: string;
    [key: string]: any;
  };
  onFiltersChange?: (filters: any) => void;
  warehouses?: Array<{ id: string; name: string }>;
  showDateFilter?: boolean;
  showWarehouseFilter?: boolean;
  showSearchFilter?: boolean;
  customFilters?: ReactNode;
  footer?: ReactNode;
  /** Override the default export handler (e.g. for sales reports that use a different endpoint) */
  onExport?: (format: ReportFormat, filters: Record<string, any>) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ReportsTable = ({
  title,
  data,
  columns,
  loading,
  totalRecords,
  page,
  rows,
  reportType,
  onPageChange,
  filters = {},
  onFiltersChange,
  warehouses = [],
  showDateFilter = false,
  showWarehouseFilter = false,
  showSearchFilter = false,
  customFilters,
  footer,
  onExport,
}: ReportsTableProps) => {
  const toast = useRef<Toast>(null);
  const [exporting, setExporting] = useState<ReportFormat | null>(null);

  const handleExport = async (format: ReportFormat) => {
    setExporting(format);
    try {
      const exportFilters: Record<string, any> = {};

      if (filters.dateFrom) {
        exportFilters.dateFrom = formatDate(filters.dateFrom, "yyyy-MM-dd");
      }
      if (filters.dateTo) {
        exportFilters.dateTo = formatDate(filters.dateTo, "yyyy-MM-dd");
      }
      if (filters.warehouseId) {
        exportFilters.warehouseId = filters.warehouseId;
      }
      if (filters.search) {
        exportFilters.search = filters.search;
      }
      if (filters.type) {
        exportFilters.type = filters.type;
      }
      if (filters.classification) {
        exportFilters.classification = filters.classification;
      }

      if (onExport) {
        await onExport(format, exportFilters);
      } else {
        await reportService.download(reportType as any, format, exportFilters);
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Reporte exportado a ${format.toUpperCase()}`,
        life: 3000,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `No se pudo exportar a ${format.toUpperCase()}`,
        life: 3000,
      });
    } finally {
      setExporting(null);
    }
  };

  const header = (
    <Toolbar
      className="mb-3"
      left={
        <div className="flex align-items-end gap-3 flex-wrap">
          {showSearchFilter && (
            <div className="flex flex-column gap-1">
              <label className="text-sm font-medium">Búsqueda</label>
              <InputText
                placeholder="Buscar..."
                value={filters.search || ""}
                onChange={(e) =>
                  onFiltersChange?.({ ...filters, search: e.target.value })
                }
                style={{ width: "12rem" }}
              />
            </div>
          )}

          {showDateFilter && (
            <>
              <div className="flex flex-column gap-1">
                <label className="text-sm font-medium">Desde</label>
                <Calendar
                  value={filters.dateFrom || null}
                  onChange={(e) =>
                    onFiltersChange?.({ ...filters, dateFrom: e.value })
                  }
                  dateFormat="dd/mm/yy"
                  showIcon
                  style={{ width: "12rem" }}
                />
              </div>

              <div className="flex flex-column gap-1">
                <label className="text-sm font-medium">Hasta</label>
                <Calendar
                  value={filters.dateTo || null}
                  onChange={(e) =>
                    onFiltersChange?.({ ...filters, dateTo: e.value })
                  }
                  dateFormat="dd/mm/yy"
                  showIcon
                  style={{ width: "12rem" }}
                />
              </div>
            </>
          )}

          {showWarehouseFilter && warehouses.length > 0 && (
            <div className="flex flex-column gap-1">
              <label className="text-sm font-medium">Almacén</label>
              <Dropdown
                options={[
                  { label: "Todos", value: "" },
                  ...warehouses.map((w) => ({ label: w.name, value: w.id })),
                ]}
                value={filters.warehouseId || ""}
                onChange={(e) =>
                  onFiltersChange?.({ ...filters, warehouseId: e.value })
                }
                placeholder="Seleccionar almacén"
                style={{ width: "12rem" }}
              />
            </div>
          )}

          {customFilters}
        </div>
      }
      right={
        <div className="flex gap-2 align-items-center">
          {exporting && (
            <span className="text-500 text-sm">
              <i className="pi pi-spin pi-spinner mr-1" />
              Generando {exporting.toUpperCase()}...
            </span>
          )}
          <Button
            icon={exporting === ReportFormat.CSV ? "pi pi-spin pi-spinner" : "pi pi-file"}
            label="CSV"
            severity="secondary"
            size="small"
            outlined
            onClick={() => handleExport(ReportFormat.CSV)}
            disabled={exporting !== null || data.length === 0}
            tooltip="Descargar en formato CSV"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon={exporting === ReportFormat.EXCEL ? "pi pi-spin pi-spinner" : "pi pi-file-excel"}
            label="Excel"
            severity="success"
            size="small"
            outlined
            onClick={() => handleExport(ReportFormat.EXCEL)}
            disabled={exporting !== null || data.length === 0}
            tooltip="Descargar en formato Excel"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon={exporting === ReportFormat.PDF ? "pi pi-spin pi-spinner" : "pi pi-file-pdf"}
            label="PDF"
            severity="danger"
            size="small"
            outlined
            onClick={() => handleExport(ReportFormat.PDF)}
            disabled={exporting !== null || data.length === 0}
            tooltip="Descargar en formato PDF"
            tooltipOptions={{ position: "top" }}
          />
        </div>
      }
    />
  );

  return (
    <>
      <Toast ref={toast} />
      <Card title={title} className="w-full">
        {header}

        <DataTable
          value={data}
          loading={loading}
          paginator
          rows={rows}
          rowsPerPageOptions={[10, 20, 50]}
          first={(page - 1) * rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          dataKey="id"
          stripedRows
          scrollable
          size="small"
          emptyMessage={
            <div className="flex flex-column align-items-center py-5 text-500 gap-2">
              <i className="pi pi-inbox text-4xl" />
              <span className="text-lg">No hay datos disponibles</span>
              <span className="text-sm">Ajusta los filtros o verifica los datos de inventario</span>
            </div>
          }
          className="w-full"
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              style={{ width: col.width || "auto" }}
              sortable={col.sortable !== false}
            />
          ))}
        </DataTable>

        {footer && <div className="mt-3">{footer}</div>}
      </Card>
    </>
  );
};

export default ReportsTable;
