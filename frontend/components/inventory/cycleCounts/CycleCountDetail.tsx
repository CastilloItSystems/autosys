"use client";

import React, { useState, useRef } from "react";
import {
  CycleCount,
  CYCLE_COUNT_STATUS_CONFIG,
  CycleCountStatus,
} from "../../../libs/interfaces/inventory/cycleCount.interface";
import { Badge } from "primereact/badge";
import { Divider } from "primereact/divider";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { PDFDownloadLink } from "@react-pdf/renderer";
import cycleCountService from "../../../app/api/inventory/cycleCountService";
import CycleCountRouteSheetPDF from "./CycleCountRouteSheetPDF";

interface CycleCountDetailProps {
  cycleCount: CycleCount;
}

// Tipo para los valores locales mientras el usuario escribe
interface LocalItemState {
  countedQuantity: number | null;
  location: string;
  saving: boolean;
  saved: boolean;
  error: boolean;
}

export default function CycleCountDetail({
  cycleCount,
}: CycleCountDetailProps) {
  const statusConfig = CYCLE_COUNT_STATUS_CONFIG[cycleCount.status];
  const toast = useRef<Toast>(null);
  const isInProgress = cycleCount.status === CycleCountStatus.IN_PROGRESS;
  const [isExporting, setIsExporting] = useState(false);

  // Estado local de cada ítem (para reflejar cambios inmediatamente en UI)
  const [localItems, setLocalItems] = useState<Record<string, LocalItemState>>(
    () => {
      const init: Record<string, LocalItemState> = {};
      cycleCount.items.forEach((item: any) => {
        init[item.itemId] = {
          countedQuantity: item.countedQuantity ?? null,
          location: item.locationFound ?? "", // locationFound = lo que el contador registró
          saving: false,
          saved: false,
          error: false,
        };
      });
      return init;
    },
  );

  // Debounce refs — un timer y un acumulador de cambios por ítem
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const pendingUpdates = useRef<
    Record<string, { countedQuantity?: number; newLocation?: string | null }>
  >({});

  // ─── Debounced save ────────────────────────────────────────────────────────

  const scheduleUpdate = (
    itemId: string,
    update: { countedQuantity?: number; newLocation?: string | null },
  ) => {
    // Acumular cambios (cantidad + ubicación pueden llegar en momentos distintos)
    pendingUpdates.current[itemId] = {
      ...pendingUpdates.current[itemId],
      ...update,
    };

    // Indicar "guardando pendiente" en UI
    setLocalItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], saving: true, saved: false, error: false },
    }));

    // Reiniciar timer
    if (debounceTimers.current[itemId]) {
      clearTimeout(debounceTimers.current[itemId]);
    }

    debounceTimers.current[itemId] = setTimeout(async () => {
      const payload = pendingUpdates.current[itemId];
      delete pendingUpdates.current[itemId];

      try {
        await cycleCountService.updateItemQuantity(
          cycleCount.id,
          itemId,
          payload.countedQuantity,
          payload.newLocation,
        );
        setLocalItems((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            saving: false,
            saved: true,
            error: false,
          },
        }));
        // Ocultar el ✓ después de 2s
        setTimeout(() => {
          setLocalItems((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], saved: false },
          }));
        }, 2000);
      } catch {
        setLocalItems((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            saving: false,
            saved: false,
            error: true,
          },
        }));
        toast.current?.show({
          severity: "error",
          summary: "Error al guardar",
          detail: "No se pudo actualizar el ítem",
          life: 3000,
        });
      }
    }, 700);
  };

  const handleQuantityChange = (itemId: string, value: number | null) => {
    if (value === null) return;
    setLocalItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], countedQuantity: value },
    }));
    scheduleUpdate(itemId, { countedQuantity: value });
  };

  const handleLocationChange = (itemId: string, value: string) => {
    setLocalItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], location: value },
    }));
    scheduleUpdate(itemId, { newLocation: value || null });
  };

  // ─── Export ────────────────────────────────────────────────────────────────

  const handleExport = async (format: "csv" | "excel") => {
    try {
      setIsExporting(true);
      const blob = await cycleCountService.exportRouteSheet(
        cycleCount.id,
        format,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hoja-ruta-${cycleCount.cycleCountNumber}.${
        format === "excel" ? "xlsx" : "csv"
      }`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al exportar",
        life: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportMenuItems = [
    {
      label: "Exportar Excel",
      icon: "pi pi-file-excel",
      command: () => handleExport("excel"),
    },
    {
      label: "Exportar CSV",
      icon: "pi pi-file",
      command: () => handleExport("csv"),
    },
  ];

  // ─── Templates ─────────────────────────────────────────────────────────────

  const varianceRowClass = (rowData: any) => {
    const local = localItems[rowData.itemId];
    if (local?.countedQuantity === null || local?.countedQuantity === undefined)
      return "";
    const variance = local.countedQuantity - rowData.expectedQuantity;
    if (variance === 0) return "";
    return Math.abs(variance) <= 5 ? "bg-yellow-50" : "bg-red-50";
  };

  const articleTemplate = (rowData: any) => (
    <div className="flex flex-column">
      <span className="font-medium">
        {rowData.item?.name || "Artículo Desconocido"}
      </span>
      {rowData.item?.sku && (
        <span className="text-sm text-500 font-mono">{rowData.item.sku}</span>
      )}
    </div>
  );

  const systemLocationTemplate = (rowData: any) => {
    // location = snapshot original, locationFound = lo que encontró el contador
    const originalLoc = rowData.location ?? null;
    const foundLoc = (rowData as any).locationFound ?? null;
    const locationChanged = foundLoc && foundLoc !== originalLoc;

    return (
      <div className="flex flex-column gap-1">
        {/* Ubicación original del sistema */}
        {originalLoc ? (
          <div className="flex align-items-center gap-1">
            <i className="pi pi-map-marker text-blue-400 text-xs" />
            <span
              className={`font-mono text-sm ${
                locationChanged ? "text-blue-400 line-through" : "text-blue-700"
              }`}
            >
              {originalLoc}
            </span>
          </div>
        ) : (
          <span className="text-gray-300 text-sm">Sin ubic.</span>
        )}
        {/* Ubicación encontrada (solo visible cuando ya no está en IN_PROGRESS) */}
        {!isInProgress && locationChanged && (
          <div className="flex align-items-center gap-1">
            <i className="pi pi-arrow-right text-orange-500 text-xs" />
            <span className="font-mono text-sm text-orange-600 font-bold">
              {foundLoc}
            </span>
          </div>
        )}
      </div>
    );
  };

  const countedQuantityTemplate = (rowData: any) => {
    if (!isInProgress) {
      return (
        <span className="font-bold">{rowData.countedQuantity ?? "—"}</span>
      );
    }
    const local = localItems[rowData.itemId];
    return (
      <div className="flex align-items-center gap-2">
        <InputNumber
          value={local?.countedQuantity ?? undefined}
          onValueChange={(e) =>
            handleQuantityChange(rowData.itemId, e.value ?? null)
          }
          min={0}
          placeholder="0"
          className="flex-1"
          pt={{
            input: {
              className: "w-full text-right",
              onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                // onValueChange no dispara al hacer click fuera, onBlur sí
                const raw = e.target.value.replace(/[^0-9.-]/g, "");
                const val = parseFloat(raw);
                if (!isNaN(val) && val !== local?.countedQuantity) {
                  handleQuantityChange(rowData.itemId, val);
                }
              },
            },
          }}
        />
        {local?.saving && (
          <ProgressSpinner
            style={{ width: "16px", height: "16px" }}
            strokeWidth="4"
          />
        )}
        {local?.saved && <i className="pi pi-check text-green-500 text-sm" />}
        {local?.error && <i className="pi pi-times text-red-500 text-sm" />}
      </div>
    );
  };

  const newLocationTemplate = (rowData: any) => {
    if (!isInProgress) return <span className="text-gray-300 text-sm">—</span>;
    const local = localItems[rowData.itemId];
    const originalLocation = rowData.location ?? ""; // snapshot original
    const hasChanged =
      (local?.location ?? "") !== originalLocation &&
      (local?.location ?? "") !== "";

    return (
      <div className="flex flex-column gap-1">
        <InputText
          value={local?.location ?? ""}
          onChange={(e) => handleLocationChange(rowData.itemId, e.target.value)}
          placeholder="Ej: M1-R02-D01"
          className="p-inputtext-sm w-full font-mono"
        />
        {hasChanged && (
          <Tag
            value="Modificada"
            severity="warning"
            style={{ fontSize: "0.6rem" }}
          />
        )}
      </div>
    );
  };

  const varianceTemplate = (rowData: any) => {
    const local = localItems[rowData.itemId];
    if (local?.countedQuantity === null || local?.countedQuantity === undefined)
      return <span className="text-gray-400">—</span>;
    const variance = local.countedQuantity - rowData.expectedQuantity;
    if (variance === 0) return <Badge value="0" severity="success" />;
    if (variance > 0)
      return <Badge value={`+${variance}`} severity="warning" />;
    return <Badge value={`${variance}`} severity="danger" />;
  };

  // Progreso del conteo (solo IN_PROGRESS)
  const totalItems = cycleCount.items.length;
  const countedItems = Object.values(localItems).filter(
    (s) => s.countedQuantity !== null && s.countedQuantity !== undefined,
  ).length;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      {/* Header */}
      <div className="grid">
        <div className="col-12 md:col-3">
          <span className="text-500 font-medium block mb-2"># Conteo</span>
          <span className="text-900 text-xl font-bold">
            {cycleCount.cycleCountNumber}
          </span>
        </div>
        <div className="col-12 md:col-3">
          <span className="text-500 font-medium block mb-2">Estado</span>
          <Badge
            value={statusConfig.label}
            severity={statusConfig.severity}
            size="large"
          />
        </div>
        <div className="col-12 md:col-3">
          <span className="text-500 font-medium block mb-2">Almacén</span>
          <span className="text-900 font-medium">
            {cycleCount.warehouse?.name || "—"}
          </span>
        </div>

        {/* Export */}
        <div className="col-12 md:col-3 flex align-items-end justify-content-end gap-2">
          <PDFDownloadLink
            document={
              <CycleCountRouteSheetPDF
                cycleCount={cycleCount as any}
                warehouseName={cycleCount.warehouse?.name}
              />
            }
            fileName={`hoja-ruta-${cycleCount.cycleCountNumber}.pdf`}
          >
            {({ loading }) => (
              <Button
                label="PDF"
                icon="pi pi-file-pdf"
                severity="danger"
                outlined
                size="small"
                loading={loading}
                tooltip="Descargar hoja de ruta PDF"
                tooltipOptions={{ position: "left" }}
              />
            )}
          </PDFDownloadLink>
          <SplitButton
            label="Excel"
            icon="pi pi-file-excel"
            severity="success"
            outlined
            size="small"
            onClick={() => handleExport("excel")}
            model={exportMenuItems}
            loading={isExporting}
            tooltipOptions={{ position: "left" }}
          />
        </div>
      </div>

      {/* Barra de progreso del conteo */}
      {isInProgress && (
        <div className="surface-50 border-round p-3 border-left-4 border-blue-500">
          <div className="flex justify-content-between align-items-center mb-2">
            <span className="font-bold text-blue-700">
              <i className="pi pi-list-check mr-2" />
              Progreso del conteo
            </span>
            <span className="text-sm font-bold">
              <span
                className={
                  countedItems === totalItems
                    ? "text-green-600"
                    : "text-blue-600"
                }
              >
                {countedItems}
              </span>
              <span className="text-500"> / {totalItems} ítems</span>
            </span>
          </div>
          <div
            className="w-full bg-gray-200 border-round"
            style={{ height: "6px" }}
          >
            <div
              className={`border-round transition-all ${
                countedItems === totalItems ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{
                height: "6px",
                width: `${(countedItems / totalItems) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-500 mt-2 mb-0">
            <i className="pi pi-eye-slash mr-1" />
            La cantidad del sistema está oculta para no sesgar el conteo. Se
            revelará al completar. Los cambios se guardan automáticamente.
          </p>
        </div>
      )}

      {/* Info de auditoría */}
      {cycleCount.completedAt && (
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="surface-50 p-3 border-round flex align-items-center gap-3 border-left-3 border-green-500">
              <i className="pi pi-check-square text-green-500 text-xl" />
              <div>
                <span className="text-700 font-bold block">Completado por</span>
                <span className="text-900">
                  {cycleCount.completedBy || "—"}
                </span>
                <div className="text-sm text-500 mt-1">
                  {new Date(cycleCount.completedAt).toLocaleDateString(
                    "es-ES",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
          {cycleCount.approvedAt && (
            <div className="col-12 md:col-6">
              <div className="surface-50 p-3 border-round flex align-items-center gap-3 border-left-3 border-orange-500">
                <i className="pi pi-check-circle text-orange-500 text-xl" />
                <div>
                  <span className="text-700 font-bold block">Aprobado por</span>
                  <span className="text-900">
                    {cycleCount.approvedBy || "—"}
                  </span>
                  <div className="text-sm text-500 mt-1">
                    {new Date(cycleCount.approvedAt).toLocaleDateString(
                      "es-ES",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {cycleCount.status === CycleCountStatus.REJECTED && (
        <Message
          severity="error"
          className="w-full"
          content={
            <div className="flex flex-column gap-1">
              <span className="font-semibold">Rechazado</span>
            </div>
          }
        />
      )}

      <Divider className="my-0" />

      {/* Tabla */}
      <div>
        <div className="flex justify-content-between align-items-center mb-3">
          <h3 className="text-lg font-semibold m-0">
            {isInProgress ? "Registro de Conteo" : "Artículos"}
          </h3>
          <div className="flex gap-3 text-sm">
            <span className="flex align-items-center gap-2">
              <span className="w-1rem h-1rem bg-yellow-50 border-1 border-yellow-200 border-round" />
              <span>Varianza baja (±5)</span>
            </span>
            <span className="flex align-items-center gap-2">
              <span className="w-1rem h-1rem bg-red-50 border-1 border-red-200 border-round" />
              <span>Varianza alta (&gt;5)</span>
            </span>
          </div>
        </div>

        <DataTable
          value={cycleCount.items}
          rowClassName={varianceRowClass}
          className="w-full"
          showGridlines
          stripedRows
          scrollable
          size="small"
        >
          <Column
            header="Artículo"
            body={articleTemplate}
            style={{ minWidth: "180px" }}
          />

          {/* Ubicación: durante conteo mostramos la anterior + campo para la encontrada */}
          <Column
            header={isInProgress ? "Ubic. Anterior" : "Ubicación"}
            body={systemLocationTemplate}
            style={{ width: isInProgress ? "130px" : "160px" }}
          />
          {isInProgress && (
            <Column
              header="Ubic. Encontrada"
              body={newLocationTemplate}
              style={{ width: "175px" }}
            />
          )}

          {/* Cantidad sistema: oculta durante el conteo para no sesgar al contador */}
          {!isInProgress && (
            <Column
              field="expectedQuantity"
              header="Stock Sistema"
              align="right"
              style={{ width: "110px" }}
            />
          )}

          <Column
            field="countedQuantity"
            header="Cant. Contada"
            body={countedQuantityTemplate}
            align="right"
            style={{ width: "160px" }}
          />

          {/* Varianza solo visible cuando ya se tiene la cantidad contada */}
          {!isInProgress && (
            <Column
              header="Varianza"
              body={varianceTemplate}
              align="center"
              style={{ width: "100px" }}
            />
          )}
        </DataTable>
      </div>

      {cycleCount.notes && (
        <>
          <Divider />
          <div className="surface-50 p-3 border-round">
            <span className="text-700 font-bold block mb-2">Notas</span>
            <p className="m-0 text-gray-700 line-height-3">
              {cycleCount.notes}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
