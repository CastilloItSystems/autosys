"use client";

import QuickActions from "@/components/inventory/dashboard/QuickActions";
import InventoryDashboard from "@/components/inventory/dashboard/InventoryDashboard";

function InventarioDashboard() {
  return (
    <div className="flex flex-column gap-4">
      <QuickActions />
      <InventoryDashboard />
    </div>
  );
}

export default InventarioDashboard;
