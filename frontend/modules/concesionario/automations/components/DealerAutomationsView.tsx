"use client";

import React, { useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import dealerAutomationService, { DealerAutomationAlert, DealerAutomationSummary } from "../services/dealerAutomationService";
import { useDealerAutomationsData } from "../hooks/useDealerAutomationsData";

export default function DealerAutomationsView() {
  const [summary, setSummary] = useState<DealerAutomationSummary | null>(null);
  const [running, setRunning] = useState(false);
  const { alerts, loading, mutate } = useDealerAutomationsData();

  const runChecks = async () => {
    setRunning(true);
    try {
      const res = await dealerAutomationService.runChecks();
      setSummary(res.data);
      await mutate();
    } finally {
      setRunning(false);
    }
  };

  const displayAlerts = summary?.alerts ?? alerts;

  return (
    <div className="card">
      <div className="mb-3">
        <h3 className="m-0 mb-2">Automatizaciones de Concesionario</h3>
        <p className="m-0 text-600">Alertas operativas automáticas y ejecución manual de chequeos de continuidad comercial.</p>
      </div>
      <Card>
        <div className="flex gap-2 mb-3">
          <Button label="Ejecutar Chequeos" icon="pi pi-bolt" onClick={runChecks} loading={running} />
          <Button label="Refrescar" icon="pi pi-refresh" severity="secondary" outlined onClick={() => mutate()} />
        </div>

        {summary && (
          <div className="surface-100 border-round p-2 mb-3 text-sm">
            Última ejecución: {new Date(summary.generatedAt).toLocaleString()} | Alertas totales: {summary.totalAlerts}
          </div>
        )}

        <DataTable value={displayAlerts} loading={loading} responsiveLayout="scroll" emptyMessage="No hay alertas disponibles">
          <Column field="message" header="Alerta" />
          <Column field="count" header="Cantidad" />
          <Column
            header="Severidad"
            body={(row: DealerAutomationAlert) => <Tag value={row.severity.toUpperCase()} severity={row.severity as any} />}
          />
        </DataTable>
      </Card>
    </div>
  );
}
