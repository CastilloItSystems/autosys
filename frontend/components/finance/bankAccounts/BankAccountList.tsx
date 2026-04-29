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
import { InputText } from "primereact/inputtext";
import { MenuItem } from "primereact/menuitem";
import type { BankAccount } from "@/modules/finance/bankAccounts/interfaces/bankAccount";
import bankAccountService from "@/modules/finance/bankAccounts/services/bankAccountService";
import BankAccountForm from "@/modules/finance/bankAccounts/components/BankAccountForm";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/shared/components/FormActionButtons";

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Corriente",
  SAVINGS: "Ahorro",
  CASH: "Caja",
  CRYPTO: "Cripto",
};

export default function BankAccountList() {
  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [menuTarget, setMenuTarget] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [syncing, setSyncing] = useState(false);

  const syncBalances = async () => {
    setSyncing(true);
    try {
      await bankAccountService.syncBalances();
      await load();
      toast.current?.show({
        severity: "success",
        summary: "Saldos sincronizados",
        detail: "Los saldos se recalcularon desde el flujo de caja",
        life: 4000,
      });
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron sincronizar los saldos",
      });
    } finally {
      setSyncing(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await bankAccountService.getAll({
        page,
        limit: 20,
        isActive: "true",
        search: searchQuery || undefined,
      });
      setAccounts(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las cuentas",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, searchQuery]);

  const onSave = async () => {
    setShowForm(false);
    setSelected(null);
    await load();
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Cuenta guardada",
    });
  };

  const getMenuItems = (target: BankAccount | null): MenuItem[] => [
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => setShowForm(true),
    },
    {
      label: target?.isActive ? "Desactivar" : "Activar",
      icon: target?.isActive ? "pi pi-ban" : "pi pi-check",
      command: () =>
        confirmDialog({
          message: `¿${
            target?.isActive ? "Desactivar" : "Activar"
          } esta cuenta?`,
          header: "Confirmar",
          icon: "pi pi-question-circle",
          accept: async () => {
            await bankAccountService.update(target!.id, {
              isActive: !target!.isActive,
            });
            await load();
            toast.current?.show({
              severity: "success",
              summary: "Éxito",
              detail: "Cuenta actualizada",
            });
          },
        }),
    },
  ];

  const actionsBody = (row: BankAccount) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setMenuTarget(row);
        setSelected(row);
        menuRef.current?.toggle(e);
      }}
      aria-controls="bank-account-menu"
      aria-haspopup
    />
  );

  const statusBody = (row: BankAccount) => (
    <Tag
      value={row.isActive ? "Activa" : "Inactiva"}
      severity={row.isActive ? "success" : "danger"}
    />
  );

  const balanceBody = (row: BankAccount) => (
    <span className="font-semibold">
      {row.currency}{" "}
      {Number(row.currentBalance).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
      })}
    </span>
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Cuentas Bancarias</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex gap-2">
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
        <Button
          label="Sincronizar Saldos"
          icon="pi pi-sync"
          outlined
          severity="secondary"
          size="small"
          loading={syncing}
          onClick={syncBalances}
          tooltip="Recalcula el saldo de cada cuenta desde el flujo de caja"
          tooltipOptions={{ position: "top" }}
        />
        <CreateButton
          label="Nueva Cuenta"
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
      <Menu
        model={getMenuItems(menuTarget)}
        popup
        ref={menuRef}
        id="bank-account-menu"
      />

      <div className="card">
        <DataTable
          value={accounts}
          loading={loading}
          lazy
          paginator
          rows={20}
          rowsPerPageOptions={[5, 10, 25, 50]}
          totalRecords={total}
          onPage={(e) => setPage((e.page ?? 0) + 1)}
          emptyMessage="Sin cuentas registradas"
          stripedRows
          scrollable
          sortMode="multiple"
          header={header}
        >
          <Column field="name" header="Nombre" sortable />
          <Column
            field="type"
            header="Tipo"
            body={(r) => TYPE_LABELS[r.type] ?? r.type}
          />
          <Column field="bankName" header="Banco" />
          <Column field="accountNumber" header="Número" />
          <Column field="currency" header="Moneda" />
          <Column header="Saldo Actual" body={balanceBody} />
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
                <i className="pi pi-building-columns mr-3 text-primary text-3xl" />
                {selected ? "Editar Cuenta" : "Nueva Cuenta Bancaria"}
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="bank-account-form"
            isUpdate={!!selected}
            onCancel={() => setShowForm(false)}
            isSubmitting={isSubmitting}
          />
        }
        style={{ width: "480px" }}
        maximizable
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        modal
        draggable={false}
      >
        <BankAccountForm
          account={selected}
          onSave={onSave}
          formId="bank-account-form"
          toast={toast}
          onSubmittingChange={setIsSubmitting}
        />
      </Dialog>
    </>
  );
}
