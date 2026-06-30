"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";
import preInvoiceService from "../services/preInvoiceService";
import { usePreInvoicesData } from "../hooks/usePreInvoicesData";
import { usePreInvoicePaymentsData } from "@/modules/sales/payments/hooks/usePaymentsData";
import {
  PreInvoice,
  PreInvoiceStatus,
  PREINVOICE_STATUS_CONFIG,
} from "../interfaces/preInvoice.interface";
import {
  PAYMENT_METHOD_CONFIG,
} from "@/modules/sales/payments/interfaces/payment.interface";
import PreInvoiceStepper from "./PreInvoiceStepper";
import ApprovalTrail from "@/modules/sales/shared/components/ApprovalTrail";
import AuditTimeline from "@/modules/sales/shared/components/AuditTimeline";
import PaymentDialog from "@/modules/sales/payments/components/PaymentDialog";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";
import dynamic from "next/dynamic";
import { Dialog } from "primereact/dialog";
import { CURRENCY_SYMBOLS } from "@/utils/currencyFormat";

const PreInvoicePDFPreview = dynamic(
  () => import("./PreInvoicePDFPreview"),
  { ssr: false }
);

const formatAmount = (value: number | string, currency = "USD") => {
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";
  return `${sym} ${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Cross-reference amount in the opposite currency.
 * Both directions use the stored exchangeRate (always X currency / VES).
 * - USD/EUR doc → total × exchangeRate → Bs.
 * - VES doc     → total ÷ exchangeRate → USD
 * currentUsdRate is only a fallback for VES docs missing stored rate.
 */
const formatCrossRef = (
  total: number,
  currency: string,
  exchangeRate?: number | null,
  currentUsdRate?: number | null,
): string | null => {
  const n = Number(total || 0);
  if (currency === "VES") {
    const rate = Number(exchangeRate) || Number(currentUsdRate);
    if (!rate || rate <= 0) return null;
    const usd = n / rate;
    return `≈ $ ${usd.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }
  const rate = Number(exchangeRate);
  if (!rate || rate <= 0) return null;
  const ves = n * rate;
  return `≈ Bs. ${ves.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const PreInvoicePaymentsSection = ({
  preInvoice,
}: {
  preInvoice: PreInvoice;
}) => {
  const { payments } = usePreInvoicePaymentsData(preInvoice.id);
  const piPayments = payments.filter((p) => p.status === "COMPLETED");
  if (piPayments.length === 0) return null;

  const totalPaid = piPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = Math.max(0, Number(preInvoice.total) - totalPaid);

  return (
    <div
      className="mt-3"
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
          justifyContent: "space-between",
          padding: "8px 12px",
          backgroundColor: "var(--green-50)",
          borderBottom: "2px solid var(--surface-300)",
        }}
      >
        <div className="flex align-items-center gap-2">
          <i className="pi pi-wallet text-green-600" />
          <span
            className="font-bold text-green-700"
            style={{ fontSize: "0.85rem" }}
          >
            Pagos ({piPayments.length})
          </span>
        </div>
        <div className="flex gap-3" style={{ fontSize: "0.8rem" }}>
          <span className="text-green-600">
            Pagado: <b>{formatAmount(totalPaid, preInvoice.currency)}</b>
          </span>
          {pending > 0 && (
            <span className="text-orange-500">
              Pendiente: <b>{formatAmount(pending, preInvoice.currency)}</b>
            </span>
          )}
        </div>
      </div>
      {piPayments.map((payment) => {
        const methodCfg =
          PAYMENT_METHOD_CONFIG[
            payment.method as keyof typeof PAYMENT_METHOD_CONFIG
          ];
        return (
          <div
            key={payment.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderBottom: "1px solid var(--surface-200)",
              fontSize: "0.8rem",
            }}
          >
            <i
              className={`${methodCfg?.icon} ${methodCfg?.color}`}
              style={{ width: "1.2rem" }}
            />
            <span className="text-600" style={{ width: "8rem" }}>
              {payment.paymentNumber}
            </span>
            <span style={{ width: "7rem" }}>
              {methodCfg?.label || payment.method}
            </span>
            <span className="font-semibold" style={{ width: "6rem" }}>
              {formatAmount(payment.amount, preInvoice.currency)}
            </span>
            {payment.reference && (
              <span className="text-500 text-xs">
                Ref: {payment.reference}
              </span>
            )}
            {Number(payment.igtfAmount) > 0 && (
              <Tag
                value={`IGTF +${formatAmount(
                  payment.igtfAmount,
                  preInvoice.currency,
                )}`}
                severity="warning"
                className="text-xs ml-auto"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const PreInvoiceListContent = () => {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentPreInvoice, setPaymentPreInvoice] = useState<PreInvoice | null>(
    null,
  );
  const [pdfItem, setPdfItem] = useState<PreInvoice | null>(null);
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
  const { preInvoices, total: totalRecords, loading, mutate } =
    usePreInvoicesData(listParams);
  const {
    payments: existingPayments,
    mutate: mutateSelectedPayments,
  } = usePreInvoicePaymentsData(paymentPreInvoice?.id);

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

  /* ── Actions ── */
  const handleStartPreparation = async (pi: PreInvoice) => {
    try {
      await preInvoiceService.startPreparation(pi.id);
      await mutate();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Preparación iniciada",
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleMarkReady = async (pi: PreInvoice) => {
    try {
      await preInvoiceService.markReady(pi.id);
      await mutate();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Lista para pago",
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const openPaymentDialog = (pi: PreInvoice) => {
    setPaymentPreInvoice(pi);
    setPaymentDialog(true);
  };

  const handlePaymentSuccess = async () => {
    await mutate();
    if (paymentPreInvoice) await mutateSelectedPayments();
    setPaymentDialog(false);
    setPaymentPreInvoice(null);
  };

  const handleRowToggle = (e: any) => {
    setExpandedRows(e.data);
  };

  const handleCancel = async (pi: PreInvoice) => {
    try {
      await preInvoiceService.cancel(pi.id);
      await mutate();
      toast.current?.show({
        severity: "success",
        summary: "Cancelada",
        detail: `Pre-factura ${pi.preInvoiceNumber} cancelada`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  /* ── Header ── */
  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Pre-Facturas</h4>
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
          placeholder="Buscar (nro, cliente, orden...)"
          className="w-full"
        />
      </span>
    </div>
  );

  /* ── Column: Actions ── */
  const actionBodyTemplate = (rowData: PreInvoice) => {
    const { status } = rowData;
    return (
      <div className="flex gap-1 flex-nowrap">
        {status === PreInvoiceStatus.PENDING_PREPARATION && (
          <Button
            icon="pi pi-play"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Iniciar Preparación"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: "¿Iniciar preparación?",
                icon: "pi pi-play",
                iconClass: "text-blue-500",
                acceptLabel: "Iniciar",
                acceptSeverity: "info",
                onAccept: () => handleStartPreparation(rowData),
              })
            }
          />
        )}
        {status === PreInvoiceStatus.IN_PREPARATION && (
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-warning p-button-sm"
            tooltip="Marcar como Lista"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: "¿Marcar como lista para pago?",
                icon: "pi pi-check",
                iconClass: "text-yellow-500",
                acceptLabel: "Marcar Lista",
                acceptSeverity: "warning",
                onAccept: () => handleMarkReady(rowData),
              })
            }
          />
        )}
        {status === PreInvoiceStatus.READY_FOR_PAYMENT && (
          <Button
            icon="pi pi-wallet"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Registrar Pago"
            tooltipOptions={{ position: "top" }}
            onClick={() => openPaymentDialog(rowData)}
          />
        )}
        <Button
          icon="pi pi-print"
          className="p-button-rounded p-button-secondary p-button-sm"
          tooltip="Imprimir PDF"
          tooltipOptions={{ position: "top" }}
          onClick={() => setPdfItem(rowData)}
        />
        {status !== PreInvoiceStatus.PAID &&
          status !== PreInvoiceStatus.CANCELLED && (
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Cancelar ${rowData.preInvoiceNumber}?`,
                  icon: "pi pi-ban",
                  iconClass: "text-red-500",
                  acceptLabel: "Sí, Cancelar",
                  acceptSeverity: "danger",
                  onAccept: () => handleCancel(rowData),
                })
              }
            />
          )}
      </div>
    );
  };

  /* ── Column templates ── */
  const statusBodyTemplate = (rowData: PreInvoice) => {
    const cfg = PREINVOICE_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={cfg.label}
        severity={cfg.severity === "help" ? "secondary" : cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const customerBodyTemplate = (rowData: PreInvoice) =>
    rowData.customer?.name || "—";

  const orderBodyTemplate = (rowData: PreInvoice) => {
    if (rowData.order?.orderNumber) return rowData.order.orderNumber;
    if (rowData.serviceOrder?.folio) return rowData.serviceOrder.folio;
    if ((rowData.consolidatedServiceOrders?.length ?? 0) > 0) {
      return `Consolidada (${rowData.consolidatedServiceOrders!.length} OTs)`;
    }
    return "—";
  };

  const totalBodyTemplate = (rowData: PreInvoice) => {
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

  const currencyBodyTemplate = (rowData: PreInvoice) => (
    <Tag
      value={rowData.currency}
      severity={
        rowData.currency === "USD"
          ? "info"
          : rowData.currency === "EUR"
          ? "contrast"
          : "warning"
      }
      className="text-xs"
    />
  );

  const dateBodyTemplate = (rowData: PreInvoice) =>
    formatDate(rowData.createdAt);

  /* ── Row expansion ── */
  const rowExpansionTemplate = (data: PreInvoice) => {
    const piItems = data.items || [];
    return (
      <div className="p-3">
        <PreInvoiceStepper currentStatus={data.status} />

        <div className="grid mt-2 mb-1">
          <div className="col-12 md:col-6">
            <ApprovalTrail
              entries={[
                {
                  label: "Aprobado por (Orden)",
                  name: data.order?.approvedByName ?? data.order?.approvedBy,
                  date: data.order?.approvedAt,
                  icon: "pi pi-check-circle",
                  refLabel: "Orden",
                  refValue: data.order?.orderNumber,
                },
                {
                  label: "Preparado por",
                  name: data.preparedByName ?? data.preparedBy,
                  date: data.preparedAt,
                  icon: "pi pi-file-edit",
                },
              ]}
            />
          </div>
          <div className="col-12 md:col-6">
            <AuditTimeline entity="PreInvoice" entityId={data.id} />
          </div>
        </div>

        {/* Info cards */}
        <div className="grid my-3">
          <div className="col-12 md:col-4">
            <div className="surface-100 border-round p-3">
              <div className="flex align-items-center gap-2 mb-1">
                <i className="pi pi-shopping-cart text-primary" />
                <span className="text-500 text-sm font-medium">Orden</span>
              </div>
              <div className="font-bold text-900">
                {data.order?.orderNumber ||
                  data.serviceOrder?.folio ||
                  ((data.consolidatedServiceOrders?.length ?? 0) > 0
                    ? `Consolidada (${
                        data.consolidatedServiceOrders!.length
                      } OTs)`
                    : "—")}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="surface-100 border-round p-3">
              <div className="flex align-items-center gap-2 mb-1">
                <i className="pi pi-user text-green-500" />
                <span className="text-500 text-sm font-medium">Cliente</span>
              </div>
              <div className="font-bold text-900">
                {data.customer?.name || "—"}
              </div>
              {data.customer?.taxId && (
                <div className="text-500 text-xs">{data.customer.taxId}</div>
              )}
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="surface-100 border-round p-3">
              <div className="flex align-items-center gap-2 mb-1">
                <i className="pi pi-building text-orange-500" />
                <span className="text-500 text-sm font-medium">Almacén</span>
              </div>
              <div className="font-bold text-900">
                {data.warehouse?.name ||
                  (data.serviceOrderId ? "Taller (sin almacén)" : "—")}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="surface-100 border-round p-3">
              <div className="flex align-items-center gap-2 mb-1">
                <i className="pi pi-sync text-blue-500" />
                <span className="text-500 text-sm font-medium">Moneda</span>
              </div>
              <div className="flex align-items-center gap-2">
                <Tag
                  value={data.currency}
                  severity={
                    data.currency === "USD"
                      ? "info"
                      : data.currency === "EUR"
                      ? "contrast"
                      : "warning"
                  }
                />
                {data.exchangeRate && data.currency !== "VES" && (
                  <span className="text-500 text-xs">
                    1 {data.currency} = Bs.{" "}
                    {Number(data.exchangeRate).toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items table */}
        {piItems.length > 0 && (
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
            {piItems.map((line) => (
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
                  {formatAmount(line.unitPrice, data.currency)}
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
                    severity={line.taxType === "EXEMPT" ? "warning" : "info"}
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
                  {formatAmount(line.totalLine, data.currency)}
                </div>
              </div>
            ))}
            {/* Totals footer */}
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
                  Subtotal:{" "}
                  <b>{formatAmount(data.subtotalBruto, data.currency)}</b>
                </span>
                {Number(data.discountAmount) > 0 && (
                  <span className="text-orange-500">
                    Desc:{" "}
                    <b>-{formatAmount(data.discountAmount, data.currency)}</b>
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
              {formatCrossRef(
                Number(data.total),
                data.currency,
                data.exchangeRate,
              ) && (
                <div className="flex justify-content-end mt-1">
                  <span className="text-xs text-500">
                    {formatCrossRef(
                      Number(data.total),
                      data.currency,
                      data.exchangeRate,
                    )}
                    {data.exchangeRate && (
                      <span className="ml-1">
                        (tasa: 1{" "}
                        {data.currency === "VES" ? "USD" : data.currency} = Bs.{" "}
                        {Number(data.exchangeRate).toFixed(4)})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <PreInvoicePaymentsSection preInvoice={data} />
      </div>
    );
  };

  /* ── Render ── */
  return (
    <>
      <Toast ref={toast} />
      <ConfirmActionPopup />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={preInvoices}
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
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pre-facturas"
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage="No hay pre-facturas"
          size="small"
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={handleRowToggle}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          tableStyle={{ minWidth: "65rem" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Proceso"
            body={actionBodyTemplate}
            style={{ width: "8rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column field="preInvoiceNumber" header="Nro. Pre-Factura" sortable />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            sortable
            sortField="status"
          />
          <Column header="Orden" body={orderBodyTemplate} />
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
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            sortField="createdAt"
          />
        </DataTable>
      </motion.div>

      {/* Payment Dialog */}
      <PaymentDialog
        visible={paymentDialog}
        onHide={() => {
          setPaymentDialog(false);
          setPaymentPreInvoice(null);
        }}
        preInvoice={paymentPreInvoice}
        existingPayments={existingPayments}
        onSuccess={handlePaymentSuccess}
        toast={toast}
      />

      {/* PDF Preview Dialog */}
      {pdfItem && (
        <Dialog
          visible
          onHide={() => setPdfItem(null)}
          header="Vista Previa — Pre-Factura"
          style={{ width: "85%", height: "90vh" }}
          contentStyle={{ padding: 0, height: "100%" }}
          modal
        >
          <PreInvoicePDFPreview data={pdfItem} />
        </Dialog>
      )}
    </>
  );
};

export default PreInvoiceListContent;
