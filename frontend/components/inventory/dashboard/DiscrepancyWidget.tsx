"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Button } from "primereact/button";
import analyticsService from "@/app/api/inventory/analyticsService";
import { TopDiscrepancyItem } from "@/app/api/inventory/analyticsService";

export function DiscrepancyWidget() {
  const [discrepancies, setDiscrepancies] = useState<TopDiscrepancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDiscrepancies = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsService.getTopDiscrepancies({
          limit: 10,
        });
        setDiscrepancies(response.data || []);
      } catch (err: any) {
        console.error("Error fetching discrepancies:", err);
        setError(err?.message || "Error al cargar discrepancias");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscrepancies();
  }, []);

  const itemNameBodyTemplate = (rowData: TopDiscrepancyItem) => (
    <Button
      label={rowData.itemName}
      link
      onClick={() =>
        router.push(`/empresa/inventario/items?itemId=${rowData.itemId}`)
      }
      className="p-0 justify-content-start text-left"
    >
      <div className="text-left">
        <div className="font-semibold">{rowData.itemName}</div>
        <div className="text-xs text-gray-500">{rowData.itemSku}</div>
      </div>
    </Button>
  );

  const varianceBodyTemplate = (rowData: TopDiscrepancyItem) => {
    const isHigh = Math.abs(rowData.totalVarianceAbs || 0) > 20;
    const isModerate = Math.abs(rowData.totalVarianceAbs || 0) > 10;
    const severity = isHigh ? "high" : isModerate ? "moderate" : "low";

    const bgColor =
      severity === "high"
        ? "bg-red-50"
        : severity === "moderate"
        ? "bg-yellow-50"
        : "bg-blue-50";

    const textColor =
      severity === "high"
        ? "text-red-700"
        : severity === "moderate"
        ? "text-yellow-700"
        : "text-blue-700";

    return (
      <div
        className={`${bgColor} ${textColor} px-2 py-1 rounded text-sm font-medium`}
      >
        ±{rowData.totalVarianceAbs || 0} units
      </div>
    );
  };

  const netVarianceBodyTemplate = (rowData: TopDiscrepancyItem) => {
    const net = rowData.netVariance || 0;
    const isPositive = net > 0;

    return (
      <div className={isPositive ? "text-green-600" : "text-red-600"}>
        {isPositive ? "+" : ""}
        {net}
      </div>
    );
  };

  const occurrenceBodyTemplate = (rowData: TopDiscrepancyItem) => (
    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-semibold">
      {rowData.occurrenceCount} veces
    </span>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <ProgressSpinner
          style={{ width: "50px", height: "50px" }}
          strokeWidth="4"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <Message severity="error" text={error} className="mb-4 w-full" />
      )}

      {discrepancies.length === 0 ? (
        <Message
          severity="info"
          text="No hay discrepancias detectadas en los últimos 30 días"
          className="w-full"
        />
      ) : (
        <DataTable
          value={discrepancies}
          stripedRows
          className="p-datatable-sm"
          paginator
          rows={5}
          size="small"
        >
          <Column
            field="itemName"
            header="Artículo"
            body={itemNameBodyTemplate}
            className="w-4"
          />
          <Column
            field="totalVarianceAbs"
            header="Varianza Total"
            body={varianceBodyTemplate}
            className="w-2"
          />
          <Column
            field="netVariance"
            header="Varianza Neta"
            body={netVarianceBodyTemplate}
            className="w-2"
          />
          <Column
            field="occurrenceCount"
            header="Conteos Afectados"
            body={occurrenceBodyTemplate}
            className="w-2"
          />
        </DataTable>
      )}
    </div>
  );
}
