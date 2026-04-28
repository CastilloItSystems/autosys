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
import { MenuItem } from "primereact/menuitem";
import type { Expense } from "@/libs/interfaces/finance";
import { EXPENSE_CATEGORY_LABELS } from "@/libs/interfaces/finance";
import expenseService from "@/app/api/finance/expenseService";
import ExpenseForm from "./ExpenseForm";
import RegisterExpensePaymentDialog from "./RegisterExpensePaymentDialog";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import { confirmAction, ConfirmActionPopup } from "@/components/common/ConfirmAction";

const STATUS_SEVERITY: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  DRAFT: "secondary",
  PENDING: "warning",
  PAID: "success",
  CANCELLED: "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
};

const STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Borrador", value: "DRAFT" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Pagado", value: "PAID" },
  { label: "Cancelado", value: "CANCELLED" },
];

export default function ExpenseList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [menuTarget, setMenuTarget] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await expenseService.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setExpenses(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudieron cargar los gastos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, statusFilter, searchQuery]);

  const onSave = async () => {
    setShowForm(false);
    setSelected(null);
    await load();
    toast.current?.show({ severity: "success", summary: "Éxito", detail: "Gasto guardado" });
  };

  const onPaymentSuccess = async () => {
    await load();
  };

  const getMenuItems = (target: Expense | null): MenuItem[] => [
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => setShowForm(true),
      disabled: target?.status === "PAID" || target?.status === "CANCELLED",
    },
    { separator: true },
    {
      label: "Cancelar",
      icon: "pi pi-times",
      className: "p-menuitem-danger",
      command: () => confirmDialog({
        message: "¿Cancelar este gasto?",
        header: "Confirmar",
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        accept: async () => {
          await expenseService.cancel(target!.id);
          await load();
          toast.current?.show({ severity: "success", summary: "Éxito", detail: "Gasto cancelado" });
        },
      }),
      disabled: target?.status === "CANCELLED",
    },
  ];

  const processoBodyTemplate = (row: Expense) => {
    const canPay = row.status === "PENDING";
    const canCancel = row.status === "DRAFT" || row.status === "PENDING";
    if (!canPay && !canCancel) return null;
    return (
      <div className="flex gap-1 flex-nowrap">
        {canPay && (
          <Button
            icon="pi pi-wallet"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Registrar Pago"
            tooltipOptions={{ position: "top" }}
            onClick={() => { setSelected(row); setShowPayDialog(true); }}
          />
        )}
        {canCancel && (
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger p-button-sm"
            tooltip="Cancelar Gasto"
            tooltipOptions={{ position: "top" }}
            onClick={(e) => confirmAction({
              target: e.currentTarget as EventTarget & HTMLElement,
              message: `¿Cancelar gasto ${row.expenseNumber}?`,
              icon: "pi pi-ban",
              iconClass: "text-red-500",
              acceptLabel: "Sí, Cancelar",
              acceptSeverity: "danger",
              onAccept: async () => {
                await expenseService.cancel(row.id);
                await load();
                toast.current?.show({ severity: "success", summary: "Éxito", detail: "Gasto cancelado" });
              },
            })}
          />
        )}
      </div>
    );
  };

  const actionsBody = (row: Expense) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => { setMenuTarget(row); setSelected(row); menuRef.current?.toggle(e); }}
      aria-controls="expense-menu"
      aria-haspopup
    />
  );

  const amountBody = (row: Expense) => (
    <div>
      <div className="font-semibold">
        {row.currency} {Number(row.total).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
      </div>
      {Number(row.pendingAmount) > 0 && (
        <div className="text-sm text-orange-500">
          Pend: {Number(row.pendingAmount).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Gastos Operativos</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex gap-2">
        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) => { setStatusFilter(e.value); setPage(1); }}
          placeholder="Filtrar estado"
          className="w-10rem"
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </span>
        <CreateButton
          label="Nuevo Gasto"
          onClick={() => { setSelected(null); setShowForm(true); }}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <ConfirmActionPopup />
      <Menu model={getMenuItems(menuTarget)} popup ref={menuRef} id="expense-menu" />

      <div className="card">
      <DataTable
        value={expenses}
        loading={loading}
        lazy
        paginator
        rows={20}
        rowsPerPageOptions={[5, 10, 25, 50]}
        totalRecords={total}
        onPage={(e) => setPage((e.page ?? 0) + 1)}
        emptyMessage="Sin gastos registrados"
        stripedRows
        scrollable
        sortMode="multiple"
        header={header}
      >
        <Column
          header="Proceso"
          body={processoBodyTemplate}
          style={{ width: "8rem", textAlign: "center" }}
          headerStyle={{ textAlign: "center" }}
        />
        <Column field="expenseNumber" header="# Gasto" sortable />
        <Column
          header="Categoría"
          body={(r: Expense) => EXPENSE_CATEGORY_LABELS[r.category] ?? r.category}
        />
        <Column field="description" header="Descripción" />
        <Column
          field="expenseDate"
          header="Fecha"
          body={(r: Expense) => new Date(r.expenseDate).toLocaleDateString("es-VE")}
          sortable
        />
        <Column header="Monto" body={amountBody} />
        <Column
          header="Estado"
          body={(r: Expense) => <Tag value={STATUS_LABELS[r.status]} severity={STATUS_SEVERITY[r.status]} />}
        />
        <Column
          header="Recurrente"
          body={(r: Expense) => r.isRecurring ? <i className="pi pi-sync text-primary" /> : null}
          style={{ width: "80px", textAlign: "center" }}
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

      <Dialog
        visible={showForm}
        onHide={() => setShowForm(false)}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-receipt mr-3 text-primary text-3xl" />
                {selected ? "Editar Gasto" : "Nuevo Gasto Operativo"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="expense-form"
            isUpdate={!!selected}
            onCancel={() => setShowForm(false)}
            isSubmitting={isSubmitting}
          />
        }
        style={{ width: "520px" }}
        maximizable
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        modal
        draggable={false}
      >
        <ExpenseForm
          expense={selected}
          onSave={onSave}
          formId="expense-form"
          toast={toast}
          onSubmittingChange={setIsSubmitting}
        />
      </Dialog>

      <RegisterExpensePaymentDialog
        visible={showPayDialog}
        onHide={() => { setShowPayDialog(false); setSelected(null); }}
        expense={selected}
        onSuccess={onPaymentSuccess}
        toast={toast}
      />
    </>
  );
}
