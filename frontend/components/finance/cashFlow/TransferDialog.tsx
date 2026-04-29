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
import { useBcvRate } from "@/hooks/useBcvRate";

interface Props {
  visible: boolean;
  onHide: () => void;
  bankAccounts: BankAccount[];
  onSuccess: () => void;
  toast: React.RefObject<Toast | null>;
}

const fmt = (v: number, cur = "USD") =>
  `${cur} ${v.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;

export default function TransferDialog({
  visible,
  onHide,
  bankAccounts,
  onSuccess,
  toast,
}: Props) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(
    undefined,
  );
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const { rate: bcvRate } = useBcvRate("USD");

  const fromAccount = bankAccounts.find((a) => a.id === fromAccountId);
  const toAccount = bankAccounts.find((a) => a.id === toAccountId);
  const needsRate =
    fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  useEffect(() => {
    if (!visible) return;
    setFromAccountId("");
    setToAccountId("");
    setAmount(0);
    setDescription("");
    setExchangeRate(undefined);
  }, [visible]);

  useEffect(() => {
    if (needsRate && bcvRate && bcvRate > 1) setExchangeRate(bcvRate);
  }, [needsRate, bcvRate]);

  const toAmount = (() => {
    if (!needsRate || !exchangeRate || !fromAccount || !toAccount)
      return amount;
    if (fromAccount.currency === "USD" && toAccount.currency === "VES")
      return amount * exchangeRate;
    if (fromAccount.currency === "VES" && toAccount.currency === "USD")
      return amount / exchangeRate;
    return amount;
  })();

  const handleSubmit = async () => {
    if (!fromAccountId || !toAccountId) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Seleccione ambas cuentas",
      });
      return;
    }
    if (amount <= 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "El monto debe ser mayor a 0",
      });
      return;
    }
    if (needsRate && (!exchangeRate || exchangeRate <= 0)) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Ingrese la tasa de cambio",
      });
      return;
    }
    setLoading(true);
    try {
      await cashFlowService.createTransfer({
        fromAccountId,
        toAccountId,
        amount,
        exchangeRate: needsRate ? exchangeRate : undefined,
        description: description || undefined,
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
    label: `${a.name} (${a.currency}) — Saldo: ${fmt(
      Number(a.currentBalance),
      a.currency,
    )}`,
    value: a.id,
    currency: a.currency,
  }));

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="mb-2">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-xl font-bold text-900 m-0 flex align-items-center gap-2">
              <i className="pi pi-arrow-right-arrow-left text-primary" />
              Transferencia entre Cuentas
            </h2>
          </div>
        </div>
      }
      style={{ width: "480px" }}
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
            label="Transferir"
            icon="pi pi-check"
            severity="success"
            onClick={handleSubmit}
            loading={loading}
            className="flex-1"
          />
        </div>
      }
    >
      <div className="flex flex-column gap-3 pt-2">
        <div className="field">
          <label className="font-semibold">
            Cuenta Origen <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={fromAccountId}
            options={accountOptions}
            onChange={(e) => setFromAccountId(e.value)}
            placeholder="Seleccionar cuenta origen..."
            className="w-full"
          />
        </div>

        <div className="flex align-items-center justify-content-center">
          <i className="pi pi-arrow-down text-primary text-xl" />
        </div>

        <div className="field">
          <label className="font-semibold">
            Cuenta Destino <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={toAccountId}
            options={accountOptions.filter((a) => a.value !== fromAccountId)}
            onChange={(e) => setToAccountId(e.value)}
            placeholder="Seleccionar cuenta destino..."
            className="w-full"
          />
        </div>

        <div className="field">
          <label className="font-semibold">
            Monto <span className="text-red-500">*</span>
          </label>
          <InputNumber
            value={amount}
            onValueChange={(e) => setAmount(e.value ?? 0)}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0}
            className="w-full"
            prefix={fromAccount ? `${fromAccount.currency} ` : ""}
          />
        </div>

        {needsRate && (
          <div className="field">
            <label className="font-semibold">
              Tasa {fromAccount?.currency}/{toAccount?.currency}
              {bcvRate && bcvRate > 1 && (
                <span className="text-xs text-green-600 font-normal ml-2">
                  BCV:{" "}
                  {bcvRate.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </label>
            <InputNumber
              value={exchangeRate ?? null}
              onValueChange={(e) => setExchangeRate(e.value ?? undefined)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              className="w-full"
            />
          </div>
        )}

        {needsRate && toAccount && (
          <div className="surface-100 border-round p-3 text-sm">
            <span className="text-500">Recibirá en {toAccount.currency}: </span>
            <span className="font-bold">
              {fmt(toAmount, toAccount.currency)}
            </span>
          </div>
        )}

        <div className="field">
          <label className="font-semibold">Descripción</label>
          <InputText
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Motivo de la transferencia..."
            className="w-full"
          />
        </div>
      </div>
    </Dialog>
  );
}
