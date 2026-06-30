"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import type { Expense } from "../interfaces/expense";
import type { PaymentMethod } from "@/modules/finance/supplierPayments/interfaces/supplierPayment";
import supplierPaymentService from "@/modules/finance/supplierPayments/services/supplierPaymentService";
import { useActiveBankAccountOptionsData } from "@/modules/finance/bankAccounts/hooks/useBankAccountsData";
import { useSupplierPaymentsData } from "@/modules/finance/supplierPayments/hooks/useSupplierPaymentsData";
import { handleFormError } from "@/utils/errorHandlers";
import { CURRENCY_SYMBOLS } from "@/utils/currencyFormat";
import { useBcvRate } from "@/hooks/useBcvRate";

interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

const METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "Efectivo", value: "CASH" },
  { label: "Transferencia", value: "TRANSFER" },
  { label: "Tarjeta", value: "CARD" },
  { label: "Pago Móvil", value: "MOBILE_PAYMENT" },
  { label: "Cheque", value: "CHECK" },
  { label: "Mixto", value: "MIXED" },
];

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  MOBILE_PAYMENT: "Pago Móvil",
  CHECK: "Cheque",
  MIXED: "Mixto",
};

const MIXED_OPTIONS = METHOD_OPTIONS.filter((o) => o.value !== "MIXED");

const round2 = (n: number) => Math.round(n * 100) / 100;

interface Props {
  visible: boolean;
  onHide: () => void;
  expense: Expense | null;
  onSuccess: () => void;
  toast: React.RefObject<Toast | null>;
}

