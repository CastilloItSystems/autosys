import React from "react";
import { Divider } from "primereact/divider";
import { CURRENCY_SYMBOLS } from "@/utils/currencyFormat";

export interface TotalsLine {
  label: string;
  value: number;
  highlight?: boolean;
}

interface TotalsFooterProps {
  lines: TotalsLine[];
  currency?: string;
  exchangeRate?: number | null;
}

export default function TotalsFooter({
  lines,
  currency = "USD",
  exchangeRate,
}: TotalsFooterProps) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  const fmt = (value: number, s = sym) =>
    `${s} ${value.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const crossRef = (value: number): string | null => {
    const rate = Number(exchangeRate);
    if (currency === "VES") {
      if (!rate || rate <= 1) return null;
      return `≈ $ ${(value / rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    if (!rate || rate <= 0) return null;
    return `≈ Bs. ${(value * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex justify-content-end mt-2">
      <div className="surface-100 border-round p-3" style={{ minWidth: "260px" }}>
        <Divider className="my-2" />
        {lines.map((line, i) => (
          <div key={i} className={`flex justify-content-between align-items-center mb-1 ${line.highlight ? "font-bold text-lg" : "text-sm"}`}>
            <span className={line.highlight ? "text-900" : "text-600"}>
              {line.label}
            </span>
            <div className="flex flex-column align-items-end gap-1">
              <span className={line.highlight ? "text-primary" : "text-700"}>
                {fmt(line.value)}
              </span>
              {line.highlight && crossRef(line.value) && (
                <span className="text-xs font-normal text-500">
                  {crossRef(line.value)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
