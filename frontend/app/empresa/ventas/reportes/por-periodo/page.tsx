"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";
import ReportsTable from "@/modules/inventory/reports/components/ReportsTable";
import salesReportService, {
  SalesByPeriodItem,
  SalesByPeriodSummary,
  CurrencyAmount,
} from "@/modules/sales/dashboard/services/reportService";
import { ReportFormat } from "@/modules/inventory/reports/services/reportService";
import MultiCurrencyCell from "@/components/common/MultiCurrencyCell";
import { formatCurrency as fmtCurrency } from "@/utils/currencyFormat";

const GRANULARITY_OPTIONS = [
  { label: "Por Día", value: "day" },
  { label: "Por Semana", value: "week" },
  { label: "Por Mes", value: "month" },
];

const SalesByPeriodPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<SalesByPeriodItem[]>([]);
  const [summary, setSummary] = useState<SalesByPeriodSummary | null>(null);
  const [fxRates, setFxRates] = useState<CurrencyAmount>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [filters, setFilters] = useState<{
    dateFrom?: Date | null;
    dateTo?: Date | null;
    granularity: "day" | "week" | "month";
  }>({ granularity: "day" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: rows,
        granularity: filters.granularity,
      };
      if (filters.dateFrom)
        params.dateFrom = filters.dateFrom.toISOString().split("T")[0];
      if (filters.dateTo)
        params.dateTo = filters.dateTo.toISOString().split("T")[0];

      const response = await salesReportService.getByPeriod(params);
      setItems(response.data);
      setTotalRecords(response.meta?.total ?? 0);
      setSummary(response.summary ?? null);
      setFxRates(response.fxRates ?? {});
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las ventas por período",
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
    { field: "period", header: "Período", sortable: true, width: "16%" },
    {
      field: "invoiceCount",
      header: "Facturas",
      sortable: true,
      width: "8%",
      body: (row: SalesByPeriodItem) => (
        <span className="font-semibold">{row.invoiceCount}</span>
      ),
    },
    {
      field: "subtotalUSD",
      header: "Subtotal",
      sortable: true,
      width: "19%",
      body: (row: SalesByPeriodItem) => (
        <MultiCurrencyCell
          amount={row.subtotal}
          amountUSD={row.subtotalUSD}
          highlight="usd"
        />
      ),
    },
    {
      field: "taxAmountUSD",
      header: "IVA",
      sortable: true,
      width: "15%",
      body: (row: SalesByPeriodItem) => (
        <MultiCurrencyCell
          amount={row.taxAmount}
          amountUSD={row.taxAmountUSD}
          highlight="usd"
        />
      ),
    },
    {
      field: "igtfAmountUSD",
      header: "IGTF",
      sortable: true,
      width: "13%",
      body: (row: SalesByPeriodItem) => (
        <MultiCurrencyCell
          amount={row.igtfAmount}
          amountUSD={row.igtfAmountUSD}
          highlight="usd"
        />
      ),
    },
    {
      field: "totalUSD",
      header: "Total",
      sortable: true,
      width: "19%",
      body: (row: SalesByPeriodItem) => (
        <MultiCurrencyCell
          amount={row.total}
          amountUSD={row.totalUSD}
          highlight="primary"
        />
      ),
    },
  ], []);

  const summaryCards = [
    {
      label: "Períodos",
      value: summary?.totalPeriods ?? 0,
      icon: "pi pi-calendar",
      color: "#3B82F6",
      bg: "#EFF6FF",
      isCount: true,
    },
    {
      label: "Total Facturas",
      value: summary?.totalInvoices ?? 0,
      icon: "pi pi-file",
      color: "#22C55E",
      bg: "#F0FDF4",
      isCount: true,
    },
    {
      label: "Ingresos Totales (USD)",
      value: summary?.totalRevenueUSD ?? 0,
      icon: "pi pi-dollar",
      color: "#F97316",
      bg: "#FFF7ED",
    },
    {
      label: "Promedio / Período (USD)",
      value: summary?.avgRevenuePerPeriodUSD ?? 0,
      icon: "pi pi-chart-bar",
      color: "#8B5CF6",
      bg: "#F5F3FF",
    },
  ];

  return (
    <>
      <Toast ref={toast} />

      <div className="grid mb-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex align-items-center gap-3">
                <div
                  className="flex align-items-center justify-content-center border-round"
                  style={{ width: 48, height: 48, background: card.bg }}
                >
                  <i
                    className={card.icon}
                    style={{ fontSize: "1.4rem", color: card.color }}
                  />
                </div>
                <div>
                  <p className="text-500 text-sm m-0">{card.label}</p>
                  {loading ? (
                    <Skeleton width="4rem" height="1.5rem" />
                  ) : (
                    <p
                      className="font-bold text-2xl m-0"
                      style={{ color: card.color }}
                    >
                      {card.isCount
                        ? card.value
                        : fmtCurrency(card.value, "USD")}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {Object.keys(fxRates).length > 0 && (
        <div className="text-xs text-500 mb-2">
          Tasas usadas:{" "}
          {Object.entries(fxRates)
            .map(([c, r]) => `${c} ${r.toFixed(4)}/USD`)
            .join(" · ")}
        </div>
      )}

      {loading && items.length === 0 ? (
        <Card title="Ventas por Período">
          <Skeleton height="300px" />
        </Card>
      ) : (
        <ReportsTable
          title="Ventas por Período"
          data={items}
          columns={columns}
          loading={loading}
          totalRecords={totalRecords}
          page={page}
          rows={rows}
          reportType="sales-by-period"
          onPageChange={(e) => {
            setPage((e.page ?? 0) + 1);
            setRows(e.rows ?? 20);
          }}
          showDateFilter={true}
          showWarehouseFilter={false}
          showSearchFilter={false}
          customFilters={
            <div className="flex flex-column gap-1">
              <label className="text-sm font-medium">Granularidad</label>
              <Dropdown
                value={filters.granularity}
                options={GRANULARITY_OPTIONS}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, granularity: e.value }));
                  setPage(1);
                }}
                className="p-inputtext-sm"
                style={{ width: "12rem" }}
              />
            </div>
          }
          filters={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
          onFiltersChange={(f) => {
            setFilters((prev) => ({ ...prev, ...f }));
            setPage(1);
          }}
          onExport={(format, exportFilters) =>
            salesReportService.download("by-period", format as ReportFormat, {
              ...exportFilters,
              granularity: filters.granularity,
            })
          }
        />
      )}
    </>
  );
};

export default SalesByPeriodPage;
