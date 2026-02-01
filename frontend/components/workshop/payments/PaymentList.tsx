"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import {
  Payment,
  InvoiceReference,
  PaymentMethod,
  PaymentStatus,
} from "@/libs/interfaces/workshop/payment.interface";
import { getPayments, deletePayment } from "@/app/api/workshop/paymentService";
import CreateButton from "@/components/common/CreateButton";
import CustomActionButtons from "@/components/common/CustomActionButtons";
import PaymentForm from "./PaymentForm";

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [globalFilterValue, setGlobalFilterValue] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | null>(null);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadPayments();
  }, [currentPage, rows, methodFilter, statusFilter, globalFilterValue]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await getPayments({
        page: currentPage,
        limit: rows,
        paymentMethod: methodFilter || undefined,
        status: statusFilter || undefined,
        search: globalFilterValue || undefined,
      });

      setPayments(response.data.docs);
      setTotalRecords(response.data.totalDocs);
    } catch (error) {
      console.error("Error loading payments:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar pagos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setCurrentPage(event.page + 1);
  };

  const openNew = () => {
    setPayment(null);
    setFormDialog(true);
  };

  const hideDialog = () => {
    setFormDialog(false);
    setPayment(null);
  };

  const hideDeleteDialog = () => {
    setDeleteDialog(false);
    setPayment(null);
  };

  const editPayment = (payment: Payment) => {
    setPayment({ ...payment });
    setFormDialog(true);
  };

  const confirmDeletePayment = (payment: Payment) => {
    setPayment(payment);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!payment?._id) return;

    try {
      await deletePayment(payment._id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Pago eliminado correctamente",
        life: 3000,
      });
      loadPayments();
      hideDeleteDialog();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar el pago",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: payment?._id
        ? "Pago actualizado correctamente"
        : "Pago registrado correctamente",
      life: 3000,
    });
    loadPayments();
    hideDialog();
  };

  // Template for invoice column
  const invoiceBodyTemplate = (rowData: Payment) => {
    if (typeof rowData.invoice === "string") {
      return <span>{rowData.invoice}</span>;
    }

    const invoice = rowData.invoice as InvoiceReference;
    return (
      <div>
        <div style={{ fontFamily: "monospace", fontWeight: "bold" }}>
          {typeof invoice.invoiceNumber === "string"
            ? invoice.invoiceNumber
            : "N/A"}
        </div>
        <div className="text-sm text-gray-500">
          Total:{" "}
          {formatCurrency(
            typeof invoice.total === "number" ? invoice.total : 0
          )}
        </div>
        <div className="text-sm text-gray-500">
          Pagado:{" "}
          {formatCurrency(
            typeof invoice.paidAmount === "number" ? invoice.paidAmount : 0
          )}{" "}
          • Saldo:{" "}
          {formatCurrency(
            typeof invoice.balance === "number" ? invoice.balance : 0
          )}
        </div>
      </div>
    );
  };

  // Template for amount column
  const amountBodyTemplate = (rowData: Payment) => {
    return (
      <span style={{ fontWeight: "bold", color: "#10b981" }}>
        {formatCurrency(
          typeof rowData.amount === "number" ? rowData.amount : 0
        )}
      </span>
    );
  };

  // Template for paymentDate column
  const dateBodyTemplate = (rowData: Payment) => {
    return formatDate(rowData.paymentDate);
  };

  // Template for paymentMethod column
  const methodBodyTemplate = (rowData: Payment) => {
    const methodLabels: Record<string, string> = {
      efectivo: "Efectivo",
      transferencia: "Transferencia",
      tarjeta_credito: "Tarjeta Crédito",
      tarjeta_debito: "Tarjeta Débito",
      cheque: "Cheque",
      cripto: "Criptomoneda",
      otro: "Otro",
    };

    const methodColors: Record<string, string> = {
      efectivo: "success",
      transferencia: "info",
      tarjeta_credito: "warning",
      tarjeta_debito: "warning",
      cheque: "secondary",
      cripto: "contrast",
      otro: "secondary",
    };

    const method =
      typeof rowData.paymentMethod === "string"
        ? rowData.paymentMethod
        : "otro";
    return (
      <Tag
        value={methodLabels[method] || method}
        severity={(methodColors[method] as any) || "secondary"}
      />
    );
  };

  // Template for status column
  const statusBodyTemplate = (rowData: Payment) => {
    const statusLabels: Record<string, string> = {
      pendiente: "Pendiente",
      confirmado: "Confirmado",
      rechazado: "Rechazado",
      reembolsado: "Reembolsado",
    };

    const statusColors: Record<string, string> = {
      pendiente: "warning",
      confirmado: "success",
      rechazado: "danger",
      reembolsado: "info",
    };

    const status =
      typeof rowData.status === "string" ? rowData.status : "pendiente";
    return (
      <Tag
        value={statusLabels[status] || status}
        severity={(statusColors[status] as any) || "warning"}
      />
    );
  };

  // Template for actions
  const actionBodyTemplate = (rowData: Payment) => {
    return (
      <CustomActionButtons
        rowData={rowData}
        onEdit={() => editPayment(rowData)}
        onDelete={() => confirmDeletePayment(rowData)}
      />
    );
  };

  // Helper functions
  const formatCurrency = (value: any): string => {
    const numValue = typeof value === "number" ? value : 0;
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  const formatDate = (date: any): string => {
    try {
      const dateObj =
        date instanceof Date || typeof date === "string"
          ? new Date(date)
          : new Date();
      return dateObj.toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Payment method options for filter
  const paymentMethodOptions = [
    { label: "Todos", value: null },
    { label: "Efectivo", value: "efectivo" },
    { label: "Transferencia", value: "transferencia" },
    { label: "Tarjeta Crédito", value: "tarjeta_credito" },
    { label: "Tarjeta Débito", value: "tarjeta_debito" },
    { label: "Cheque", value: "cheque" },
    { label: "Criptomoneda", value: "cripto" },
    { label: "Otro", value: "otro" },
  ];

  // Payment status options for filter
  const paymentStatusOptions = [
    { label: "Todos", value: null },
    { label: "Pendiente", value: "pendiente" },
    { label: "Confirmado", value: "confirmado" },
    { label: "Rechazado", value: "rechazado" },
    { label: "Reembolsado", value: "reembolsado" },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Pagos</h4>
      <div className="flex gap-2">
        <Dropdown
          value={methodFilter}
          options={paymentMethodOptions}
          onChange={(e) => setMethodFilter(e.value)}
          placeholder="Método de Pago"
          className="w-full md:w-14rem"
        />
        <Dropdown
          value={statusFilter}
          options={paymentStatusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Estado"
          className="w-full md:w-12rem"
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={globalFilterValue}
            onChange={(e) => setGlobalFilterValue(e.target.value)}
          />
        </span>
        <CreateButton label="Nuevo Pago" onClick={openNew} />
      </div>
    </div>
  );

  const deleteDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeleteDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={handleDelete}
      />
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={payments}
          lazy
          paginator
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          dataKey="_id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron pagos"
        >
          <Column
            header="Factura"
            body={invoiceBodyTemplate}
            sortable
            style={{ minWidth: "180px" }}
          />
          <Column
            field="amount"
            header="Monto"
            body={amountBodyTemplate}
            sortable
            style={{ minWidth: "140px" }}
          />
          <Column
            field="paymentDate"
            header="Fecha de Pago"
            body={dateBodyTemplate}
            sortable
            style={{ minWidth: "130px" }}
          />
          <Column
            field="paymentMethod"
            header="Método"
            body={methodBodyTemplate}
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="reference"
            header="Referencia"
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ minWidth: "130px" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "120px" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={formDialog}
        style={{ width: "700px" }}
        header={payment?._id ? "Editar Pago" : "Nuevo Pago"}
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <PaymentForm
          payment={payment}
          onSave={handleSave}
          onCancel={hideDialog}
        />
      </Dialog>

      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteDialog}
      >
        <div className="confirmation-content flex align-items-center">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {payment && (
            <span>
              ¿Está seguro de eliminar el pago de{" "}
              <b>{formatCurrency(payment.amount)}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </motion.div>
  );
}
