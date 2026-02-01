"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import {
  vehicleBrandSchema,
  VehicleBrandFormData,
} from "@/libs/zods/inventory/vehicleZod";
import {
  createVehicleBrand,
  updateVehicleBrand,
} from "@/app/api/crm/vehicleBrandService";
import { VehicleBrand } from "@/libs/interfaces/inventory";
import { handleFormError } from "@/utils/errorHandlers";

interface VehicleBrandFormProps {
  brand: VehicleBrand | null;
  hideFormDialog: () => void;
  brands: VehicleBrand[];
  setBrands: (brands: VehicleBrand[]) => void;
  setBrand: (brand: VehicleBrand | null) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<any>;
}

const VehicleBrandForm: React.FC<VehicleBrandFormProps> = ({
  brand,
  hideFormDialog,
  brands,
  setBrands,
  setBrand,
  showToast,
  toast,
}) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<VehicleBrandFormData>({
    resolver: zodResolver(vehicleBrandSchema),
    defaultValues: {
      nombre: brand?.nombre || "",
      paisOrigen: brand?.paisOrigen || "",
      logo: brand?.logo || "",
      estado: brand?.estado || "activo",
    },
  });

  const onSubmit = async (data: VehicleBrandFormData) => {
    setLoading(true);
    try {
      if (brand) {
        const updatedBrand = await updateVehicleBrand(brand.id, data);
        const updatedBrands = brands.map((b) =>
          b.id === brand.id ? updatedBrand.vehicleBrand : b
        );
        setBrands(updatedBrands);
        showToast("success", "Éxito", "Marca actualizada correctamente");
      } else {
        const newBrand = await createVehicleBrand(data);
        setBrands([...brands, newBrand.vehicleBrand]);
        showToast("success", "Éxito", "Marca creada correctamente");
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const getFormErrorMessage = (name: string) => {
    const error = errors[name as keyof VehicleBrandFormData];
    return error ? (
      <small className="p-error">
        {typeof error.message === "string"
          ? error.message
          : "Error de validación"}
      </small>
    ) : (
      <small className="p-error">&nbsp;</small>
    );
  };

  const estadoOptions = [
    { label: "Activo", value: "activo" },
    { label: "Inactivo", value: "inactivo" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        <div className="col-12">
          <label htmlFor="nombre" className="block text-900 font-medium mb-2">
            Nombre *
          </label>
          <Controller
            name="nombre"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <InputText
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  placeholder="Nombre de la marca"
                />
                {getFormErrorMessage(field.name)}
              </>
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="paisOrigen"
            className="block text-900 font-medium mb-2"
          >
            País de Origen
          </label>
          <Controller
            name="paisOrigen"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <InputText
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  placeholder="País de origen (opcional)"
                />
                {getFormErrorMessage(field.name)}
              </>
            )}
          />
        </div>

        {/* Estado - Solo visible al modificar */}
        {brand && (
          <div className="col-12 md:col-6">
            <label htmlFor="estado" className="block text-900 font-medium mb-2">
              Estado *
            </label>
            <Controller
              name="estado"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Dropdown
                    id={field.name}
                    value={field.value}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Selecciona el estado"
                    options={estadoOptions}
                    focusInputRef={field.ref}
                    onChange={(e) => field.onChange(e.value)}
                    className={classNames({
                      "p-invalid": fieldState.error,
                    })}
                  />
                  {getFormErrorMessage(field.name)}
                </>
              )}
            />
          </div>
        )}

        <div className="col-12">
          <label htmlFor="logo" className="block text-900 font-medium mb-2">
            Logo URL
          </label>
          <Controller
            name="logo"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <InputText
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={classNames({
                    "p-invalid": fieldState.error,
                  })}
                  placeholder="URL del logo (opcional)"
                />
                {getFormErrorMessage(field.name)}
              </>
            )}
          />
        </div>
      </div>

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          onClick={hideFormDialog}
          type="button"
          disabled={loading}
        />

        <Button
          label={brand ? "Actualizar" : "Crear"}
          icon="pi pi-check"
          type="submit"
          loading={loading}
        />
      </div>
    </form>
  );
};

export default VehicleBrandForm;
