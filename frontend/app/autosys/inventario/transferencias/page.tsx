"use client";

import { useState, useEffect } from "react";
import TransferList from "@/components/inventory/transfers/TransferList";
import { getActiveWarehouses } from "@/app/api/inventory/warehouseService";
import { Warehouse } from "@/app/api/inventory/warehouseService";

export default function TransferenciasPage() {
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

  return <TransferList warehouses={warehouses} />;
}
