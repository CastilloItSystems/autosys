"use client";

import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputSwitch } from "primereact/inputswitch";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { Card } from "primereact/card";
import { useRef } from "react";
import modelsService from "@/app/api/inventory/modelService";
import modelCompatibilityService, {
  type ModelCompatibility,
} from "@/app/api/inventory/compatibilityService";
import type { Model } from "@/app/api/inventory/modelService";

interface CompatibilityState {
  [key: string]: boolean; // format: "partModelId_vehicleModelId"
}

export const CompatibilityMatrix = () => {
  const toast = useRef<Toast>(null);

  // State
  const [partModels, setPartModels] = useState<Model[]>([]);
  const [vehicleModels, setVehicleModels] = useState<Model[]>([]);
  const [compatibilities, setCompatibilities] = useState<ModelCompatibility[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [partBrandFilter, setPartBrandFilter] = useState<string | null>(null);
  const [vehicleBrandFilter, setVehicleBrandFilter] = useState<string | null>(
    null,
  );
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // UI state
  const [batchMode, setBatchMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<CompatibilityState>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Get unique brands from models
  type BrandOption = { label: string; value: string };
  const partBrands = Array.from(
    new Map(partModels.map((m) => [m.brand?.id, m.brand?.name])).entries(),
  )
    .map(([id, name]) => ({ label: name || "", value: id || "" }))
    .filter((b) => b.value);

  const vehicleBrands = Array.from(
    new Map(vehicleModels.map((m) => [m.brand?.id, m.brand?.name])).entries(),
  )
    .map(([id, name]) => ({ label: name || "", value: id || "" }))
    .filter((b) => b.value);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partsResponse, vehiclesResponse, compatResponse] =
        await Promise.all([
          modelsService.getActive("PART"),
          modelsService.getActive("VEHICLE"),
          modelCompatibilityService.getAll({ limit: 100 }),
        ]);

      const parts = partsResponse.data || [];
      const vehicles = vehiclesResponse.data || [];
      // modelCompatibilityService.getAll returns { data: [], meta: ... }
      // Let's handle both cases based on the service signature
      const compat = Array.isArray(compatResponse)
        ? compatResponse
        : (compatResponse as any).data || [];

      setPartModels(parts);
      setVehicleModels(vehicles);
      setCompatibilities(compat);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter models based on search and brand
  const filteredPartModels = partModels.filter((m) => {
    const matchesSearch =
      searchText === "" ||
      m.name.toLowerCase().includes(searchText.toLowerCase()) ||
      m.code.toLowerCase().includes(searchText.toLowerCase());
    const matchesBrand = !partBrandFilter || m.brand?.id === partBrandFilter;
    return matchesSearch && matchesBrand;
  });

  const filteredVehicleModels = vehicleModels.filter((m) => {
    const matchesSearch =
      searchText === "" ||
      m.name.toLowerCase().includes(searchText.toLowerCase()) ||
      m.code.toLowerCase().includes(searchText.toLowerCase());
    const matchesBrand =
      !vehicleBrandFilter || m.brand?.id === vehicleBrandFilter;
    return matchesSearch && matchesBrand;
  });

  // Check if compatibility exists (either verified or pending)
  const isChecked = (partId: string, vehicleId: string): boolean => {
    const key = `${partId}_${vehicleId}`;
    if (key in pendingChanges) {
      return pendingChanges[key];
    }
    return compatibilities.some(
      (c) => c.partModelId === partId && c.vehicleModelId === vehicleId,
    );
  };

  // Get compatibility state: 'verified', 'unverified', null
  const getCompatibilityState = (
    partId: string,
    vehicleId: string,
  ): "verified" | "unverified" | null => {
    const existing = compatibilities.find(
      (c) => c.partModelId === partId && c.vehicleModelId === vehicleId,
    );
    if (existing) {
      return existing.isVerified ? "verified" : "unverified";
    }
    return null;
  };

  // Handle checkbox change
  const handleCompatibilityChange = async (
    partId: string,
    vehicleId: string,
    checked: boolean,
  ) => {
    const key = `${partId}_${vehicleId}`;

    if (batchMode) {
      // Batch mode: accumulate changes
      setPendingChanges((prev) => {
        const updated = { ...prev };
        if (checked) {
          updated[key] = true;
        } else {
          delete updated[key];
        }
        return updated;
      });
    } else {
      // Immediate mode: apply immediately
      try {
        setSaving(true);
        if (checked) {
          // Fix: Get the real response to use the real ID
          const response: any = await modelCompatibilityService.create({
            partModelId: partId,
            vehicleModelId: vehicleId,
          });

          // modelCompatibilityService.create returns { data: ModelCompatibility, ... }
          const newCompat = response.data || response;

          setCompatibilities((prev) => [
            ...prev,
            {
              id: newCompat.id, // Use real ID from backend
              partModelId: partId,
              vehicleModelId: vehicleId,
              isVerified: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
          toast.current?.show({
            severity: "success",
            summary: "Agregado",
            detail: "Compatibilidad creada",
          });
        } else {
          const toDelete = compatibilities.find(
            (c) => c.partModelId === partId && c.vehicleModelId === vehicleId,
          );
          if (toDelete) {
            await modelCompatibilityService.delete(toDelete.id);
            setCompatibilities((prev) =>
              prev.filter((c) => c.id !== toDelete.id),
            );
            toast.current?.show({
              severity: "success",
              summary: "Eliminado",
              detail: "Compatibilidad eliminada",
            });
          }
        }
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al actualizar compatibilidad",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Submit batch changes
  const submitBatchChanges = async () => {
    try {
      setSaving(true);
      const keys = Object.keys(pendingChanges);

      for (const key of keys) {
        if (pendingChanges[key]) {
          const [partId, vehicleId] = key.split("_");
          const exists = compatibilities.some(
            (c) => c.partModelId === partId && c.vehicleModelId === vehicleId,
          );

          if (!exists) {
            await modelCompatibilityService.create({
              partModelId: partId,
              vehicleModelId: vehicleId,
            });
          }
        }
      }

      // Remove deleted
      for (const compat of compatibilities) {
        const key = `${compat.partModelId}_${compat.vehicleModelId}`;
        if (key in pendingChanges && !pendingChanges[key]) {
          await modelCompatibilityService.delete(compat.id);
        }
      }

      setPendingChanges({});
      setShowConfirm(false);
      await loadData();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Todos los cambios guardados",
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar cambios",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (partId: string, vehicleId: string) => {
    const compat = compatibilities.find(
      (c) => c.partModelId === partId && c.vehicleModelId === vehicleId,
    );
    if (compat && !compat.isVerified) {
      try {
        await modelCompatibilityService.verify(compat.id);
        setCompatibilities((prev) =>
          prev.map((c) =>
            c.id === compat.id ? { ...c, isVerified: true } : c,
          ),
        );
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Compatibilidad verificada",
        });
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al verificar",
        });
      }
    }
  };

  // Cell template for compatibility checkboxes
  const compatibilityCellTemplate = (rowData: Model, columnProps: any) => {
    const vehicleId = columnProps.field;
    const partId = rowData.id;
    const state = getCompatibilityState(partId, vehicleId);
    const checked = isChecked(partId, vehicleId);

    let severityColor = "";
    let icon = null;

    if (state === "verified") {
      severityColor = "p-button-rounded p-button-text p-button-success";
      icon = "pi pi-check-circle";
    } else if (state === "unverified") {
      severityColor = "p-button-rounded p-button-text p-button-warning";
      icon = "pi pi-exclamation-circle";
    }

    return (
      <div className="flex align-items-center justify-content-center gap-2">
        <Checkbox
          checked={checked}
          onChange={(e) =>
            handleCompatibilityChange(partId, vehicleId, e.checked || false)
          }
          disabled={saving}
        />
        {state === "unverified" && (
          <Button
            icon={icon}
            className={severityColor}
            tooltip="Verificar (Click para aprobar)"
            onClick={() => handleVerify(partId, vehicleId)}
            aria-label="Verificar"
          />
        )}
        {state === "verified" && (
          <i className={`${icon} text-green-500`} title="Verificado" />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-content-between mb-4">
          <Skeleton width="15rem" height="3rem" />
          <div className="flex gap-2">
            <Skeleton width="8rem" height="3rem" />
            <Skeleton width="8rem" height="3rem" />
          </div>
        </div>
        <Skeleton width="100%" height="500px" />
      </div>
    );
  }

  return (
    <div className="surface-0">
      <Toast ref={toast} />

      <div className="card mb-0">
        <Toolbar
          className="mb-4"
          start={
            <div className="flex align-items-center gap-2">
              <InputSwitch
                id="batchMode"
                checked={batchMode}
                onChange={(e) => setBatchMode(e.value)}
                disabled={saving}
              />
              <label htmlFor="batchMode" className="font-semibold ml-2">
                Modo por lotes
              </label>
            </div>
          }
          end={
            <div className="flex gap-2">
              <Button
                icon="pi pi-refresh"
                onClick={loadData}
                loading={loading}
                rounded
                text
                severity="secondary"
                tooltip="Refrescar datos"
              />
              {batchMode && Object.keys(pendingChanges).length > 0 && (
                <>
                  <Button
                    label="Descartar"
                    icon="pi pi-times"
                    severity="secondary"
                    onClick={() => setPendingChanges({})}
                    disabled={saving}
                    text
                  />
                  <Button
                    label={`Guardar (${Object.keys(pendingChanges).length})`}
                    icon="pi pi-check"
                    onClick={() => setShowConfirm(true)}
                    loading={saving}
                  />
                </>
              )}
            </div>
          }
        />

        <div className="flex flex-column md:flex-row gap-3 mb-4 align-items-end">
          <div className="flex-1">
            <span className="p-input-icon-left w-full">
              <i className="pi pi-search" />
              <InputText
                placeholder="Buscar modelos..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full"
              />
            </span>
          </div>
          <Dropdown
            options={[
              { label: "Todas las Marcas", value: null },
              ...partBrands,
            ]}
            value={partBrandFilter}
            onChange={(e) => setPartBrandFilter(e.value)}
            placeholder="Marca de Repuesto"
            className="w-full md:w-15rem"
            showClear
          />
          <Dropdown
            options={[
              { label: "Todas las Marcas", value: null },
              ...vehicleBrands,
            ]}
            value={vehicleBrandFilter}
            onChange={(e) => setVehicleBrandFilter(e.value)}
            placeholder="Marca de Vehículo"
            className="w-full md:w-15rem"
            showClear
          />
        </div>

        <div className="text-600 text-sm mb-2">
          Mostrando {filteredPartModels.length} modelos de repuestos ×{" "}
          {filteredVehicleModels.length} modelos de vehículos
        </div>

        <DataTable
          value={filteredPartModels}
          scrollable
          scrollHeight="65vh"
          showGridlines
          stripedRows
          size="small"
          className="p-datatable-sm"
          style={{ minWidth: "100%" }}
        >
          <Column
            field="name"
            header="Modelo Repuesto"
            style={{ width: "150px", minWidth: "150px" }}
            frozen
            body={(rowData: Model) => (
              <div className="flex flex-column">
                <strong>{rowData.name}</strong>
                <small className="text-500">{rowData.code}</small>
              </div>
            )}
          />

          {filteredVehicleModels.map((vehicle) => (
            <Column
              key={vehicle.id}
              field={vehicle.id}
              header={
                <div className="text-center">
                  <div className="font-bold text-xs">{vehicle.brand?.name}</div>
                  <div className="text-600 text-xs">
                    {vehicle.name.substring(0, 15)}
                  </div>
                  {vehicle.year && (
                    <div className="text-500 text-xs">{vehicle.year}</div>
                  )}
                </div>
              }
              style={{ width: "80px", minWidth: "80px", textAlign: "center" }}
              body={(rowData: Model) =>
                compatibilityCellTemplate(rowData, { field: vehicle.id })
              }
            />
          ))}
        </DataTable>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-sm align-items-center">
          <span className="font-semibold mr-2">Leyenda:</span>
          <div className="flex align-items-center gap-2">
            <Tag
              severity="success"
              icon="pi pi-check-circle"
              value="Verificado"
            />
          </div>
          <div className="flex align-items-center gap-2">
            <Tag
              severity="warning"
              icon="pi pi-exclamation-circle"
              value="No Verificado"
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        header="Confirmar Cambios"
        modal
        style={{ width: "450px" }}
        breakpoints={{ "1400px": "450px", "900px": "60vw", "600px": "90vw" }}
        maximizable
        footer={
          <div className="flex gap-2 pb-3 px-1">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setShowConfirm(false)}
              className="flex-1"
            />
            <Button
              label="Guardar Todo"
              icon="pi pi-check"
              onClick={submitBatchChanges}
              loading={saving}
              className="flex-1"
              autoFocus
            />
          </div>
        }
      >
        <div className="confirmation-content flex align-items-center gap-3">
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "2rem", color: "var(--yellow-500)" }}
          />
          <div className="flex flex-column">
            <span>
              Tienes <b>{Object.keys(pendingChanges).length}</b> cambios
              pendientes. ¿Desea guardarlos ahora?
            </span>
            <small className="text-500 mt-2">
              Esta acción actualizará la base de datos inmediatamente.
            </small>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CompatibilityMatrix;
