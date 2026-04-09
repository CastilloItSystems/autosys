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
import paymentService from "@/app/api/sales/paymentService";
import {
  Payment,
  PaymentStatus,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  PaymentMethod,
} from "@/libs/interfaces/sales/payment.interface";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";

const formatCurrency = (value: number | string) =>
  `$${Number(value || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const PaymentList = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    loadPayments();
  }, [page, rows, sortField, sortOrder, debouncedSearch]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getAll({
        page: page + 1,
        limit: rows,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
      });
      setPayments(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener pagos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (payment: Payment) => {
    try {
      await paymentService.cancel(payment.id);
      await loadPayments();
      toast.current?.show({
        severity: "success",
        summary: "Cancelado",
        detail: `Pago ${payment.paymentNumber} cancelado`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ── Header ── */
  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Historial de Pagos</h4>
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
          placeholder="Buscar (nro, referencia, cliente...)"
          className="w-full"
        />
      </span>
    </div>
  );

  /* ── Column templates ── */
  const statusBodyTemplate = (rowData: Payment) => {
    const cfg = PAYMENT_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={cfg.label}
        severity={cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const methodBodyTemplate = (rowData: Payment) => {
    const cfg = PAYMENT_METHOD_CONFIG[rowData.method];
    return (
      <div className="flex align-items-center gap-2">
        <i className={`${cfg.icon} ${cfg.color}`} />
        <span className="text-sm">{cfg.label}</span>
      </div>
    );
  };

  const amountBodyTemplate = (rowData: Payment) => (
    <div className="flex flex-column">
      <span className="font-semibold">{formatCurrency(rowData.amount)}</span>
      {rowData.igtfApplies && Number(rowData.igtfAmount) > 0 && (
        <span className="text-xs text-yellow-600">
          +IGTF {formatCurrency(rowData.igtfAmount)}
        </span>
      )}
    </div>
  );

  const customerBodyTemplate = (rowData: Payment) =>
    rowData.customer?.name || "—";

  const preInvoiceBodyTemplate = (rowData: Payment) =>
    rowData.preInvoice?.preInvoiceNumber || "—";

  const dateBodyTemplate = (rowData: Payment) =>
    formatDate(rowData.processedAt);

  const actionBodyTemplate = (rowData: Payment) => {
    if (rowData.status !== PaymentStatus.COMPLETED) return null;
    return (
      <Button
        icon="pi pi-times"
        className="p-button-rounded p-button-danger p-button-sm"
        tooltip="Cancelar Pago"
        tooltipOptions={{ position: "top" }}
        onClick={(e) =>
          confirmAction({
            target: e.currentTarget as EventTarget & HTMLElement,
            message: `¿Cancelar pago ${rowData.paymentNumber}?`,
            icon: "pi pi-ban",
            iconClass: "text-red-500",
            acceptLabel: "Sí, Cancelar",
            acceptSeverity: "danger",
            onAccept: () => handleCancel(rowData),
          })
        }
      />
    );
  };

  /* ── Row expansion ── */
  const rowExpansionTemplate = (data: Payment) => (
    <div className="p-3">
      <div className="grid">
        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3">
            <span className="text-500 text-sm">Pre-factura</span>
            <div className="font-bold text-900">
              {data.preInvoice?.preInvoiceNumber || "—"}
            </div>
            {data.preInvoice?.order && (
              <div className="text-500 text-xs mt-1">
                Orden: {data.preInvoice.order.orderNumber}
              </div>
            )}
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3">
            <span className="text-500 text-sm">Referencia</span>
            <div className="font-bold text-900">
              {data.reference || "Sin referencia"}
            </div>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3">
            <span className="text-500 text-sm">Total con IGTF</span>
            <div className="font-bold text-primary text-lg">
              {formatCurrency(data.totalWithIgtf)}
            </div>
          </div>
        </div>
      </div>

      {/* Mixed payment details */}
      {data.method === PaymentMethod.MIXED &&
        Array.isArray(data.details) &&
        data.details.length > 0 && (
          <div className="mt-3 surface-50 border-round p-3">
            <span className="font-semibold text-sm mb-2 block">
              Desglose Pago Mixto
            </span>
            {data.details.map((d: any, idx: number) => {
              const cfg = PAYMENT_METHOD_CONFIG[d.method as PaymentMethod];
              return (
                <div
                  key={idx}
                  className="flex justify-content-between align-items-center py-1"
                >
                  <div className="flex align-items-center gap-2">
                    <i className={`${cfg?.icon} ${cfg?.color}`} />
                    <span className="text-sm">{cfg?.label || d.method}</span>
                    {d.reference && (
                      <span className="text-xs text-500">
                        (Ref: {d.reference})
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(d.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      {data.notes && (
        <div className="mt-3 surface-50 border-round p-3">
          <span className="text-500 text-sm">Notas:</span>
          <div className="text-900 mt-1">{data.notes}</div>
        </div>
      )}
    </div>
  );

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
          value={payments}
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
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pagos"
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage="No hay pagos registrados"
          size="small"
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          tableStyle={{ minWidth: "60rem" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column field="paymentNumber" header="Nro. Pago" sortable />
          <Column header="Estado" body={statusBodyTemplate} />
          <Column header="Método" body={methodBodyTemplate} />
          <Column
            header="Monto"
            body={amountBodyTemplate}
            sortable
            sortField="amount"
          />
          <Column header="Cliente" body={customerBodyTemplate} />
          <Column header="Pre-Factura" body={preInvoiceBodyTemplate} />
          <Column
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            sortField="processedAt"
          />
          <Column
            header=""
            body={actionBodyTemplate}
            style={{ width: "4rem", textAlign: "center" }}
          />
        </DataTable>
      </motion.div>
    </>
  );
};

export default PaymentList;
