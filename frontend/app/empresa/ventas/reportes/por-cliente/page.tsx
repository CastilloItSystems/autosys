"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import salesReportService, {
  SalesByCustomerItem,
} from "@/app/api/sales/reportService";
import { ReportFormat } from "@/app/api/inventory/reportService";

const SalesByCustomerPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<SalesByCustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [filters, setFilters] = useState<{
    search?: string;
    dateFrom?: Date | null;
    dateTo?: Date | null;
  }>({});

  useEffect(() => {
    loadData();
  }, [page, rows, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: rows };
      if (filters.search) params.search = filters.search;
      if (filters.dateFrom)
        params.dateFrom = filters.dateFrom.toISOString().split("T")[0];
      if (filters.dateTo)
        params.dateTo = filters.dateTo.toISOString().split("T")[0];

      const response = await salesReportService.getByCustomer(params);
      setItems(response.data);
      setTotalRecords(response.meta?.total ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las ventas por cliente",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const columns = [
    {
      field: "customerName",
      header: "Cliente",
      sortable: true,
      width: "22%",
      body: (row: SalesByCustomerItem) => (
        <span className="font-semibold">{row.customerName}</span>
      ),
    },
    { field: "taxId", header: "RIF / Cédula", sortable: true, width: "14%" },
    {
      field: "customerType",
      header: "Tipo",
      sortable: true,
      width: "10%",
      body: (row: SalesByCustomerItem) => (
        <Tag
          value={row.customerType === "COMPANY" ? "Empresa" : "Natural"}
          severity={row.customerType === "COMPANY" ? "info" : "success"}
        />
      ),
    },
    {
      field: "invoiceCount",
      header: "Facturas",
      sortable: true,
      width: "9%",
      body: (row: SalesByCustomerItem) => (
        <span className="font-semibold">{row.invoiceCount}</span>
      ),
    },
    {
      field: "totalRevenue",
      header: "Total Facturado",
      sortable: true,
      width: "16%",
      body: (row: SalesByCustomerItem) => (
        <span className="font-bold text-primary">
          {formatCurrency(row.totalRevenue)}
        </span>
      ),
    },
    {
      field: "avgTicket",
      header: "Ticket Promedio",
      sortable: true,
      width: "15%",
      body: (row: SalesByCustomerItem) => formatCurrency(row.avgTicket),
    },
    {
      field: "lastInvoiceDate",
      header: "Última Factura",
      sortable: true,
      width: "14%",
      body: (row: SalesByCustomerItem) =>
        row.lastInvoiceDate
          ? new Date(row.lastInvoiceDate).toLocaleDateString("es-VE")
          : "—",
    },
  ];

  return (
    <>
      <Toast ref={toast} />
      {loading && items.length === 0 ? (
        <Card title="Ventas por Cliente">
          <Skeleton height="300px" />
        </Card>
      ) : (
        <ReportsTable
          title="Ventas por Cliente"
          data={items}
          columns={columns}
          loading={loading}
          totalRecords={totalRecords}
          page={page}
          rows={rows}
          reportType="sales-by-customer"
          onPageChange={(e) => {
            setPage((e.page ?? 0) + 1);
            setRows(e.rows ?? 20);
          }}
          showDateFilter={true}
          showWarehouseFilter={false}
          showSearchFilter={true}
          filters={filters}
          onFiltersChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          onExport={(format, exportFilters) =>
            salesReportService.download(
              "by-customer",
              format as ReportFormat,
              exportFilters,
            )
          }
        />
      )}
    </>
  );
};

export default SalesByCustomerPage;
