import { useCallback, useEffect, useState } from "react";

import { getBrent } from "@/app/api/brentService";
import { getOilDerivate } from "@/app/api/oilDerivativesService";

export const useRefineryPrecios = () => {
  const [loading, setLoading] = useState(true);

  const [brent, setBrent] = useState<any | null>(null);
  const [oilDerivate, setOilDerivate] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Desestructuramos el resultado de Promise.all
      const [brentData, getOilDerivateData] = await Promise.all([
        getBrent(),
        getOilDerivate(),
      ]);
      const derivateData = {
        gas: 0,
        naphtha: getOilDerivateData.nafta,
        kerosene: 0,
        fo4: getOilDerivateData.fo4,
        fo6: getOilDerivateData.fo6,
      };
      // Guardamos únicamente el 'price'
      setBrent(Number(brentData.price));
      setOilDerivate(derivateData);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    brent,
    oilDerivate,
  };
};
