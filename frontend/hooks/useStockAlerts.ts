/**
 * useStockAlerts Hook
 * Manages stock alerts (low stock, dead stock, etc.)
 */

import { useCallback, useEffect, useState } from "react";
import stockService, { StockAlert } from "@/app/api/inventory/stockService";

export interface StockAlertsState {
  total: number;
  critical: number;
  warning: number;
  info: number;
  alerts: StockAlert[];
}

export const useStockAlerts = (enabled: boolean = true) => {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<StockAlertsState>({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    alerts: [],
  });

  const fetchAlerts = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const response = await stockService.getAlerts(1, 50, {
        isRead: false, // Only unread alerts
      });

      if (response?.data) {
        const alertList = response.data;

        // Count by severity
        const counts = {
          total: alertList.length,
          critical: alertList.filter((a) => a.severity === "CRITICAL").length,
          warning: alertList.filter((a) => a.severity === "MEDIUM").length,
          info: alertList.filter((a) => a.severity === "LOW").length,
        };

        setAlerts({
          ...counts,
          alerts: alertList,
        });
      }
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Fetch alerts on mount and periodically refresh
  useEffect(() => {
    if (enabled) {
      fetchAlerts();

      // Refresh every 30 seconds
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [enabled, fetchAlerts]);

  // Mark alert as read
  const handleMarkAsRead = useCallback(async (alertId: string) => {
    try {
      await stockService.markAlertAsRead(alertId);

      // Remove from local state
      setAlerts((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        alerts: prev.alerts.filter((a) => a.id !== alertId),
      }));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  }, []);

  return {
    loading,
    alerts,
    fetchAlerts,
    handleMarkAsRead,
  };
};

export default useStockAlerts;
