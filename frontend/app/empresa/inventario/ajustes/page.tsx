"use client";

import { useState, useEffect } from "react";
import AdjustmentList from "@/modules/inventory/adjustments/components/AdjustmentList";
import warehouseService from "@/modules/inventory/warehouses/services/warehouseService";
import { Warehouse } from "@/modules/inventory/warehouses/services/warehouseService";

export default function AjustesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await warehouseService.getActive();
        setWarehouses(response.data || []);
      } catch (error) {
        console.error("Error loading warehouses:", error);
      }
    })();
  }, []);

  return <AdjustmentList />;
}
