"use client";

import { useState, useEffect } from "react";
import TransferList from "@/modules/inventory/transfers/components/TransferList";
import warehouseService from "@/modules/inventory/warehouses/services/warehouseService";
import { Warehouse } from "@/modules/inventory/warehouses/services/warehouseService";

export default function TransferenciasPage() {
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

  return <TransferList warehouses={warehouses} />;
}
