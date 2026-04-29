// modules/crm/quotes/utils/quote.utils.ts

import { QUOTE_TYPE_OPTIONS, QUOTE_STATUS_OPTIONS } from "../interfaces/quote.interface";

export const QUOTE_TYPE_FILTER_OPTIONS = [
  { label: "Todos los tipos", value: "" },
  ...QUOTE_TYPE_OPTIONS,
];

export const QUOTE_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estados", value: "" },
  ...QUOTE_STATUS_OPTIONS,
];

export const QUOTE_REVISABLE_STATUSES = ["APPROVED", "EXPIRED", "REJECTED"];

export const QUOTE_CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "VES", value: "VES" },
  { label: "EUR", value: "EUR" },
];

export const QUOTE_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ISSUED", "SENT"],
  ISSUED: ["SENT", "NEGOTIATING", "APPROVED", "REJECTED", "EXPIRED"],
  SENT: ["NEGOTIATING", "APPROVED", "REJECTED", "EXPIRED"],
  NEGOTIATING: ["APPROVED", "REJECTED", "EXPIRED"],
  APPROVED: ["CONVERTED"],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
};

export function getQuoteNextStatusOptions(currentStatus: string) {
  const next = QUOTE_STATUS_TRANSITIONS[currentStatus] ?? [];
  return next.map((value) => ({ label: value, value }));
}

export function calcQuoteItemTotal(
  qty: number,
  price: number,
  discPct: number,
  taxPct: number
): number {
  return qty * price * (1 - discPct / 100) * (1 + taxPct / 100);
}
