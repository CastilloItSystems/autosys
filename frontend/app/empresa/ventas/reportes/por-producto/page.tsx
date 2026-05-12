"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/modules/inventory/reports/components/ReportsTable";
import salesReportService, {
  SalesByProductItem,
  CurrencyAmount,
} from "@/modules/sales/dashboard/services/reportService";
import { ReportFormat } from "@/modules/inventory/reports/services/reportService";
import MultiCurrencyCell from "@/components/common/MultiCurrencyCell";
import { formatBreakdownLine } from "@/utils/currencyFormat";

const SalesByProductPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<SalesByProductItem[]>([]);
  const [fxRates, setFxRates] = useState<CurrencyAmount>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [filters, setFilters] = useState<{
    search?: string;
    dateFrom?: Date | null;
    dateTo?: Date | null;
  }>({});

  const loadData = useCallback(async () => {
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
      setFxRates(response.fxRates ?? {});
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
  }, [page, rows, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = useMemo(() => [
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
      sortable: false,
      width: "16%",
      body: (row: SalesByProductItem) => (
        <span className="text-sm" title={formatBreakdownLine(row.avgUnitPrice)}>
          {formatBreakdownLine(row.avgUnitPrice)}
        </span>
      ),
    },
    {
      field: "totalDiscountUSD",
      header: "Descuentos",
      sortable: true,
      width: "14%",
      body: (row: SalesByProductItem) => (
        <MultiCurrencyCell
          amount={row.totalDiscount}
          amountUSD={row.totalDiscountUSD}
          highlight="usd"
        />
      ),
    },
    {
      field: "totalRevenueUSD",
      header: "Revenue Total",
      sortable: true,
      width: "17%",
      body: (row: SalesByProductItem) => (
        <MultiCurrencyCell
          amount={row.totalRevenue}
          amountUSD={row.totalRevenueUSD}
          highlight="primary"
        />
      ),
    },
  ], []);

  return (
    <>
      <Toast ref={toast} />
      {Object.keys(fxRates).length > 0 && (
        <div className="text-xs text-500 mb-2">
          Tasas usadas:{" "}
          {Object.entries(fxRates)
            .map(([c, r]) => `${c} ${r.toFixed(4)}/USD`)
            .join(" · ")}
        </div>
      )}
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
