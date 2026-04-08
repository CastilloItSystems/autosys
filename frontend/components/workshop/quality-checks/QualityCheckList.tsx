"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { ProgressBar } from "primereact/progressbar";
import { motion } from "framer-motion";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import { handleFormError } from "@/utils/errorHandlers";
import { qualityCheckService } from "@/app/api/workshop";
import type {
  QualityCheck,
  QualityCheckStatus,
} from "@/libs/interfaces/workshop";
import QualityCheckForm from "./QualityCheckForm";
import QualityCheckSubmitForm from "./QualityCheckSubmitForm";

interface QualityCheckListProps {
  serviceOrderId?: string;
  embedded?: boolean;
}

type TagSeverity =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "secondary"
  | "contrast"
  | undefined;

const QC_STATUS_LABELS: Record<QualityCheckStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En revisión",
  PASSED: "Aprobado",
  FAILED: "Fallido",
};

const QC_STATUS_SEVERITY: Record<QualityCheckStatus, TagSeverity> = {
  PENDING: "secondary",
  IN_PROGRESS: "warning",
  PASSED: "success",
  FAILED: "danger",
};

export default function QualityCheckList({
  serviceOrderId,
  embedded,
}: QualityCheckListProps) {
  const [items, setItems] = useState<QualityCheck[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<QualityCheck | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast>(null);

  // Use prop serviceOrderId when embedded
  const finalServiceOrderId = embedded ? serviceOrderId : searchQuery;

  useEffect(() => {
    if (embedded && !serviceOrderId) return; // Wait for prop if embedded
    setPage(0); // Reset to page 1 when filter changes
    loadItems();
  }, [finalServiceOrderId, embedded]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await qualityCheckService.getAll({
        serviceOrderId: finalServiceOrderId || undefined,
        page: page + 1,
        limit: rows,
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSaved = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Control de calidad creado",
        life: 3000,
      });
      await loadItems();
      setCreateDialog(false);
    })();
  };

  const handleSubmitSaved = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Control de calidad enviado",
        life: 3000,
      });
      await loadItems();
      setSubmitDialog(false);
      setSelected(null);
    })();
  };

  // ── Templates ──────────────────────────────────────────────────────────────

  const statusTemplate = (row: QualityCheck) => (
    <Tag
      value={QC_STATUS_LABELS[row.status]}
      severity={QC_STATUS_SEVERITY[row.status]}
      rounded
    />
  );

  const orderTemplate = (row: QualityCheck) =>
    row.serviceOrder ? (
      <span className="font-bold text-primary">{row.serviceOrder.folio}</span>
    ) : (
      <span className="text-500 text-sm">
        {row.serviceOrderId.slice(0, 8)}…
      </span>
    );

  const checklistTemplate = (row: QualityCheck) => {
    if (!row.totalItems) return <span className="text-500">Sin checklist</span>;
    const pct = Math.round((row.passedItems / row.totalItems) * 100);
    return (
      <div
        className="flex align-items-center gap-2"
        style={{ minWidth: "120px" }}
      >
        <ProgressBar
          value={pct}
          showValue={false}
          style={{ height: "8px", flex: 1 }}
        />
        <span className="text-sm font-medium">
          {row.passedItems}/{row.totalItems}
        </span>
      </div>
    );
  };

  const retryTemplate = (row: QualityCheck) =>
    row.retryCount > 0 ? (
      <Tag value={`Intento ${row.retryCount}`} severity="warning" rounded />
    ) : (
      <span className="text-500">—</span>
    );

  const dateTemplate = (row: QualityCheck) =>
    new Date(row.createdAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const actionsTemplate = (row: QualityCheck) => (
    <Button
      icon="pi pi-clipboard"
      rounded
      text
      severity={
        row.status === "IN_PROGRESS" || row.status === "PENDING"
          ? "warning"
          : "secondary"
      }
      disabled={row.status === "PASSED" || row.status === "FAILED"}
      onClick={() => {
        setSelected({ ...row });
        setSubmitDialog(true);
      }}
      tooltip={
        row.status === "PASSED" || row.status === "FAILED"
          ? "Ya cerrado"
          : "Revisar / Enviar resultado"
      }
      tooltipOptions={{ position: "left" }}
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Control de Calidad</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="ID de orden..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            style={{ width: "14rem" }}
          />
        </span>
        <CreateButton
          label="Nueva revisión"
          onClick={() => setCreateDialog(true)}
          tooltip="Crear control de calidad"
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={items}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={(e) => {
            setPage(e.page ?? Math.floor(e.first / e.rows));
            setRows(e.rows);
          }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron controles de calidad"
          sortMode="multiple"
          scrollable
          size="small"
        >
          <Column
            header="OT"
            body={orderTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="inspectorId"
            header="Inspector"
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Checklist"
            body={checklistTemplate}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Reintentos"
            body={retryTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            field="createdAt"
            header="Fecha"
            body={dateTemplate}
            sortable
            style={{ minWidth: "110px" }}
          />
          <Column
            header="Revisar"
            body={actionsTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Create Dialog */}
      <Dialog
        visible={createDialog}
        style={{ width: "480px" }}
        breakpoints={{ "600px": "90vw" }}
        header={
          <div className="mb-2">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center gap-2">
                <i className="pi pi-check-square text-primary text-3xl" />
                Nueva Revisión de Calidad
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setCreateDialog(false)}
        footer={
          <FormActionButtons
            formId="quality-check-create-form"
            isUpdate={false}
            onCancel={() => setCreateDialog(false)}
            isSubmitting={isSubmitting}
            submitLabel="Crear"
          />
        }
      >
        <QualityCheckForm
          onSave={handleCreateSaved}
          formId="quality-check-create-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Submit Dialog */}
      <Dialog
        visible={submitDialog}
        style={{ width: "700px" }}
        breakpoints={{ "900px": "85vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center gap-2">
                <i className="pi pi-list-check text-primary text-3xl" />
                Enviar Resultado de Calidad
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => {
          setSubmitDialog(false);
          setSelected(null);
        }}
        footer={
          <FormActionButtons
            formId="quality-check-submit-form"
            isUpdate={false}
            onCancel={() => {
              setSubmitDialog(false);
              setSelected(null);
            }}
            isSubmitting={isSubmitting}
            submitLabel="Enviar resultado"
          />
        }
      >
        <QualityCheckSubmitForm
          qualityCheck={selected}
          onSave={handleSubmitSaved}
          formId="quality-check-submit-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>
    </motion.div>
  );
}
