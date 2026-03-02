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
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { useRef } from "react";
import { modelService } from "@/app/api/inventory/modelService";
import * as compatibilityService from "@/app/api/inventory/compatibilityService";
import type { Model } from "@/app/api/inventory/modelService";
import type { IModelCompatibility } from "@/app/api/inventory/compatibilityService";

interface CompatibilityState {
  [key: string]: boolean; // format: "partModelId_vehicleModelId"
}

export const CompatibilityMatrix = () => {
  const toast = useRef<Toast>(null);

  // State
  const [partModels, setPartModels] = useState<Model[]>([]);
  const [vehicleModels, setVehicleModels] = useState<Model[]>([]);
  const [compatibilities, setCompatibilities] = useState<IModelCompatibility[]>(
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
      const [parts, vehicles, compat] = await Promise.all([
        modelService
          .getModels(1, 500, "", undefined, undefined, "PART")
          .then((r) => r.data),
        modelService
          .getModels(1, 500, "", undefined, undefined, "VEHICLE")
          .then((r) => r.data),
        compatibilityService.getAll({ limit: 500 }).then((r) => r.data),
      ]);

      setPartModels(parts);
      setVehicleModels(vehicles);
      setCompatibilities(compat);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load data",
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
          await compatibilityService.create({
            partModelId: partId,
            vehicleModelId: vehicleId,
          });
          setCompatibilities((prev) => [
            ...prev,
            {
              id: "",
              partModelId: partId,
              vehicleModelId: vehicleId,
              isVerified: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
          toast.current?.show({
            severity: "success",
            summary: "Added",
            detail: "Compatibility created",
          });
        } else {
          const toDelete = compatibilities.find(
            (c) => c.partModelId === partId && c.vehicleModelId === vehicleId,
          );
          if (toDelete) {
            await compatibilityService.remove(toDelete.id);
            setCompatibilities((prev) =>
              prev.filter((c) => c.id !== toDelete.id),
            );
            toast.current?.show({
              severity: "success",
              summary: "Removed",
              detail: "Compatibility deleted",
            });
          }
        }
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to update compatibility",
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
            await compatibilityService.create({
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
          await compatibilityService.remove(compat.id);
        }
      }

      setPendingChanges({});
      setShowConfirm(false);
      await loadData();
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: "All changes saved",
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to save changes",
      });
    } finally {
      setSaving(false);
    }
  };

  // Cell template for compatibility checkboxes
  const compatibilityCellTemplate = (rowData: Model, columnProps: any) => {
    const vehicleId = columnProps.field;
    const partId = rowData.id;
    const state = getCompatibilityState(partId, vehicleId);
    const checked = isChecked(partId, vehicleId);

    let severityColor = "";
    if (state === "verified") {
      severityColor = "check-circle text-green-600";
    } else if (state === "unverified") {
      severityColor = "circle-fill text-yellow-600";
    }

    return (
      <div className="flex align-items-center justify-content-center">
        <Checkbox
          checked={checked}
          onChange={(e) =>
            handleCompatibilityChange(partId, vehicleId, e.checked || false)
          }
          disabled={saving}
          className={severityColor}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex align-items-center justify-content-center">
        <ProgressSpinner
          style={{ width: "100px", height: "100px" }}
          strokeWidth="4"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toast ref={toast} />

      {/* Header Controls */}
      <div className="bg-white p-4 mb-4 border-round shadow-1">
        <div className="flex flex-column gap-4">
          {/* First row: Mode toggle and filters */}
          <div className="flex align-items-center justify-content-between gap-4">
            <div className="flex align-items-center gap-2">
              <label htmlFor="batchMode" className="font-semibold">
                Batch Mode
              </label>
              <InputSwitch
                id="batchMode"
                checked={batchMode}
                onChange={(e) => setBatchMode(e.value)}
                disabled={saving}
              />
            </div>

            {batchMode && Object.keys(pendingChanges).length > 0 && (
              <div className="flex gap-2">
                <Button
                  label={`Save Changes (${Object.keys(pendingChanges).length})`}
                  onClick={() => setShowConfirm(true)}
                  loading={saving}
                />
                <Button
                  label="Discard"
                  severity="secondary"
                  onClick={() => setPendingChanges({})}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Second row: Search and filters */}
          <div className="flex gap-4 flex-wrap">
            <InputText
              placeholder="Search models..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full md:w-20rem"
            />
            <Dropdown
              options={[{ label: "All Brands", value: null }, ...partBrands]}
              value={partBrandFilter}
              onChange={(e) => setPartBrandFilter(e.value)}
              placeholder="Part Brand"
              className="w-full md:w-12rem"
            />
            <Dropdown
              options={[{ label: "All Brands", value: null }, ...vehicleBrands]}
              value={vehicleBrandFilter}
              onChange={(e) => setVehicleBrandFilter(e.value)}
              placeholder="Vehicle Brand"
              className="w-full md:w-12rem"
            />
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadData}
              loading={loading}
            />
          </div>

          {/* Info */}
          <div className="text-600 text-sm">
            Showing {filteredPartModels.length} part models ×{" "}
            {filteredVehicleModels.length} vehicle models
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white p-4 border-round shadow-1 overflow-x-auto">
        <DataTable
          value={filteredPartModels}
          scrollable
          scrollHeight="70vh"
          style={{ minWidth: "800px" }}
        >
          <Column
            field="name"
            header="Part Model"
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
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-check-circle text-green-600"></i>
          <span>Verified</span>
        </div>
        <div className="flex align-items-center gap-2">
          <i className="pi pi-circle-fill text-yellow-600"></i>
          <span>Unverified</span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        header="Confirm Changes"
        modal
        footer={
          <div className="flex gap-2">
            <Button label="Cancel" onClick={() => setShowConfirm(false)} />
            <Button
              label="Save All"
              onClick={submitBatchChanges}
              loading={saving}
            />
          </div>
        }
      >
        <p>
          You have {Object.keys(pendingChanges).length} pending changes. Save
          them now?
        </p>
      </Dialog>
    </div>
  );
};

export default CompatibilityMatrix;
