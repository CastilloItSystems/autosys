"use client";

import React, { useState, useCallback } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import BulkImport from "@/components/inventory/bulk/BulkImport";
import BulkExport from "@/components/inventory/bulk/BulkExport";
import BulkHistory from "@/components/inventory/bulk/BulkHistory";

const TAB_HISTORY = 2;

export default function ImportarPage() {
  const [activeTab, setActiveTab] = useState(0);
  // Increment to trigger History reload from outside
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Only refresh history data in the background — don't switch tabs automatically.
  // The user navigates to History manually when they're ready.
  const handleImportComplete = useCallback(() => {
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  const handleExportComplete = useCallback(() => {
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  const goToHistory = useCallback(() => {
    setActiveTab(TAB_HISTORY);
    setHistoryRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-column gap-4">
      <div>
        <h2 className="m-0 mb-2">Importar / Exportar</h2>
        <p className="text-600 mt-0">
          Gestiona operaciones de importación y exportación de artículos en
          lotes
        </p>
      </div>

      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        <TabPanel header="Importar" leftIcon="pi pi-upload">
          <div className="mt-3">
            <BulkImport onComplete={handleImportComplete} onGoToHistory={goToHistory} />
          </div>
        </TabPanel>

        <TabPanel header="Exportar" leftIcon="pi pi-download">
          <div className="mt-3">
            <BulkExport onComplete={handleExportComplete} />
          </div>
        </TabPanel>

        <TabPanel header="Historial" leftIcon="pi pi-history">
          <div className="mt-3">
            <BulkHistory refreshKey={historyRefreshKey} />
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
}
