"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { motion } from "framer-motion";
import FormActionButtons from "@/shared/components/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";
import { handleFormError } from "@/utils/errorHandlers";
import { exchangeRateService } from "@/app/api/finance";
import type {
  ExchangeRate,
  ExchangeRateSource,
  CurrencyCode,
} from "@/libs/interfaces/finance";
import ExchangeRateForm from "./ExchangeRateForm";

const SOURCE_OPTIONS = [
  { label: "Todas las fuentes", value: "" },
  { label: "BCV", value: "BCV" },
  { label: "Manual", value: "MANUAL" },
  { label: "Paralelo", value: "PARALLEL" },
];

const CURRENCY_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "USD", value: "USD" },
  { label: "VES", value: "VES" },
  { label: "EUR", value: "EUR" },
];

const SOURCE_SEVERITY: Record<
  ExchangeRateSource,
  "success" | "info" | "warning"
> = {
  BCV: "success",
  MANUAL: "info",
  PARALLEL: "warning",
};

const fmtRate = (v: number) =>
  v.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

const fmtDate = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export default function ExchangeRateList() {
  const [items, setItems] = useState<ExchangeRate[]>([]);
  const [activeRates, setActiveRates] = useState<ExchangeRate[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [actionItem, setActionItem] = useState<ExchangeRate | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ExchangeRateSource | "">("");
  const [fromFilter, setFromFilter] = useState<CurrencyCode | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [bcvLoading, setBcvLoading] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editItem, setEditItem] = useState<ExchangeRate | null>(null);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exchangeRateService.getAll({
        source: sourceFilter || undefined,
        fromCurrency: fromFilter || undefined,
        page: page + 1,
        limit: rows,
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar las tasas",
      });
    } finally {
      setLoading(false);
    }
  }, [page, rows, sourceFilter, fromFilter]);

  const loadActiveRates = useCallback(async () => {
    try {
      const res = await exchangeRateService.getActive();
      setActiveRates(res.data ?? []);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadActiveRates();
  }, [loadActiveRates]);

  const handlePage = (e: DataTablePageEvent) => {
    setPage(e.first / e.rows);
    setRows(e.rows);
  };

  const handleFetchBcv = async () => {
    setBcvLoading(true);
    try {
      const res = await exchangeRateService.fetchBcv();
      const count = Array.isArray(res.data) ? res.data.length : 0;
      toast.current?.show({
        severity: "success",
        summary: "BCV actualizado",
        detail: `${count} tasa(s) obtenidas del BCV`,
      });
      load();
      loadActiveRates();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setBcvLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await exchangeRateService.delete(id);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Tasa eliminada correctamente",
      });
      load();
      loadActiveRates();
    } catch (err) {
      handleFormError(err, toast);
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setFormDialog(true);
  };

  const openEdit = (item: ExchangeRate) => {
    setEditItem(item);
    setFormDialog(true);
  };

  const onSave = () => {
    setFormDialog(false);
    toast.current?.show({
      severity: "success",
      summary: editItem ? "Actualizado" : "Creado",
      detail: editItem
        ? "Tasa actualizada correctamente"
        : "Tasa manual registrada",
    });
    load();
    loadActiveRates();
  };

  const menuItems = (item: ExchangeRate) => {
    const isManual = item.source === "MANUAL";
    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => openEdit(item),
        disabled: !isManual,
      },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "text-red-500",
        command: (e: any) =>
          confirmAction({
            target: (e?.originalEvent?.currentTarget ??
              e?.originalEvent?.target) as EventTarget & HTMLElement,
            message: "¿Eliminar esta tasa manual?",
            onAccept: () => handleDelete(item.id),
          }),
        disabled: !isManual,
      },
    ];
  };

  // Active rate cards
  const usdVes = activeRates.find(
    (r) => r.fromCurrency === "USD" && r.toCurrency === "VES",
  );
  const eurVes = activeRates.find(
    (r) => r.fromCurrency === "EUR" && r.toCurrency === "VES",
  );

  const formDialogHeader = (
    <div className="flex align-items-center gap-2 border-bottom-2 border-primary pb-2">
      <i className="pi pi-sync text-primary text-xl" />
      <span className="font-semibold text-lg">
        {editItem ? "Editar Tasa Manual" : "Nueva Tasa Manual"}
      </span>
    </div>
  );

  const formDialogFooter = (
    <FormActionButtons
      formId="exchange-rate-form"
      isSubmitting={isSubmitting}
      onCancel={() => setFormDialog(false)}
    />
  );

  return (
    <div className="flex flex-column gap-3">
      <Toast ref={toast} />
      <ConfirmActionPopup />

      {/* Active rate cards */}
      <div className="grid">
        {[
          { label: "USD / VES", rate: usdVes },
          { label: "EUR / VES", rate: eurVes },
        ].map(({ label, rate }) => (
          <div key={label} className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex align-items-center justify-content-between">
                <div>
                  <div className="text-500 text-sm mb-1">{label} — Hoy</div>
                  {rate ? (
                    <>
                      <div className="text-2xl font-bold text-900">
                        {fmtRate(Number(rate.rate))}
                      </div>
                      <Tag
                        value={rate.source}
                        severity={SOURCE_SEVERITY[rate.source]}
                        className="mt-1"
                      />
                    </>
                  ) : (
                    <div className="text-400 text-sm">Sin tasa activa</div>
                  )}
                </div>
                <i className="pi pi-chart-line text-4xl text-300" />
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Filters & actions */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap align-items-center gap-2"
      >
        <InputText
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar..."
          className="p-inputtext-sm"
          style={{ width: 200 }}
        />
        <Dropdown
          value={sourceFilter}
          options={SOURCE_OPTIONS}
          onChange={(e) => {
            setSourceFilter(e.value);
            setPage(0);
          }}
          placeholder="Fuente"
          className="p-inputtext-sm"
          style={{ width: 160 }}
        />
        <Dropdown
          value={fromFilter}
          options={CURRENCY_OPTIONS}
          onChange={(e) => {
            setFromFilter(e.value);
            setPage(0);
          }}
          placeholder="Moneda"
          className="p-inputtext-sm"
          style={{ width: 130 }}
        />
        <div className="flex-1" />
        <Button
          label="Obtener Tasa BCV"
          icon={bcvLoading ? "pi pi-spin pi-spinner" : "pi pi-download"}
          severity="secondary"
          size="small"
          onClick={handleFetchBcv}
          disabled={bcvLoading}
        />
        <CreateButton label="Nueva Tasa Manual" onClick={openCreate} />
      </motion.div>

      {/* DataTable */}
      <DataTable
        value={items}
        lazy
        paginator
        rows={rows}
        first={page * rows}
        totalRecords={totalRecords}
        onPage={handlePage}
        loading={loading}
        rowsPerPageOptions={[10, 20, 50]}
        emptyMessage="No se encontraron tasas de cambio"
        className="p-datatable-sm"
        stripedRows
      >
        <Column
          header="Fecha"
          body={(r: ExchangeRate) => fmtDate(r.rateDate)}
          style={{ minWidth: 110 }}
        />
        <Column
          header="Par"
          body={(r: ExchangeRate) => (
            <span className="font-semibold">
              {r.fromCurrency} / {r.toCurrency}
            </span>
          )}
          style={{ minWidth: 90 }}
        />
        <Column
          header="Tasa"
          body={(r: ExchangeRate) => (
            <span className="font-mono">{fmtRate(Number(r.rate))}</span>
          )}
          style={{ minWidth: 120 }}
        />
        <Column
          header="Fuente"
          body={(r: ExchangeRate) => (
            <Tag value={r.source} severity={SOURCE_SEVERITY[r.source]} />
          )}
          style={{ minWidth: 100 }}
        />
        <Column
          header="Estado"
          body={(r: ExchangeRate) => (
            <Tag
              value={r.isActive ? "Activa" : "Inactiva"}
              severity={r.isActive ? "success" : "secondary"}
            />
          )}
          style={{ minWidth: 90 }}
        />
        <Column
          header=""
          body={(r: ExchangeRate) => (
            <>
              <Menu
                ref={(el) => {
                  if (actionItem?.id === r.id) menuRef.current = el;
                }}
                model={menuItems(r)}
                popup
              />
              <Button
                icon="pi pi-cog"
                rounded
                text
                severity="secondary"
                size="small"
                onClick={(e) => {
                  setActionItem(r);
                  menuRef.current?.toggle(e);
                }}
              />
            </>
          )}
          style={{ width: 60 }}
        />
      </DataTable>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        onHide={() => setFormDialog(false)}
        header={formDialogHeader}
        footer={formDialogFooter}
        style={{ width: "480px" }}
        modal
        draggable={false}
      >
        <ExchangeRateForm
          exchangeRate={editItem}
          formId="exchange-rate-form"
          onSave={onSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>
    </div>
  );
}
