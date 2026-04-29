"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import type { BankAccount } from "@/modules/finance/bankAccounts/interfaces/bankAccount";
import cashFlowService from "@/modules/finance/cashFlow/services/cashFlowService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  visible: boolean;
  onHide: () => void;
  bankAccounts: BankAccount[];
  preselectedAccountId?: string;
  onSuccess: () => void;
  toast: React.RefObject<Toast | null>;
}

export default function ManualAdjustmentDialog({
  visible,
  onHide,
  bankAccounts,
  preselectedAccountId,
  onSuccess,
  toast,
}: Props) {
  const [bankAccountId, setBankAccountId] = useState(
    preselectedAccountId ?? "",
  );
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedAccount = bankAccounts.find((a) => a.id === bankAccountId);

  useEffect(() => {
    if (!visible) return;
    setBankAccountId(preselectedAccountId ?? "");
    setAmount(0);
    setDescription("");
  }, [visible, preselectedAccountId]);

  const handleSubmit = async () => {
    if (!bankAccountId) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Seleccione una cuenta",
      });
      return;
    }
    if (amount === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "El monto no puede ser 0",
      });
      return;
    }
    if (!description.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Ingrese una descripción",
      });
      return;
    }
    setLoading(true);
    try {
      await cashFlowService.createAdjustment({
        bankAccountId,
        amount,
        description,
      });
      onSuccess();
      onHide();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setLoading(false);
    }
  };

  const accountOptions = bankAccounts.map((a) => ({
    label: `${a.name} (${a.currency})`,
    value: a.id,
  }));

  const isPositive = amount > 0;
  const isNegative = amount < 0;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="mb-2">
          <div className="border-bottom-2 border-orange-500 pb-2">
            <h2 className="text-xl font-bold text-900 m-0 flex align-items-center gap-2">
              <i className="pi pi-sliders-h text-orange-500" />
              Ajuste Manual de Caja
            </h2>
          </div>
        </div>
      }
      style={{ width: "420px" }}
      breakpoints={{ "900px": "85vw", "600px": "95vw" }}
      modal
      draggable={false}
      footer={
        <div className="flex w-full gap-2 mb-2">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            onClick={onHide}
            disabled={loading}
            className="flex-1"
          />
          <Button
            label={isNegative ? "Registrar Egreso" : "Registrar Ingreso"}
            icon={isNegative ? "pi pi-minus-circle" : "pi pi-plus-circle"}
            severity={isNegative ? "danger" : "success"}
            onClick={handleSubmit}
            loading={loading}
            className="flex-1"
          />
        </div>
      }
    >
      <div className="flex flex-column gap-3 pt-2">
        <div className="surface-50 border-round p-3 text-sm text-600">
          <i className="pi pi-info-circle mr-2" />
          Use valores <b>positivos</b> para entradas y <b>negativos</b> para
          salidas manuales.
        </div>

        <div className="field">
          <label className="font-semibold">
            Cuenta <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={bankAccountId}
            options={accountOptions}
            onChange={(e) => setBankAccountId(e.value)}
            placeholder="Seleccionar cuenta..."
            className="w-full"
          />
        </div>

        <div className="field">
          <label className="font-semibold">
            Monto <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-500 ml-2">
              (negativo = salida)
            </span>
          </label>
          <InputNumber
            value={amount}
            onValueChange={(e) => setAmount(e.value ?? 0)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            className={`w-full ${
              isPositive
                ? "p-inputtext-success"
                : isNegative
                ? "p-inputtext-danger"
                : ""
            }`}
            prefix={selectedAccount ? `${selectedAccount.currency} ` : ""}
          />
          {amount !== 0 && (
            <small className={isPositive ? "text-green-600" : "text-red-600"}>
              {isPositive
                ? "↑ Entrada (incrementa saldo)"
                : "↓ Salida (reduce saldo)"}
            </small>
          )}
        </div>

        <div className="field">
          <label className="font-semibold">
            Descripción <span className="text-red-500">*</span>
          </label>
          <InputText
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Corrección de saldo, depósito inicial..."
            className="w-full"
          />
        </div>
      </div>
    </Dialog>
  );
}
