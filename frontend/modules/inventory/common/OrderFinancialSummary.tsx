import React from "react";
import { CalculationResult } from "../../../hooks/useOrderCalculation";
import { CURRENCY_SYMBOLS } from "@/utils/currencyFormat";

interface OrderFinancialSummaryProps {
  totals: CalculationResult;
  currency?: string;
  exchangeRate?: number | null;
  referenceUsdRate?: number | null;
}

export const OrderFinancialSummary: React.FC<OrderFinancialSummaryProps> = ({
  totals,
  currency = "USD",
  exchangeRate,
  referenceUsdRate,
}) => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "$";

  const formatAmount = (amount: number, sym: string) =>
    `${sym}${amount.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Cross-reference calculation
  let crossAmount: number | null = null;
  let crossSymbol = "";
  let crossLabel = "";

  if (currency === "VES" && referenceUsdRate && referenceUsdRate > 0) {
    crossAmount = totals.total / referenceUsdRate;
    crossSymbol = "$";
    crossLabel = "USD";
  } else if (currency !== "VES" && exchangeRate && exchangeRate > 0) {
    crossAmount = totals.total * exchangeRate;
    crossSymbol = "Bs.";
    crossLabel = "VES";
  }

  return (
    <div className="surface-100 p-4 border-round shadow-1">
      <h3 className="m-0 mb-3 text-900 font-medium text-xl">
        Resumen Financiero
      </h3>

      <div className="flex flex-column gap-2">
        <div className="flex justify-content-between align-items-center">
          <span className="text-700">Subtotal Bruto:</span>
          <span className="font-semibold">
            {formatAmount(totals.subtotalBruto, symbol)}
          </span>
        </div>

        {totals.discountAmount > 0 && (
          <div className="flex justify-content-between align-items-center text-red-500">
            <span>Descuento General:</span>
            <span className="font-semibold">
              -{formatAmount(totals.discountAmount, symbol)}
            </span>
          </div>
        )}

        <div className="flex justify-content-between align-items-center">
          <span className="text-700">Base Imponible (16%):</span>
          <span className="font-semibold">
            {formatAmount(totals.baseImponible, symbol)}
          </span>
        </div>

        {totals.baseExenta > 0 && (
          <div className="flex justify-content-between align-items-center">
            <span className="text-700">Base Exenta (0%):</span>
            <span className="font-semibold">
              {formatAmount(totals.baseExenta, symbol)}
            </span>
          </div>
        )}

        <div className="flex justify-content-between align-items-center">
          <span className="text-700">IVA (16%):</span>
          <span className="font-semibold">
            {formatAmount(totals.taxAmount, symbol)}
          </span>
        </div>

        {totals.igtfAmount > 0 && (
          <div className="flex justify-content-between align-items-center text-yellow-600">
            <span>IGTF (3%):</span>
            <span className="font-semibold">
              {formatAmount(totals.igtfAmount, symbol)}
            </span>
          </div>
        )}

        <hr className="my-2 border-top-1 border-300" />

        <div className="flex justify-content-between align-items-center text-xl font-bold text-900">
          <span>Total a Pagar:</span>
          <div className="flex flex-column align-items-end gap-1">
            <span className="text-primary">
              {formatAmount(totals.total, symbol)} {currency}
            </span>
            {crossAmount !== null && (
              <span className="text-sm font-normal text-500">
                ≈ {formatAmount(crossAmount, crossSymbol)} {crossLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
