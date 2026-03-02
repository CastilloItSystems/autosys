"use client";

import StockDashboard from "@/components/inventory/stocks/StockDashboard";
import StockList from "@/components/inventory/stocks/StockList";

function Stock() {
  return (
    <div className="flex flex-column gap-4">
      <StockDashboard />
      <StockList />
    </div>
  );
}

export default Stock;
