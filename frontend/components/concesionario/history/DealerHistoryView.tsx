"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import dealerDashboardService, {
  DealerHistoryItem,
} from "@/app/api/dealer/dealerDashboardService";

const TYPE_LABELS: Record<DealerHistoryItem["type"], string> = {
  RESERVATION: "Reserva",
  QUOTE: "Cotización",
  TEST_DRIVE: "Prueba de manejo",
  TRADE_IN: "Retoma",
  FINANCING: "Financiamiento",
  DELIVERY: "Entrega",
};

export default function DealerHistoryView() {
  const [rows, setRows] = useState<DealerHistoryItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const load = async (query?: string) => {
    setLoading(true);
    try {
      const res = await dealerDashboardService.getHistory({
        page: page + 1,
        limit,
        search: query || undefined,
      });
      setRows(res.data || []);
      setTotalRecords(res.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(search);
  }, [page, limit, search]);

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Historial Comercial</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar por cliente, número o unidad"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </span>
      </div>
    </div>
  );

  return (
    <div className="card">
      <DataTable
        value={rows}
        paginator
        lazy
        first={page * limit}
        rows={limit}
        totalRecords={totalRecords}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPage={(e) => {
          setPage(e.page ?? Math.floor((e.first ?? 0) / (e.rows ?? 10)));
          setLimit(e.rows ?? 10);
        }}
        loading={loading}
        header={header}
        sortMode="multiple"
        dataKey="id"
        scrollable
        responsiveLayout="scroll"
        emptyMessage="No hay movimientos comerciales"
      >
        <Column
          field="type"
          header="Tipo"
          body={(row: DealerHistoryItem) => (
            <Tag value={TYPE_LABELS[row.type] || row.type} />
          )}
        />
        <Column field="number" header="Número" />
        <Column field="status" header="Estatus" />
        <Column field="customerName" header="Cliente" />
        <Column field="unitRef" header="Unidad" />
        <Column
          header="Fecha"
          body={(row: DealerHistoryItem) =>
            row.occurredAt ? new Date(row.occurredAt).toLocaleString() : "-"
          }
        />
      </DataTable>
    </div>
  );
}
