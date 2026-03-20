"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";

import { PreInvoice } from "@/libs/interfaces/sales/preInvoice.interface";
import {
  Payment,
  PaymentMethod,
  PaymentDetail,
  PAYMENT_METHOD_CONFIG,
  PAYMENT_METHOD_OPTIONS,
} from "@/libs/interfaces/sales/payment.interface";
import paymentService from "@/app/api/sales/paymentService";
import { handleFormError } from "@/utils/errorHandlers";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

interface PaymentDialogProps {
  visible: boolean;
  onHide: () => void;
  preInvoice: PreInvoice | null;
  existingPayments: Payment[];
  onSuccess: () => void;
  toast: React.RefObject<Toast | null>;
}

const PaymentDialog = ({
  visible,
  onHide,
  preInvoice,
  existingPayments,
  onSuccess,
  toast,
}: PaymentDialogProps) => {
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [igtfApplies, setIgtfApplies] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mixed payment details
  const [mixedDetails, setMixedDetails] = useState<PaymentDetail[]>([
    { method: PaymentMethod.CASH, amount: 0 },
    { method: PaymentMethod.TRANSFER, amount: 0 },
  ]);

  // Calculate totals
  const totalPreInvoice = Number(preInvoice?.total || 0);
  const totalPaidSoFar = round2(
    existingPayments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount), 0),
  );
  const remainingAmount = round2(totalPreInvoice - totalPaidSoFar);

  const igtfAmount = igtfApplies ? round2(amount * 0.03) : 0;
  const totalWithIgtf = round2(amount + igtfAmount);

  // Reset form when dialog opens
  useEffect(() => {
    if (visible && preInvoice) {
      setMethod(PaymentMethod.CASH);
      setAmount(remainingAmount);
      setReference("");
      setNotes("");
      setIgtfApplies(preInvoice.igtfApplies || false);
      setMixedDetails([
        { method: PaymentMethod.CASH, amount: 0 },
        { method: PaymentMethod.TRANSFER, amount: 0 },
      ]);
    }
  }, [visible, preInvoice?.id]);

  // Sync mixed details sum with amount
  useEffect(() => {
    if (method === PaymentMethod.MIXED) {
      const sum = round2(mixedDetails.reduce((s, d) => s + (d.amount || 0), 0));
      setAmount(sum);
    }
  }, [mixedDetails, method]);

  const handleAddMixedLine = () => {
    setMixedDetails((prev) => [
      ...prev,
      { method: PaymentMethod.CASH, amount: 0 },
    ]);
  };

  const handleRemoveMixedLine = (index: number) => {
    if (mixedDetails.length <= 2) return;
    setMixedDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMixedChange = (
    index: number,
    field: keyof PaymentDetail,
    value: any,
  ) => {
    setMixedDetails((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  };

  const handleSubmit = async () => {
    if (!preInvoice) return;

    if (amount <= 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "El monto debe ser mayor a 0",
        life: 3000,
      });
      return;
    }

    if (amount > remainingAmount) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: `El monto excede el saldo pendiente (${formatCurrency(
          remainingAmount,
        )})`,
        life: 3000,
      });
      return;
    }

    if (method === PaymentMethod.MIXED) {
      const sum = round2(mixedDetails.reduce((s, d) => s + (d.amount || 0), 0));
      if (sum !== round2(amount)) {
        toast.current?.show({
          severity: "warn",
          summary: "Atención",
          detail: "La suma de los métodos no coincide con el monto total",
          life: 3000,
        });
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        preInvoiceId: preInvoice.id,
        method,
        amount,
        currency: preInvoice.currency || "USD",
        exchangeRate: preInvoice.exchangeRate || undefined,
        igtfApplies,
        reference: reference || undefined,
        notes: notes || undefined,
      };

      if (method === PaymentMethod.MIXED) {
        payload.details = mixedDetails.map((d) => ({
          method: d.method,
          amount: d.amount,
          reference: d.reference || undefined,
        }));
      }

      await paymentService.create(payload);

      toast.current?.show({
        severity: "success",
        summary: "Pago Procesado",
        detail: `Pago de ${formatCurrency(amount)} registrado exitosamente`,
        life: 3000,
      });

      onSuccess();
      onHide();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  if (!preInvoice) return null;

  const mixedMethodOptions = PAYMENT_METHOD_OPTIONS.filter(
    (o) => o.value !== PaymentMethod.MIXED,
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "700px" }}
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-green-500 pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-wallet mr-3 text-green-500 text-3xl"></i>
              Registrar Pago
            </h2>
          </div>
        </div>
      }
      modal
      onHide={onHide}
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
            label={`Procesar Pago ${formatCurrency(totalWithIgtf)}`}
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
        {/* ── Resumen Pre-factura ── */}
        <div className="surface-100 border-round p-3">
          <div className="grid">
            <div className="col-6">
              <span className="text-500 text-sm">Pre-factura</span>
              <div className="font-bold text-900">
                {preInvoice.preInvoiceNumber}
              </div>
            </div>
            <div className="col-6 text-right">
              <span className="text-500 text-sm">Total</span>
              <div className="font-bold text-primary text-xl">
                {formatCurrency(totalPreInvoice)}
              </div>
            </div>
          </div>
          {preInvoice.customer && (
            <div className="mt-2 text-sm text-600">
              <i className="pi pi-user mr-1" />
              {preInvoice.customer.name}
              {preInvoice.customer.taxId && ` (${preInvoice.customer.taxId})`}
            </div>
          )}
        </div>

        {/* ── Pagos anteriores ── */}
        {existingPayments.length > 0 && (
          <div className="surface-50 border-round p-3">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-history text-blue-500" />
              <span className="font-semibold text-sm">Pagos anteriores</span>
            </div>
            {existingPayments
              .filter((p) => p.status === "COMPLETED")
              .map((p) => (
                <div
                  key={p.id}
                  className="flex justify-content-between align-items-center py-1"
                >
                  <span className="text-sm">
                    {p.paymentNumber} —{" "}
                    {PAYMENT_METHOD_CONFIG[p.method]?.label || p.method}
                  </span>
                  <span className="font-semibold text-sm">
                    {formatCurrency(Number(p.amount))}
                  </span>
                </div>
              ))}
            <Divider className="my-2" />
            <div className="flex justify-content-between">
              <span className="text-sm text-600">Pagado</span>
              <span className="font-bold">
                {formatCurrency(totalPaidSoFar)}
              </span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-sm font-semibold text-orange-500">
                Saldo pendiente
              </span>
              <span className="font-bold text-orange-500">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        )}

        {/* ── Método de pago ── */}
        <div className="field">
          <label className="font-semibold">
            Método de Pago <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={method}
            onChange={(e) => {
              setMethod(e.value);
              if (e.value !== PaymentMethod.MIXED) {
                setAmount(remainingAmount);
              }
            }}
            options={PAYMENT_METHOD_OPTIONS}
            optionLabel="label"
            optionValue="value"
            className="w-full"
          />
        </div>

        {/* ── Mixed details ── */}
        {method === PaymentMethod.MIXED && (
          <div className="surface-50 border-round p-3">
            <div className="flex align-items-center justify-content-between mb-2">
              <span className="font-semibold text-sm">Desglose de métodos</span>
              <Button
                icon="pi pi-plus"
                className="p-button-rounded p-button-text p-button-sm"
                onClick={handleAddMixedLine}
                tooltip="Agregar método"
              />
            </div>
            {mixedDetails.map((detail, idx) => (
              <div key={idx} className="flex gap-2 mb-2 align-items-center">
                <Dropdown
                  value={detail.method}
                  onChange={(e) => handleMixedChange(idx, "method", e.value)}
                  options={mixedMethodOptions}
                  optionLabel="label"
                  optionValue="value"
                  className="flex-1"
                  placeholder="Método"
                />
                <InputNumber
                  value={detail.amount}
                  onValueChange={(e) =>
                    handleMixedChange(idx, "amount", e.value || 0)
                  }
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  min={0}
                  className="flex-1"
                  placeholder="Monto"
                />
                <InputText
                  value={detail.reference || ""}
                  onChange={(e) =>
                    handleMixedChange(idx, "reference", e.target.value)
                  }
                  placeholder="Ref."
                  className="w-8rem"
                />
                {mixedDetails.length > 2 && (
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-text p-button-sm"
                    onClick={() => handleRemoveMixedLine(idx)}
                  />
                )}
              </div>
            ))}
            <div className="text-right mt-1">
              <span className="text-sm text-600">
                Suma:{" "}
                <b>
                  {formatCurrency(
                    round2(
                      mixedDetails.reduce((s, d) => s + (d.amount || 0), 0),
                    ),
                  )}
                </b>
              </span>
            </div>
          </div>
        )}

        {/* ── Monto (non-mixed) ── */}
        {method !== PaymentMethod.MIXED && (
          <div className="field">
            <label className="font-semibold">
              Monto <span className="text-red-500">*</span>
            </label>
            <InputNumber
              value={amount}
              onValueChange={(e) => setAmount(e.value || 0)}
              mode="currency"
              currency="USD"
              locale="en-US"
              min={0}
              max={remainingAmount}
              className="w-full"
            />
            {amount < remainingAmount && amount > 0 && (
              <small className="text-orange-500">
                Pago parcial — quedarán{" "}
                {formatCurrency(round2(remainingAmount - amount))} pendientes
              </small>
            )}
          </div>
        )}

        {/* ── Referencia ── */}
        {method !== PaymentMethod.CASH && method !== PaymentMethod.MIXED && (
          <div className="field">
            <label>Número de Referencia</label>
            <InputText
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Nro. de referencia bancaria"
              className="w-full"
            />
          </div>
        )}

        {/* ── IGTF ── */}
        <div className="flex align-items-center gap-3 surface-50 border-round p-3">
          <InputSwitch
            checked={igtfApplies}
            onChange={(e) => setIgtfApplies(e.value || false)}
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
              value={`+${formatCurrency(igtfAmount)}`}
              severity="warning"
              className="ml-auto"
            />
          )}
        </div>

        {/* ── Notas ── */}
        <div className="field">
          <label>Notas</label>
          <InputTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            autoResize
            placeholder="Observaciones del pago"
            className="w-full"
          />
        </div>

        {/* ── Total a cobrar ── */}
        <div className="surface-100 border-round p-3">
          <div className="flex justify-content-between align-items-center">
            <span className="text-600">Monto:</span>
            <span className="font-semibold">{formatCurrency(amount)}</span>
          </div>
          {igtfApplies && (
            <div className="flex justify-content-between align-items-center text-yellow-600">
              <span>IGTF (3%):</span>
              <span className="font-semibold">
                +{formatCurrency(igtfAmount)}
              </span>
            </div>
          )}
          <Divider className="my-2" />
          <div className="flex justify-content-between align-items-center text-xl font-bold">
            <span className="text-900">Total a cobrar:</span>
            <span className="text-primary">
              {formatCurrency(totalWithIgtf)}
            </span>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default PaymentDialog;
