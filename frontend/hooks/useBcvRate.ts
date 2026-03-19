import { useState, useEffect } from "react";

// Interfaz para la respuesta del servicio del BCV
interface BcvResponse {
  date: string;
  usd: number;
  eur: number;
}

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

  // En un ambiente real, este endpoint debería estar en el backend para evitar problemas de CORS
  // Por ahora se simulará una llamada a API
  const fetchRate = async () => {
    // Si la moneda base es VES (Bolívar), la tasa es 1
    if (currency === "VES") {
      setRate(1);
      setSource("BCV_AUTO");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Simulación de una petición a un proxy del BCV (ajustar con endpoint real)
      // const response = await fetch('/api/bcv-rates');
      // const data: BcvResponse = await response.json();

      // Simulando delay de red
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Tasa simulada (TODO: Cambiar a endpoint real)
      const mockData: BcvResponse = {
        date: new Date().toISOString(),
        usd: 36.25,
        eur: 39.4,
      };

      setRate(currency === "USD" ? mockData.usd : mockData.eur);
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
