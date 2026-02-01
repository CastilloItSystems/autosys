"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Invoice } from "@/libs/interfaces/workshop/invoice.interface";
import {
  Payment,
  PaymentSummary,
} from "@/libs/interfaces/workshop/payment.interface";
import { getPaymentsByInvoice } from "@/app/api/workshop/paymentService";

interface InvoicePaymentsDialogProps {
  visible: boolean;
  invoice: Invoice | null;
  onHide: () => void;
  onAddPayment: () => void;
}

export default function InvoicePaymentsDialog({
  visible,
  invoice,
  onHide,
  onAddPayment,
}: InvoicePaymentsDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(
    null
  );

  useEffect(() => {
    if (visible && invoice?._id) {
      loadPayments();
    }
  }, [visible, invoice]);

  const loadPayments = async () => {
    if (!invoice?._id) return;

    try {
      setLoading(true);
      const response = await getPaymentsByInvoice(invoice._id);
      setPaymentSummary(response);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethodTemplate = (rowData: Payment) => {
    const methodLabels: Record<string, string> = {
      efectivo: "Efectivo",
      transferencia: "Transferencia",
      tarjeta_credito: "Tarjeta Crédito",
      tarjeta_debito: "Tarjeta Débito",
      cheque: "Cheque",
      cripto: "Criptomoneda",
      otro: "Otro",
    };

    const method =
      typeof rowData.paymentMethod === "string"
        ? rowData.paymentMethod
        : "otro";
    return methodLabels[method] || method;
  };

  const paymentStatusTemplate = (rowData: Payment) => {
    const statusConfig: Record<
      string,
      {
        severity: "success" | "info" | "warning" | "danger" | "secondary";
        label: string;
        icon: string;
      }
    > = {
      pendiente: { severity: "warning", label: "Pendiente", icon: "pi-clock" },
      confirmado: {
        severity: "success",
        label: "Confirmado",
        icon: "pi-check",
      },
      rechazado: { severity: "danger", label: "Rechazado", icon: "pi-times" },
      reembolsado: {
        severity: "info",
        label: "Reembolsado",
        icon: "pi-refresh",
      },
    };

    const config = statusConfig[rowData.status] || {
      severity: "info" as const,
      label: rowData.status,
      icon: "pi-question",
    };

    return (
      <Tag severity={config.severity} icon={config.icon} rounded>
        {config.label}
      </Tag>
    );
  };

  const dateTemplate = (date: string | Date) => {
    if (!date) return "-";
    try {
      const dateObj =
        typeof date === "string" || date instanceof Date
          ? new Date(date)
          : new Date();
      return dateObj.toLocaleDateString("es-VE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const currencyTemplate = (value: any) => {
    const numValue = typeof value === "number" ? value : 0;
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  const amountTemplate = (rowData: Payment) => {
    return currencyTemplate(
      typeof rowData.amount === "number" ? rowData.amount : 0
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div>
        <h5 className="m-0">
          Pagos de Factura{" "}
          {typeof invoice?.invoiceNumber === "string"
            ? invoice.invoiceNumber
            : "N/A"}
        </h5>
        {paymentSummary && (
          <div className="text-sm text-600 mt-1">
            Total pagado:{" "}
            {currencyTemplate(
              typeof paymentSummary.totalAmount === "number"
                ? paymentSummary.totalAmount
                : 0
            )}{" "}
            •
            {typeof paymentSummary.totalPayments === "number"
              ? paymentSummary.totalPayments
              : 0}{" "}
            pago
            {paymentSummary.totalPayments !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <Button
        label="Agregar Pago"
        icon="pi pi-plus"
        size="small"
        onClick={onAddPayment}
        className="p-button-success"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "800px" }}
      header={header}
      modal
      onHide={onHide}
      maximizable
      breakpoints={{ "960px": "75vw", "641px": "90vw" }}
    >
      <DataTable
        value={paymentSummary?.payments || []}
        loading={loading}
        emptyMessage="No se encontraron pagos para esta factura"
        stripedRows
        removableSort
      >
        <Column
          field="paymentDate"
          header="Fecha"
          body={(rowData) => dateTemplate(rowData.paymentDate)}
          sortable
          style={{ minWidth: "8rem" }}
        />
        <Column
          field="paymentMethod"
          header="Método"
          body={paymentMethodTemplate}
          sortable
          style={{ minWidth: "10rem" }}
        />
        <Column
          field="amount"
          header="Monto"
          body={amountTemplate}
          sortable
          style={{ minWidth: "8rem" }}
        />
        <Column
          field="reference"
          header="Referencia"
          sortable
          style={{ minWidth: "10rem" }}
        />
        <Column
          field="status"
          header="Estado"
          body={paymentStatusTemplate}
          sortable
          style={{ minWidth: "8rem" }}
        />
        <Column field="notes" header="Notas" style={{ minWidth: "12rem" }} />
      </DataTable>
    </Dialog>
  );
}
