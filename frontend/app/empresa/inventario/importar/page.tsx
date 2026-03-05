"use client";

import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import BulkImport from "@/components/inventory/bulk/BulkImport";
import BulkExport from "@/components/inventory/bulk/BulkExport";
import BulkHistory from "@/components/inventory/bulk/BulkHistory";

export default function ImportarPage() {
  const [activeTab, setActiveTab] = useState(0);

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
            <BulkImport />
          </div>
        </TabPanel>

        <TabPanel header="Exportar" leftIcon="pi pi-download">
          <div className="mt-3">
            <BulkExport />
          </div>
        </TabPanel>

        <TabPanel header="Historial" leftIcon="pi pi-history">
          <div className="mt-3">
            <BulkHistory />
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
}
