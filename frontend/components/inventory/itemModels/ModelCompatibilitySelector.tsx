import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import modelCompatibilityService, {
  type ModelCompatibility,
} from "@/app/api/inventory/compatibilityService";
import modelsService from "@/app/api/inventory/modelService";
import type { Model } from "@/app/api/inventory/modelService";

interface Props {
  modelId: string;
  modelType: "PART" | "VEHICLE";
  toast: React.RefObject<any>;
}

export default function ModelCompatibilitySelector({
  modelId,
  modelType,
  toast,
}: Props) {
  const [compatibilities, setCompatibilities] = useState<ModelCompatibility[]>(
    [],
  );
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Cargar datos
  useEffect(() => {
    loadCompatibilities();
    loadAvailableModels();
  }, [modelId, modelType]);

  const loadCompatibilities = async () => {
    try {
      setLoading(true);
      let data: ModelCompatibility[] = [];
      if (modelType === "PART") {
        const response: any = await modelCompatibilityService.getByPartModel(
          modelId,
        );
        data = Array.isArray(response) ? response : response?.data || [];
      } else {
        const response: any = await modelCompatibilityService.getByVehicleModel(
          modelId,
        );
        data = Array.isArray(response) ? response : response?.data || [];
      }
      setCompatibilities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading compatibilities:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar compatibilidades",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      // Si soy Repuesto, busco Vehículos. Si soy Vehículo, busco Repuestos.
      const targetType = modelType === "PART" ? "VEHICLE" : "PART";
      const response = await modelsService.getActive(targetType);
      setAvailableModels(response.data || []);
    } catch (error) {
      console.error("Error loading models:", error);
    }
  };

  const handleAdd = async () => {
    if (!selectedModelId) return;

    try {
      setAdding(true);
      const payload =
        modelType === "PART"
          ? { partModelId: modelId, vehicleModelId: selectedModelId }
          : { partModelId: selectedModelId, vehicleModelId: modelId };

      await modelCompatibilityService.create(payload);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Compatibilidad agregada",
      });
      setSelectedModelId("");
      loadCompatibilities();
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al agregar",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await modelCompatibilityService.delete(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Compatibilidad eliminada",
      });
      loadCompatibilities();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar",
      });
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await modelCompatibilityService.verify(id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Verificado correctamente",
      });
      loadCompatibilities();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al verificar",
      });
    }
  };

  // Filtrar modelos ya agregados
  const getFilteredOptions = () => {
    const safeCompatibilities = Array.isArray(compatibilities)
      ? compatibilities
      : [];

    const existingIds = new Set(
      safeCompatibilities.map((c) =>
        modelType === "PART" ? c.vehicleModelId : c.partModelId,
      ),
    );
    return availableModels
      .filter((m) => !existingIds.has(m.id))
      .map((m) => ({
        label: `${m.brand?.name} - ${m.name} ${m.year || ""}`,
        value: m.id,
      }));
  };

  const nameTemplate = (rowData: ModelCompatibility) => {
    const model =
      modelType === "PART" ? rowData.vehicleModel : rowData.partModel;
    return (
      <div className="flex flex-column">
        <span className="font-bold">{model?.name}</span>
        <span className="text-sm text-500">
          {model?.brand?.name} {model?.code}
        </span>
      </div>
    );
  };

  const statusTemplate = (rowData: ModelCompatibility) => {
    return (
      <Tag
        value={rowData.isVerified ? "Verificado" : "Pendiente"}
        severity={rowData.isVerified ? "success" : "warning"}
      />
    );
  };

  const actionTemplate = (rowData: ModelCompatibility) => {
    return (
      <div className="flex gap-2">
        {!rowData.isVerified && (
          <Button
            icon="pi pi-check"
            rounded
            text
            severity="success"
            tooltip="Verificar"
            onClick={() => handleVerify(rowData.id)}
          />
        )}
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          tooltip="Eliminar"
          onClick={() => handleDelete(rowData.id)}
        />
      </div>
    );
  };

  return (
    <div className="p-3">
      <div className="flex gap-2 mb-4">
        <Dropdown
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.value)}
          options={getFilteredOptions()}
          optionLabel="label"
          filter
          placeholder={
            modelType === "PART"
              ? "Seleccionar vehículo..."
              : "Seleccionar repuesto..."
          }
          className="w-full md:w-20rem"
        />
        <Button
          label="Agregar"
          icon="pi pi-plus"
          onClick={handleAdd}
          loading={adding}
          disabled={!selectedModelId}
        />
      </div>

      <DataTable
        value={compatibilities}
        loading={loading}
        emptyMessage="No hay compatibilidades registradas"
        size="small"
        paginator
        rows={5}
      >
        <Column
          header={modelType === "PART" ? "Vehículo" : "Repuesto"}
          body={nameTemplate}
        />
        <Column field="notes" header="Notas" />
        <Column header="Estado" body={statusTemplate} />
        <Column body={actionTemplate} style={{ width: "100px" }} />
      </DataTable>
    </div>
  );
}
