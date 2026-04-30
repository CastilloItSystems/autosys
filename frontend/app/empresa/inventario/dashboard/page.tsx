"use client";

import QuickActions from "@/modules/inventory/dashboard/components/QuickActions";
import InventoryDashboard from "@/modules/inventory/dashboard/components/InventoryDashboard";

function InventarioDashboard() {
  return (
    <div className="flex flex-column gap-4">
      <QuickActions />
      <InventoryDashboard />
    </div>
  );
}

export default InventarioDashboard;
