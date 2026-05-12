"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { motion } from "framer-motion";
import salesReportService, {
  PaymentMethodsReport,
} from "@/modules/sales/dashboard/services/reportService";
import MultiCurrencyCell from "@/components/common/MultiCurrencyCell";
import {
  formatCurrency as fmtCurrency,
} from "@/utils/currencyFormat";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  MOBILE_PAYMENT: "Pago Móvil",
  CHECK: "Cheque",
  CREDIT: "Crédito",
  MIXED: "Mixto",
};

const METHOD_ICONS: Record<string, string> = {
  CASH: "pi-money-bill",
  TRANSFER: "pi-send",
  CARD: "pi-credit-card",
  MOBILE_PAYMENT: "pi-mobile",
  CHECK: "pi-file",
  CREDIT: "pi-wallet",
  MIXED: "pi-sliders-h",
};

const PaymentMethodsPage = () => {
  const toast = useRef<Toast>(null);
  const [data, setData] = useState<PaymentMethodsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.dateFrom = dateFrom.toISOString().split("T")[0];
      if (dateTo) params.dateTo = dateTo.toISOString().split("T")[0];

      const response = await salesReportService.getPaymentMethods(params);
      setData(response);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los métodos de pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryCards = [
    {
      label: "Total Pagos",
      value: data?.summary.totalPayments ?? 0,
      icon: "pi pi-check-circle",
      color: "#3B82F6",
      bg: "#EFF6FF",
      isCount: true,
    },
    {
      label: "Monto Total (USD)",
      value: data?.summary.totalAmountUSD ?? 0,
      icon: "pi pi-dollar",
      color: "#22C55E",
      bg: "#F0FDF4",
    },
    {
      label: "Total IGTF (USD)",
      value: data?.summary.totalIgtfUSD ?? 0,
      icon: "pi pi-percentage",
      color: "#F97316",
      bg: "#FFF7ED",
    },
  ];

  return (
    <>
      <Toast ref={toast} />

      <div className="grid mb-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="col-12 md:col-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
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
                          : fmtCurrency(card.value as number, "USD")}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        ))}
      </div>

      {data?.fxRates && Object.keys(data.fxRates).length > 0 && (
        <div className="text-xs text-500 mb-2">
          Tasas usadas:{" "}
          {Object.entries(data.fxRates)
            .map(([c, r]) => `${c} ${r.toFixed(4)}/USD`)
            .join(" · ")}
        </div>
      )}

      <div className="grid">
        <div className="col-12 lg:col-8">
          <Card
            title="Por Método de Pago"
            subTitle={
              <div className="flex gap-2 mt-2">
                <Calendar
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.value as Date | null)}
                  placeholder="Desde"
                  showIcon
                  className="p-inputtext-sm"
                  dateFormat="dd/mm/yy"
                />
                <Calendar
                  value={dateTo}
                  onChange={(e) => setDateTo(e.value as Date | null)}
                  placeholder="Hasta"
                  showIcon
                  className="p-inputtext-sm"
                  dateFormat="dd/mm/yy"
                />
              </div>
            }
          >
            {loading ? (
              <Skeleton height="250px" />
            ) : (
              <DataTable value={data?.data ?? []} size="small" stripedRows>
                <Column
                  field="method"
                  header="Método"
                  body={(row) => (
                    <div className="flex align-items-center gap-2">
                      <i
                        className={`pi ${
                          METHOD_ICONS[row.method] ?? "pi-wallet"
                        }`}
                      />
                      <span>{METHOD_LABELS[row.method] ?? row.method}</span>
                    </div>
                  )}
                />
                <Column
                  field="count"
                  header="Cantidad"
                  body={(row) => (
                    <span className="font-semibold">{row.count}</span>
                  )}
                />
                <Column
                  field="totalAmountUSD"
                  header="Monto Total"
                  body={(row) => (
                    <MultiCurrencyCell
                      amount={row.totalAmount}
                      amountUSD={row.totalAmountUSD}
                      highlight="primary"
                    />
                  )}
                />
                <Column
                  field="percentage"
                  header="% del Total"
                  body={(row) => (
                    <Tag
                      value={`${row.percentage.toFixed(1)}%`}
                      severity={
                        row.percentage > 50
                          ? "success"
                          : row.percentage > 20
                          ? "warning"
                          : "info"
                      }
                    />
                  )}
                />
                <Column
                  field="igtfAmountUSD"
                  header="IGTF"
                  body={(row) => (
                    <MultiCurrencyCell
                      amount={row.igtfAmount}
                      amountUSD={row.igtfAmountUSD}
                      highlight="usd"
                    />
                  )}
                />
                <Column
                  field="avgAmountUSD"
                  header="Prom. por Pago (USD)"
                  body={(row) => (
                    <span className="font-semibold">
                      {fmtCurrency(row.avgAmountUSD ?? 0, "USD")}
                    </span>
                  )}
                />
              </DataTable>
            )}
          </Card>
        </div>

        <div className="col-12 lg:col-4">
          <Card title="Por Moneda">
            {loading ? (
              <Skeleton height="150px" />
            ) : (
              <DataTable value={data?.byCurrency ?? []} size="small">
                <Column
                  field="currency"
                  header="Moneda"
                  body={(row) => <Tag value={row.currency} />}
                />
                <Column field="count" header="Pagos" />
                <Column
                  field="totalAmount"
                  header="Monto"
                  body={(row) => (
                    <span className="font-semibold">
                      {fmtCurrency(row.totalAmount, row.currency)}
                    </span>
                  )}
                />
                <Column
                  field="totalAmountUSD"
                  header="≈ USD"
                  body={(row) => (
                    <span className="text-700">
                      {fmtCurrency(row.totalAmountUSD ?? 0, "USD")}
                    </span>
                  )}
                />
              </DataTable>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default PaymentMethodsPage;
