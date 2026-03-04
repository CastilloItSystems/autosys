"use client";

import StockList from "@/components/inventory/stocks/StockList";

function Stock() {
  return (
    <div className="flex flex-column gap-4">
      <StockList />
    </div>
  );
}

export default Stock;
