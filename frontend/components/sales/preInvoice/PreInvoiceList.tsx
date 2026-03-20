"use client";
import React, { useEffect, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";
import preInvoiceService from "@/app/api/sales/preInvoiceService";
import paymentService from "@/app/api/sales/paymentService";
import {
  PreInvoice,
  PreInvoiceStatus,
  PREINVOICE_STATUS_CONFIG,
} from "@/libs/interfaces/sales/preInvoice.interface";
import {
  Payment,
  PAYMENT_METHOD_CONFIG,
} from "@/libs/interfaces/sales/payment.interface";
import PreInvoiceStepper from "./PreInvoiceStepper";
import PaymentDialog from "../payments/PaymentDialog";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";

const formatCurrency = (value: number | string) =>
  `$${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const PreInvoiceList = () => {
  const [preInvoices, setPreInvoices] = useState<PreInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentPreInvoice, setPaymentPreInvoice] = useState<PreInvoice | null>(
    null,
  );
  const [existingPayments, setExistingPayments] = useState<Payment[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment[]>>({});
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
    loadPreInvoices();
  }, [page, rows, sortField, sortOrder, debouncedSearch]);

  const loadPreInvoices = async () => {
    try {
      setLoading(true);
      const res = await preInvoiceService.getAll({
        page: page + 1,
        limit: rows,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
      });
      setPreInvoices(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener pre-facturas:", error);
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

  /* ── Actions ── */
  const handleStartPreparation = async (pi: PreInvoice) => {
    try {
      await preInvoiceService.startPreparation(pi.id);
      await loadPreInvoices();
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
      await loadPreInvoices();
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

  const openPaymentDialog = async (pi: PreInvoice) => {
    try {
      const res = await paymentService.getByPreInvoice(pi.id);
      setExistingPayments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setExistingPayments([]);
    }
    setPaymentPreInvoice(pi);
    setPaymentDialog(true);
  };

  const handlePaymentSuccess = async () => {
    await loadPreInvoices();
    // Refresh payments cache for this PI
    if (paymentPreInvoice) {
      try {
        const res = await paymentService.getByPreInvoice(paymentPreInvoice.id);
        setPaymentsMap((prev) => ({
          ...prev,
          [paymentPreInvoice.id]: Array.isArray(res.data) ? res.data : [],
        }));
      } catch {
        /* ignore */
      }
    }
    setPaymentDialog(false);
    setPaymentPreInvoice(null);
  };

  const loadPaymentsForPI = async (piId: string) => {
    if (paymentsMap[piId]) return; // already cached
    try {
      const res = await paymentService.getByPreInvoice(piId);
      setPaymentsMap((prev) => ({
        ...prev,
        [piId]: Array.isArray(res.data) ? res.data : [],
      }));
    } catch {
      setPaymentsMap((prev) => ({ ...prev, [piId]: [] }));
    }
  };

  const handleRowToggle = (e: any) => {
    setExpandedRows(e.data);
    // Load payments for newly expanded rows
    if (e.data) {
      const expandedIds = Array.isArray(e.data)
        ? e.data.map((r: any) => r.id)
        : Object.keys(e.data);
      expandedIds.forEach((id: string) => loadPaymentsForPI(id));
    }
  };

  const handleCancel = async (pi: PreInvoice) => {
    try {
      await preInvoiceService.cancel(pi.id);
      await loadPreInvoices();
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
        severity={cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const customerBodyTemplate = (rowData: PreInvoice) =>
    rowData.customer?.name || "—";

  const orderBodyTemplate = (rowData: PreInvoice) =>
    rowData.order?.orderNumber || "—";

  const totalBodyTemplate = (rowData: PreInvoice) => (
    <span className="font-semibold">{formatCurrency(rowData.total)}</span>
  );

  const dateBodyTemplate = (rowData: PreInvoice) =>
    formatDate(rowData.createdAt);

  /* ── Row expansion ── */
  const rowExpansionTemplate = (data: PreInvoice) => {
    const piItems = data.items || [];
    return (
      <div className="p-3">
        <PreInvoiceStepper currentStatus={data.status} />

        {/* Info cards */}
        <div className="grid my-3">
          <div className="col-12 md:col-4">
            <div className="surface-100 border-round p-3">
              <div className="flex align-items-center gap-2 mb-1">
                <i className="pi pi-shopping-cart text-primary" />
                <span className="text-500 text-sm font-medium">Orden</span>
              </div>
              <div className="font-bold text-900">
                {data.order?.orderNumber || "—"}
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
                {data.warehouse?.name || "—"}
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

        {/* ── Payments section ── */}
        {(() => {
          const piPayments = (paymentsMap[data.id] || []).filter(
            (p) => p.status === "COMPLETED",
          );
          if (piPayments.length === 0) return null;
          const totalPaid = piPayments.reduce(
            (sum, p) => sum + Number(p.amount),
            0,
          );
          const pending = Math.max(0, Number(data.total) - totalPaid);
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
                    Pagado: <b>{formatCurrency(totalPaid)}</b>
                  </span>
                  {pending > 0 && (
                    <span className="text-orange-500">
                      Pendiente: <b>{formatCurrency(pending)}</b>
                    </span>
                  )}
                </div>
              </div>
              {piPayments.map((p) => {
                const methodCfg =
                  PAYMENT_METHOD_CONFIG[
                    p.method as keyof typeof PAYMENT_METHOD_CONFIG
                  ];
                return (
                  <div
                    key={p.id}
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
                      {p.paymentNumber}
                    </span>
                    <span style={{ width: "7rem" }}>
                      {methodCfg?.label || p.method}
                    </span>
                    <span className="font-semibold" style={{ width: "6rem" }}>
                      {formatCurrency(p.amount)}
                    </span>
                    {p.reference && (
                      <span className="text-500 text-xs">
                        Ref: {p.reference}
                      </span>
                    )}
                    {Number(p.igtfAmount) > 0 && (
                      <Tag
                        value={`IGTF +${formatCurrency(p.igtfAmount)}`}
                        severity="warning"
                        className="text-xs ml-auto"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
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
            header="Total"
            body={totalBodyTemplate}
            sortable
            sortField="total"
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
    </>
  );
};

export default PreInvoiceList;
