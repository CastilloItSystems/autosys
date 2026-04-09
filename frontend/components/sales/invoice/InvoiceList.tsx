"use client";
import React, { useEffect, useRef, useState } from "react";
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
import invoiceService from "@/app/api/sales/invoiceService";
import {
  Invoice,
  InvoiceStatus,
  INVOICE_STATUS_CONFIG,
} from "@/libs/interfaces/sales/invoice.interface";
import {
  PAYMENT_METHOD_CONFIG,
  PaymentMethod,
} from "@/libs/interfaces/sales/payment.interface";

const formatCurrency = (value: number | string) =>
  `$${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const toast = useRef<Toast | null>(null);
  const dt = useRef(null);

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(globalFilterValue),
      500,
    );
    return () => clearTimeout(handler);
  }, [globalFilterValue]);

  useEffect(() => {
    loadInvoices();
  }, [page, rows, sortField, sortOrder, debouncedSearch]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getAll({
        page: page + 1,
        limit: rows,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
      });
      setInvoices(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener facturas:", error);
    } finally {
      setLoading(false);
    }
  };

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

  /* ── Cancel ── */
  const openCancelDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCancelReason("");
    setCancelDialog(true);
  };

  const handleCancel = async () => {
    if (!selectedInvoice || !cancelReason.trim()) {
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
      await invoiceService.cancel(selectedInvoice.id, cancelReason.trim());
      await loadInvoices();
      toast.current?.show({
        severity: "success",
        summary: "Anulada",
        detail: `Factura ${selectedInvoice.invoiceNumber} anulada`,
        life: 3000,
      });
      setCancelDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setCancelLoading(false);
    }
  };

  /* ── Header ── */
  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Facturas</h4>
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
          placeholder="Buscar (nro factura, fiscal, cliente...)"
          className="w-full"
        />
      </span>
    </div>
  );

  /* ── Column templates ── */
  const statusBodyTemplate = (rowData: Invoice) => {
    const cfg = INVOICE_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={cfg.label}
        severity={cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const customerBodyTemplate = (rowData: Invoice) => (
    <div className="flex flex-column">
      <span className="font-semibold text-900 text-sm">
        {rowData.customer?.name || "—"}
      </span>
      {rowData.customer?.taxId && (
        <span className="text-xs text-500">{rowData.customer.taxId}</span>
      )}
    </div>
  );

  const totalBodyTemplate = (rowData: Invoice) => (
    <span className="font-semibold">{formatCurrency(rowData.total)}</span>
  );

  const dateBodyTemplate = (rowData: Invoice) =>
    formatDate(rowData.invoiceDate);

  const fiscalBodyTemplate = (rowData: Invoice) => (
    <span className="text-sm font-mono">
      {rowData.fiscalNumber || "—"}
    </span>
  );

  const actionBodyTemplate = (rowData: Invoice) => {
    if (rowData.status !== InvoiceStatus.ACTIVE) return null;
    return (
      <Button
        icon="pi pi-ban"
        className="p-button-rounded p-button-danger p-button-sm"
        tooltip="Anular factura"
        tooltipOptions={{ position: "top" }}
        onClick={() => openCancelDialog(rowData)}
      />
    );
  };

  /* ── Row expansion ── */
  const rowExpansionTemplate = (data: Invoice) => {
    const invItems = data.items || [];
    return (
      <div className="p-3">
        {/* Info cards */}
        <div className="grid mb-3">
          <div className="col-12 md:col-3">
            <div className="surface-100 border-round p-3">
              <span className="text-500 text-sm">Nro. Control Fiscal</span>
              <div className="font-bold text-900 text-lg font-mono">
                {data.fiscalNumber || "—"}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-100 border-round p-3">
              <span className="text-500 text-sm">Orden</span>
              <div className="font-bold text-900">
                {data.preInvoice?.order?.orderNumber || "—"}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-100 border-round p-3">
              <span className="text-500 text-sm">Pre-factura</span>
              <div className="font-bold text-900">
                {data.preInvoice?.preInvoiceNumber || "—"}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-100 border-round p-3">
              <span className="text-500 text-sm">Pago</span>
              <div className="font-bold text-900">
                {data.payment?.paymentNumber || "—"}
                {data.payment?.method && (
                  <span className="text-xs text-500 ml-2">
                    (
                    {PAYMENT_METHOD_CONFIG[
                      data.payment.method as PaymentMethod
                    ]?.label || data.payment.method}
                    )
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation info */}
        {data.status === InvoiceStatus.CANCELLED && (
          <div className="mb-3 p-3 bg-red-50 border-round border-1 border-red-200">
            <div className="flex align-items-center gap-2 mb-1">
              <i className="pi pi-ban text-red-500" />
              <span className="font-semibold text-red-700 text-sm">
                Factura Anulada
              </span>
              <span className="text-red-500 text-xs ml-auto">
                {formatDate(data.cancelledAt)}
              </span>
            </div>
            {data.cancellationReason && (
              <div className="text-red-600 text-sm">
                Motivo: {data.cancellationReason}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        {invItems.length > 0 && (
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
                {
                  label: "Cant.",
                  style: { width: "4rem", textAlign: "center" as const },
                },
                {
                  label: "Precio",
                  style: { width: "5rem", textAlign: "right" as const },
                },
                {
                  label: "Desc.%",
                  style: { width: "4rem", textAlign: "center" as const },
                },
                {
                  label: "Impuesto",
                  style: { width: "5rem", textAlign: "center" as const },
                },
                {
                  label: "Total Línea",
                  style: { width: "6rem", textAlign: "right" as const },
                },
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
            {invItems.map((line) => (
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
                  <div
                    className="font-medium text-900"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {line.item?.sku || "—"}
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
                <div
                  style={{
                    width: "4rem",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {line.quantity}
                </div>
                <div
                  style={{
                    width: "5rem",
                    textAlign: "right",
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  {formatCurrency(line.unitPrice)}
                </div>
                <div
                  style={{
                    width: "4rem",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  {Number(line.discountPercent) > 0
                    ? `${line.discountPercent}%`
                    : "—"}
                </div>
                <div
                  style={{
                    width: "5rem",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  <Tag
                    value={
                      line.taxType === "EXEMPT"
                        ? "Exento"
                        : line.taxType === "REDUCED"
                          ? "Red. 8%"
                          : "IVA 16%"
                    }
                    severity={
                      line.taxType === "EXEMPT" ? "warning" : "info"
                    }
                    className="text-xs"
                  />
                </div>
                <div
                  style={{
                    width: "6rem",
                    textAlign: "right",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {formatCurrency(line.totalLine)}
                </div>
              </div>
            ))}
            {/* Totals footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                padding: "8px",
                backgroundColor: "var(--surface-50)",
                borderTop: "2px solid var(--surface-300)",
                fontSize: "0.8rem",
              }}
            >
              <span className="text-500">
                Subtotal: <b>{formatCurrency(data.subtotalBruto)}</b>
              </span>
              {Number(data.discountAmount) > 0 && (
                <span className="text-orange-500">
                  Desc: <b>-{formatCurrency(data.discountAmount)}</b>
                </span>
              )}
              <span className="text-blue-500">
                IVA: <b>{formatCurrency(data.taxAmount)}</b>
              </span>
              {data.igtfApplies && (
                <span className="text-purple-500">
                  IGTF: <b>{formatCurrency(data.igtfAmount)}</b>
                </span>
              )}
              <span className="text-primary font-bold">
                Total: {formatCurrency(data.total)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Render ── */
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
          value={invoices}
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
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} facturas"
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage="No hay facturas"
          size="small"
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          tableStyle={{ minWidth: "65rem" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            field="invoiceNumber"
            header="Nro. Factura"
            sortable
          />
          <Column
            header="Control Fiscal"
            body={fiscalBodyTemplate}
            sortable
            sortField="fiscalNumber"
          />
          <Column header="Estado" body={statusBodyTemplate} />
          <Column header="Cliente" body={customerBodyTemplate} />
          <Column
            header="Total"
            body={totalBodyTemplate}
            sortable
            sortField="total"
          />
          <Column
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            sortField="invoiceDate"
          />
          <Column
            header=""
            body={actionBodyTemplate}
            style={{ width: "4rem", textAlign: "center" }}
          />
        </DataTable>
      </motion.div>

      {/* Cancel dialog */}
      <Dialog
        visible={cancelDialog}
        style={{ width: "500px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-red-500 pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-ban mr-3 text-red-500 text-3xl"></i>
                Anular Factura
              </h2>
            </div>
          </div>
        }
        modal
        onHide={() => {
          setCancelDialog(false);
          setSelectedInvoice(null);
        }}
        footer={
          <div className="flex w-full gap-2 mb-4">
            <Button
              label="No"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => {
                setCancelDialog(false);
                setSelectedInvoice(null);
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
                ¿Anular la factura{" "}
                <b>{selectedInvoice?.invoiceNumber}</b>?
              </span>
              <div className="text-xs text-500 mt-1">
                La factura quedará registrada como anulada (SENIAT no
                permite eliminar).
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
    </>
  );
};

export default InvoiceList;
