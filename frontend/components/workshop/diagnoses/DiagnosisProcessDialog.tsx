"use client";
import React, { useState, useCallback } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { diagnosisService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import DiagnosisHeader from "./DiagnosisHeader";
import DiagnosisFindingsTab from "./tabs/DiagnosisFindingsTab";
import DiagnosisOperationsTab from "./tabs/DiagnosisOperationsTab";
import DiagnosisPartsTab from "./tabs/DiagnosisPartsTab";
import DiagnosisEvidencesTab from "./tabs/DiagnosisEvidencesTab";
import type { Diagnosis } from "@/libs/interfaces/workshop";

interface Props {
  diagnosis: Diagnosis;
  visible: boolean;
  onHide: () => void;
  toast: React.RefObject<any>;
}

export default function DiagnosisProcessDialog({ diagnosis, visible, onHide, toast }: Props) {
  const [current, setCurrent] = useState<Diagnosis>(diagnosis);
  const [activeTab, setActiveTab] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await diagnosisService.getById(current.id);
      setCurrent(res.data);
    } catch (e) {
      handleFormError(e, toast);
    }
  }, [current.id, toast]);

  // Sync when the dialog opens with a new diagnosis
  React.useEffect(() => {
    setCurrent(diagnosis);
    setActiveTab(0);
  }, [diagnosis]);

  const progressItems = [
    { label: "Hallazgos",   completed: (current.findings?.length ?? 0) > 0 },
    { label: "Operaciones", completed: (current.suggestedOperations?.length ?? 0) > 0 },
    { label: "Repuestos",   completed: (current.suggestedParts?.length ?? 0) > 0 },
    { label: "Evidencias",  completed: (current.evidences?.length ?? 0) > 0 },
  ];

  return (
    <Dialog
      visible={visible}
      style={{ width: "80vw" }}
      breakpoints={{ "960px": "90vw", "600px": "95vw" }}
      maximizable
      modal
      header={null}
      contentStyle={{ padding: 0, overflow: "hidden", height: "80vh" }}
      onHide={onHide}
      footer={
        <div className="flex justify-content-end">
          <Button label="Cerrar" icon="pi pi-times" severity="secondary" onClick={onHide} />
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <DiagnosisHeader diagnosis={current} progressItems={progressItems} />
        <div style={{ overflowY: "auto", flex: 1 }} className="p-3">
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            <TabPanel
              header={`Hallazgos (${current.findings?.length ?? 0})`}
              leftIcon="pi pi-exclamation-triangle mr-2"
            >
              <DiagnosisFindingsTab
                diagnosisId={current.id}
                findings={current.findings ?? []}
                onRefresh={refresh}
                toast={toast}
              />
            </TabPanel>
            <TabPanel
              header={`Operaciones (${current.suggestedOperations?.length ?? 0})`}
              leftIcon="pi pi-wrench mr-2"
            >
              <DiagnosisOperationsTab
                diagnosisId={current.id}
                operations={current.suggestedOperations ?? []}
                onRefresh={refresh}
                toast={toast}
              />
            </TabPanel>
            <TabPanel
              header={`Repuestos (${current.suggestedParts?.length ?? 0})`}
              leftIcon="pi pi-box mr-2"
            >
              <DiagnosisPartsTab
                diagnosisId={current.id}
                parts={current.suggestedParts ?? []}
                onRefresh={refresh}
                toast={toast}
              />
            </TabPanel>
            <TabPanel
              header={`Evidencias (${current.evidences?.length ?? 0})`}
              leftIcon="pi pi-images mr-2"
            >
              <DiagnosisEvidencesTab
                diagnosisId={current.id}
                evidences={current.evidences ?? []}
                onRefresh={refresh}
                toast={toast}
              />
            </TabPanel>
          </TabView>
        </div>
      </div>
    </Dialog>
  );
}
