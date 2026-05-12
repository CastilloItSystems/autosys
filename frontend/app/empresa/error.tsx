"use client";

import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useEffect } from "react";

export default function EmpresaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Empresa segment error:", error);
  }, [error]);

  return (
    <div className="flex align-items-center justify-content-center w-full" style={{ minHeight: "60vh" }}>
      <Card title="Ocurrió un error" className="w-full max-w-30rem">
        <p className="text-color-secondary mb-4">
          {error.message || "No se pudo cargar esta sección."}
        </p>
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          onClick={() => reset()}
        />
      </Card>
    </div>
  );
}
