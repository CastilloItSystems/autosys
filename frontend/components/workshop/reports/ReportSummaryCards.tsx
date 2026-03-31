"use client";
import React from "react";
import KPICard from "@/components/common/KPICard";
import type {
  ServiceOrdersReport,
  ProductivityReport,
  EfficiencyReport,
  MaterialsReport,
  WarrantyReport,
  FinancialReport,
} from "@/libs/interfaces/workshop";

const fmt = (v?: number | null) =>
  v != null
    ? v.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
    : "—";

const fmtNum = (v?: number | null) =>
  v != null ? v.toLocaleString("es-MX") : "—";

const fmtPct = (v?: number | null) =>
  v != null ? `${v.toFixed(1)}%` : "—";

interface ReportSummaryCardsProps {
  type: string;
  data: any;
}

export default function ReportSummaryCards({ type, data }: ReportSummaryCardsProps) {
  const s = data?.statistics;
  if (!s) return null;

  if (type === "service-orders") {
    const d = data as ServiceOrdersReport;
    return (
      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <KPICard title="Total OTs" value={fmtNum(d.statistics?.total)} icon="pi pi-file-edit" color="blue" />
        </div>
        <div className="col-12 md:col-4">
          <KPICard title="Ingresos totales" value={fmt(d.statistics?.totalRevenue)} icon="pi pi-dollar" color="green" />
        </div>
        <div className="col-12 md:col-4">
          <KPICard title="Período analizado" value={fmtNum(d.count)} icon="pi pi-calendar" color="teal" />
        </div>
      </div>
    );
  }

  if (type === "productivity") {
    const d = data as ProductivityReport;
    return (
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <KPICard title="Técnicos activos" value={fmtNum(d.statistics?.totalTechnicians)} icon="pi pi-users" color="blue" />
        </div>
        <div className="col-12 md:col-3">
          <KPICard title="Hrs estándar" value={fmtNum(Math.round((d.statistics?.totalStandardMinutes ?? 0) / 60))} icon="pi pi-clock" color="teal" />
        </div>
        <div className="col-12 md:col-3">
          <KPICard title="Hrs reales" value={fmtNum(Math.round((d.statistics?.totalRealMinutes ?? 0) / 60))} icon="pi pi-stopwatch" color="orange" />
        </div>
        <div className="col-12 md:col-3">
          <KPICard title="Eficiencia promedio" value={fmtPct(d.statistics?.avgEfficiency)} icon="pi pi-chart-line" color="green" />
        </div>
      </div>
    );
  }

  if (type === "efficiency") {
    const d = data as EfficiencyReport;
    return (
      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <KPICard title="Total OTs" value={fmtNum(d.statistics?.totalOrders)} icon="pi pi-file-edit" color="blue" />
        </div>
        <div className="col-12 md:col-4">
          <KPICard title="A tiempo" value={fmtNum(d.statistics?.onTime)} icon="pi pi-check-circle" color="green" />
        </div>
        <div className="col-12 md:col-4">
          <KPICard title="Tasa de cumplimiento" value={fmtPct(d.statistics?.onTimeRate)} icon="pi pi-chart-pie" color="teal" />
        </div>
      </div>
    );
  }

  if (type === "materials") {
    const d = data as MaterialsReport;
    return (
      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <KPICard title="Total materiales" value={fmtNum(d.statistics?.totalMaterials)} icon="pi pi-box" color="purple" />
        </div>
        <div className="col-12 md:col-4">
          <KPICard title="Costo total" value={fmt(d.statistics?.totalCost)} icon="pi pi-dollar" color="orange" />
        </div>
      </div>
    );
  }

  if (type === "warranty") {
    const d = data as WarrantyReport;
    return (
      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <KPICard title="Reclamaciones" value={fmtNum(d.statistics?.totalClaims)} icon="pi pi-shield" color="orange" />
        </div>
        <div className="col-12 md:col-4">
          <KPICard title="Costo garantías" value={fmt(d.statistics?.totalCost)} icon="pi pi-dollar" color="red" />
        </div>
      </div>
    );
  }

  if (type === "financial") {
    const d = data as FinancialReport;
    return (
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <KPICard title="Ingresos totales" value={fmt(d.statistics?.totalRevenue)} icon="pi pi-dollar" color="green" />
        </div>
        <div className="col-12 md:col-3">
          <KPICard title="Mano de obra" value={fmt(d.statistics?.laborRevenue)} icon="pi pi-wrench" color="blue" />
        </div>
        <div className="col-12 md:col-3">
          <KPICard title="Repuestos" value={fmt(d.statistics?.partsRevenue)} icon="pi pi-box" color="purple" />
        </div>
        <div className="col-12 md:col-3">
          <KPICard title="Ticket promedio" value={fmt(d.statistics?.avgOrderValue)} icon="pi pi-chart-line" color="teal" />
        </div>
      </div>
    );
  }

  return null;
}
