"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { motion } from "framer-motion";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import DiagnosisSeverityBadge from "@/components/workshop/shared/DiagnosisSeverityBadge";
import { handleFormError } from "@/utils/errorHandlers";
import { diagnosisService } from "@/app/api/workshop";
import type { Diagnosis, DiagnosisStatus } from "@/libs/interfaces/workshop";
import DiagnosisForm from "./DiagnosisForm";
import DiagnosisDetailPanel from "./DiagnosisDetailPanel";

type TagSeverity =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "secondary"
  | "contrast"
  | undefined;

const STATUS_LABELS: Record<DiagnosisStatus, string> = {
  DRAFT: "Borrador",
  COMPLETED: "Completado",
  APPROVED_INTERNAL: "Aprobado",
};

const STATUS_SEVERITY: Record<DiagnosisStatus, TagSeverity> = {
  DRAFT: "secondary",
  COMPLETED: "info",
  APPROVED_INTERNAL: "success",
};

const STATUS_OPTIONS = [
  { label: "Todos", value: "ALL" },
  { label: "Borrador", value: "DRAFT" },
  { label: "Completado", value: "COMPLETED" },
  { label: "Aprobado", value: "APPROVED_INTERNAL" },
];

interface DiagnosisListProps {
  serviceOrderId?: string;
  embedded?: boolean;
}

