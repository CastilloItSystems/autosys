import React from "react";
import { Divider } from "primereact/divider";

export interface TotalsLine {
  label: string;
  value: number;
  highlight?: boolean;
}

interface TotalsFooterProps {
  lines: TotalsLine[];
  currency?: string;
}

export default function TotalsFooter({
  lines,
  currency = "USD",
}: TotalsFooterProps) {
  const fmt = new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

  return (
    <div className="flex justify-content-end mt-2">
      <div
        className="surface-100 border-round p-3"
        style={{ minWidth: "260px" }}
      >
        <Divider className="my-2" />
        {lines.map((line, i) => (
          <div
            key={i}
            className={`flex justify-content-between align-items-center mb-1 ${
              line.highlight ? "font-bold text-lg" : "text-sm"
            }`}
          >
            <span className={line.highlight ? "text-900" : "text-600"}>
              {line.label}
            </span>
            <span className={line.highlight ? "text-primary" : "text-700"}>
              {fmt.format(line.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
