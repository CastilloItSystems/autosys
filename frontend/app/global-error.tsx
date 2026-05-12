"use client";

import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div
          className="flex align-items-center justify-content-center w-full"
          style={{ minHeight: "100vh" }}
        >
          <Card title="Algo salió mal" className="w-full max-w-30rem">
            <p className="text-color-secondary mb-4">
              {error.message || "Ocurrió un error inesperado."}
            </p>
            <Button
              label="Reintentar"
              icon="pi pi-refresh"
              onClick={() => reset()}
            />
          </Card>
        </div>
      </body>
    </html>
  );
}
