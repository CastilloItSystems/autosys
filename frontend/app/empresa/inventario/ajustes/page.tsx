"use client";

import { useState, useEffect } from "react";
import AdjustmentList from "@/components/inventory/adjustments/AdjustmentList";
import { getActiveWarehouses } from "@/app/api/inventory/warehouseService";
import { Warehouse } from "@/app/api/inventory/warehouseService";

export default function AjustesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await getActiveWarehouses();
        setWarehouses(response.data || []);
      } catch (error) {
        console.error("Error loading warehouses:", error);
      }
    })();
  }, []);

  return <AdjustmentList warehouses={warehouses} />;
}
