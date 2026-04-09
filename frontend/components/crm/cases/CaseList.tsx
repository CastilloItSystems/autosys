"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";

import caseService from "@/app/api/crm/caseService";
import {
  Case,
  CASE_STATUS_CONFIG,
  CASE_STATUS_OPTIONS,
  CASE_PRIORITY_CONFIG,
  CASE_PRIORITY_OPTIONS,
  CASE_TYPE_CONFIG,
  CASE_TYPE_OPTIONS,
} from "@/libs/interfaces/crm/case.interface";
import CaseForm from "./CaseForm";
import CaseStatusDialog from "./CaseStatusDialog";
import CaseDetailDialog from "./CaseDetailDialog";
import CreateButton from "@/components/common/CreateButton";

const typeFilterOptions = [
  { label: "Todos los tipos", value: "" },
  ...CASE_TYPE_OPTIONS,
];

const statusFilterOptions = [
  { label: "Todos los estados", value: "" },
  ...CASE_STATUS_OPTIONS,
];

const priorityFilterOptions = [
  { label: "Todas las prioridades", value: "" },
  ...CASE_PRIORITY_OPTIONS,
];

const TERMINAL_STATUSES = ["CLOSED", "REJECTED"];

export default function CaseList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const selectedRef = useRef<Case | null>(null);

  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editCase, setEditCase] = useState<Case | null>(null);

  const [statusDialogCase, setStatusDialogCase] = useState<Case | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const limit = 20;

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Reset page on filter changes ──────────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterStatus, filterPriority]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await caseService.getAll({
        page,
        limit,
        search: search || undefined,
        type: filterType || undefined,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const raw = (res as any)?.data ?? res;
      setCases(raw.data ?? raw);
      setTotal(raw.meta?.total ?? raw.length ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error al cargar casos",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus, filterPriority]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditCase(null);
    setFormVisible(true);
  };

  const openEdit = (c: Case) => {
    setEditCase(c);
    setFormVisible(true);
  };

  const openStatusDialog = (c: Case) => {
    setStatusDialogCase(c);
    setStatusDialogVisible(true);
  };

  const openDetail = (c: Case) => {
    setDetailCaseId(c.id);
    setDetailVisible(true);
  };

  const handleDelete = (c: Case) => {
    confirmDialog({
      message: `¿Eliminar el caso "${c.caseNumber} — ${c.title}"? Solo se pueden eliminar casos abiertos.`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await caseService.delete(c.id);
          toast.current?.show({ severity: "success", summary: "Caso eliminado" });
          load();
        } catch (e: any) {
          toast.current?.show({
            severity: "error",
            summary: e?.response?.data?.message ?? "Error al eliminar",
          });
        }
      },
    });
  };

  const menuItems = (c: Case): MenuItem[] => [
    {
      label: "Ver detalle",
      icon: "pi pi-eye",
      command: () => openDetail(c),
    },
    {
      label: "Cambiar Estado",
      icon: "pi pi-exchange",
      command: () => openStatusDialog(c),
      disabled: TERMINAL_STATUSES.includes(c.status as string),
    },
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => openEdit(c),
      disabled: TERMINAL_STATUSES.includes(c.status as string),
    },
    { separator: true },
    {
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger",
      command: () => handleDelete(c),
      disabled: c.status !== "OPEN",
    },
  ];

  // ── Column templates ──────────────────────────────────────────────────────
  const caseNumberBody = (c: Case) => (
    <div>
      <div className="font-semibold text-sm">{c.caseNumber}</div>
      <div className="text-xs text-600 mt-1">{c.title}</div>
    </div>
  );

  const customerBody = (c: Case) => (
    <div>
      <div className="text-sm">{c.customer?.name ?? c.customerId}</div>
      {c.customer?.code && (
        <div className="text-xs text-500">{c.customer.code}</div>
      )}
    </div>
  );

  const typeBody = (c: Case) => {
    const cfg = CASE_TYPE_CONFIG[c.type];
    if (!cfg) return <span className="text-xs text-500">{c.type}</span>;
    return <span className="text-xs">{cfg.label}</span>;
  };

  const priorityBody = (c: Case) => {
    const cfg = CASE_PRIORITY_CONFIG[c.priority];
    if (!cfg) return <span className="text-xs">{c.priority}</span>;
    return (
      <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />
    );
  };

  const statusBody = (c: Case) => {
    const cfg = CASE_STATUS_CONFIG[c.status];
    if (!cfg) return <span className="text-xs">{c.status}</span>;
    return (
      <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />
    );
  };

  const slaBody = (c: Case) => {
    if (!c.slaDeadline) return <span className="text-400">—</span>;
    const isOverdue =
      new Date(c.slaDeadline) < new Date() &&
      !TERMINAL_STATUSES.includes(c.status as string) &&
      c.status !== "RESOLVED";
    return (
      <span className={`text-sm ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
        {isOverdue && <i className="pi pi-exclamation-triangle mr-1" />}
        {new Date(c.slaDeadline).toLocaleDateString("es-VE")}
      </span>
    );
  };

  const createdAtBody = (c: Case) =>
    new Date(c.createdAt).toLocaleDateString("es-VE");

  const actionsBody = (c: Case) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      severity="secondary"
      size="small"
      onClick={(e) => {
        selectedRef.current = c;
        menuRef.current?.toggle(e);
      }}
    />
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <Menu
        ref={menuRef}
        popup
        model={selectedRef.current ? menuItems(selectedRef.current) : []}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card"
      >
        {/* Header */}
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="mb-1 text-900">Casos / PQRS / Reclamos</h4>
            <span className="text-500 text-sm">{total} registros</span>
          </div>
          <CreateButton
            label="Nuevo Caso"
            onClick={openNew}
            tooltip="Crear nuevo caso o reclamo"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar caso..."
              style={{ width: "220px" }}
            />
          </span>
          <Dropdown
            value={filterType}
            onChange={(e) => setFilterType(e.value)}
            options={typeFilterOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "180px" }}
          />
          <Dropdown
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.value)}
            options={priorityFilterOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "160px" }}
          />
          <Dropdown
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.value)}
            options={statusFilterOptions}
            optionLabel="label"
            optionValue="value"
            style={{ minWidth: "180px" }}
          />
        </div>

        {/* Table */}
        <DataTable
          value={cases}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
          emptyMessage="No hay casos registrados"
          size="small"
          stripedRows
          dataKey="id"
          tableStyle={{ minWidth: "70rem" }}
        >
          <Column
            header="Caso"
            body={caseNumberBody}
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Cliente"
            body={customerBody}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Tipo"
            body={typeBody}
            style={{ minWidth: "140px" }}
          />
          <Column
            header="Prioridad"
            body={priorityBody}
            style={{ width: "110px" }}
          />
          <Column
            header="Estado"
            body={statusBody}
            style={{ width: "150px" }}
          />
          <Column
            header="SLA"
            body={slaBody}
            style={{ width: "120px" }}
          />
          <Column
            header="Creado"
            body={createdAtBody}
            style={{ width: "110px" }}
          />
          <Column
            header=""
            body={actionsBody}
            style={{ width: "60px", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </motion.div>

      {/* Case Form Dialog */}
      <CaseForm
        case={editCase}
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        onSaved={load}
        toast={toast}
      />

      {/* Status Dialog */}
      <CaseStatusDialog
        caseRecord={statusDialogCase}
        visible={statusDialogVisible}
        onHide={() => setStatusDialogVisible(false)}
        onSaved={load}
        toast={toast}
      />

      {/* Detail Dialog */}
      <CaseDetailDialog
        caseId={detailCaseId}
        visible={detailVisible}
        onHide={() => setDetailVisible(false)}
        onUpdated={load}
        toast={toast}
      />
    </>
  );
}
