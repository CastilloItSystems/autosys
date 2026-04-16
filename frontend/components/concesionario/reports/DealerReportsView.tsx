"use client";

import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import dealerReportService, { DealerExecutiveReport, DealerPipelineReport } from "@/app/api/dealer/dealerReportService";

export default function DealerReportsView() {
  const [executive, setExecutive] = useState<DealerExecutiveReport | null>(null);
  const [pipeline, setPipeline] = useState<DealerPipelineReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [execRes, pipeRes] = await Promise.all([dealerReportService.getExecutive(), dealerReportService.getPipeline()]);
        setExecutive(execRes.data);
        setPipeline(pipeRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const conversionRows = executive
    ? Object.entries(executive.conversion).map(([key, value]) => ({ key, value }))
    : [];
  const riskRows = executive ? Object.entries(executive.risks).map(([key, value]) => ({ key, value })) : [];

  return (
    <div className="card">
      <div className="mb-3">
        <h3 className="m-0 mb-2">Reportes de Concesionario</h3>
        <p className="m-0 text-600">Visión ejecutiva de conversión, riesgos operativos y embudo por etapa comercial.</p>
      </div>

      <div className="grid mb-3">
        <div className="col-12 md:col-6">
          <Card title="Conversiones">
            <DataTable value={conversionRows} loading={loading} size="small" responsiveLayout="scroll" emptyMessage="Sin datos de conversión">
              <Column field="key" header="Métrica" />
              <Column field="value" header="Valor" body={(row) => `${Number(row.value).toFixed(2)}%`} />
            </DataTable>
          </Card>
        </div>
        <div className="col-12 md:col-6">
          <Card title="Riesgos Operativos">
            <DataTable value={riskRows} loading={loading} size="small" responsiveLayout="scroll" emptyMessage="Sin riesgos detectados">
              <Column field="key" header="Indicador" />
              <Column field="value" header="Cantidad" />
            </DataTable>
          </Card>
        </div>
      </div>

      <Card title="Pipeline por Estatus">
        <div className="grid">
          {[
            { title: "Reservas", rows: pipeline?.reservations || [] },
            { title: "Cotizaciones", rows: pipeline?.quotes || [] },
            { title: "Pruebas de Manejo", rows: pipeline?.testDrives || [] },
            { title: "Financiamiento", rows: pipeline?.financing || [] },
            { title: "Entregas", rows: pipeline?.deliveries || [] },
          ].map((section) => (
            <div className="col-12 md:col-6 lg:col-4" key={section.title}>
              <Card title={section.title}>
                <DataTable value={section.rows} loading={loading} size="small" responsiveLayout="scroll" emptyMessage="Sin registros">
                  <Column field="status" header="Estatus" />
                  <Column field="count" header="Total" />
                </DataTable>
              </Card>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
