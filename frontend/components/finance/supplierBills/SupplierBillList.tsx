"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { MenuItem } from "primereact/menuitem";
import type { SupplierBill } from "@/libs/interfaces/finance";
import supplierBillService from "@/app/api/finance/supplierBillService";
import SupplierBillForm from "./SupplierBillForm";
import RegisterPaymentDialog from "./RegisterPaymentDialog";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/shared/components/FormActionButtons";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";

const STATUS_SEVERITY: Record<
  string,
  "success" | "warning" | "danger" | "secondary"
> = {
  PENDING_INVOICE: "warning",
  PENDING: "warning",
  PARTIAL: "warning",
  PAID: "success",
  CANCELLED: "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_INVOICE: "Pendiente por factura",
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

const STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Pendiente por factura", value: "PENDING_INVOICE" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Parcial", value: "PARTIAL" },
  { label: "Pagada", value: "PAID" },
  { label: "Cancelada", value: "CANCELLED" },
];

export default function SupplierBillList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const [bills, setBills] = useState<SupplierBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showRegisterInvoiceDialog, setShowRegisterInvoiceDialog] =
    useState(false);
  const [selected, setSelected] = useState<SupplierBill | null>(null);
  const [menuTarget, setMenuTarget] = useState<SupplierBill | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceForm, setInvoiceForm] = useState({
    billNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    attachmentUrl: "",
    notes: "",
    subtotal: 0,
    taxAmount: 0,
    total: 0,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await supplierBillService.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setBills(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las facturas",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, statusFilter, searchQuery]);

  const onSave = async () => {
    setShowForm(false);
    setSelected(null);
    await load();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Factura guardada",
    });
  };

  const onPaymentSuccess = async () => {
    await load();
  };

  const openRegisterInvoiceDialog = (bill: SupplierBill) => {
    setSelected(bill);
    setInvoiceForm({
      billNumber: bill.billNumber ?? "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: bill.dueDate ? bill.dueDate.split("T")[0] : "",
      attachmentUrl: bill.attachmentUrl ?? "",
      notes: bill.notes ?? "",
      subtotal: Number(bill.subtotal || 0),
      taxAmount: Number(bill.taxAmount || 0),
      total: Number(bill.total || 0),
    });
    setShowRegisterInvoiceDialog(true);
  };

  const handleRegisterInvoice = async () => {
    if (!selected) return;
    if (!invoiceForm.billNumber.trim() || !invoiceForm.issueDate) {
      toast.current?.show({
        severity: "warn",
        summary: "Datos incompletos",
        detail: "Número y fecha de factura son obligatorios",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await supplierBillService.registerInvoice(selected.id, {
        billNumber: invoiceForm.billNumber.trim(),
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate || null,
        attachmentUrl: invoiceForm.attachmentUrl || null,
        notes: invoiceForm.notes || null,
        subtotal: invoiceForm.subtotal,
        taxAmount: invoiceForm.taxAmount,
        total: invoiceForm.total,
      });
      setShowRegisterInvoiceDialog(false);
      setSelected(null);
      await load();
      toast.current?.show({
        severity: "success",
        summary: "Factura registrada",
        detail: "La cuenta por pagar quedó habilitada para pago",
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo registrar la factura",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMenuItems = (target: SupplierBill | null): MenuItem[] => [
    {
      label: "Registrar factura",
      icon: "pi pi-file-check",
      command: () => target && openRegisterInvoiceDialog(target),
      disabled: target?.status !== "PENDING_INVOICE",
    },
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => setShowForm(true),
      disabled:
        target?.status === "PAID" ||
        target?.status === "CANCELLED" ||
        target?.status === "PENDING_INVOICE",
    },
    {
      separator: true,
    },
    {
      label: "Cancelar Factura",
      icon: "pi pi-times",
      className: "p-menuitem-danger",
      command: () =>
        confirmDialog({
          message: "¿Cancelar esta factura? Esta acción no se puede deshacer.",
          header: "Confirmar Cancelación",
          icon: "pi pi-exclamation-triangle",
          acceptClassName: "p-button-danger",
          accept: async () => {
            await supplierBillService.cancel(target!.id);
            await load();
            toast.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: "Factura cancelada",
            });
          },
        }),
      disabled: target?.status === "CANCELLED",
    },
  ];

  const processoBodyTemplate = (row: SupplierBill) => {
    if (row.status === "PENDING_INVOICE") {
      return (
        <div className="flex gap-1 flex-nowrap">
          <Button
            icon="pi pi-file-check"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Registrar factura"
            tooltipOptions={{ position: "top" }}
            onClick={() => openRegisterInvoiceDialog(row)}
          />
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger p-button-sm"
            tooltip="Cancelar provisión"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Cancelar provisión ${row.internalNumber}?`,
                icon: "pi pi-ban",
                iconClass: "text-red-500",
                acceptLabel: "Sí, Cancelar",
                acceptSeverity: "danger",
                onAccept: async () => {
                  await supplierBillService.cancel(row.id);
                  await load();
                  toast.current?.show({
                    severity: "success",
                    summary: "Éxito",
                    detail: "Provisión cancelada",
                  });
                },
              })
            }
          />
        </div>
      );
    }
    const isPending = row.status === "PENDING" || row.status === "PARTIAL";
    if (!isPending) return null;
    return (
      <div className="flex gap-1 flex-nowrap">
        <Button
          icon="pi pi-wallet"
          className="p-button-rounded p-button-success p-button-sm"
          tooltip="Registrar Pago"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            setSelected(row);
            setShowPayDialog(true);
          }}
        />
        <Button
          icon="pi pi-times"
          className="p-button-rounded p-button-danger p-button-sm"
          tooltip="Cancelar Factura"
          tooltipOptions={{ position: "top" }}
          onClick={(e) =>
            confirmAction({
              target: e.currentTarget as EventTarget & HTMLElement,
              message: `¿Cancelar factura ${row.internalNumber}?`,
              icon: "pi pi-ban",
              iconClass: "text-red-500",
              acceptLabel: "Sí, Cancelar",
              acceptSeverity: "danger",
              onAccept: async () => {
                await supplierBillService.cancel(row.id);
                await load();
                toast.current?.show({
                  severity: "success",
                  summary: "Éxito",
                  detail: "Factura cancelada",
                });
              },
            })
          }
        />
      </div>
    );
  };

  const actionsBody = (row: SupplierBill) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setMenuTarget(row);
        setSelected(row);
        menuRef.current?.toggle(e);
      }}
      aria-controls="supplier-bill-menu"
      aria-haspopup
    />
  );

  const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$",
    EUR: "€",
    VES: "Bs.",
  };

  const fmtAmt = (value: number | string, currency = "USD") => {
    const sym = CURRENCY_SYMBOLS[currency] ?? currency;
    return `${sym} ${Number(value || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fmtCross = (
    total: number,
    currency: string,
    exchangeRate?: number | null,
  ): string | null => {
    const n = Number(total || 0);
    const rate = Number(exchangeRate);
    if (currency === "VES") {
      if (rate <= 1) return null;
      return `≈ $ ${(n / rate).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USD`;
    }
    if (!rate || rate <= 0) return null;
    return `≈ Bs. ${(n * rate).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const statusBody = (row: SupplierBill) => (
    <Tag
      value={STATUS_LABELS[row.status]}
      severity={STATUS_SEVERITY[row.status]}
    />
  );

  const amountBody = (row: SupplierBill) => {
    const cur = row.currency ?? "USD";
    const total = Number(row.total);
    const paid = Number(row.paidAmount ?? 0);
    const pending = Number(row.pendingAmount ?? 0);
    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    const crossRef = fmtCross(total, cur, row.exchangeRate);
    return (
      <div className="text-right" style={{ minWidth: "9rem" }}>
        <div className="font-semibold">{fmtAmt(total, cur)}</div>
        {crossRef && <div className="text-xs text-500 mt-1">{crossRef}</div>}
        {paid > 0 && (
          <div className="text-sm text-green-600">Pag: {fmtAmt(paid, cur)}</div>
        )}
        {pending > 0 && (
          <div className="text-sm text-orange-500">
            Pend: {fmtAmt(pending, cur)}
          </div>
        )}
        {paid > 0 && total > 0 && (
          <div
            style={{
              height: "4px",
              background: "var(--surface-200)",
              borderRadius: "2px",
              marginTop: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background:
                  pct >= 100 ? "var(--green-500)" : "var(--orange-400)",
                borderRadius: "2px",
                transition: "width 0.3s",
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const rowExpansionTemplate = (row: SupplierBill) => {
    const cur = row.currency ?? "USD";
    const items = row.items ?? [];
    return (
      <div className="p-3">
        <DataTable value={items} size="small" emptyMessage="Sin items">
          <Column
            header="SKU"
            body={(item) => item.item?.sku || "—"}
            style={{ width: "8rem" }}
          />
          <Column
            header="Item"
            body={(item) => item.itemName || item.item?.name || "—"}
          />
          <Column
            header="Cant."
            body={(item) => item.quantity}
            className="text-center"
            style={{ width: "6rem" }}
          />
          <Column
            header="Costo"
            body={(item) => fmtAmt(item.unitCost, cur)}
            className="text-right"
            style={{ width: "9rem" }}
          />
          <Column
            header="IVA"
            body={(item) => `${Number(item.taxRate || 0)}%`}
            className="text-center"
            style={{ width: "6rem" }}
          />
          <Column
            header="Total"
            body={(item) => fmtAmt(item.totalLine, cur)}
            className="text-right font-semibold"
            style={{ width: "9rem" }}
          />
        </DataTable>
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Facturas de Proveedor</h4>
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
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </span>
        <CreateButton
          label="Nueva Factura"
          onClick={() => {
            setSelected(null);
            setShowForm(true);
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <ConfirmActionPopup />
      <Menu
        model={getMenuItems(menuTarget)}
        popup
        ref={menuRef}
        id="supplier-bill-menu"
      />

      <div className="card">
        <DataTable
          value={bills}
          loading={loading}
          lazy
          paginator
          rows={20}
          rowsPerPageOptions={[5, 10, 25, 50]}
          totalRecords={total}
          onPage={(e) => setPage((e.page ?? 0) + 1)}
          emptyMessage="Sin facturas registradas"
          stripedRows
          scrollable
          sortMode="multiple"
          header={header}
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Proceso"
            body={processoBodyTemplate}
            style={{ width: "8rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column field="internalNumber" header="# Interno" sortable />
          <Column
            field="billNumber"
            header="# Factura"
            body={(row: SupplierBill) => row.billNumber || "Pendiente"}
          />
          <Column field="supplier.name" header="Proveedor" />
          <Column
            field="issueDate"
            header="Emisión"
            body={(r: SupplierBill) =>
              r.issueDate
                ? new Date(r.issueDate).toLocaleDateString("es-VE")
                : "—"
            }
            sortable
          />
          <Column
            field="dueDate"
            header="Vence"
            body={(r) =>
              r.dueDate ? new Date(r.dueDate).toLocaleDateString("es-VE") : "-"
            }
          />
          <Column header="Monto" body={amountBody} className="text-right" />
          <Column header="Estado" body={statusBody} />
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

      <Dialog
        visible={showForm}
        onHide={() => setShowForm(false)}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-file-edit mr-3 text-primary text-3xl" />
                {selected ? "Editar Factura" : "Nueva Factura de Proveedor"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="supplier-bill-form"
            isUpdate={!!selected}
            onCancel={() => setShowForm(false)}
            isSubmitting={isSubmitting}
          />
        }
        style={{ width: "82vw" }}
        maximizable
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        modal
        draggable={false}
      >
        <SupplierBillForm
          bill={selected}
          onSave={onSave}
          formId="supplier-bill-form"
          toast={toast}
          onSubmittingChange={setIsSubmitting}
        />
      </Dialog>

      <RegisterPaymentDialog
        visible={showPayDialog}
        onHide={() => {
          setShowPayDialog(false);
          setSelected(null);
        }}
        bill={selected}
        onSuccess={onPaymentSuccess}
        toast={toast}
      />

      <Dialog
        visible={showRegisterInvoiceDialog}
        onHide={() => {
          setShowRegisterInvoiceDialog(false);
          setSelected(null);
        }}
        header="Registrar factura de proveedor"
        style={{ width: "560px" }}
        breakpoints={{ "600px": "95vw" }}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              text
              onClick={() => {
                setShowRegisterInvoiceDialog(false);
                setSelected(null);
              }}
            />
            <Button
              label="Registrar"
              icon="pi pi-check"
              loading={isSubmitting}
              onClick={handleRegisterInvoice}
            />
          </div>
        }
      >
        <div className="grid p-fluid">
          <div className="col-12 md:col-6 field">
            <label className="block mb-1 font-medium"># Factura *</label>
            <InputText
              value={invoiceForm.billNumber}
              onChange={(e) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  billNumber: e.target.value,
                }))
              }
              placeholder="Nro. de control"
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="block mb-1 font-medium">Fecha emisión *</label>
            <InputText
              type="date"
              value={invoiceForm.issueDate}
              onChange={(e) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  issueDate: e.target.value,
                }))
              }
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="block mb-1 font-medium">Fecha vencimiento</label>
            <InputText
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) =>
                setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="block mb-1 font-medium">Adjunto</label>
            <InputText
              value={invoiceForm.attachmentUrl}
              onChange={(e) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  attachmentUrl: e.target.value,
                }))
              }
              placeholder="URL del PDF"
            />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="block mb-1 font-medium">Subtotal</label>
            <InputNumber
              value={invoiceForm.subtotal}
              onValueChange={(e) =>
                setInvoiceForm((prev) => ({ ...prev, subtotal: e.value ?? 0 }))
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="block mb-1 font-medium">Impuesto</label>
            <InputNumber
              value={invoiceForm.taxAmount}
              onValueChange={(e) =>
                setInvoiceForm((prev) => ({ ...prev, taxAmount: e.value ?? 0 }))
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="block mb-1 font-medium">Total</label>
            <InputNumber
              value={invoiceForm.total}
              onValueChange={(e) =>
                setInvoiceForm((prev) => ({ ...prev, total: e.value ?? 0 }))
              }
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
            />
          </div>
          <div className="col-12 field">
            <label className="block mb-1 font-medium">Notas</label>
            <InputTextarea
              value={invoiceForm.notes}
              onChange={(e) =>
                setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              autoResize
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
