"use client";

import React, { useState, useCallback } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import StockBulkImport from "@/components/inventory/bulk/stock/StockBulkImport";
import StockBulkAdjust from "@/components/inventory/bulk/stock/StockBulkAdjust";
import StockBulkTransfer from "@/components/inventory/bulk/stock/StockBulkTransfer";
import StockBulkExport from "@/components/inventory/bulk/stock/StockBulkExport";
import StockBulkHistory from "@/components/inventory/bulk/StockBulkHistory";

const TAB_HISTORY = 4;

export default function StockBulkPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleComplete = useCallback(() => {
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-column gap-4">
      <div>
        <h2 className="m-0 mb-2">Operaciones Masivas de Stock</h2>
        <p className="text-600 mt-0">
          Carga inicial, ajustes, transferencias y exportación masiva de stock.
          Cada operación genera los movimientos correspondientes en el historial.
        </p>
      </div>

      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        <TabPanel header="Carga Inicial" leftIcon="pi pi-upload mr-2">
          <div className="mt-3">
            <StockBulkImport onComplete={handleComplete} />
          </div>
        </TabPanel>

        <TabPanel header="Ajustes" leftIcon="pi pi-sync mr-2">
          <div className="mt-3">
            <StockBulkAdjust onComplete={handleComplete} />
          </div>
        </TabPanel>

        <TabPanel header="Transferencias" leftIcon="pi pi-arrow-right-arrow-left mr-2">
          <div className="mt-3">
            <StockBulkTransfer onComplete={handleComplete} />
          </div>
        </TabPanel>

        <TabPanel header="Exportar" leftIcon="pi pi-download mr-2">
          <div className="mt-3">
            <StockBulkExport onComplete={handleComplete} />
          </div>
        </TabPanel>

        <TabPanel header="Historial" leftIcon="pi pi-history mr-2">
          <div className="mt-3">
            <StockBulkHistory refreshKey={historyRefreshKey} />
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
}
