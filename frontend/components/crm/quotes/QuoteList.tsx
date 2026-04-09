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

import quoteService from "@/app/api/crm/quoteService";
import {
  Quote,
  QUOTE_STATUS_CONFIG,
  QUOTE_STATUS_OPTIONS,
  QUOTE_TYPE_CONFIG,
  QUOTE_TYPE_OPTIONS,
} from "@/libs/interfaces/crm/quote.interface";
import QuoteForm from "./QuoteForm";
import QuoteStatusDialog from "./QuoteStatusDialog";
import CreateButton from "@/components/common/CreateButton";

const typeFilterOptions = [
  { label: "Todos los tipos", value: "" },
  ...QUOTE_TYPE_OPTIONS,
];

const statusFilterOptions = [
  { label: "Todos los estados", value: "" },
  ...QUOTE_STATUS_OPTIONS,
];

const REVISABLE_STATUSES = ["APPROVED", "EXPIRED", "REJECTED"];

export default function QuoteList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const selectedRef = useRef<Quote | null>(null);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);

  const [statusDialogQuote, setStatusDialogQuote] = useState<Quote | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

  const limit = 20;

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Reset page on filter changes ──────────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterStatus]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quoteService.getAll({
        page,
        limit,
        search: search || undefined,
        type: filterType || undefined,
        status: filterStatus || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const raw = (res as any)?.data ?? res;
      setQuotes(raw.data ?? raw);
      setTotal(raw.meta?.total ?? raw.length ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error al cargar cotizaciones",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditQuote(null);
    setFormVisible(true);
  };

  const openEdit = (quote: Quote) => {
    setEditQuote(quote);
    setFormVisible(true);
  };

  const openStatusDialog = (quote: Quote) => {
    setStatusDialogQuote(quote);
    setStatusDialogVisible(true);
  };

  const handleRevise = async (quote: Quote) => {
    try {
      await quoteService.revise(quote.id);
      toast.current?.show({ severity: "success", summary: "Nueva versión creada" });
      load();
    } catch (e: any) {
      toast.current?.show({
        severity: "error",
        summary: e?.response?.data?.message ?? "Error al crear versión",
      });
    }
  };

  const handleDelete = (quote: Quote) => {
    confirmDialog({
      message: `¿Eliminar la cotización "${quote.quoteNumber} – ${quote.title}"? Solo se pueden eliminar cotizaciones en borrador.`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await quoteService.delete(quote.id);
          toast.current?.show({ severity: "success", summary: "Cotización eliminada" });
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

  const menuItems = (quote: Quote): MenuItem[] => [
    {
      label: "Ver / Editar",
      icon: "pi pi-pencil",
      command: () => openEdit(quote),
    },
    {
      label: "Cambiar Estado",
      icon: "pi pi-exchange",
      command: () => openStatusDialog(quote),
    },
    {
      label: "Nueva versión",
      icon: "pi pi-copy",
      command: () => handleRevise(quote),
      disabled: !REVISABLE_STATUSES.includes(quote.status as string),
    },
    { separator: true },
    {
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger",
      command: () => handleDelete(quote),
      disabled: quote.status !== "DRAFT",
    },
  ];

  // ── Column templates ──────────────────────────────────────────────────────
  const quoteNumberBody = (q: Quote) => (
    <div>
      <div className="font-semibold text-sm">
        {q.quoteNumber}
        {q.version > 1 && (
          <span className="ml-1 text-xs text-500">v{q.version}</span>
        )}
      </div>
      <div className="text-xs text-600 mt-1">{q.title}</div>
    </div>
  );

  const customerBody = (q: Quote) => (
    <div>
      <div className="text-sm">{q.customer?.name ?? q.customerId}</div>
      {q.customer?.code && (
        <div className="text-xs text-500">{q.customer.code}</div>
      )}
    </div>
  );

  const typeBody = (q: Quote) => {
    const cfg = QUOTE_TYPE_CONFIG[q.type];
    if (!cfg) return <span className="text-xs text-500">{q.type}</span>;
    return (
      <span className="text-xs">
        <i className={`${cfg.icon} mr-1`} />
        {cfg.label}
      </span>
    );
  };

  const statusBody = (q: Quote) => {
    const cfg = QUOTE_STATUS_CONFIG[q.status];
    if (!cfg) return <span className="text-xs">{q.status}</span>;
    return (
      <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />
    );
  };

  const totalBody = (q: Quote) => (
    <span className="font-semibold text-sm">
      {q.currency} {Number(q.total).toFixed(2)}
    </span>
  );

  const validUntilBody = (q: Quote) =>
    q.validUntil ? (
      <span className="text-sm">
        {new Date(q.validUntil).toLocaleDateString("es-VE")}
      </span>
    ) : (
      <span className="text-400">—</span>
    );

  const createdAtBody = (q: Quote) =>
    new Date(q.createdAt).toLocaleDateString("es-VE");

  const actionsBody = (q: Quote) => (
    <div className="flex gap-1 justify-content-center">
      <Button
        icon="pi pi-exchange"
        rounded
        text
        severity="info"
        size="small"
        tooltip="Cambiar Estado"
        tooltipOptions={{ position: "top" }}
        onClick={() => openStatusDialog(q)}
      />
      <Button
        icon="pi pi-cog"
        rounded
        text
        severity="secondary"
        size="small"
        onClick={(e) => {
          selectedRef.current = q;
          menuRef.current?.toggle(e);
        }}
      />
    </div>
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
            <h4 className="mb-1 text-900">Cotizaciones</h4>
            <span className="text-500 text-sm">{total} registros</span>
          </div>
          <CreateButton
            label="Nueva Cotización"
            onClick={openNew}
            tooltip="Crear nueva cotización"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar cotización..."
              style={{ width: "220px" }}
            />
          </span>
          <Dropdown
            value={filterType}
            onChange={(e) => setFilterType(e.value)}
            options={typeFilterOptions}
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
          value={quotes}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
          emptyMessage="No hay cotizaciones registradas"
          size="small"
          stripedRows
          dataKey="id"
          tableStyle={{ minWidth: "60rem" }}
        >
          <Column
            header="Cotización"
            body={quoteNumberBody}
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
            style={{ width: "110px" }}
          />
          <Column
            header="Estado"
            body={statusBody}
            style={{ width: "130px" }}
          />
          <Column
            header="Total"
            body={totalBody}
            style={{ width: "140px" }}
          />
          <Column
            header="Válida hasta"
            body={validUntilBody}
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
            style={{ width: "90px", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </motion.div>

      {/* Quote Form Dialog */}
      <QuoteForm
        quote={editQuote}
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        onSaved={load}
        toast={toast}
      />

      {/* Status Dialog */}
      <QuoteStatusDialog
        quote={statusDialogQuote}
        visible={statusDialogVisible}
        onHide={() => setStatusDialogVisible(false)}
        onSaved={load}
        toast={toast}
      />
    </>
  );
}
