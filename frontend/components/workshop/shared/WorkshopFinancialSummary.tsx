import React from "react";
import { Divider } from "primereact/divider";
import type { WorkshopCalculationResult } from "../../../hooks/useServiceOrderCalculation";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface WorkshopFinancialSummaryProps {
  totals: WorkshopCalculationResult;
  /** ISO 4217 currency code. Default: "USD" */
  currency?: string;
  /** Optional IGTF amount to display below total */
  igtfAmount?: number;
  /** Locale for number formatting. Default: "es-VE" */
  locale?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkshopFinancialSummary({
  totals,
  currency = "USD",
  igtfAmount,
  locale = "es-VE",
}: WorkshopFinancialSummaryProps) {
  const fmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

  const {
    laborTotal,
    partsTotal,
    otherTotal,
    subtotalBruto,
    baseImponible,
    baseReducida,
    taxAmount,
    total,
  } = totals;

  const totalWithIgtf = igtfAmount != null ? total + igtfAmount : total;

  return (
    <div className="flex justify-content-end mt-2">
      <div
        className="surface-100 border-round p-3"
        style={{ minWidth: "280px" }}
      >
        {/* ── Breakdown by type ── */}
        {laborTotal > 0 && (
          <div className="flex justify-content-between align-items-center mb-1">
            <span className="text-600 text-sm flex align-items-center gap-2">
              <span className="px-2 border-round text-xs bg-blue-100 text-blue-800 font-medium">
                Mano de obra
              </span>
            </span>
            <span className="text-700 text-sm">{fmt.format(laborTotal)}</span>
          </div>
        )}
        {partsTotal > 0 && (
          <div className="flex justify-content-between align-items-center mb-1">
            <span className="text-600 text-sm flex align-items-center gap-2">
              <span className="px-2 border-round text-xs bg-green-100 text-green-800 font-medium">
                Refacciones
              </span>
            </span>
            <span className="text-700 text-sm">{fmt.format(partsTotal)}</span>
          </div>
        )}
        {otherTotal > 0 && (
          <div className="flex justify-content-between align-items-center mb-1">
            <span className="text-600 text-sm flex align-items-center gap-2">
              <span className="px-2 border-round text-xs bg-orange-100 text-orange-800 font-medium">
                Otros
              </span>
            </span>
            <span className="text-700 text-sm">{fmt.format(otherTotal)}</span>
          </div>
        )}

        <Divider className="my-2" />

        {/* ── Subtotal bruto ── */}
        <div className="flex justify-content-between align-items-center mb-1">
          <span className="text-600 text-sm">Subtotal</span>
          <span className="text-700 text-sm">{fmt.format(subtotalBruto)}</span>
        </div>

        {/* ── Tax IVA 16% ── */}
        {baseImponible > 0 && (
          <div className="flex justify-content-between align-items-center mb-1">
            <span className="text-600 text-sm">
              IVA{" "}
              <span className="text-500" style={{ fontSize: "0.7rem" }}>
                (Base {fmt.format(baseImponible)})
              </span>
            </span>
            <span className="text-700 text-sm">
              {fmt.format(baseImponible * 0.16)}
            </span>
          </div>
        )}

        {/* ── Tax REDUCED 8% ── */}
        {(baseReducida ?? 0) > 0 && (
          <div className="flex justify-content-between align-items-center mb-1">
            <span className="text-600 text-sm">
              IVA Reducido{" "}
              <span className="text-500" style={{ fontSize: "0.7rem" }}>
                (Base {fmt.format(baseReducida)})
              </span>
            </span>
            <span className="text-700 text-sm">
              {fmt.format((baseReducida ?? 0) * 0.08)}
            </span>
          </div>
        )}

        {/* ── IGTF (optional) ── */}
        {igtfAmount != null && igtfAmount > 0 && (
          <div className="flex justify-content-between align-items-center mb-1">
            <span className="text-600 text-sm">IGTF (3%)</span>
            <span className="text-700 text-sm">{fmt.format(igtfAmount)}</span>
          </div>
        )}

        <Divider className="my-2" />

        {/* ── Grand Total ── */}
        <div className="flex justify-content-between align-items-center">
          <span className="font-bold text-900">
            {igtfAmount != null && igtfAmount > 0 ? "Total + IGTF" : "Total"}
          </span>
          <span className="font-bold text-lg text-primary">
            {fmt.format(igtfAmount != null && igtfAmount > 0 ? totalWithIgtf : total)}
          </span>
        </div>
      </div>
    </div>
  );
}
