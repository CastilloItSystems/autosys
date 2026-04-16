"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import dealerDashboardService, {
  DealerHistoryItem,
  DealerIntegrationStatus,
  DealerOverview,
} from "@/app/api/dealer/dealerDashboardService";

export default function DealerDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DealerOverview | null>(null);
  const [history, setHistory] = useState<DealerHistoryItem[]>([]);
  const [integrations, setIntegrations] = useState<DealerIntegrationStatus | null>(null);
  const [search, setSearch] = useState("");

  const load = async (historySearch?: string) => {
    setLoading(true);
    try {
      const [overviewRes, historyRes, integrationsRes] = await Promise.all([
        dealerDashboardService.getOverview(),
        dealerDashboardService.getHistory({ page: 1, limit: 20, search: historySearch || undefined }),
        dealerDashboardService.getIntegrations(),
      ]);
      setOverview(overviewRes.data);
      setHistory(historyRes.data || []);
      setIntegrations(integrationsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load(search);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const cards = useMemo(
    () => [
      { title: "Unidades", value: overview?.units.total ?? 0, hint: `Disp: ${overview?.units.available ?? 0} | Reserv: ${overview?.units.reserved ?? 0}` },
      { title: "Reservas", value: overview?.reservations.total ?? 0, hint: "Activas" },
      { title: "Cotizaciones", value: overview?.quotes.total ?? 0, hint: `Aprobadas: ${overview?.quotes.approved ?? 0}` },
      { title: "Pruebas de Manejo", value: overview?.testDrives.total ?? 0, hint: `Completadas: ${overview?.testDrives.completed ?? 0}` },
      { title: "Retomas", value: overview?.tradeIns.total ?? 0, hint: "Avalúos comerciales" },
      { title: "Financiamientos", value: overview?.financing.total ?? 0, hint: `Aprobados: ${overview?.financing.approved ?? 0}` },
      { title: "Entregas", value: overview?.deliveries.total ?? 0, hint: `Entregadas: ${overview?.deliveries.delivered ?? 0}` },
    ],
    [overview]
  );

  const historyHeader = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Historial Comercial</h4>
        <span className="text-600 text-sm">({history.length} recientes)</span>
      </div>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, número o unidad"
        />
      </span>
    </div>
  );

  return (
    <div className="card">
      <div className="mb-3">
        <h3 className="m-0 mb-2">Dashboard Concesionario</h3>
        <p className="m-0 text-600">Resumen operativo, historial comercial e indicadores de integración con CRM y procesos transversales.</p>
      </div>

      <div className="grid mb-3">
        {cards.map((card) => (
          <div className="col-12 md:col-6 lg:col-3" key={card.title}>
            <Card>
              <div className="text-600 text-sm">{card.title}</div>
              <div className="text-3xl font-bold mt-2">{loading ? "..." : card.value}</div>
              <div className="text-500 text-sm mt-2">{card.hint}</div>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="col-12 lg:col-8">
          <Card>
            <DataTable
              value={history}
              loading={loading}
              header={historyHeader}
              responsiveLayout="scroll"
              emptyMessage="No hay actividad comercial reciente"
            >
              <Column field="type" header="Tipo" />
              <Column field="number" header="Número" />
              <Column field="customerName" header="Cliente" />
              <Column field="unitRef" header="Unidad" />
              <Column field="status" header="Estatus" />
              <Column
                header="Fecha"
                body={(row: DealerHistoryItem) => new Date(row.occurredAt).toLocaleString()}
              />
            </DataTable>
          </Card>
        </div>
        <div className="col-12 lg:col-4">
          <Card title="Integraciones Funcionales">
            <div className="mb-3">
              <div className="text-600 text-sm">Leads canal VEHICULOS (CRM)</div>
              <div className="text-2xl font-bold">{loading ? "..." : integrations?.crm.leadsVehiculos ?? 0}</div>
            </div>
            <div className="flex flex-column gap-2">
              {(integrations?.alerts || []).map((alert) => (
                <div key={alert.key} className="surface-100 border-round p-2 flex align-items-center justify-content-between">
                  <span className="text-sm">{alert.label}</span>
                  <Tag value={String(alert.count)} severity={alert.severity} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
