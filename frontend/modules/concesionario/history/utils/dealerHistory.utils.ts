import type { DealerHistoryItem } from "../services/dealerHistoryService";

export const HISTORY_TYPE_LABELS: Record<DealerHistoryItem["type"], string> = {
  RESERVATION: "Reserva",
  QUOTE: "Cotización",
  TEST_DRIVE: "Prueba de manejo",
  TRADE_IN: "Retoma",
  FINANCING: "Financiamiento",
  DELIVERY: "Entrega",
};
