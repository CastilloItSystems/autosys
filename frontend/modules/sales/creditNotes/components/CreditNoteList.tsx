"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";
import creditNoteService from "../services/creditNoteService";
import { useCreditNotesData } from "../hooks/useCreditNotesData";
import {
  CreditNote,
  CreditNoteStatus,
  CREDIT_NOTE_STATUS_CONFIG,
} from "../interfaces/creditNote.interface";
import dynamic from "next/dynamic";

const CreditNotePDFPreview = dynamic(() => import("./CreditNotePDFPreview"), {
  ssr: false,
});

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  VES: "Bs.",
};

const formatAmount = (value: number | string, currency = "USD") => {
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";
  return `${sym} ${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatCrossRef = (
  total: number,
  currency: string,
  exchangeRate?: number | null,
) => {
  const rate = Number(exchangeRate);
  if (!rate || rate <= 0) return null;
  if (currency === "VES") {
    return `≈ $ ${(total / rate).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }
  return `≈ Bs. ${(total * rate).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const CreditNoteListContent = () => {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cancelDialog, setCancelDialog] = useState(false);
  const [pdfItem, setPdfItem] = useState<CreditNote | null>(null);
  const [selectedNote, setSelectedNote] = useState<CreditNote | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const toast = useRef<Toast | null>(null);
  const dt = useRef(null);

  const listParams = useMemo(
    () => ({
      page: page + 1,
      limit: rows,
      search: debouncedSearch || undefined,
      sortBy: sortField,
      sortOrder,
    }),
    [page, rows, debouncedSearch, sortField, sortOrder],
  );

  const { creditNotes, total: totalRecords, loading, mutate } =
    useCreditNotesData(listParams);

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(globalFilterValue),
      500,
    );
    return () => clearTimeout(handler);
  }, [globalFilterValue]);

  const onPageChange = (event: any) => {
    setPage(
      event.page !== undefined
        ? event.page
        : Math.floor(event.first / event.rows),
    );
    setRows(event.rows);
  };

  const onSort = (event: any) => {
    const newField = event.sortField;
    const newOrder = event.sortOrder === 1 ? "asc" : "desc";
    if (newField !== sortField || newOrder !== sortOrder) {
      setSortField(newField);
      setSortOrder(newOrder as "asc" | "desc");
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openCancelDialog = (note: CreditNote) => {
    setSelectedNote(note);
    setCancelReason("");
    setCancelDialog(true);
  };

  const handleCancel = async () => {
    if (!selectedNote || !cancelReason.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "El motivo de anulación es obligatorio",
        life: 3000,
      });
      return;
    }
    setCancelLoading(true);
    try {
      await creditNoteService.cancel(selectedNote.id, cancelReason.trim());
      await mutate();
      toast.current?.show({
        severity: "success",
        summary: "Anulada",
        detail: `Nota de crédito ${selectedNote.creditNoteNumber} anulada`,
        life: 3000,
      });
      setCancelDialog(false);
      setSelectedNote(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setCancelLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Notas de Crédito</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <span className="p-input-icon-left w-full sm:w-20rem">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => {
            setGlobalFilterValue(e.target.value);
            setPage(0);
          }}
          placeholder="Buscar (nro nota, cliente...)"
          className="w-full"
        />
      </span>
    </div>
  );

  const statusBodyTemplate = (rowData: CreditNote) => {
    const cfg = CREDIT_NOTE_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={cfg.label}
        severity={cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const customerBodyTemplate = (rowData: CreditNote) => (
    <div className="flex flex-column">
      <span className="font-semibold text-900 text-sm">
        {rowData.customer?.name || "—"}
      </span>
      {rowData.customer?.taxId && (
        <span className="text-xs text-500">{rowData.customer.taxId}</span>
      )}
    </div>
  );

  const totalBodyTemplate = (rowData: CreditNote) => {
    const crossRef = formatCrossRef(
      Number(rowData.total),
      rowData.currency,
      rowData.exchangeRate,
    );
    return (
      <div className="flex flex-column align-items-end gap-1">
        <span className="font-semibold">
          {formatAmount(rowData.total, rowData.currency)}
        </span>
        {crossRef && <span className="text-xs text-500">{crossRef}</span>}
      </div>
    );
  };

  const currencyBodyTemplate = (rowData: CreditNote) => (
    <Tag
      value={rowData.currency || "USD"}
      severity={
        rowData.currency === "VES"
          ? "warning"
          : rowData.currency === "EUR"
          ? "contrast"
          : "info"
      }
      className="text-xs"
    />
  );

  const dateBodyTemplate = (rowData: CreditNote) =>
    formatDate(rowData.issuedAt);

  const actionBodyTemplate = (rowData: CreditNote) => (
    <div className="flex gap-1 flex-nowrap justify-content-center">
      <Button
        icon="pi pi-print"
        className="p-button-rounded p-button-secondary p-button-sm"
        tooltip="Imprimir PDF"
        tooltipOptions={{ position: "top" }}
        onClick={() => setPdfItem(rowData)}
      />
      {rowData.status === CreditNoteStatus.ACTIVE && (
        <Button
          icon="pi pi-ban"
          className="p-button-rounded p-button-danger p-button-sm"
          tooltip="Anular nota de crédito"
          tooltipOptions={{ position: "top" }}
          onClick={() => openCancelDialog(rowData)}
        />
      )}
    </div>
  );

  const rowExpansionTemplate = (data: CreditNote) => {
    const noteItems = data.items || [];
    return (
      <div className="p-3">
        <div className="grid mb-3">
          <div className="col-12 md:col-3">
            <div className="surface-100 border-round p-3">
              <span className="text-500 text-sm">Factura Vinculada</span>
              <div className="font-bold text-900">
                {data.invoice?.invoiceNumber || "—"}
              </div>
              {data.invoice?.fiscalNumber && (
                <div className="text-xs text-500 font-mono">
                  {data.invoice.fiscalNumber}
                </div>
              )}
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-100 border-round p-3">
              <span className="text-500 text-sm">Cliente</span>
              <div className="font-bold text-900">
                {data.customer?.name || "—"}
              </div>
              {data.customer?.taxId && (
                <div className="text-xs text-500">{data.customer.taxId}</div>
              )}
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-100 border-round p-3">
              <span className="text-500 text-sm">Emitido por</span>
              <div className="font-bold text-900">
                {data.issuedByName || data.issuedBy || "—"}
              </div>
              <div className="text-xs text-500">{formatDate(data.issuedAt)}</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-100 border-round p-3">
              <span className="text-500 text-sm">Moneda / Tasa</span>
              <div className="flex align-items-center gap-2 mt-1">
                <Tag
                  value={data.currency || "USD"}
                  severity={
                    data.currency === "VES"
                      ? "warning"
                      : data.currency === "EUR"
                      ? "contrast"
                      : "info"
                  }
                />
                {data.exchangeRate && data.currency !== "VES" && (
                  <span className="text-xs text-500">
                    1 {data.currency} = Bs.{" "}
                    {Number(data.exchangeRate).toFixed(4)}
                  </span>
                )}
                {data.currency === "VES" && data.exchangeRate && (
                  <span className="text-xs text-500">
                    1 USD = Bs. {Number(data.exchangeRate).toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {data.reason && (
          <div className="mb-3 p-3 surface-50 border-round border-1 surface-border">
            <span className="text-500 text-sm font-semibold">Motivo: </span>
            <span className="text-900 text-sm">{data.reason}</span>
          </div>
        )}

        {data.status === CreditNoteStatus.CANCELLED && (
          <div className="mb-3 p-3 bg-red-50 border-round border-1 border-red-200">
            <div className="flex align-items-center gap-2 mb-1">
              <i className="pi pi-ban text-red-500" />
              <span className="font-semibold text-red-700 text-sm">
                Nota de Crédito Anulada
              </span>
              <span className="text-red-500 text-xs ml-auto">
                {formatDate(data.cancelledAt)}
              </span>
            </div>
            {data.cancelledByName && (
              <div className="text-red-500 text-xs mb-1">
                Por: {data.cancelledByName}
              </div>
            )}
            {data.cancellationReason && (
              <div className="text-red-600 text-sm">
                Motivo: {data.cancellationReason}
              </div>
            )}
          </div>
        )}

        {noteItems.length > 0 && (
          <div
            style={{
              border: "1px solid var(--surface-300)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 8px",
                backgroundColor: "var(--surface-100)",
                borderBottom: "2px solid var(--surface-300)",
              }}
            >
              {[
                { label: "Artículo", style: { flex: "1 1 0", minWidth: 0 } },
                { label: "Cant.", style: { width: "4rem", textAlign: "center" as const } },
                { label: "Precio", style: { width: "5rem", textAlign: "right" as const } },
                { label: "Desc.%", style: { width: "4rem", textAlign: "center" as const } },
                { label: "Impuesto", style: { width: "5rem", textAlign: "center" as const } },
                { label: "Total Línea", style: { width: "6rem", textAlign: "right" as const } },
              ].map((col, i) => (
                <div
                  key={i}
                  style={{
                    ...col.style,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "var(--text-color-secondary)",
                    userSelect: "none",
                    flexShrink: 0,
                  }}
                >
                  {col.label}
                </div>
              ))}
            </div>
            {noteItems.map((line) => (
              <div
                key={line.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderBottom: "1px solid var(--surface-200)",
                }}
              >
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <div className="font-medium text-900" style={{ fontSize: "0.8rem" }}>
                    {line.item?.code || "—"}
                  </div>
                  <div
                    className="text-500"
                    style={{
                      fontSize: "0.7rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {line.itemName || line.item?.name || "Sin nombre"}
                  </div>
                </div>
                <div style={{ width: "4rem", textAlign: "center", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>
                  {line.quantity}
                </div>
                <div style={{ width: "5rem", textAlign: "right", fontSize: "0.8rem", flexShrink: 0 }}>
                  {formatAmount(line.unitPrice, data.currency)}
                </div>
                <div style={{ width: "4rem", textAlign: "center", fontSize: "0.8rem", flexShrink: 0 }}>
                  {Number(line.discountPercent) > 0 ? `${line.discountPercent}%` : "—"}
                </div>
                <div style={{ width: "5rem", textAlign: "center", flexShrink: 0 }}>
                  <Tag
                    value={
                      line.taxType === "EXEMPT"
                        ? "Exento"
                        : line.taxType === "REDUCED"
                        ? "Red. 8%"
                        : "IVA 16%"
                    }
                    severity={line.taxType === "EXEMPT" ? "warning" : "info"}
                    className="text-xs"
                  />
                </div>
                <div style={{ width: "6rem", textAlign: "right", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>
                  {formatAmount(line.totalLine, data.currency)}
                </div>
              </div>
            ))}
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--surface-50)",
                borderTop: "2px solid var(--surface-300)",
                fontSize: "0.8rem",
              }}
            >
              <div className="flex justify-content-end gap-3 flex-wrap">
                <span className="text-500">
                  Subtotal: <b>{formatAmount(data.subtotalBruto, data.currency)}</b>
                </span>
                {Number(data.discountAmount) > 0 && (
                  <span className="text-orange-500">
                    Desc.: <b>-{formatAmount(data.discountAmount, data.currency)}</b>
                  </span>
                )}
                <span className="text-blue-500">
                  IVA: <b>{formatAmount(data.taxAmount, data.currency)}</b>
                </span>
                {data.igtfApplies && (
                  <span className="text-purple-500">
                    IGTF: <b>{formatAmount(data.igtfAmount, data.currency)}</b>
                  </span>
                )}
                <span className="text-primary font-bold">
                  Total: {formatAmount(data.total, data.currency)}
                </span>
              </div>
              {formatCrossRef(Number(data.total), data.currency, data.exchangeRate) && (
                <div className="flex justify-content-end mt-1">
                  <span className="text-xs text-500">
                    {formatCrossRef(Number(data.total), data.currency, data.exchangeRate)}
                    {data.exchangeRate && (
                      <span className="ml-1">
                        (tasa: 1 {data.currency === "VES" ? "USD" : data.currency} = Bs.{" "}
                        {Number(data.exchangeRate).toFixed(4)})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={creditNotes}
          header={renderHeader()}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          onSort={onSort}
          sortField={sortField}
          sortOrder={sortOrder === "asc" ? 1 : -1}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} notas de crédito"
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage="No hay notas de crédito"
          size="small"
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          tableStyle={{ minWidth: "65rem" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column field="creditNoteNumber" header="Nro. Nota" sortable />
          <Column header="Estado" body={statusBodyTemplate} />
          <Column header="Cliente" body={customerBodyTemplate} />
          <Column
            header="Moneda"
            body={currencyBodyTemplate}
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column
            header="Total"
            body={totalBodyTemplate}
            sortable
            sortField="total"
            headerStyle={{ textAlign: "right" }}
            style={{ textAlign: "right" }}
          />
          <Column
            header="Emisión"
            body={dateBodyTemplate}
            sortable
            sortField="issuedAt"
          />
          <Column
            header=""
            body={actionBodyTemplate}
            style={{ width: "4rem", textAlign: "center" }}
          />
        </DataTable>
      </motion.div>

      <Dialog
        visible={cancelDialog}
        style={{ width: "500px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-red-500 pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-ban mr-3 text-red-500 text-3xl"></i>
                Anular Nota de Crédito
              </h2>
            </div>
          </div>
        }
        modal
        onHide={() => {
          setCancelDialog(false);
          setSelectedNote(null);
        }}
        footer={
          <div className="flex w-full gap-2 mb-4">
            <Button
              label="No"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => {
                setCancelDialog(false);
                setSelectedNote(null);
              }}
              type="button"
              className="flex-1"
            />
            <Button
              label="Sí, Anular"
              icon="pi pi-ban"
              severity="danger"
              onClick={handleCancel}
              loading={cancelLoading}
              disabled={!cancelReason.trim()}
              type="button"
              className="flex-1"
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 p-2">
          <div className="flex align-items-center gap-3 p-2 surface-100 border-round">
            <i className="pi pi-exclamation-triangle text-orange-500 text-2xl" />
            <div>
              <span>
                ¿Anular la nota de crédito{" "}
                <b>{selectedNote?.creditNoteNumber}</b>?
              </span>
              <div className="text-xs text-500 mt-1">
                La nota de crédito quedará registrada como anulada.
              </div>
            </div>
          </div>
          <div className="flex flex-column gap-1">
            <label className="text-sm font-semibold text-600">
              Motivo de anulación <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Ingrese el motivo de la anulación..."
              className="w-full"
              autoResize
            />
          </div>
        </div>
      </Dialog>

      {pdfItem && (
        <Dialog
          visible
          onHide={() => setPdfItem(null)}
          header="Vista Previa — Nota de Crédito"
          style={{ width: "85%", height: "90vh" }}
          contentStyle={{ padding: 0, height: "100%" }}
          modal
        >
          <CreditNotePDFPreview data={pdfItem} />
        </Dialog>
      )}
    </>
  );
};

export default CreditNoteListContent;
