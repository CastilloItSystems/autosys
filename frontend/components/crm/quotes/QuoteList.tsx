"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
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
import { handleFormError } from "@/utils/errorHandlers";
import QuoteForm from "./QuoteForm";
import QuoteStatusDialog from "./QuoteStatusDialog";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

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

  const [formDialog, setFormDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [statusDialogQuote, setStatusDialogQuote] = useState<Quote | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);

  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterStatus]);

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

  const openNew = () => {
    setEditQuote(null);
    setFormDialog(true);
  };

  const openEdit = (quote: Quote) => {
    setEditQuote(quote);
    setFormDialog(true);
  };

  const openStatusDialog = (quote: Quote) => {
    setStatusDialogQuote(quote);
    setStatusDialogVisible(true);
  };

  const openDeleteDialog = (quote: Quote) => {
    setEditQuote(quote);
    setDeleteDialog(true);
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: editQuote ? "Cotización actualizada" : "Cotización creada",
      life: 3000,
    });
    setFormDialog(false);
    setEditQuote(null);
    await load();
  };

  const handleDelete = async () => {
    if (!editQuote) return;

    setIsDeleting(true);
    try {
      await quoteService.delete(editQuote.id);
      toast.current?.show({ severity: "success", summary: "Cotización eliminada" });
      setDeleteDialog(false);
      setEditQuote(null);
      await load();
    } catch (e: any) {
      handleFormError(e, toast);
    } finally {
      setIsDeleting(false);
    }
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
      command: () => openDeleteDialog(quote),
      disabled: quote.status !== "DRAFT",
    },
  ];

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

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Cotizaciones</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.value);
            setPage(1);
          }}
          options={statusFilterOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Estado"
          style={{ minWidth: "160px" }}
        />
        <Dropdown
          value={filterType}
          onChange={(e) => {
            setFilterType(e.value);
            setPage(1);
          }}
          options={typeFilterOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Tipo"
          style={{ minWidth: "160px" }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar..."
            style={{ width: "220px" }}
          />
        </span>
        <CreateButton
          label="Nueva Cotización"
          onClick={openNew}
          tooltip="Crear nueva cotización"
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
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
        <DataTable
          value={quotes}
          header={header}
          loading={loading}
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={(page - 1) * limit}
          onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
          rowsPerPageOptions={[10, 20, 50]}
          scrollable
          sortMode="multiple"
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
            header="Acciones"
            body={actionsBody}
            style={{ width: "90px", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
            frozen
            alignFrozen="right"
          />
        </DataTable>
      </motion.div>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setEditQuote(null);
        }}
        onConfirm={handleDelete}
        itemName={editQuote?.title || "esta cotización"}
        isDeleting={isDeleting}
      />

      <Dialog
        visible={formDialog}
        onHide={() => {
          setFormDialog(false);
          setEditQuote(null);
        }}
        modal
        maximizable
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-file-edit mr-3 text-primary text-3xl"></i>
                {editQuote ? "Editar Cotización" : "Nueva Cotización"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="quote-form"
            onCancel={() => {
              setFormDialog(false);
              setEditQuote(null);
            }}
            isSubmitting={isSubmitting}
            isUpdate={!!editQuote}
            submitLabel={editQuote ? "Guardar Cambios" : "Crear Cotización"}
          />
        }
      >
        <QuoteForm
          quote={editQuote}
          formId="quote-form"
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

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
