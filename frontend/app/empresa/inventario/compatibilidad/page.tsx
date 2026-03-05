"use client";

import React from "react";
import CompatibilityMatrix from "@/components/inventory/models/CompatibilityMatrix";

export default function CompatibilidadPage() {
  return (
    <div className="flex flex-column gap-4 p-4">
      <div>
        <h1 className="text-3xl font-bold m-0">Matriz de Compatibilidad</h1>
        <p className="text-600 mt-2">
          Gestiona la compatibilidad entre repuestos y vehículos
        </p>
      </div>
      <CompatibilityMatrix />
    </div>
  );
}
