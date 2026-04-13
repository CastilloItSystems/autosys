import { useMemo } from "react";
import Decimal from "decimal.js-light";
import type { TaxType } from "../libs/interfaces/inventory/purchaseOrder.interface";

export type ServiceOrderItemType = "LABOR" | "PART" | "OTHER";

export interface ServiceOrderCalcItem {
  type: ServiceOrderItemType;
  quantity: number;
  unitPrice: number;
  discountPct?: number; // 0-100
  taxType?: TaxType;
}

export interface WorkshopCalculationResult {
  /** Totals broken down by item type (each includes tax) */
  laborTotal: number;
  partsTotal: number;
  otherTotal: number;
  /** Tax decomposition */
  subtotalBruto: number;
  baseImponible: number;
  baseReducida: number;
  baseExenta: number;
  taxAmount: number;
  /** Final total */
  total: number;
  /** Per-line computed values — same index as input items */
  items: {
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    subtotal: number;
    totalLine: number;
  }[];
}

export function useServiceOrderCalculation(
  items: ServiceOrderCalcItem[],
  taxRatePercent = 16,
): WorkshopCalculationResult {
  return useMemo(() => {
    let subtotalBruto = new Decimal(0);
    let sumGravadasIVA = new Decimal(0);
    let sumGravadasReduced = new Decimal(0);
    let sumExentas = new Decimal(0);

    let laborTotalRaw = new Decimal(0);
    let partsTotalRaw = new Decimal(0);
    let otherTotalRaw = new Decimal(0);

    const processedItems = items.map((item) => {
      const qty = new Decimal(item.quantity || 0);
      const price = new Decimal(item.unitPrice || 0);
      const discPct = new Decimal(item.discountPct || 0);

      const lineRaw = qty.mul(price);
      const lineDiscount = lineRaw.mul(discPct.div(100));
      const lineSubtotal = lineRaw.minus(lineDiscount);

      subtotalBruto = subtotalBruto.plus(lineSubtotal);

      const taxType = item.taxType ?? "IVA";
      const itemTaxRate =
        taxType === "IVA"
          ? new Decimal(taxRatePercent)
          : taxType === "REDUCED"
          ? new Decimal(8)
          : new Decimal(0);

      const lineTax = lineSubtotal.mul(itemTaxRate.div(100));
      const lineTotal = lineSubtotal.plus(lineTax);

      // Separate gravadas by tax type
      if (taxType === "IVA") {
        sumGravadasIVA = sumGravadasIVA.plus(lineSubtotal);
      } else if (taxType === "REDUCED") {
        sumGravadasReduced = sumGravadasReduced.plus(lineSubtotal);
      } else {
        sumExentas = sumExentas.plus(lineSubtotal);
      }

      // Accumulate per type
      if (item.type === "LABOR") {
        laborTotalRaw = laborTotalRaw.plus(lineTotal);
      } else if (item.type === "PART") {
        partsTotalRaw = partsTotalRaw.plus(lineTotal);
      } else {
        otherTotalRaw = otherTotalRaw.plus(lineTotal);
      }

      return {
        lineDiscount,
        lineSubtotal,
        itemTaxRate,
        lineTax,
        lineTotal,
      };
    });

    const taxAmountIVA = sumGravadasIVA.mul(new Decimal(taxRatePercent).div(100));
    const taxAmountReduced = sumGravadasReduced.mul(new Decimal(8).div(100));
    const taxAmount = taxAmountIVA.plus(taxAmountReduced);
    const sumGravadas = sumGravadasIVA.plus(sumGravadasReduced);
    const total = laborTotalRaw.plus(partsTotalRaw).plus(otherTotalRaw);

    const finalItems = processedItems.map((p) => ({
      discountAmount: p.lineDiscount.toDecimalPlaces(2).toNumber(),
      taxRate: p.itemTaxRate.toDecimalPlaces(2).toNumber(),
      taxAmount: p.lineTax.toDecimalPlaces(2).toNumber(),
      subtotal: p.lineSubtotal.toDecimalPlaces(2).toNumber(),
      totalLine: p.lineTotal.toDecimalPlaces(2).toNumber(),
    }));

    return {
      laborTotal: laborTotalRaw.toDecimalPlaces(2).toNumber(),
      partsTotal: partsTotalRaw.toDecimalPlaces(2).toNumber(),
      otherTotal: otherTotalRaw.toDecimalPlaces(2).toNumber(),
      subtotalBruto: subtotalBruto.toDecimalPlaces(2).toNumber(),
      baseImponible: sumGravadasIVA.toDecimalPlaces(2).toNumber(),
      baseReducida: sumGravadasReduced.toDecimalPlaces(2).toNumber(),
      baseExenta: sumExentas.toDecimalPlaces(2).toNumber(),
      taxAmount: taxAmount.toDecimalPlaces(2).toNumber(),
      total: total.toDecimalPlaces(2).toNumber(),
      items: finalItems,
    };
  }, [items, taxRatePercent]);
}
