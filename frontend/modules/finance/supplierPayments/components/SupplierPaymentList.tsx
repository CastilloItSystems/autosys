"use client";

import React, { useMemo, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { MenuItem } from "primereact/menuitem";
import dynamic from "next/dynamic";
import type { SupplierPayment } from "../interfaces/supplierPayment";
import { useSupplierPaymentsData } from "../hooks/useSupplierPaymentsData";

const SupplierPaymentPDFPreview = dynamic(() => import("./SupplierPaymentPDFPreview"), { ssr: false });
import supplierPaymentService from "../services/supplierPaymentService";

const STATUS_SEVERITY: Record<
  string,
  "success" | "warning" | "danger" | "secondary"
> = {
  PENDING: "warning",
  COMPLETED: "success",
  CANCELLED: "secondary",
  REFUNDED: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  MOBILE_PAYMENT: "Pago Móvil",
  CHECK: "Cheque",
  CREDIT: "Crédito",
  MIXED: "Mixto",
};

const STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Completado", value: "COMPLETED" },
  { label: "Cancelado", value: "CANCELLED" },
];

function SupplierPaymentListContent() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [menuTarget, setMenuTarget] = useState<SupplierPayment | null>(null);
  const [pdfPayment, setPdfPayment] = useState<SupplierPayment | null>(null);
  const listParams = useMemo(
    () => ({
      page,
      limit: 20,
      status: statusFilter || undefined,
    }),
    [page, statusFilter],
  );
  const { payments, total, loading, mutate } =
    useSupplierPaymentsData(listParams);

  const cancelPayment = async (payment: SupplierPayment) => {
    confirmDialog({
      message: `¿Cancelar el pago ${payment.paymentNumber}? Se revertirá el monto en la cuenta bancaria.`,
      header: "Confirmar Cancelación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await supplierPaymentService.cancel(payment.id);
          await mutate();
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Pago cancelado",
          });
        } catch {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo cancelar el pago",
          });
        }
      },
    });
  };

  const getMenuItems = (target: SupplierPayment | null): MenuItem[] => [
    {
      label: "Imprimir PDF",
      icon: "pi pi-print",
      command: () => target && setPdfPayment(target),
    },
    {
      separator: true,
    },
    {
      label: "Cancelar Pago",
      icon: "pi pi-times",
      className: "p-menuitem-danger",
      command: () => target && cancelPayment(target),
      disabled: target?.status !== "COMPLETED",
    },
  ];

  const amountBody = (row: SupplierPayment) => (
    <div>
      <div className="font-semibold">
        {row.currency}{" "}
        {Number(row.amount).toLocaleString("es-VE", {
          minimumFractionDigits: 2,
        })}
      </div>
      {row.igtfApplies && (
        <div className="text-sm text-color-secondary">
          +IGTF{" "}
          {Number(row.igtfAmount).toLocaleString("es-VE", {
            minimumFractionDigits: 2,
          })}
        </div>
      )}
    </div>
  );

  const actionsBody = (row: SupplierPayment) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setMenuTarget(row);
        menuRef.current?.toggle(e);
      }}
      aria-controls="supplier-payment-menu"
      aria-haspopup
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Pagos a Proveedores</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex gap-2">
        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(1);
          }}
          placeholder="Filtrar estado"
          className="w-10rem"
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <Menu
        model={getMenuItems(menuTarget)}
        popup
        ref={menuRef}
        id="supplier-payment-menu"
      />

      {pdfPayment && (
        <Dialog
          visible
          onHide={() => setPdfPayment(null)}
          header="Vista Previa — Pago a Proveedor"
          style={{ width: "85%", height: "90vh" }}
          contentStyle={{ padding: 0, height: "100%" }}
          modal
        >
          <SupplierPaymentPDFPreview data={pdfPayment} />
        </Dialog>
      )}

      <div className="card">
        <DataTable
          value={payments}
          loading={loading}
          lazy
          paginator
          rows={20}
          rowsPerPageOptions={[5, 10, 25, 50]}
          totalRecords={total}
          onPage={(e) => setPage((e.page ?? 0) + 1)}
          emptyMessage="Sin pagos registrados"
          stripedRows
          scrollable
          sortMode="multiple"
          header={header}
        >
          <Column field="paymentNumber" header="# Pago" sortable />
          <Column field="supplier.name" header="Proveedor" />
          <Column
            header="Referencia"
            body={(r: SupplierPayment) =>
              r.supplierBill?.internalNumber ?? r.expense?.expenseNumber ?? "-"
            }
          />
          <Column
            field="bankAccount.name"
            header="Cuenta"
            body={(r: SupplierPayment) => r.bankAccount?.name ?? "-"}
          />
          <Column
            header="Método"
            body={(r: SupplierPayment) => METHOD_LABELS[r.method] ?? r.method}
          />
          <Column header="Monto" body={amountBody} />
          <Column
            header="Estado"
            body={(r: SupplierPayment) => (
              <Tag
                value={STATUS_LABELS[r.status]}
                severity={STATUS_SEVERITY[r.status]}
              />
            )}
          />
          <Column
            field="processedAt"
            header="Fecha"
            body={(r: SupplierPayment) =>
              new Date(r.processedAt).toLocaleDateString("es-VE")
            }
            sortable
          />
          <Column
            header="Acciones"
            body={actionsBody}
            frozen={true}
            alignFrozen="right"
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>
    </>
  );
}

export default SupplierPaymentListContent;
