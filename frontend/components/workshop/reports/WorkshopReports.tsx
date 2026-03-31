"use client";
import React, { useState, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { motion } from "framer-motion";
import reportService from "@/app/api/workshop/reportService";
import { handleFormError } from "@/utils/errorHandlers";
import ReportSummaryCards from "./ReportSummaryCards";

const REPORT_TABS = [
  { id: "service-orders", label: "Órdenes", icon: "pi pi-file-edit" },
  { id: "productivity", label: "Productividad", icon: "pi pi-users" },
  { id: "efficiency", label: "Eficiencia", icon: "pi pi-chart-line" },
  { id: "materials", label: "Materiales", icon: "pi pi-box" },
  { id: "warranty", label: "Garantías", icon: "pi pi-shield" },
  { id: "financial", label: "Financiero", icon: "pi pi-dollar" },
];

const fmt = (v?: number | null) =>
  v != null
    ? v.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
    : "—";

export default function WorkshopReports() {
  const toast = useRef<Toast>(null);
  const dt = useRef<DataTable<any>>(null);

  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState(0);

  const currentTabId = REPORT_TABS[activeTab]?.id ?? "service-orders";

  const loadReport = async (tabId: string) => {
    if (!startDate || !endDate) {
      toast.current?.show({
        severity: "warn",
        summary: "Rango requerido",
        detail: "Selecciona fechas de inicio y fin.",
        life: 3000,
      });
      return;
    }
    setLoading(true);
    try {
      const filters = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      let res: any;
      switch (tabId) {
        case "service-orders":
          res = await reportService.getServiceOrders(filters);
          break;
        case "productivity":
          res = await reportService.getProductivity(filters);
          break;
        case "efficiency":
          res = await reportService.getEfficiency(filters);
          break;
        case "materials":
          res = await reportService.getMaterials(filters);
          break;
        case "warranty":
          res = await reportService.getWarranty(filters);
          break;
        case "financial":
          res = await reportService.getFinancial(filters);
          break;
        default:
          res = await reportService.getAll(filters);
      }
      setReportData((prev) => ({ ...prev, [tabId]: res.data }));
    } catch (error) {
      handleFormError(error, toast.current!);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    const tabId = REPORT_TABS[index]?.id;
    if (tabId && !reportData[tabId]) {
      loadReport(tabId);
    }
  };

  const handleGenerate = () => {
    setReportData({});
    loadReport(currentTabId);
  };

  const exportCSV = () => {
    dt.current?.exportCSV();
  };

  // Build table rows from byStatus or byType maps
  const buildStatusRows = (map?: Record<string, number>) => {
    if (!map) return [];
    return Object.entries(map).map(([key, count]) => ({ key, count }));
  };

  const currentData = reportData[currentTabId];

  return (
    <motion.div
      className="p-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex align-items-center gap-2 mb-4">
        <i className="pi pi-chart-bar text-primary text-2xl" />
        <h2 className="text-2xl font-bold text-900 m-0">Reportes del Taller</h2>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 align-items-end">
          <div className="flex flex-column gap-1">
            <label className="text-900 font-medium text-sm">Fecha inicio</label>
            <Calendar
              value={startDate}
              onChange={(e) => setStartDate(e.value as Date | null)}
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div className="flex flex-column gap-1">
            <label className="text-900 font-medium text-sm">Fecha fin</label>
            <Calendar
              value={endDate}
              onChange={(e) => setEndDate(e.value as Date | null)}
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="DD/MM/AAAA"
            />
          </div>
          <Button
            label="Generar reporte"
            icon="pi pi-refresh"
            onClick={handleGenerate}
            loading={loading}
          />
          {currentData && (
            <Button
              label="Exportar CSV"
              icon="pi pi-download"
              outlined
              onClick={exportCSV}
            />
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="card">
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => handleTabChange(e.index)}
        >
          {REPORT_TABS.map((tab) => (
            <TabPanel
              key={tab.id}
              header={tab.label}
              leftIcon={`${tab.icon} mr-2`}
            >
              {loading && activeTab === REPORT_TABS.indexOf(tab) ? (
                <div className="flex justify-content-center py-6">
                  <ProgressSpinner style={{ width: 50, height: 50 }} />
                </div>
              ) : !reportData[tab.id] ? (
                <div className="py-6 text-center text-500">
                  <i className="pi pi-chart-bar text-4xl mb-3 block" />
                  <p>
                    Selecciona un rango de fechas y presiona{" "}
                    <strong>Generar reporte</strong>.
                  </p>
                </div>
              ) : reportData[tab.id]?.error ? (
                <Message
                  severity="error"
                  text={`Error: ${reportData[tab.id].error}`}
                  className="w-full"
                />
              ) : (
                <div>
                  {/* Summary KPI cards */}
                  <ReportSummaryCards
                    type={tab.id}
                    data={reportData[tab.id]}
                  />

                  {/* Generated at */}
                  <div className="text-500 text-sm mb-3">
                    <i className="pi pi-clock mr-1" />
                    Generado:{" "}
                    {reportData[tab.id]?.generatedAt
                      ? new Date(
                          reportData[tab.id].generatedAt
                        ).toLocaleString("es-MX")
                      : "—"}
                  </div>

                  {/* byStatus / byType breakdown table */}
                  {(reportData[tab.id]?.statistics?.byStatus ||
                    reportData[tab.id]?.statistics?.byType) && (
                    <DataTable
                      ref={dt}
                      value={buildStatusRows(
                        reportData[tab.id]?.statistics?.byStatus ??
                          reportData[tab.id]?.statistics?.byType
                      )}
                      size="small"
                      exportFilename={`reporte-${tab.id}`}
                      className="mb-3"
                    >
                      <Column
                        field="key"
                        header="Estado / Tipo"
                        body={(row) => (
                          <Tag value={row.key} severity="info" rounded />
                        )}
                      />
                      <Column field="count" header="Cantidad" sortable />
                    </DataTable>
                  )}

                  {/* Financial breakdown */}
                  {tab.id === "financial" &&
                    reportData[tab.id]?.statistics && (
                      <DataTable
                        ref={dt}
                        value={[
                          {
                            concepto: "Mano de obra",
                            monto: fmt(
                              reportData[tab.id].statistics.laborRevenue
                            ),
                          },
                          {
                            concepto: "Repuestos",
                            monto: fmt(
                              reportData[tab.id].statistics.partsRevenue
                            ),
                          },
                          {
                            concepto: "Total",
                            monto: fmt(
                              reportData[tab.id].statistics.totalRevenue
                            ),
                          },
                        ]}
                        size="small"
                        exportFilename="reporte-financiero"
                      >
                        <Column field="concepto" header="Concepto" />
                        <Column field="monto" header="Monto" />
                      </DataTable>
                    )}
                </div>
              )}
            </TabPanel>
          ))}
        </TabView>
      </div>
    </motion.div>
  );
}
