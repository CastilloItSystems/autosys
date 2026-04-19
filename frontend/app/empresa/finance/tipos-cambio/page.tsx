"use client";
import React from "react";
import ExchangeRateList from "@/components/finance/exchange-rates/ExchangeRateList";

export default function TiposCambioPage() {
  return (
    <div className="p-3">
      <div className="mb-3">
        <h2 className="text-xl font-semibold text-900 m-0">
          Tipos de Cambio
        </h2>
        <p className="text-500 text-sm mt-1 mb-0">
          Gestión de tasas de cambio — BCV y manuales
        </p>
      </div>
      <ExchangeRateList />
    </div>
  );
}
