import { useState, useEffect } from "react";
import apiClient from "@/app/api/apiClient";

interface UseBcvRateReturn {
  rate: number | null;
  loading: boolean;
  error: string | null;
  source: "BCV_AUTO" | "MANUAL";
  setManualRate: (rate: number) => void;
  fetchRate: () => Promise<void>;
}

// Hook para obtener la tasa del BCV
export const useBcvRate = (
  currency: "USD" | "EUR" | "VES",
): UseBcvRateReturn => {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"BCV_AUTO" | "MANUAL">("BCV_AUTO");

  const fetchRate = async () => {
    if (currency === "VES") {
      setRate(1);
      setSource("BCV_AUTO");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/exchange-rates/latest", {
        params: { fromCurrency: currency, toCurrency: "VES" },
      });
      const value = Number(response?.data?.data?.rate ?? 0);
      if (!value || Number.isNaN(value) || value <= 0) {
        throw new Error(`No hay tasa BCV activa para ${currency}/VES`);
      }
      setRate(value);
      setSource("BCV_AUTO");
    } catch (err: any) {
      setError(err.message || "Error al obtener tasa del BCV");
    } finally {
      setLoading(false);
    }
  };

  const setManualRate = (manualRate: number) => {
    setRate(manualRate);
    setSource("MANUAL");
  };

  useEffect(() => {
    fetchRate();
  }, [currency]);

  return { rate, loading, error, source, setManualRate, fetchRate };
};
