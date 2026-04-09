import { useMemo } from "react";
import Decimal from "decimal.js-light";
import { TaxType } from "../libs/interfaces/inventory/purchaseOrder.interface";

export interface CalculationItemInput {
  quantityOrdered: number;
  unitCost: number;
  discountPercent?: number;
  taxType?: TaxType;
}

export interface CalculationResult {
  subtotalBruto: number;
  discountAmount: number;
  baseImponible: number;
  baseExenta: number;
  taxAmount: number;
  igtfAmount: number;
  total: number;
  items: {
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    subtotal: number;
    totalLine: number;
  }[];
}

export const useOrderCalculation = (
  items: CalculationItemInput[],
  globalDiscountAmount: number = 0,
  igtfApplies: boolean = false,
  taxRatePercent: number = 16,
  igtfRatePercent: number = 3,
): CalculationResult => {
  return useMemo(() => {
    let subtotalBruto = new Decimal(0);
    let sumGravadas = new Decimal(0);
    let sumExentas = new Decimal(0);

    const processedItems = items.map((item) => {
      const qty = new Decimal(item.quantityOrdered || 0);
      const unitCost = new Decimal(item.unitCost || 0);
      const discountPercent = new Decimal(item.discountPercent || 0);

      const lineSubtotalRaw = qty.mul(unitCost);
      const lineDiscount = lineSubtotalRaw.mul(discountPercent.div(100));
      const lineSubtotal = lineSubtotalRaw.minus(lineDiscount);

      subtotalBruto = subtotalBruto.plus(lineSubtotal);

      const taxType = item.taxType || "IVA";
      const itemTaxRate =
        taxType === "IVA"
          ? new Decimal(taxRatePercent)
          : taxType === "REDUCED"
          ? new Decimal(8)
          : new Decimal(0);

      if (itemTaxRate.greaterThan(0)) {
        sumGravadas = sumGravadas.plus(lineSubtotal);
      } else {
        sumExentas = sumExentas.plus(lineSubtotal);
      }

      return {
        lineSubtotalRaw,
        lineDiscount,
        lineSubtotal,
        itemTaxRate,
      };
    });

    const globalDiscount = new Decimal(globalDiscountAmount || 0);
    let descGravado = new Decimal(0);
    let descExento = new Decimal(0);

    if (subtotalBruto.greaterThan(0) && globalDiscount.greaterThan(0)) {
      descGravado = globalDiscount.mul(sumGravadas.div(subtotalBruto));
      descExento = globalDiscount.mul(sumExentas.div(subtotalBruto));
    }

    const baseImponible = sumGravadas.minus(descGravado);
    const baseExenta = sumExentas.minus(descExento);

    const taxAmount = baseImponible.mul(new Decimal(taxRatePercent).div(100));

    let igtfAmount = new Decimal(0);
    if (igtfApplies) {
      const montoIgtfBase = baseImponible.plus(baseExenta).plus(taxAmount);
      igtfAmount = montoIgtfBase.mul(new Decimal(igtfRatePercent).div(100));
    }

    const total = baseImponible
      .plus(baseExenta)
      .plus(taxAmount)
      .plus(igtfAmount);

    const finalItems = processedItems.map((pItem) => {
      const itemTaxAmount = pItem.lineSubtotal.mul(pItem.itemTaxRate.div(100));
      const totalLine = pItem.lineSubtotal.plus(itemTaxAmount);
      return {
        discountAmount: pItem.lineDiscount.toDecimalPlaces(2).toNumber(),
        taxRate: pItem.itemTaxRate.toDecimalPlaces(2).toNumber(),
        taxAmount: itemTaxAmount.toDecimalPlaces(2).toNumber(),
        subtotal: pItem.lineSubtotal.toDecimalPlaces(2).toNumber(),
        totalLine: totalLine.toDecimalPlaces(2).toNumber(),
      };
    });

    return {
      subtotalBruto: subtotalBruto.toDecimalPlaces(2).toNumber(),
      discountAmount: globalDiscount.toDecimalPlaces(2).toNumber(),
      baseImponible: baseImponible.toDecimalPlaces(2).toNumber(),
      baseExenta: baseExenta.toDecimalPlaces(2).toNumber(),
      taxAmount: taxAmount.toDecimalPlaces(2).toNumber(),
      igtfAmount: igtfAmount.toDecimalPlaces(2).toNumber(),
      total: total.toDecimalPlaces(2).toNumber(),
      items: finalItems,
    };
  }, [
    JSON.stringify(items),
    globalDiscountAmount,
    igtfApplies,
    taxRatePercent,
    igtfRatePercent,
  ]);
};
