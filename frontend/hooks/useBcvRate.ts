import { useState, useEffect, useCallback } from "react";
import apiClient from "@/app/api/apiClient";

interface UseBcvRateReturn {
  rate: number | null;
  loading: boolean;
  error: string | null;
  source: "BCV_AUTO" | "MANUAL";
  setManualRate: (rate: number) => void;
  fetchRate: () => Promise<void>;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const getCached = (currency: string): number | null => {
  try {
    const raw = sessionStorage.getItem(`bcv_rate_${currency}`);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return value;
  } catch {
    return null;
  }
};

const setCached = (currency: string, value: number) => {
  try {
    sessionStorage.setItem(`bcv_rate_${currency}`, JSON.stringify({ value, ts: Date.now() }));
  } catch {}
};

export const useBcvRate = (
  currency: "USD" | "EUR" | "VES",
): UseBcvRateReturn => {
  // Initialize immediately from cache so there's no loading flash for warm sessions
  const [rate, setRate] = useState<number | null>(() => {
    if (currency === "VES") return 1;
    return getCached(currency);
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"BCV_AUTO" | "MANUAL">("BCV_AUTO");

  const fetchRate = useCallback(async () => {
    if (currency === "VES") {
      setRate(1);
      setSource("BCV_AUTO");
      return;
    }

    // Use cached value if still fresh — skip network entirely
    const cached = getCached(currency);
    if (cached) {
      setRate(cached);
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
      setCached(currency, value);
      setRate(value);
      setSource("BCV_AUTO");
    } catch (err: any) {
      setError(err.message || "Error al obtener tasa del BCV");
    } finally {
      setLoading(false);
    }
  }, [currency]);

  const setManualRate = (manualRate: number) => {
    setRate(manualRate);
    setSource("MANUAL");
  };

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return { rate, loading, error, source, setManualRate, fetchRate };
};