export default function RegisterExpensePaymentDialog({
  visible,
  onHide,
  expense,
  onSuccess,
  toast,
}: Props) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [bankAccountId, setBankAccountId] = useState("");
  const [amount, setAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(
    undefined,
  );
  const [igtfApplies, setIgtfApplies] = useState(false);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [mixedDetails, setMixedDetails] = useState<PaymentDetail[]>([
    { method: "CASH", amount: 0 },
    { method: "TRANSFER", amount: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  // BCV auto-fill
  const { rate: bcvUsdRate, loading: bcvLoading } = useBcvRate("USD");
  const { rate: bcvEurRate } = useBcvRate("EUR");
  const { accounts: activeBankAccounts } = useActiveBankAccountOptionsData();
  const { payments: existingPayments } = useSupplierPaymentsData(
    visible && expense ? { expenseId: expense.id, limit: 50 } : null,
  );

  const currency = expense?.currency ?? "USD";
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";
  const fmt = (v: number) =>
    `${sym} ${v.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const bcvAutoRate = currency === "EUR" ? bcvEurRate : bcvUsdRate;

  const totalPaid = round2(
    existingPayments
      .filter((p) => p.status === "COMPLETED")
      .reduce((s, p) => s + Number(p.amount), 0),
  );
  const remaining = expense ? round2(Number(expense.total) - totalPaid) : 0;

  // IGTF only on non-VES portion (mirrors backend + RegisterPaymentDialog)
  const igtfBase = (() => {
    if (!igtfApplies) return 0;
    if (method === "MIXED") {
      return round2(
        mixedDetails
          .filter((d) => currency !== "VES")
          .reduce((s, d) => s + (d.amount || 0), 0),
      );
    }
    return currency !== "VES" ? amount : 0;
  })();
  const igtfAmount = round2(igtfBase * 0.03);
  const totalWithIgtf = round2(amount + igtfAmount);

  // Only show accounts matching the expense's currency
  const matchingAccounts = useMemo(
    () =>
      activeBankAccounts
        .filter((account) => account.currency === currency)
        .map((account) => ({
          label: `${account.name} (${account.currency})`,
          value: account.id,
          currency: account.currency,
        })),
    [activeBankAccounts, currency],
  );

  useEffect(() => {
    if (method === "MIXED") {
      setAmount(round2(mixedDetails.reduce((s, d) => s + (d.amount || 0), 0)));
    }
  }, [mixedDetails, method]);

  useEffect(() => {
    if (!visible || !expense) return;
    setMethod("CASH");
    setBankAccountId(expense.bankAccountId ?? "");
    setAmount(round2(Number(expense.pendingAmount)));
    setExchangeRate(
      currency !== "USD" && bcvAutoRate && bcvAutoRate > 0
        ? bcvAutoRate
        : undefined,
    );
    setIgtfApplies(false);
    setReference("");
    setNotes("");
    setMixedDetails([
      { method: "CASH", amount: 0 },
      { method: "TRANSFER", amount: 0 },
    ]);
  }, [visible, expense?.id, bcvAutoRate, currency, expense]);

  const handleSubmit = async () => {
    if (!expense) return;
    if (amount <= 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "El monto debe ser mayor a 0",
      });
      return;
    }
    if (!bankAccountId) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Seleccione una cuenta",
      });
      return;
    }
    if (method === "MIXED") {
      const sum = round2(mixedDetails.reduce((s, d) => s + (d.amount || 0), 0));
      if (sum !== round2(amount)) {
        toast.current?.show({
          severity: "warn",
          summary: "Atención",
          detail: "La suma de los métodos no coincide con el monto total",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        expenseId: expense.id,
        bankAccountId,
        method,
        amount,
        currency,
        exchangeRate: exchangeRate || undefined,
        igtfApplies,
        reference: reference || undefined,
        notes: notes || undefined,
      };
      if (expense.supplierId) payload.supplierId = expense.supplierId;
      if (method === "MIXED") {
        payload.details = mixedDetails.map((d) => ({
          method: d.method,
          amount: d.amount,
          reference: d.reference || undefined,
        }));
      }
      await supplierPaymentService.create(payload as any);
      toast.current?.show({
        severity: "success",
        summary: "Pago Procesado",
        detail: `Pago de ${fmt(amount)} registrado exitosamente`,
      });
      onSuccess();
      onHide();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setLoading(false);
    }
  };

  if (!expense) return null;

  const completedPayments = existingPayments.filter(
    (p) => p.status === "COMPLETED",
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      style={{ width: "700px" }}
      breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
      modal
      draggable={false}
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-green-500 pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-wallet mr-3 text-green-500 text-3xl" />
              Registrar Pago de Gasto
            </h2>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full gap-2 mb-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            onClick={onHide}
            disabled={loading}
            type="button"
            className="flex-1"
          />
          <Button
            label={`Procesar Pago ${fmt(totalWithIgtf)}`}
            icon="pi pi-check"
            severity="success"
            onClick={handleSubmit}
            loading={loading}
            type="button"
            className="flex-1"
          />
        </div>
      }
    >
      <div className="flex flex-column gap-3">
        {/* Resumen gasto */}
        <div className="surface-100 border-round p-3">
          <div className="grid">
            <div className="col-6">
              <span className="text-500 text-sm">Gasto</span>
              <div className="font-bold text-900">{expense.expenseNumber}</div>
              <div className="text-600 text-sm">{expense.description}</div>
            </div>
            <div className="col-6 text-right">
              <span className="text-500 text-sm">Total</span>
              <div className="font-bold text-primary text-xl">
                {fmt(Number(expense.total))}
              </div>
            </div>
          </div>
        </div>

        {/* Pagos anteriores */}
        {completedPayments.length > 0 && (
          <div className="surface-50 border-round p-3">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-history text-blue-500" />
              <span className="font-semibold text-sm">Pagos anteriores</span>
            </div>
            {completedPayments.map((p) => (
              <div
                key={p.id}
                className="flex justify-content-between align-items-center py-1"
              >
                <span className="text-sm">
                  {p.paymentNumber} — {METHOD_LABELS[p.method] ?? p.method}
                </span>
                <span className="font-semibold text-sm">
                  {fmt(Number(p.amount))}
                </span>
              </div>
            ))}
            <Divider className="my-2" />
            <div className="flex justify-content-between">
              <span className="text-sm text-600">Pagado</span>
              <span className="font-bold">{fmt(totalPaid)}</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-sm font-semibold text-orange-500">
                Saldo pendiente
              </span>
              <span className="font-bold text-orange-500">
                {fmt(remaining)}
              </span>
            </div>
          </div>
        )}

        {/* Cuenta */}
        <div className="field">
          <label className="font-semibold">
            Cuenta / Caja <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={bankAccountId}
            options={matchingAccounts}
            onChange={(e) => setBankAccountId(e.value)}
            placeholder={
              matchingAccounts.length === 0
                ? `Sin cuentas en ${currency}`
                : "Seleccionar cuenta..."
            }
            className="w-full"
            emptyMessage={`No hay cuentas activas en ${currency}`}
          />
          {matchingAccounts.length === 0 && (
            <small className="text-orange-500 flex align-items-center gap-1 mt-1">
              <i className="pi pi-exclamation-triangle" />
              No tienes cuentas activas en {currency}. Crea una en Cuentas
              Bancarias.
            </small>
          )}
        </div>

        {/* Método */}
        <div className="field">
          <label className="font-semibold">
            Método de Pago <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={method}
            options={METHOD_OPTIONS}
            onChange={(e) => {
              setMethod(e.value);
              if (e.value !== "MIXED") setAmount(remaining);
            }}
            className="w-full"
          />
        </div>

        {/* Desglose mixto */}
        {method === "MIXED" && (
          <div className="surface-50 border-round p-3">
            <div className="flex align-items-center justify-content-between mb-2">
              <span className="font-semibold text-sm">Desglose de métodos</span>
              <Button
                icon="pi pi-plus"
                className="p-button-rounded p-button-text p-button-sm"
                onClick={() =>
                  setMixedDetails((prev) => [
                    ...prev,
                    { method: "CASH", amount: 0 },
                  ])
                }
                tooltip="Agregar método"
              />
            </div>
            {mixedDetails.map((detail, idx) => (
              <div key={idx} className="flex gap-2 mb-2 align-items-center">
                <Dropdown
                  value={detail.method}
                  options={MIXED_OPTIONS}
                  onChange={(e) =>
                    setMixedDetails((prev) =>
                      prev.map((d, i) =>
                        i === idx ? { ...d, method: e.value } : d,
                      ),
                    )
                  }
                  className="flex-1"
                  placeholder="Método"
                />
                <InputNumber
                  value={detail.amount}
                  onValueChange={(e) =>
                    setMixedDetails((prev) =>
                      prev.map((d, i) =>
                        i === idx ? { ...d, amount: e.value || 0 } : d,
                      ),
                    )
                  }
                  mode="decimal"
                  prefix={`${sym} `}
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  className="flex-1"
                  placeholder="Monto"
                />
                <InputText
                  value={detail.reference || ""}
                  onChange={(e) =>
                    setMixedDetails((prev) =>
                      prev.map((d, i) =>
                        i === idx ? { ...d, reference: e.target.value } : d,
                      ),
                    )
                  }
                  placeholder="Ref."
                  className="w-8rem"
                />
                {mixedDetails.length > 2 && (
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-text p-button-sm"
                    onClick={() =>
                      setMixedDetails((prev) =>
                        prev.filter((_, i) => i !== idx),
                      )
                    }
                  />
                )}
              </div>
            ))}
            <div className="text-right mt-1">
              <span className="text-sm text-600">
                Suma:{" "}
                <b>
                  {fmt(
                    round2(
                      mixedDetails.reduce((s, d) => s + (d.amount || 0), 0),
                    ),
                  )}
                </b>
              </span>
            </div>
          </div>
        )}

        {/* Monto (no mixto) */}
        {method !== "MIXED" && (
          <div className="field">
            <label className="font-semibold">
              Monto <span className="text-red-500">*</span>
            </label>
            <InputNumber
              value={amount}
              onValueChange={(e) => setAmount(e.value ?? 0)}
              mode="decimal"
              prefix={`${sym} `}
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={remaining}
              className="w-full"
            />
            {amount < remaining && amount > 0 && (
              <small className="text-orange-500">
                Pago parcial — quedarán {fmt(round2(remaining - amount))}{" "}
                pendientes
              </small>
            )}
          </div>
        )}

        {/* Referencia */}
        {method !== "CASH" && method !== "MIXED" && (
          <div className="field">
            <label className="font-semibold">Número de Referencia</label>
            <InputText
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Nro. transferencia..."
              className="w-full"
            />
          </div>
        )}

        {/* Tasa de cambio */}
        {currency !== "USD" && (
          <div className="field">
            <label className="font-semibold flex align-items-center gap-2">
              {currency === "EUR" ? "Tasa Bs./EUR" : "Tasa ref. Bs./USD"}
              {bcvLoading && (
                <i className="pi pi-spin pi-spinner text-xs text-500" />
              )}
              {!bcvLoading && bcvAutoRate && bcvAutoRate > 1 && (
                <span className="text-xs text-green-600 font-normal">
                  BCV:{" "}
                  {bcvAutoRate.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
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
              placeholder={
                bcvLoading
                  ? "Cargando BCV..."
                  : `Bs. por 1 ${currency === "VES" ? "USD" : currency}`
              }
            />
          </div>
        )}

        {/* IGTF: aplica en pagos en divisas (no VES) */}
        {currency !== "VES" && (
          <div className="flex align-items-center gap-3 surface-50 border-round p-3">
            <InputSwitch
              checked={igtfApplies}
              onChange={(e) => setIgtfApplies(e.value ?? false)}
            />
            <div>
              <span className="font-semibold text-sm">
                Pago en Divisas (IGTF 3%)
              </span>
              <div className="text-xs text-500">
                Impuesto a Grandes Transacciones Financieras
              </div>
            </div>
            {igtfApplies && igtfAmount > 0 && (
              <Tag
                value={`+${fmt(igtfAmount)}`}
                severity="warning"
                className="ml-auto"
              />
            )}
          </div>
        )}

        {/* Notas */}
        <div className="field">
          <label className="font-semibold">Notas</label>
          <InputTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            autoResize
            placeholder="Observaciones del pago"
            className="w-full"
          />
        </div>

        {/* Resumen total */}
        <div className="surface-100 border-round p-3">
          <div className="flex justify-content-between align-items-center">
            <span className="text-600">Monto:</span>
            <span className="font-semibold">{fmt(amount)}</span>
          </div>
          {igtfApplies && (
            <div className="flex justify-content-between align-items-center text-yellow-600">
              <span>IGTF (3%):</span>
              <span className="font-semibold">+{fmt(igtfAmount)}</span>
            </div>
          )}
          <Divider className="my-2" />
          <div className="flex justify-content-between align-items-center text-xl font-bold">
            <span className="text-900">Total a pagar:</span>
            <span className="text-green-600">{fmt(totalWithIgtf)}</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
