/**
 * useStockAlerts Hook
 * Manages stock alerts (low stock, dead stock, etc.)
 */

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import stockService, { StockAlert } from "@/modules/inventory/stocks/services/stockService";

export interface StockAlertsState {
  total: number;
  critical: number;
  warning: number;
  info: number;
  alerts: StockAlert[];
}

const STOCK_ALERTS_KEY = "stock-alerts-unread";

const EMPTY_ALERTS: StockAlertsState = {
  total: 0,
  critical: 0,
  warning: 0,
  info: 0,
  alerts: [],
};

export const useStockAlerts = (enabled: boolean = true) => {
  // SWR maneja el polling (refreshInterval) y la deduplicación entre los
  // múltiples consumidores que comparten esta misma key.
  const { data, isLoading, mutate } = useSWR(
    enabled ? STOCK_ALERTS_KEY : null,
    () => stockService.getAlerts(1, 50, { isRead: false }),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  );

  const alerts = useMemo<StockAlertsState>(() => {
    const alertList = data?.data;
    if (!alertList) return EMPTY_ALERTS;
    return {
      total: alertList.length,
      critical: alertList.filter((a) => a.severity === "CRITICAL").length,
      warning: alertList.filter((a) => a.severity === "MEDIUM").length,
      info: alertList.filter((a) => a.severity === "LOW").length,
      alerts: alertList,
    };
  }, [data]);

  const handleMarkAsRead = useCallback(
    async (alertId: string) => {
      try {
        await stockService.markAlertAsRead(alertId);
        await mutate();
      } catch (error) {
        console.error("Error marking alert as read:", error);
      }
    },
    [mutate],
  );

  return {
    loading: isLoading,
    alerts,
    fetchAlerts: mutate,
    handleMarkAsRead,
  };
};

export default useStockAlerts;
