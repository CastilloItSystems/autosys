"use client";

import StockList from "@/modules/inventory/stocks/components/StockList";

function Stock() {
  return (
    <div className="flex flex-column gap-4">
      <StockList />
    </div>
  );
}

export default Stock;
