'use client';

import { useState, useRef, ReactNode } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { ReportFormat, downloadReport } from '@/app/api/inventory/reportService';
import { format } from 'date-fns';

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
  reportType: 'stock-value' | 'movements' | 'abc' | 'turnover' | 'low-stock' | 'dead-stock';
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
}: ReportsTableProps) => {
  const toast = useRef<Toast>(null);
  const [exporting, setExporting] = useState<ReportFormat | null>(null);

  const handleExport = async (format: ReportFormat) => {
    setExporting(format);
    try {
      const exportFilters: Record<string, any> = {};

      if (filters.dateFrom) {
        exportFilters.dateFrom = format('yyyy-MM-dd', filters.dateFrom);
      }
      if (filters.dateTo) {
        exportFilters.dateTo = format('yyyy-MM-dd', filters.dateTo);
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

      await downloadReport(reportType, format, exportFilters);

      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `Reporte exportado a ${format.toUpperCase()}`,
        life: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: `No se pudo exportar a ${format.toUpperCase()}`,
        life: 3000,
      });
    } finally {
      setExporting(null);
    }
  };

  const header = (
    <Toolbar
      className="mb-4"
      left={
        <div className="flex gap-3 items-end w-full flex-wrap">
          {showSearchFilter && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Búsqueda</label>
              <InputText
                placeholder="Buscar..."
                value={filters.search || ''}
                onChange={(e) =>
                  onFiltersChange?.({ ...filters, search: e.target.value })
                }
                className="w-48"
              />
            </div>
          )}

          {showDateFilter && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Desde</label>
                <Calendar
                  value={filters.dateFrom || null}
                  onChange={(e) =>
                    onFiltersChange?.({ ...filters, dateFrom: e.value })
                  }
                  dateFormat="dd/mm/yy"
                  showIcon
                  className="w-48"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Hasta</label>
                <Calendar
                  value={filters.dateTo || null}
                  onChange={(e) =>
                    onFiltersChange?.({ ...filters, dateTo: e.value })
                  }
                  dateFormat="dd/mm/yy"
                  showIcon
                  className="w-48"
                />
              </div>
            </>
          )}

          {showWarehouseFilter && warehouses.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Almacén</label>
              <Dropdown
                options={[{ label: 'Todos', value: '' }, ...warehouses.map((w) => ({ label: w.name, value: w.id }))]}
                value={filters.warehouseId || ''}
                onChange={(e) =>
                  onFiltersChange?.({ ...filters, warehouseId: e.value })
                }
                placeholder="Seleccionar almacén"
                className="w-48"
              />
            </div>
          )}

          {customFilters}
        </div>
      }
      right={
        <div className="flex gap-2">
          <Button
            icon="pi pi-download"
            label="CSV"
            severity="secondary"
            size="small"
            onClick={() => handleExport(ReportFormat.CSV)}
            loading={exporting === ReportFormat.CSV}
            disabled={exporting !== null || data.length === 0}
            title="Descargar en formato CSV"
          />
          <Button
            icon="pi pi-download"
            label="Excel"
            severity="secondary"
            size="small"
            onClick={() => handleExport(ReportFormat.EXCEL)}
            loading={exporting === ReportFormat.EXCEL}
            disabled={exporting !== null || data.length === 0}
            title="Descargar en formato Excel"
          />
          <Button
            icon="pi pi-download"
            label="PDF"
            severity="secondary"
            size="small"
            onClick={() => handleExport(ReportFormat.PDF)}
            loading={exporting === ReportFormat.PDF}
            disabled={exporting !== null || data.length === 0}
            title="Descargar en formato PDF"
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
          first={(page - 1) * rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          dataKey="id"
          stripedRows
          responsiveLayout="scroll"
          emptyMessage="No hay datos disponibles"
          className="w-full"
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              style={{ width: col.width || 'auto' }}
              sortable={col.sortable !== false}
            />
          ))}
        </DataTable>

        {footer && <div className="mt-4">{footer}</div>}
      </Card>
    </>
  );
};

export default ReportsTable;
