"use client";

import dynamic from "next/dynamic";

const InventoryDashboard = dynamic(
  () => import("@/modules/inventory/reports/components/InventoryDashboard"),
  { ssr: false },
);

export default function InventoryDashboardPage() {
  return <InventoryDashboard />;
}