export default function DiagnosisList({
  serviceOrderId,
  embedded,
}: DiagnosisListProps) {
  const [items, setItems] = useState<Diagnosis[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<Diagnosis | null>(null);
  const [actionItem, setActionItem] = useState<Diagnosis | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<DiagnosisStatus | undefined>();
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => {
    if (embedded && !serviceOrderId) return; // Wait for prop if embedded
    loadItems();
  }, [page, rows, searchQuery, statusFilter, serviceOrderId, embedded]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await diagnosisService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status:
          statusFilter !== "ALL"
            ? (statusFilter as DiagnosisStatus)
            : undefined,
        serviceOrderId: serviceOrderId,
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

  const STATUS_TRANSITIONS: Record<DiagnosisStatus, DiagnosisStatus | null> = {
    DRAFT: "COMPLETED",
    COMPLETED: "APPROVED_INTERNAL",
    APPROVED_INTERNAL: null,
  };

  const openNew = () => {
    setSelected(null);
    setFormDialog(true);
  };
  const editItem = (item: Diagnosis) => {
    setSelected({ ...item });
    setFormDialog(true);
  };
  const confirmDelete = (item: Diagnosis) => {
    setSelected(item);
    setDeleteDialog(true);
  };
  const openStatusChange = (item: Diagnosis) => {
    setSelected(item);
    setNewStatus(STATUS_TRANSITIONS[item.status] ?? undefined);
    setStatusDialog(true);
  };
  const handleStatusChange = async () => {
    if (!selected?.id || !newStatus) return;
    setIsChangingStatus(true);
    try {
      await diagnosisService.updateStatus(selected.id, newStatus);
      toast.current?.show({ severity: "success", summary: "Estado actualizado", life: 3000 });
      await loadItems();
      setStatusDialog(false);
      setSelected(null);
    } catch (e) { handleFormError(e, toast); }
    finally { setIsChangingStatus(false); }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    setIsDeleting(true);
    try {
      await diagnosisService.delete(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Diagnóstico eliminado",
        life: 3000,
      });
      await loadItems();
      setDeleteDialog(false);
      setSelected(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = () => {
    (async () => {
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: selected?.id ? "Diagnóstico actualizado" : "Diagnóstico creado",
        life: 3000,
      });
      await loadItems();
      setFormDialog(false);
      setSelected(null);
    })();
  };

  const rowExpansionTemplate = (data: Diagnosis) => (
    <DiagnosisDetailPanel diagnosis={data} onRefresh={loadItems} toast={toast} />
  );

  // ── Body templates ──────────────────────────────────────────────────────

  const referenceBodyTemplate = (rowData: Diagnosis) => (
    <span className="font-bold text-primary">
      {rowData.serviceOrder?.folio ??
        rowData.reception?.code ??
        rowData.id.slice(0, 8)}
    </span>
  );

  const technicianBodyTemplate = (rowData: Diagnosis) => (
    <span>{rowData.technician?.name ?? "—"}</span>
  );

  const severityBodyTemplate = (rowData: Diagnosis) =>
    rowData.severity ? (
      <DiagnosisSeverityBadge severity={rowData.severity} />
    ) : (
      <span className="text-400">—</span>
    );

  const statusBodyTemplate = (rowData: Diagnosis) => (
    <Tag
      value={STATUS_LABELS[rowData.status] ?? rowData.status}
      severity={STATUS_SEVERITY[rowData.status]}
      rounded
    />
  );

  const dateBodyTemplate = (rowData: Diagnosis) =>
    new Date(rowData.createdAt).toLocaleDateString("es-MX");

  const actionBodyTemplate = (rowData: Diagnosis) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-haspopup
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  // ── Header ──────────────────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Diagnósticos</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          style={{ minWidth: "160px" }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
        </span>
        <CreateButton
          label="Nuevo diagnóstico"
          onClick={openNew}
          tooltip="Crear diagnóstico"
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={(e) => {
            setPage(e.page ?? Math.floor(e.first / e.rows));
            setRows(e.rows);
          }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron diagnósticos"
          sortMode="multiple"
          scrollable
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Referencia"
            body={referenceBodyTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            header="Técnico"
            body={technicianBodyTemplate}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Severidad"
            body={severityBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Fecha"
            body={dateBodyTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "700px" }}
        breakpoints={{ "900px": "75vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-search-plus mr-3 text-primary text-3xl" />
                {selected?.id ? "Modificar Diagnóstico" : "Crear Diagnóstico"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
        footer={
          <FormActionButtons
            formId="diagnosis-form"
            isUpdate={!!selected?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <DiagnosisForm
          diagnosis={selected}
          onSave={handleSave}
          formId="diagnosis-form"
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        itemName={selected?.id?.slice(0, 8)}
        isDeleting={isDeleting}
      />

      {/* Context Menu */}
      {/* Status Change Dialog */}
      <Dialog
        header={`Cambiar estado: ${STATUS_LABELS[selected?.status ?? "DRAFT"]}`}
        visible={statusDialog}
        onHide={() => setStatusDialog(false)}
        style={{ width: "26rem" }}
        modal
        draggable={false}
      >
        {selected && newStatus && (
          <div className="flex flex-column gap-4 p-2">
            <p className="text-600 m-0">
              Estado actual: <Tag value={STATUS_LABELS[selected.status]} severity={STATUS_SEVERITY[selected.status]} rounded />
            </p>
            <p className="text-700 m-0">
              Nuevo estado: <Tag value={STATUS_LABELS[newStatus]} severity={STATUS_SEVERITY[newStatus]} rounded />
            </p>
            <div className="flex gap-2 justify-content-end">
              <Button label="Cancelar" severity="secondary" outlined onClick={() => setStatusDialog(false)} />
              <Button label="Confirmar" loading={isChangingStatus} onClick={handleStatusChange} />
            </div>
          </div>
        )}
      </Dialog>

      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Editar",
                  icon: "pi pi-pencil",
                  command: () => editItem(actionItem),
                },
                ...(STATUS_TRANSITIONS[actionItem.status]
                  ? [{
                      label: `Pasar a ${STATUS_LABELS[STATUS_TRANSITIONS[actionItem.status]!]}`,
                      icon: "pi pi-arrow-right",
                      command: () => openStatusChange(actionItem),
                    }]
                  : []),
                { separator: true },
                ...(actionItem.status === "DRAFT"
                  ? [{
                      label: "Eliminar",
                      icon: "pi pi-trash",
                      className: "p-menuitem-danger",
                      command: () => confirmDelete(actionItem),
                    }]
                  : []),
              ]
            : []
        }
        popup
        ref={menuRef}
        id="diagnosis-menu"
      />
    </motion.div>
  );
}
