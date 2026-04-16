"use client";

import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import dealerDashboardService, {
  DealerIntegrationStatus,
} from "@/app/api/dealer/dealerDashboardService";

export default function DealerIntegrationsView() {
  const [data, setData] = useState<DealerIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dealerDashboardService.getIntegrations();
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <div className="mb-3">
        <h3 className="m-0 mb-2">Integraciones Funcionales</h3>
        <p className="m-0 text-600">Estado de sincronización con CRM y señales operativas de continuidad comercial.</p>
      </div>
      <div className="grid">
        <div className="col-12 md:col-4">
          <Card title="CRM - Canal VEHICULOS">
            <div className="text-sm text-600">Leads sincronizados</div>
            <div className="text-3xl font-bold mt-2">
              {loading ? "..." : data?.crm.leadsVehiculos ?? 0}
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-8">
          <Card title="Alertas de Integración">
            <DataTable
              value={data?.alerts || []}
              loading={loading}
              responsiveLayout="scroll"
              emptyMessage="No hay alertas activas."
              size="small"
            >
              <Column field="label" header="Alerta" />
              <Column field="count" header="Cantidad" />
              <Column
                header="Severidad"
                body={(row) => <Tag value={String(row.severity).toUpperCase()} severity={row.severity} />}
              />
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
}
