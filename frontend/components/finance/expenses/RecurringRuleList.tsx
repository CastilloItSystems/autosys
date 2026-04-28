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
import { MenuItem } from "primereact/menuitem";
import type { ExpenseRecurringRule } from "@/libs/interfaces/finance";
import { EXPENSE_CATEGORY_LABELS } from "@/libs/interfaces/finance";
import expenseService from "@/app/api/finance/expenseService";
import RecurringRuleForm from "./RecurringRuleForm";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  YEARLY: "Anual",
};

export default function RecurringRuleList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const [rules, setRules] = useState<ExpenseRecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<ExpenseRecurringRule | null>(null);
  const [menuTarget, setMenuTarget] = useState<ExpenseRecurringRule | null>(null);
  const [running, setRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await expenseService.getAllRules({ page, limit: 20 });
      setRules(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudieron cargar las reglas" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const onSave = async () => {
    setShowForm(false);
    setSelected(null);
    await load();
    toast.current?.show({ severity: "success", summary: "Éxito", detail: "Regla guardada" });
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await expenseService.runRecurring();
      await load();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `${res.data?.generated ?? 0} gasto(s) generado(s)`,
      });
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Error al ejecutar reglas" });
    } finally {
      setRunning(false);
    }
  };

  const getMenuItems = (target: ExpenseRecurringRule | null): MenuItem[] => [
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => setShowForm(true),
    },
    {
      label: target?.isActive ? "Desactivar" : "Activar",
      icon: target?.isActive ? "pi pi-ban" : "pi pi-check",
      command: () => confirmDialog({
        message: `¿${target?.isActive ? "Desactivar" : "Activar"} esta regla?`,
        header: "Confirmar",
        icon: "pi pi-question-circle",
        accept: async () => {
          await expenseService.updateRule(target!.id, { isActive: !target!.isActive });
          await load();
          toast.current?.show({ severity: "success", summary: "Éxito", detail: "Regla actualizada" });
        },
      }),
    },
  ];

  const actionsBody = (row: ExpenseRecurringRule) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => { setMenuTarget(row); setSelected(row); menuRef.current?.toggle(e); }}
      aria-controls="recurring-rule-menu"
      aria-haspopup
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Gastos Recurrentes</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex gap-2">
        <Button
          label="Ejecutar ahora"
          icon="pi pi-play"
          severity="secondary"
          outlined
          size="small"
          loading={running}
          onClick={runNow}
          tooltip="Genera los gastos pendientes de hoy"
        />
        <CreateButton
          label="Nueva Regla"
          onClick={() => { setSelected(null); setShowForm(true); }}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <Menu model={getMenuItems(menuTarget)} popup ref={menuRef} id="recurring-rule-menu" />

      <div className="card">
      <DataTable
        value={rules}
        loading={loading}
        lazy
        paginator
        rows={20}
        rowsPerPageOptions={[5, 10, 25, 50]}
        totalRecords={total}
        onPage={(e) => setPage((e.page ?? 0) + 1)}
        emptyMessage="Sin reglas recurrentes configuradas"
        stripedRows
        scrollable
        sortMode="multiple"
        header={header}
      >
        <Column field="name" header="Nombre" sortable />
        <Column
          header="Categoría"
          body={(r: ExpenseRecurringRule) => EXPENSE_CATEGORY_LABELS[r.category] ?? r.category}
        />
        <Column field="description" header="Descripción" />
        <Column
          header="Frecuencia"
          body={(r: ExpenseRecurringRule) => FREQUENCY_LABELS[r.frequency] ?? r.frequency}
        />
        <Column
          header="Monto"
          body={(r: ExpenseRecurringRule) => (
            <span className="font-semibold">
              {r.currency} {Number(r.amount).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
            </span>
          )}
        />
        <Column
          header="Próxima"
          body={(r: ExpenseRecurringRule) => new Date(r.nextRunDate).toLocaleDateString("es-VE")}
          sortable
          sortField="nextRunDate"
        />
        <Column
          header="Estado"
          body={(r: ExpenseRecurringRule) => (
            <Tag
              value={r.isActive ? "Activa" : "Inactiva"}
              severity={r.isActive ? "success" : "secondary"}
            />
          )}
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
                <i className="pi pi-sync mr-3 text-primary text-3xl" />
                {selected ? "Editar Regla Recurrente" : "Nueva Regla Recurrente"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="recurring-rule-form"
            isUpdate={!!selected}
            onCancel={() => setShowForm(false)}
            isSubmitting={isSubmitting}
          />
        }
        style={{ width: "500px" }}
        maximizable
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        modal
        draggable={false}
      >
        <RecurringRuleForm
          rule={selected}
          onSave={onSave}
          formId="recurring-rule-form"
          toast={toast}
          onSubmittingChange={setIsSubmitting}
        />
      </Dialog>
    </>
  );
}
