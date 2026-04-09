"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import salesReportService, {
  SalesByProductItem,
} from "@/app/api/sales/reportService";
import { ReportFormat } from "@/app/api/inventory/reportService";

const SalesByProductPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<SalesByProductItem[]>([]);
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

      const response = await salesReportService.getByProduct(params);
      setItems(response.data);
      setTotalRecords(response.meta?.total ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las ventas por producto",
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
      field: "itemName",
      header: "Producto",
      sortable: true,
      width: "25%",
      body: (row: SalesByProductItem) => (
        <span className="font-semibold">{row.itemName}</span>
      ),
    },
    { field: "sku", header: "SKU", sortable: true, width: "12%" },
    {
      field: "totalQuantity",
      header: "Cant. Vendida",
      sortable: true,
      width: "12%",
      body: (row: SalesByProductItem) => (
        <span className="font-semibold">{row.totalQuantity}</span>
      ),
    },
    {
      field: "invoiceCount",
      header: "Facturas",
      sortable: true,
      width: "9%",
      body: (row: SalesByProductItem) => row.invoiceCount,
    },
    {
      field: "avgUnitPrice",
      header: "Precio Prom.",
      sortable: true,
      width: "14%",
      body: (row: SalesByProductItem) => formatCurrency(row.avgUnitPrice),
    },
    {
      field: "totalDiscount",
      header: "Descuentos",
      sortable: true,
      width: "13%",
      body: (row: SalesByProductItem) => formatCurrency(row.totalDiscount),
    },
    {
      field: "totalRevenue",
      header: "Revenue Total",
      sortable: true,
      width: "15%",
      body: (row: SalesByProductItem) => (
        <span className="font-bold text-primary">
          {formatCurrency(row.totalRevenue)}
        </span>
      ),
    },
  ];

  return (
    <>
      <Toast ref={toast} />
      {loading && items.length === 0 ? (
        <Card title="Ventas por Producto">
          <Skeleton height="300px" />
        </Card>
      ) : (
        <ReportsTable
          title="Ventas por Producto"
          data={items}
          columns={columns}
          loading={loading}
          totalRecords={totalRecords}
          page={page}
          rows={rows}
          reportType="sales-by-product"
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
              "by-product",
              format as ReportFormat,
              exportFilters,
            )
          }
        />
      )}
    </>
  );
};

export default SalesByProductPage;
