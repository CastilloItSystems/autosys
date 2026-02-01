"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
import {
  vehicleSchema,
  VehicleFormData,
} from "@/libs/zods/inventory/vehicleZod";
import { createVehicle, updateVehicle } from "@/app/api/crm/vehicleService";
import { getCustomers } from "@/app/api/inventory/customerService";
import { getVehicleModels } from "@/app/api/crm/vehicleModelService";
import { Vehicle, Customer, VehicleModel } from "@/libs/interfaces/inventory";
import { handleFormError } from "@/utils/errorHandlers";

interface VehicleFormProps {
  vehicle: Vehicle | null;
  hideFormDialog: () => void;
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
  setVehicle: (vehicle: Vehicle | null) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<any>;
  onVehicleCreated?: (vehicle: Vehicle) => void;
  preselectedCustomer?: string;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicle,
  hideFormDialog,
  vehicles,
  setVehicles,
  setVehicle,
  showToast,
  toast,
  onVehicleCreated,
  preselectedCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingModels, setLoadingModels] = useState(true);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      customer: vehicle?.customer || preselectedCustomer || "",
      model: vehicle?.model || "",
      year: vehicle?.year || new Date().getFullYear(),
      placa: vehicle?.placa || "",
      vin: vehicle?.vin || "",
      color: vehicle?.color || "",
      kilometraje: vehicle?.kilometraje || 0,
      estado: vehicle?.estado || "activo",
    },
  });

  useEffect(() => {
    fetchCustomers();
    fetchModels();
  }, []);

  useEffect(() => {
    if (vehicle) {
      reset({
        customer:
          typeof vehicle.customer === "string"
            ? vehicle.customer
            : vehicle.customer.id,
        model:
          typeof vehicle.model === "string" ? vehicle.model : vehicle.model.id,
        year: vehicle.year,
        placa: vehicle.placa,
        vin: vehicle.vin || "",
        color: vehicle.color,
        kilometraje: vehicle.kilometraje || 0,
        estado: vehicle.estado,
      });
    } else if (preselectedCustomer) {
      // Si no hay vehículo pero sí cliente preseleccionado, solo actualizar el cliente
      reset((prevValues) => ({
        ...prevValues,
        customer: preselectedCustomer,
      }));
    }
  }, [vehicle, reset, preselectedCustomer]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const customersDB = await getCustomers();
      if (customersDB && Array.isArray(customersDB.customers)) {
        setCustomers(customersDB.customers);
      }
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const modelsDB = await getVehicleModels();
      if (modelsDB && Array.isArray(modelsDB.vehicleModels)) {
        setModels(modelsDB.vehicleModels);
      }
    } catch (error) {
      console.error("Error al obtener los modelos:", error);
    } finally {
      setLoadingModels(false);
    }
  };

  const onSubmit = async (data: VehicleFormData) => {
    setLoading(true);
    try {
      if (vehicle) {
        const response = await updateVehicle(vehicle.id, data);
        const updatedVehicles = vehicles.map((v) =>
          v.id === vehicle.id ? response.vehicle : v
        );
        setVehicles(updatedVehicles);
        showToast(
          "success",
          "Éxito",
          response.msg || "Vehículo actualizado correctamente"
        );
      } else {
        const response = await createVehicle(data);
        setVehicles([...vehicles, response.vehicle]);
        showToast(
          "success",
          "Éxito",
          response.msg || "Vehículo creado correctamente"
        );
        // Llamar al callback si existe
        if (onVehicleCreated) {
          onVehicleCreated(response.vehicle);
        }
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const getFormErrorMessage = (name: string) => {
    const error = errors[name as keyof VehicleFormData];
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

  const customerOptions = customers.map((customer) => ({
    label: customer.nombre,
    value: customer.id,
  }));

  const modelOptions = models.map((model) => ({
    label: `${model.nombre} (${
      typeof model.brand === "string" ? "Cargando..." : model.brand.nombre
    })`,
    value: model.id,
  }));

  const estadoOptions = [
    { label: "Activo", value: "activo" },
    { label: "Inactivo", value: "inactivo" },
  ];

  const colorOptions = [
    { label: "Blanco", value: "blanco" },
    { label: "Negro", value: "negro" },
    { label: "Gris", value: "gris" },
    { label: "Plata", value: "plata" },
    { label: "Azul", value: "azul" },
    { label: "Rojo", value: "rojo" },
    { label: "Verde", value: "verde" },
    { label: "Amarillo", value: "amarillo" },
    { label: "Naranja", value: "naranja" },
    { label: "Marrón", value: "marron" },
    { label: "Beige", value: "beige" },
    { label: "Dorado", value: "dorado" },
    { label: "Plateado", value: "plateado" },
    { label: "Bronce", value: "bronce" },
    { label: "Champán", value: "champan" },
    { label: "Crema", value: "crema" },
    { label: "Azul Marino", value: "azul_marino" },
    { label: "Azul Claro", value: "azul_claro" },
    { label: "Verde Oscuro", value: "verde_oscuro" },
    { label: "Rojo Oscuro", value: "rojo_oscuro" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {/* Mostrar spinner mientras cargan los datos de clientes y modelos */}
      {loadingCustomers || loadingModels ? (
        <div className="flex flex-column align-items-center justify-content-center p-4">
          <ProgressSpinner
            style={{ width: "40px", height: "40px" }}
            strokeWidth="4"
            fill="var(--surface-ground)"
            animationDuration=".5s"
          />
          <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
        </div>
      ) : (
        <>
          <div className="grid">
            <div className="col-12 md:col-6">
              <label
                htmlFor="customer"
                className="block text-900 font-medium mb-2"
              >
                Cliente *
              </label>
              <Controller
                name="customer"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Dropdown
                      id={field.name}
                      value={field.value}
                      optionLabel="label"
                      optionValue="value"
                      placeholder={
                        loadingCustomers
                          ? "Cargando clientes..."
                          : "Selecciona un cliente"
                      }
                      options={customerOptions}
                      focusInputRef={field.ref}
                      onChange={(e) => field.onChange(e.value)}
                      disabled={loadingCustomers}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                    />
                    {getFormErrorMessage(field.name)}
                  </>
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="model"
                className="block text-900 font-medium mb-2"
              >
                Modelo *
              </label>
              <Controller
                name="model"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Dropdown
                      id={field.name}
                      value={field.value}
                      optionLabel="label"
                      optionValue="value"
                      placeholder={
                        loadingModels
                          ? "Cargando modelos..."
                          : "Selecciona un modelo"
                      }
                      options={modelOptions}
                      focusInputRef={field.ref}
                      onChange={(e) => field.onChange(e.value)}
                      filter={true}
                      filterBy="label"
                      disabled={loadingModels}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                    />
                    {getFormErrorMessage(field.name)}
                  </>
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="year" className="block text-900 font-medium mb-2">
                Año *
              </label>
              <Controller
                name="year"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Calendar
                      id={field.name}
                      value={field.value ? new Date(field.value, 0, 1) : null}
                      onChange={(e) => field.onChange(e.value?.getFullYear())}
                      view="year"
                      dateFormat="yy"
                      yearNavigator
                      yearRange={`1900:${new Date().getFullYear() + 1}`}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                      placeholder="Selecciona el año"
                    />
                    {getFormErrorMessage(field.name)}
                  </>
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="placa"
                className="block text-900 font-medium mb-2"
              >
                Placa *
              </label>
              <Controller
                name="placa"
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
                      placeholder="Número de placa"
                    />
                    {getFormErrorMessage(field.name)}
                  </>
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="vin" className="block text-900 font-medium mb-2">
                VIN
              </label>
              <Controller
                name="vin"
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
                      placeholder="Número de VIN (opcional)"
                    />
                    {getFormErrorMessage(field.name)}
                  </>
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="color"
                className="block text-900 font-medium mb-2"
              >
                Color *
              </label>
              <Controller
                name="color"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Dropdown
                      id={field.name}
                      value={field.value}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Selecciona el color"
                      options={colorOptions}
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

            <div className="col-12 md:col-6">
              <label
                htmlFor="kilometraje"
                className="block text-900 font-medium mb-2"
              >
                Kilometraje *
              </label>
              <Controller
                name="kilometraje"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <InputNumber
                      id={field.name}
                      value={field.value}
                      onValueChange={(e) => field.onChange(e.value)}
                      min={0}
                      className={classNames({
                        "p-invalid": fieldState.error,
                      })}
                      placeholder="Kilometraje actual"
                    />
                    {getFormErrorMessage(field.name)}
                  </>
                )}
              />
            </div>

            {vehicle && (
              <div className="col-12 md:col-6">
                <label
                  htmlFor="estado"
                  className="block text-900 font-medium mb-2"
                >
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
              label={vehicle ? "Actualizar" : "Crear"}
              icon="pi pi-check"
              type="submit"
              loading={loading}
            />
          </div>
        </>
      )}
    </form>
  );
};

export default VehicleForm;
