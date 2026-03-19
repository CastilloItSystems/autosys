import React from "react";
import { CalculationResult } from "../../../hooks/useOrderCalculation";

interface OrderFinancialSummaryProps {
  totals: CalculationResult;
  currencySymbol?: string;
}

export const OrderFinancialSummary: React.FC<OrderFinancialSummaryProps> = ({
  totals,
  currencySymbol = "$",
}) => {
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="surface-100 p-4 border-round shadow-1">
      <h3 className="m-0 mb-3 text-900 font-medium text-xl">
        Resumen Financiero
      </h3>

      <div className="flex flex-column gap-2">
        <div className="flex justify-content-between align-items-center">
          <span className="text-700">Subtotal Bruto:</span>
          <span className="font-semibold">
            {formatCurrency(totals.subtotalBruto)}
          </span>
        </div>

        {totals.discountAmount > 0 && (
          <div className="flex justify-content-between align-items-center text-red-500">
            <span>Descuento General:</span>
            <span className="font-semibold">
              -{formatCurrency(totals.discountAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-content-between align-items-center">
          <span className="text-700">Base Imponible (16%):</span>
          <span className="font-semibold">
            {formatCurrency(totals.baseImponible)}
          </span>
        </div>

        {totals.baseExenta > 0 && (
          <div className="flex justify-content-between align-items-center">
            <span className="text-700">Base Exenta (0%):</span>
            <span className="font-semibold">
              {formatCurrency(totals.baseExenta)}
            </span>
          </div>
        )}

        <div className="flex justify-content-between align-items-center">
          <span className="text-700">IVA (16%):</span>
          <span className="font-semibold">
            {formatCurrency(totals.taxAmount)}
          </span>
        </div>

        {totals.igtfAmount > 0 && (
          <div className="flex justify-content-between align-items-center text-yellow-600">
            <span>IGTF (3%):</span>
            <span className="font-semibold">
              {formatCurrency(totals.igtfAmount)}
            </span>
          </div>
        )}

        <hr className="my-2 border-top-1 border-300" />

        <div className="flex justify-content-between align-items-center text-xl font-bold text-900">
          <span>Total a Pagar:</span>
          <span className="text-primary">{formatCurrency(totals.total)}</span>
        </div>
      </div>
    </div>
  );
};
